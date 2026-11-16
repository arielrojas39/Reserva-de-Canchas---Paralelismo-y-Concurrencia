## Centralizamos la condifuracion de nuestra aplicacion
## para cuando database.py se ejecute pueda obtener las variables de entorno
## y asi poder conectarse a PostgreSQL

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    # Orígenes permitidos para CORS, separados por comas.
    # Ejemplo: "http://localhost:3000,http://127.0.0.1:3000"
    FRONTEND_ORIGINS: str = (
        "http://localhost:3000,http://127.0.0.1:3000"
    )

    # Credenciales opcionales para el usuario administrador de seed.
    # Si falta alguna, el seed no creará el admin y solo cargará canchas.
    SEED_ADMIN_EMAIL: str | None = None
    SEED_ADMIN_PASSWORD: str | None = None
    SEED_ADMIN_NAME: str | None = None

    # Mercado Pago — Checkout Pro.
    # MP_ACCESS_TOKEN y MP_WEBHOOK_SECRET se configuran en .env.
    MP_ACCESS_TOKEN: str | None = None
    MP_WEBHOOK_SECRET: str | None = None
    MP_ENVIRONMENT: str = "sandbox"
    MP_WEBHOOK_URL: str | None = None
    MP_STATEMENT_DESCRIPTOR: str = "CANCHASPLAY"
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()