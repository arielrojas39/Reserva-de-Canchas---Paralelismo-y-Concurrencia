from uuid import uuid4

from app.db.database import SessionLocal
from app.schemas.auth import UserRegister, UserLogin
from app.services.auth_service import register_user, authenticate_user
from app.models.user import User


db = SessionLocal()

email = f"test_{uuid4().hex[:8]}@gmail.com"
password = "Password123"

try:
    # 1. Registrar usuario
    user_data = UserRegister(
        name="Usuario de prueba",
        email=email,
        password=password
    )

    new_user = register_user(db, user_data)

    print("Usuario registrado:", new_user.id)
    print("Email:", new_user.email)
    print("Rol:", new_user.role)

    # 2. Comprobar que la contraseña no se almacena en texto plano
    assert new_user.hashed_password != password
    print("Hash de contraseña: OK")

    # 3. Autenticar con credenciales correctas
    login_data = UserLogin(
        email=email,
        password=password
    )

    authenticated_user = authenticate_user(db, login_data)

    assert authenticated_user is not None
    print("Autenticación correcta: OK")

    # 4. Intentar autenticar con contraseña incorrecta
    wrong_login = UserLogin(
        email=email,
        password="ContraseñaIncorrecta"
    )

    result = authenticate_user(db, wrong_login)

    assert result is None
    print("Rechazo de contraseña incorrecta: OK")

    # 5. Intentar registrar el mismo email
    try:
        register_user(db, user_data)
    except ValueError:
        print("Rechazo de email duplicado: OK")

finally:
    # Eliminar el usuario de prueba
    db.query(User).filter(User.email == email).delete()
    db.commit()
    db.close()

print("\nTodas las pruebas finalizaron correctamente.")