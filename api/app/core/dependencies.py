from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.core.security import decode_access_token

# Definimos un esquema de seguridad HTTP Bearer para manejar la autenticación mediante tokens JWT
# HTTPBearer extrae el JWT
bearer_scheme = HTTPBearer(auto_error=False)

# Servicio para obtener el usuario actual a partir del token JWT proporcionado en la cabecera de autorización
# La funcion recibe 2 parametros, las credenciales extraidas de la cabecera de autorizacion y la sesion de base de datos
# Devuelve el usuario correspondiente al token si es valido, o lanza una excepcion HTTP 401 si no lo es
def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:

    # Comprobamos que se hayan proporcionado credenciales en la cabecera de autorización
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se proporcionaron credenciales",
            headers={"WWW-Authenticate": "Bearer"}
        )
    # Extraemos el token de las credenciales proporcionadas
    token = credentials.credentials
    # Comprobamos que el token sea válido y no haya expirado, decodificando su payload
    payload = decode_access_token(token)

    # Si el payload es None, significa que el token es inválido o ha expirado, por lo que lanzamos una excepción HTTP 401
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Extraemos el "subject" del payload, que corresponde al id del usuario
    subject = payload.get("sub")

    # Intentamos convertir el subject a un entero, que es el tipo de dato del id del usuario
    try:
        user_id = int(subject)
    # Si ocurre un error al convertir el subject a entero, lanzamos una excepción HTTP 401 indicando que el token es inválido
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    # Si el user_id es valido buscamos el usuario en la base de datos por su id
    user = db.query(User).filter(User.id == user_id).first()

    # Si no encontramos el usuario o si el usuario no está activo, lanzamos una excepción HTTP 401 indicando que el usuario es inexistente o inactivo
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inexistente o inactivo"
        )

    # Si todas las verificaciones son correctas, devolvemos el usuario correspondiente al token
    return user

# Servicio para requerir que el usuario actual tenga rol de administrador
# La funcion recibe como parametro el usuario actual obtenido mediante get_current_user
def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:

    # Obtenemos el rol del usuario actual, que puede ser un objeto Enum o un string, y lo convertimos a string si es necesario
    role = getattr(current_user.role, "value", current_user.role)

    # Comprobamos si el rol del usuario es "admin", si no lo es, lanzamos una excepción HTTP 403 indicando que no tiene permisos para realizar la operación
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tenés permisos para realizar esta operación"
        )

    # Si el usuario tiene rol de administrador, devolvemos el usuario actual
    return current_user