# Contratos de datos --- Backend de reservas de canchas

**Especificación inicial del MVP · Versión 1.0 ·*

Este documento define las estructuras JSON que el backend expondrá para
que el desarrollador frontend pueda construir las vistas y consumir la
API. Los ejemplos son contratos propuestos; no todos los endpoints están
implementados todavía.

## 1. Convenciones generales

  Elemento               Convención
  ---------------------- --------------------------------------
  Fechas y horas         ISO 8601
  Identificadores        Números enteros
  Importes               Decimales como cadenas: `"15000.00"`
  Autenticación          JWT: `Authorization: Bearer <token>`
  Roles                  `admin`, `customer`
  Superficies            `synthetic`, `grass`, `concrete`
  Estados de reserva     `pending`, `confirmed`, `cancelled`
  Horarios disponibles   Cadenas `HH:MM`

## 2. Autenticación --- `app/schemas/auth.py`

### `UserRegister` --- `POST /auth/register`

Entrada para registrar un usuario:

``` json
{
  "name": "Juan Pérez",
  "email": "juan@gmail.com",
  "password": "MiPassword123"
}
```

### `UserLogin` --- `POST /auth/login`

``` json
{
  "email": "juan@gmail.com",
  "password": "MiPassword123"
}
```

### `TokenResponse` --- respuesta del login

