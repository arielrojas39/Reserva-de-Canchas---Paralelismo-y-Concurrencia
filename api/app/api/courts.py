# RESPONSABILIDADES DEL ARCHIVO
# -----------------------------
# 1. Recibir la solocitud HTTP 
# 2. Obtener una sesion de base de datos mediante get_db() 
# 3. Consultar las canchas utilizando SQLAlchemy 
# 4. Devolver los resultados utilizando el esquema CourtResponse

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status
from app.db.database import get_db
from app.models.court import Court
from app.models.user import User
from app.schemas.court import CourtResponse, CourtCreate, CourtUpdate
from app.core.dependencies import require_admin


# APIRouter nos permite agrupar los endpoints relacionados con las canchas en un solo objeto, 
# lo que facilita la organización del código y la documentación de la API, ademas de esta manera
# mantenemos separado este modulo del resto de la aplicacion 
router = APIRouter(
    prefix="/courts",
    tags=["Canchas"],
)

# response_model=list[CourtResponse] le indica a FastAPI que la respuesta de este endpoint debe ser una 
# lista de objetos con la estructura definida en el esquema Pydantic CourtResponse. FastAPI se encargara
#  de validar y serializar los datos antes de enviarlos al cliente
# Usamos "" en lugar de "/" para que el endpoint responda directamente en /courts
# (sin redirección 307 de /courts a /courts/).
@router.get("", response_model=list[CourtResponse])

# Depends(get_db) le indica a FastAPI que debe inyectar una sesión de PostgreSQL. FastAPI ejecutara 
# nuestra dependencia y se encargara de cerrar la sesion al finalizar la solicitud
def get_courts(db: Session = Depends(get_db)):
    
    # Con selec(Court) se construye una consulta SQLAlchemy para obtener registros de la tabla courts
    # La clausula where(Court.is_active.is_(True)) filtra los resultados para incluir solo las canchas activas
    statement = select(Court).where(Court.is_active.is_(True))

    # db.scalars(statement).all() ejecuta la consulta y devuelve una lista de 
    # objetos Court que cumplen con la condición especificada en la consulta
    courts = db.scalars(statement).all()

    # Retornamos el objeto courts en cuestion
    return courts

# response_model=CourtResponse le indica a FastAPI que la respuesta de este endpoint debe ser un objeto 
# con la estructura definida en el esquema Pydantic CourtResponse. FastAPI se encargara de validar y 
# serializar los datos antes de enviarlos al cliente

# court_id: FastAPI obtiene el identificador desde la URL y valida que sea un entero
@router.get("/{court_id}", response_model=CourtResponse)
def get_court(court_id: int, db: Session = Depends(get_db)):
    statement = select(Court).where(
        Court.id == court_id,
        Court.is_active.is_(True),
    )
    # db.scalar(statament) ejecuta la consulta y devuelve el primer resultado o None si no encuentra ningun tipo
    court = db.scalar(statement)

    if court is None:
        # HTTPException es una clase de FastAPI que nos permite devolver un error HTTP con un código de estado y un mensaje personalizado. 
        # En este caso, estamos devolviendo un error 404 (Not Found) con el mensaje "Cancha no encontrada"
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cancha no encontrada",
        )

    return court

# El endpoint POST /courts/ permite crear una nueva cancha en la base de datos 
# exclusivamente para aquellos usuarios que tengan el Rol de adminsitratdor
@router.post(
    "/",
    response_model=CourtResponse,
    status_code=status.HTTP_201_CREATED,
)

# CourtCreate: FastAPI recibe el JSON y Pydantic valida los datos
def create_court(
        court_data: CourtCreate, 
        db: Session = Depends(get_db),
        current_user: User = Depends(require_admin)
    ):
    
    # model_dump() convierte el esquema Pydantic en un diccionario de Python
    #Court(**court_data.model_dumpo()) crea una instancia del modelo SQLAlchemy con esos datos
    new_court = Court(**court_data.model_dump())

    # Agregamos el objeto a la sesion
    db.add(new_court)

    # Confirmamos la transaccion y guarda el registro en PostgreSQL
    db.commit()

    # Actualizamos el objeto con los valores generados por la base de datos, como id y created_at
    db.refresh(new_court)

    return new_court

# El endpoint PATCH /courts/{court_id} permite modificar los datos de una cancha existente en la base de datos
@router.patch("/{court_id}", response_model=CourtResponse)
def update_court(
    court_id: int,
    court_data: CourtUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    statement = select(Court).where(Court.id == court_id)
    # Buscamos la cancha sin el filtro de is_active, ya que queremos permitir la modificacion de canchas inactivas
    # para la busqueda de administradores, el cual esta restringido por tipo de rol de usuario
    court = db.scalar(statement)

    if court is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cancha no encontrada",
        )
    
    # Obtenemos unicamente los campos enviados, lo cual es findamental para PATCH, dado a que si el
    # cliente envia solamente el precio, el resto de los atributos no se modificaran
    update_data = court_data.model_dump(exclude_unset=True)

    # Actualizamos dinamicamente los atributos
    for field, value in update_data.items():
        # setattr() oermite modificar un atributo de un objeto utilizando el nombre del atributo como texto
        setattr(court, field, value)

    # Confirmamos los cambios
    db.commit()
    # Refrescamos los registros de la base de datos
    db.refresh(court)

    return court

# Implementamos la baja logica (Soft Delete), para que cuando un administrador elimine una cancha, no borre
# fisicamente el registro de PostgreSQL, simplemente cambiamos su estado. Una cancha puede tener reservas
# historicas asociadas, en donde si eliminaramos fisicamente el registro, podriamos perder informacion
# importante o generar problemas con las claves foraneas

# Con la baja logica:
# 1. Conservamos el historial de reservas 
# 2. Evitamos que aparezca en el listado publico 
# 3. Evitamos que pueda recibir nuevas reservas 
# 4. Podemos consultar su informacion desde administracion

# HTTP 204 No Content: Indica que la solicitud se ha procesado correctamente, 
# pero no hay contenido que devolver en la respuesta
@router.delete("/{court_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_court(
    court_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    statement = select(Court).where(Court.id == court_id)
    court = db.scalar(statement)

    if court is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cancha no encontrada",
        )

    if not court.is_active:
        # HTTP 409 Conflict: Indica que la solicitud no se puede completar debido a un conflicto 
        # con el estado actual del recurso debido a que ya se encuentre inactiva
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La cancha ya se encuentra inactiva",
        )

    court.is_active = False

    db.commit()

    return None