from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
## Importamos la configuracion de la aplicacion para poder conectarnos a PostgreSQL
from app.core.config import settings

## Importamos Generator para poder tipar la funcion get_db que nos permitira obtener una sesion de SQLAlchemy
## Las sesiones nos permitiran consultar, insertar, actualizar o eliminar registros en la base de datos
from collections.abc import Generator

## Creamos el engine de SQLAlchemy para conectarnos a la base de datos
## engine es el objeto que nos permite conectarnos a la base de datos y ejecutar consultas SQL
## administrando las conexiones entre Python y PostgreSQL
engine = create_engine(
    ## Obtenemos la direccion de conexion desde las variables de entorno (.env)
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

## Base es la clase de la que heradaran nuestros modelos SQLAlchemy para la Base de Datos
class Base(DeclarativeBase):
    pass


## Creamos la funcion get_db que nos permitira obtener una sesion de SQLAlchemy para poder 
## consultar, insertar, actualizar o eliminar registros en la base de datos
def get_db() -> Generator:
    ## con db creamos una nueva sesion SQLAlchemy
    db = SessionLocal()
    try:
        ## yield db entrega la sesion al endopoint que la necesita
        yield db
    finally:
        ## cerramos la sesion para liberar recursos y evita dejar sesiones abiertas innecesariamente
        ## IMPORTANTE: Cerrar la sesion no significa necesariamente que se confirme una transaccion!!!
        db.close()