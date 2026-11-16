## Importamos los paquetes app.models para cargar las clases
## SQLAlchemy registrara sus tablas en Base.metadata, que es la informacion
## que Alembic necesita para comparar nuestros modelos y generar migraciones
## a la estructura de la base de datos.

from app.models.user import User
from app.models.court import Court
from app.models.reservation import Reservation
from app.models.payment import Payment

__all__ = ["User", "Court", "Reservation", "Payment"]
