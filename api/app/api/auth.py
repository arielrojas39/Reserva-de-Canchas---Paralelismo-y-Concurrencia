from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.auth import UserRegister, UserResponse, UserLogin, TokenResponse
from app.services.auth_service import register_user, authenticate_user
from app.core.security import create_access_token
from app.core.dependencies import get_current_user
from app.models.user import User

# Definimos un router de FastAPI para manejar las rutas relacionadas con la autenticación
router = APIRouter(prefix="/auth", tags=["Auth"])

# Endpoint para registrar un nuevo usuario
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)

# La funcion register recibe los datos del usuario a registrar y la sesion de base de datos
# Devuelve el usuario registrado si todo es correcto, o lanza una excepcion HTTP 409 si el email ya esta registrado
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    # Intentamos registrar el usuario utilizando el servicio register_user
    try:
        new_user = register_user(db, user_data)
        return new_user

    # Si ocurre un error de validacion, lanzamos una excepcion HTTP 409 indicando que el email ya esta registrado
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        )

# Endpoint para iniciar sesion y obtener un token de acceso
@router.post("/login", response_model=TokenResponse)

# La funcion login recibe los datos del usuario a autenticar y la sesion de base de datos
# Devuelve un token de acceso si las credenciales son correctas, o lanza una excepcion HTTP 401 si no lo son
def login(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    # Intentamos autenticar al usuario utilizando el servicio authenticate_user
    user = authenticate_user(db, user_data)

    # Si el usuario no es autenticado, lanzamos una excepcion HTTP 401 indicando que las credenciales son incorrectas
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas o cuenta no disponible",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Si el usuario es autenticado correctamente, generamos un token de acceso utilizando su id
    access_token = create_access_token(user.id)

    # Retornamos el token de acceso en la respuesta, indicando que es un token de tipo "bearer"
    return TokenResponse(
        access_token=access_token
    )

# Endpoint para obtener los datos del usuario actualmente autenticado
@router.get("/me", response_model=UserResponse)

# La funcion get_me recibe el usuario actualmente autenticado a partir del token de acceso
# Devuelve los datos del usuario si el token es valido, o lanza una excepcion
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user