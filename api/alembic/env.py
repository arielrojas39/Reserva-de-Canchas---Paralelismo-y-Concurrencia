## Alembic puede comparar los metadatos de nuestros modelos con la estructura actual
## de la base de datos y generar automaticamente los scripts de migracion
## Para lograrlo, debemos configurar 2 cosas:
## 1. Alembic debe utilizar la misma configuracion de PostgreSQL que nuestra app
## 2. Alembic debe conocer los modelos registrados en Base.metadata para poder compararlos con la base de datos
## Entonces, cuando se agregue una tabla o una columna, podremos generar una migracion que represente ese cambio

from logging.config import fileConfig

from sqlalchemy import create_engine, pool
from alembic import context

## settings permite acceder a la configuracion que ya definimos en .env
from app.core.config import settings

## Base es la clase de la que heredan nuestros modelos de SQLAlchemy
from app.db.database import Base

### Importamos los modelos para que Alembic pueda registrar sus tablas en Base.metadata
import app.models

## Base.metadata contiene la informacion de las tablas registradas en esa clase
target_metadata = Base.metadata

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    
    # create_engine nos permite crear un engine de SQLAlchemy para conectarnos a la base de datos
    # a traves de la URL que esta especificada en las variables de entorno
    connectable = create_engine(
        settings.DATABASE_URL,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