``` json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### `UserResponse` --- `GET /auth/me`

``` json
{
  "id": 2,
  "name": "Juan Pérez",
  "email": "juan@gmail.com",
  "role": "customer",
  "is_active": true
}
```

Reglas: el registro público asigna `customer`; el usuario no puede
asignarse `admin`. La contraseña nunca se devuelve. Las rutas privadas
requieren JWT válido.

## 3. Canchas --- `app/schemas/court.py`

### `CourtCreate` --- `POST /courts` (solo administrador)

``` json
{
  "name": "Cancha Sintética 2",
  "description": "Cancha de fútbol 5",
  "price_per_hour": "18000.00",
  "players_per_team": 5,
  "location": "Complejo deportivo",
  "surface_type": "synthetic"
}
```

### `CourtUpdate` --- `PATCH /courts/{court_id}` (solo administrador)

Se envían únicamente los campos que se desean modificar. `description`
puede enviarse como `null`.

``` json
{
  "price_per_hour": "20000.00",
  "is_active": false
}
```

### `CourtResponse` --- `GET /courts` y `GET /courts/{court_id}`

``` json
{
  "id": 3,
  "name": "Cancha Sintética 1",
  "description": "Cancha de fútbol 5",
  "price_per_hour": "15000.00",
  "players_per_team": 5,
  "location": "Complejo deportivo",
  "surface_type": "synthetic",
  "is_active": true,
  "created_at": "2026-10-28T10:30:00"
}
```

Valores permitidos para `surface_type`: `synthetic`, `grass`,
`concrete`.

## 4. Disponibilidad --- `app/schemas/reservation.py`

### `AvailabilityResponse` --- `GET /courts/{court_id}/availability?date=2026-11-05`

``` json
{
  "court_id": 3,
  "date": "2026-11-05",
  "available_times": ["09:00", "12:00", "13:00", "14:00", "16:00", "17:00"]
}
```

Reglas: atención todos los días de 09:00 a 00:00 del día siguiente; cada
reserva dura una hora y comienza en hora en punto; no se ofrecen
horarios pasados; `pending` y `confirmed` ocupan el horario, `cancelled`
no debería ocuparlo. `date` usa `YYYY-MM-DD`.

## 5. Reservas --- `app/schemas/reservation.py`

### `ReservationCreate` --- `POST /reservations`

``` json
{
  "court_id": 3,
  "start_time": "2026-11-05T10:00:00"
}
```

No se envía `user_id` (se obtiene del usuario autenticado) ni
`total_price` (lo calcula el backend con el precio vigente). La duración
es una hora. `start_time` debe incluir zona horaria y estar alineado a
una hora en punto.

### `ReservationResponse`

``` json
{
  "id": 15,
  "court_id": 3,
  "court_name": "Cancha Sintética 1",
  "user_id": 2,
  "date": "2026-11-05",
  "time":"10:00:00",
  "total_price": "15000.00",
  "status": "pending",
  "created_at": "2026-11-03T17:30:00"
}
```

`end_time` se calcula sumando una hora a `start_time`; no hace falta
almacenarlo como columna.

### Listado --- `GET /reservations/me`

Devuelve una lista de objetos `ReservationResponse`:

``` json
[
  {
    "id": 15,
    "court_id": 3,
    "court_name": "Cancha Sintética 1",
    "user_id": 2,
    "start_time": "2026-11-05T10:00:00",
    "total_price": "15000.00",
    "status": "pending",
    "created_at": "2026-11-03T17:30:00"
  }
]
```

Para el MVP no se requiere paginación.

### Cancelación --- `POST /reservations/{reservation_id}/cancel`

Devuelve un `ReservationResponse` con `status` igual a `cancelled`.

## 6. Resumen de endpoints

  --------------------------------------------------------------------------------------------------------------------
  Método            Endpoint                                            Entrada               Respuesta
  ----------------- --------------------------------------------------- --------------------- ------------------------
  POST              `/auth/register`                                    `UserRegister`        `UserResponse`

  POST              `/auth/login`                                       `UserLogin`           `TokenResponse`

  GET               `/auth/me`                                          ---                   `UserResponse`

  GET               `/courts`                                           ---                   Lista `CourtResponse`

  GET               `/courts/{court_id}`                                ---                   `CourtResponse`

  POST              `/courts`                                           `CourtCreate`         `CourtResponse`

  PATCH             `/courts/{court_id}`                                `CourtUpdate`         `CourtResponse`

  DELETE            `/courts/{court_id}`                                ---                   `204 No Content`

  GET               `/courts/{court_id}/availability?date=YYYY-MM-DD`   `date`                `AvailabilityResponse`

  POST              `/reservations`                                     `ReservationCreate`   `ReservationResponse`

  GET               `/reservations/me`                                  ---                   Lista
                                                                                              `ReservationResponse`

  GET               `/reservations/{reservation_id}`                    ---                   `ReservationResponse`

  POST              `/reservations/{reservation_id}/cancel`             ---                   `ReservationResponse`
  --------------------------------------------------------------------------------------------------------------------

Las operaciones administrativas de canchas requieren rol `admin`. Las
reservas personales requieren autenticación. La consulta individual debe
impedir que un cliente consulte reservas ajenas.

## 7. Errores HTTP esperados

  Código   Significado             Ejemplo
  -------- ----------------------- ----------------------------------
  `400`    Bad Request             Regla de negocio incumplida
  `401`    Unauthorized            Token ausente o inválido
  `403`    Forbidden               Cliente intenta crear una cancha
  `404`    Not Found               Cancha o reserva inexistente
  `409`    Conflict                Otro usuario reservó el horario
  `422`    Unprocessable Entity    Formato o dato inválido
  `500`    Internal Server Error   Fallo inesperado

Ejemplo de error de negocio:

``` json
{
  "detail": "El horario seleccionado ya no está disponible"
}
```

FastAPI puede devolver errores `422` con `detail` como una lista de
errores de validación; el frontend debe contemplar esa estructura.

## 8. Consideraciones de integración

1.  Después del login, enviar el token en
    `Authorization: Bearer <token>` para las rutas protegidas.
2.  El backend es la fuente de verdad del precio; el frontend no
    determina el importe final.
3.  La disponibilidad puede cambiar entre la consulta y la reserva. Ante
    `409 Conflict`, actualizar los horarios.
4.  La base de datos debe permitir reutilizar horarios cancelados y
    evitar dos reservas activas simultáneas. La unicidad debe contemplar
    solo estados `pending` y `confirmed`.
5.  El frontend muestra el estado recibido y no lo modifica por su
    cuenta.
6.  Tratar importes como decimales, no como números de punto flotante.

## 9. Decisiones pendientes

-   Confirmar si el login usará token Bearer en JSON o cookie segura.
-   Definir las reglas exactas de cancelación y la anticipación mínima.
-   Definir el flujo de pago y cuándo `pending` pasa a `confirmed`.
-   Acordar el formato definitivo de errores, especialmente los de
    validación.

**Importante:** este documento define el contrato inicial propuesto para
el MVP. No todos los endpoints y schemas están implementados todavía.
Cualquier cambio debe comunicarse al desarrollador frontend.