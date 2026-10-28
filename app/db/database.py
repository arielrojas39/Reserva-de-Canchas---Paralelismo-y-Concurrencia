from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
## Importamos la configuracion de la aplicacion para poder conectarnos a PostgreSQL
from app.core.config import settings

## Creamos el engine de SQLAlchemy para conectarnos a la base de datos
engine = create_engine(
    ## Obtenemos la direccion de conexion desde el archivo .env
    settings.DATABASE_URL,
    ## Comprobamos que la conexion del conjunto de conexiones diposnibles siga funcionando antes de usarla
    pool_pre_ping=True,
)

## Creamos la clase SessionLocal para crear sesiones de SQLAlchemy para cuando
## necesitemos consultar, insertar, actualizar o eliminar registros en la base de datos
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

## Base es la clase de la que heradaran nuestros modelos de base de datos
class Base(DeclarativeBase):
    pass