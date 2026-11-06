/**
 * Verificación de integración de la Etapa 6 (lógica de servicios).
 * Ejecutar con: pnpm dlx tsx scripts/verify-etapa6.ts
 * No es parte del proyecto: es una verificación descartable.
 */

// localStorage polyfill ANTES de usar los servicios (demo.store lo lee en runtime).
const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (clave: string) => storage.get(clave) ?? null,
  setItem: (clave: string, valor: string) => {
    storage.set(clave, String(valor));
  },
  removeItem: (clave: string) => {
    storage.delete(clave);
  },
  clear: () => storage.clear(),
};
(globalThis as unknown as { window: unknown }).window = {
  localStorage: localStorageMock,
};

const CLAVE_RESERVAS = "canchasplay:reservas-demo";
const CLAVE_HORARIOS = "canchasplay:horarios-reservados";

let fallos = 0;
function ok(condicion: boolean, nombre: string): void {
  console.log(`${condicion ? "  OK   " : "  FALLO"} ${nombre}`);
  if (!condicion) fallos += 1;
}

/** Base de fechas de la prueba (sin dependencia del "hoy"). */
const BASE = Date.UTC(2026, 10, 5); // 2026-11-05

function fechaEn(indice: number): string {
  return new Date(BASE + indice * 86_400_000).toISOString().slice(0, 10);
}

