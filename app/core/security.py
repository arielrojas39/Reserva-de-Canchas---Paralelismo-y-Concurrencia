from pwdlib import PasswordHash
from datetime import datetime, timedelta, timezone
import jwt
from app.core.config import settings

# Selecciona un algorimtmo de hashing recomendado entre los disponibles en pwdlib, que actualmente es Argon2
password_hash = PasswordHash.recommended()

# Funcion que recibe una contraseña y devuelve su hash
def hash_password(password: str) -> str:
    return password_hash.hash(password)

# Funcion que recibe una contraseña en texto plano y un hash, y verifica si la contraseña coincide con el hash almacenado
# Devuelve True si la contraseña coincide, False en caso contrario
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)

# Funcion para crear un token JWT de acceso para un usuario
def create_access_token(user_id: int) -> str:
    # Calcula la fecha de expiracion del token sumando el tiempo de expiracion configurado en settings a la fecha actual
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_EXPIRE_MINUTES
    )
    # sub corresponde al "subject" del token, que en este caso es el id del usuario
    #  exp corresponde a la fecha de expiracion del token, ambos configurados en .env
    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    # jwt.encode genera el token JWT a partir del payload, la clave secreta y el algoritmo de firma configurados en settings (HS256)
    # esto permite comprobar posteriormente que el token no fue alterado
    token = jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )

    return token

# Funcion para validar y decodificar un token JWT de acceso 
# La funcion recibe un token
def decode_access_token(token: str) -> dict:
    # intenta verificar su firma y decodificar el payload, si el token es invalido o ha expirado, devuelve None
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        # Si es valido devuelve el payload decodificado, que contiene el id del usuario y la fecha de expiracion
        return payload
    # Si el token es invalido o ha expirado, devuelve None
    except jwt.InvalidTokenError:
        return None