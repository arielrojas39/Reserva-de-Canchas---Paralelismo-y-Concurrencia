# Session representa la sesion de conexion con PostrgreSQL mediante SQLAlchemy
from sqlalchemy.orm import Session
# User es el modelo ORM que representa la tabla de usuarios
from app.models.user import User
# Los schemas definen y validan los datos que recibimos para los diferentes servicios
from app.schemas.auth import UserRegister, UserLogin
# Has_password transforma la contraseña en un hash utilizando Argon2
# Verify_password compara la contraseña en texto plano con el hash almacenado en la base de datos
from app.core.security import hash_password, verify_password

# Servicios para manejar la logica de negocio relacionada con la autenticacion y registro de usuarios
def register_user(db: Session, user_data: UserRegister):
    # Comprobamos si el email del usuario ya existe
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()
    # Si el email ya existe, lanzamos un error indicando que el email ya está registrado
    if existing_user:
        raise ValueError("El email ya está registrado")

    # Si el email no existe, hasheamos la contraseña para no guardar la original en la base de datos
    hashed_password = hash_password(user_data.password)

    # Creamos un nuevo usuario con los datos recibidos y el hash de la contraseña
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hashed_password,
        # Para el registro publico de usuarios asignamos el rol de "customer" por defecto, 
        # ya que no queremos que los usuarios puedan registrarse como administradores
        role="customer"
    )

    # Agreamos el objeto a la Session
    db.add(new_user)

    # Confirmamos la transaccion y guardamos los cambios
    db.commit()

    # Actualizamos el objeto con los datos generados por la base de datos, como su id
    db.refresh(new_user)

    # Retornamos el nuevo usuario creado
    return new_user

# Servicio para autenticar un usuario, que se utiliza al iniciar sesion
def authenticate_user(db: Session, user_data: UserLogin):
    # Buscamos el usuario en la base de datos por su email
    user = db.query(User).filter(
        User.email == user_data.email
    ).first()
    # Si no encontramos el usuario, devolvemos None
    if not user:
        return None
    # Si encontramos el usuario, verificamos que la contraseña proporcionada coincida con el hash almacenado
    if not verify_password(user_data.password, user.hashed_password):
        return None
    # Si el usuario no está activo, devolvemos None
    if not user.is_active:
        return None
    
    # Por seguridad, no queremos revelar si un email está registrado, si la contraseña es incorrecta o si la cuenta esta desactivada
    # Desde el punto de vista del cliente, todos esos casos deben producir el mismo mensaje: credenciales incorrectas o cuenta no disponible
    
    # Si todas las verificaciones son correctas, devolvemos el usuario autenticado
    return user
