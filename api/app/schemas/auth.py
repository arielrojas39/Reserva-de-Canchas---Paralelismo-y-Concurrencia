from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime

# Esquema para validar los datos de entrada al registrar un usuario
class UserRegister(BaseModel):
    # El nombre del usuario debe tener entre 1 y 100 caracteres
    name: str = Field(min_length=1, max_length=100)
    # El email del usuario debe ser un email valido
    email: EmailStr
    # La contraseña del usuario debe tener al menos 8 caracteres
    password: str = Field(min_length=8)

# Esquema para validar los datos de entrada al iniciar sesion   
class UserLogin(BaseModel):
    # El email del usuario debe ser un email valido
    email: EmailStr
    # La contraseña del usuario debe tener al menos 8 caracteres
    password: str # = Field(min_length=8)

# Esquema para respuesta de tocken de acceso, que sera devuelto al usuario al iniciar sesion correctamente
class TokenResponse(BaseModel):
    # access_token contiene el JWT que generamos con nuestra funcion
    access_token: str
    # token_type indica el tipo de token, en este caso es un token de tipo "bearer"
    token_type: str = "bearer"

# Esquema para respuesta de usuario, que sera devuelto al usuario al registrarse correctamente
class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    # Esta configuracion permite que Pydantic construya la respuesta leyendo los 
    # atributos de un objeto User de SQLAlchemy, en lugar de requerir un diccionario
    model_config = ConfigDict(from_attributes=True)