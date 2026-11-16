import { NextRequest, NextResponse } from "next/server";

/**
 * Mercado Pago exige back_urls HTTPS. Esta ruta recibe el retorno público
 * y redirige al frontend local conservando el resultado del pago.
 */
export function GET(request: NextRequest) {
  const destino = new URL("http://localhost:3000/mis-reservas");
  request.nextUrl.searchParams.forEach((valor, clave) => {
    destino.searchParams.set(clave, valor);
  });
  return NextResponse.redirect(destino);
}