async function main(): Promise<void> {
  const {
    crearReservaDemo,
    obtenerReservasDeUsuario,
    actualizarReserva,
    expirarReserva,
    obtenerReserva,
  } = await import("@/lib/services/reservas.service");
  const { pagarReservaDemo } = await import("@/lib/services/pagos.service");
  const { obtenerHorarios } = await import("@/lib/services/horarios.service");

  // Busca el próximo horario libre rotando fechas (algunos días están
  // totalmente ocupados por diseño del hash).
  let cursorFecha = 0;
  async function buscarLibre(canchaId: string) {
    for (let i = 0; i < 90; i += 1) {
      const fecha = fechaEn(cursorFecha + i);
      const horarios = await obtenerHorarios(canchaId, fecha);
      const libre = horarios.find((h) => h.disponible);
      if (libre) {
        cursorFecha += i + 1;
        return { fecha, horario: libre };
      }
    }
    return null;
  }

  function datosPara(encontrado: {
    fecha: string;
    horario: { id: string; inicio: string; fin: string };
  }) {
    return {
      canchaId: "cancha-4",
      canchaNombre: "Cancha 5 Caballito",
      horarioId: encontrado.horario.id,
      fecha: encontrado.fecha,
      inicio: encontrado.horario.inicio,
      fin: encontrado.horario.fin,
      montoTotal: 15000,
      usuarioId: "usuario-1",
    };
  }

  // ---------------------------------------------------------------
  console.log("\n1) Semilla, normalización y persistencia");
  const vistas1 = await obtenerReservasDeUsuario("usuario-1");
  ok(vistas1.length === 2, "semilla de usuario-1: 2 reservas");
  ok(
    vistas1.every((v) => v.cancha !== null),
    "join de cancha en cada vista",
  );
  ok(storage.has(CLAVE_RESERVAS), "reservas persistidas en localStorage (demo)");

  const vistas2 = await obtenerReservasDeUsuario("usuario-2");
  ok(vistas2.length === 1, "semilla de usuario-2: 1 reserva");
  ok(vistas2[0].reserva.estado === "pendiente", "la reserva semilla queda PENDIENTE");
  ok(vistas2[0].reserva.expiracion != null, "expiración backfilleada en la semilla pendiente");

  // ---------------------------------------------------------------
  console.log("\n2) Creación (201) y consistencia con el catálogo");
  const libre1 = await buscarLibre("cancha-4");
  ok(libre1 !== null, "hay un horario libre para la prueba");

  const creacion = await crearReservaDemo(datosPara(libre1!), "auto");
  ok(creacion.codigo === 201, "crear reserva → 201");
  ok(creacion.reserva?.estado === "pendiente", "reserva creada en estado PENDIENTE");
  ok(
    creacion.reserva?.expiracion != null &&
      new Date(creacion.reserva.expiracion).getTime() > Date.now(),
    "la expiración queda a 15 minutos en el futuro",
  );
  ok(storage.has(CLAVE_HORARIOS), "horarios reservados persistidos (demo)");

  let horarios = await obtenerHorarios("cancha-4", libre1!.fecha);
  ok(
    horarios.find((h) => h.id === libre1!.horario.id)?.disponible === false,
    "el horario aparece ocupado en el catálogo",
  );

  const duplicada = await crearReservaDemo(datosPara(libre1!), "auto");
  ok(duplicada.codigo === 409, "crear sobre el mismo horario → 409 (sin duplicados)");

  // ---------------------------------------------------------------
  console.log("\n3) Modos forzados de creación");
  const libre2 = await buscarLibre("cancha-4");
  ok(libre2 !== null, "hay otro horario libre");

  const r410 = await crearReservaDemo(datosPara(libre2!), 410);
  ok(r410.codigo === 410, "modo forzado → 410 sin efectos");
  const r422 = await crearReservaDemo(datosPara(libre2!), 422);
  ok(r422.codigo === 422, "modo forzado → 422 sin efectos");
  const r503 = await crearReservaDemo(datosPara(libre2!), 503);
  ok(r503.codigo === 503, "modo forzado → 503 sin efectos");
  horarios = await obtenerHorarios("cancha-4", libre2!.fecha);
  ok(
    horarios.find((h) => h.id === libre2!.horario.id)?.disponible === true,
    "el horario sigue libre tras 410/422/503",
  );
  const r409Forzado = await crearReservaDemo(datosPara(libre2!), 409);
  ok(r409Forzado.codigo === 409, "modo forzado → 409");
  horarios = await obtenerHorarios("cancha-4", libre2!.fecha);
  ok(
    horarios.find((h) => h.id === libre2!.horario.id)?.disponible === false,
    "el modo 409 sí marca el horario (disponibilidad actualizada)",
  );

  // ---------------------------------------------------------------
  console.log("\n4) Pagos: aprobado, duplicado, rechazado y error");
  const idReserva = creacion.reserva!.id;

  const pago200 = await pagarReservaDemo(idReserva, "aprobado");
  ok(pago200.codigo === 200, "pago aprobado → 200");
  ok(pago200.reserva?.estado === "confirmada", "pago aprobado → estado CONFIRMADA");
  horarios = await obtenerHorarios("cancha-4", libre1!.fecha);
  ok(
    horarios.find((h) => h.id === libre1!.horario.id)?.disponible === false,
    "la reserva confirmada mantiene el horario ocupado",
  );

  const pagoDup = await pagarReservaDemo(idReserva, "aprobado");
  ok(pagoDup.codigo === 409, "pagar dos veces → 409 (pago duplicado)");

  const pagoSeed = await pagarReservaDemo("reserva-1", "aprobado");
  ok(pagoSeed.codigo === 409, "reserva ya confirmada de la semilla → 409");

  const libre3 = await buscarLibre("cancha-4");
  const creacion2 = await crearReservaDemo(datosPara(libre3!), "auto");
  ok(creacion2.codigo === 201, "segunda reserva creada");

  const pago402 = await pagarReservaDemo(creacion2.reserva!.id, "rechazado");
  ok(pago402.codigo === 402, "pago rechazado → 402");
  ok(pago402.reserva?.estado === "cancelada", "pago rechazado → estado CANCELADA");
  const horarios3 = await obtenerHorarios("cancha-4", libre3!.fecha);
  ok(
    horarios3.find((h) => h.id === libre3!.horario.id)?.disponible === true,
    "cancelada libera el horario (catálogo consistente)",
  );

  const libre4 = await buscarLibre("cancha-4");
  const creacion3 = await crearReservaDemo(datosPara(libre4!), "auto");
  ok(creacion3.codigo === 201, "tercera reserva creada");
  const pago500 = await pagarReservaDemo(creacion3.reserva!.id, "error");
  ok(pago500.codigo === 500, "error simulado → 500");
  ok(
    obtenerReserva(creacion3.reserva!.id)?.estado === "pendiente",
    "el error devuelve la reserva a PENDIENTE",
  );

  // ---------------------------------------------------------------
  console.log("\n5) Expiración");
  const libre5 = await buscarLibre("cancha-4");
  const creacion4 = await crearReservaDemo(datosPara(libre5!), "auto");
  const idExpirar = creacion4.reserva!.id;

  // a) expiración por tiempo (normalización en lectura)
  actualizarReserva(idExpirar, {
    expiracion: new Date(Date.now() - 1000).toISOString(),
  });
  const vistasExpiradas = await obtenerReservasDeUsuario("usuario-1");
  const expirada = vistasExpiradas.find((v) => v.reserva.id === idExpirar);
  ok(expirada?.reserva.estado === "expirada", "plazo vencido → estado EXPIRADA");
  const horariosExpirada = await obtenerHorarios("cancha-4", libre5!.fecha);
  ok(
    horariosExpirada.find((h) => h.id === libre5!.horario.id)?.disponible === true,
    "la expiración libera el horario",
  );
  const pago410 = await pagarReservaDemo(idExpirar, "aprobado");
  ok(pago410.codigo === 410, "pagar una expirada → 410");

  // b) expiración explícita (idempotente)
  const libre6 = await buscarLibre("cancha-4");
  const creacion5 = await crearReservaDemo(datosPara(libre6!), "auto");
  const exp = await expirarReserva(creacion5.reserva!.id);
  ok(exp?.estado === "expirada", "expirarReserva marca EXPIRADA");
  const exp2 = await expirarReserva(creacion5.reserva!.id);
  ok(exp2?.estado === "expirada", "expirarReserva es idempotente");

  // ---------------------------------------------------------------
  console.log("\n6) Estado PAGANDO y recuperación de pagos obsoletos");
  const libre7 = await buscarLibre("cancha-4");
  const creacion6 = await crearReservaDemo(datosPara(libre7!), "auto");
  const idPagando = creacion6.reserva!.id;

  actualizarReserva(idPagando, { estado: "pagando" });
  ok(obtenerReserva(idPagando)?.estado === "pagando", "estado PAGANDO persistido");
  const pagoEnCurso = await pagarReservaDemo(idPagando, "aprobado");
  ok(pagoEnCurso.codigo === 409, "pagar mientras hay un pago en curso → 409");

  // Pago obsoleto (simula recarga con pago interrumpido)
  const crudo = JSON.parse(storage.get(CLAVE_RESERVAS)!) as Array<{
    id: string;
    estado: string;
    actualizadaEn?: string;
  }>;
  const target = crudo.find((r) => r.id === idPagando)!;
  target.estado = "pagando";
  target.actualizadaEn = new Date(Date.now() - 30_000).toISOString();
  storage.set(CLAVE_RESERVAS, JSON.stringify(crudo));
  ok(
    obtenerReserva(idPagando)?.estado === "pendiente",
    "un PAGANDO obsoleto vuelve a PENDIENTE al leer",
  );

  // ---------------------------------------------------------------
  console.log("");
  if (fallos > 0) {
    console.error(`${fallos} verificaciones fallaron.`);
    process.exit(1);
  }
  console.log("Todas las verificaciones pasaron.");
}

void main();
