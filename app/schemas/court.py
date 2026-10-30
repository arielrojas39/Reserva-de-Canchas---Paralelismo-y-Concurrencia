from datetime import datetime
from decimal import Decimal

# Utilizamos BaseModel de Pydantic para definir la estructura de 
# los datos y validar que sus valores tengan los tipos esperados para cada 
# campo. Esto nos permite tener una capa de validación y serialización de datos
from pydantic import BaseModel, ConfigDict, model_validator, Field

# Definimos un esquema de respuesta para la entidad Court, que será utilizado
# para serializar los datos de un objeto Court de SQLAlchemy a un formato JSON
class CourtResponse(BaseModel):
    id: int
    name: str
    description: str | None
    price_per_hour: Decimal
    players_per_team: int
    location: str
    surface_type: str
    is_active: bool
    created_at: datetime

    # Esta configuracion permite que Pydantic construya la respuesta a leyendo
    # los atributos de un objeto Court de SQLAlchemy, en lugar de requerir un diccionario
    model_config = ConfigDict(from_attributes=True)

# Definimos el esquema para registrar canchas, que será utilizado 
# para validar los datos de entrada al crear un nuevo objeto Court
class CourtCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    price_per_hour: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    players_per_team: int = Field(gt=0)
    location: str = Field(min_length=1, max_length=255)
    surface_type: str = Field(min_length=1, max_length=100)

# Definimos el esquema para modificar canchas, el mismo posee campos opcionales
# porque utiilzaremos el metodo HTTP PATCH, que permite modificar solo los campos que se envien en la solicitud
# La idea es implementar el endpoint contemplando que pueden haber campos nulos y campos no nulos, para que 
# solo se actualicen correctamente los campos que se envien en la solicitud, y si un campo no nulo se envia 
# con valor null, se genere un error de validacion
class CourtUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    price_per_hour: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=10,
        decimal_places=2,
    )
    players_per_team: int | None = Field(default=None, gt=0)
    location: str | None = Field(default=None, min_length=1, max_length=255)
    surface_type: str | None = None
    is_active: bool | None = None

    # Ejecuta una validacion despues de que Pydantic proceso los campos
    @model_validator(mode="after")
    def validate_null_values(self):
        nullable_fields = {"description"}

        # Contiene los campos que el cliente envio explicitamente
        for field_name in self.model_fields_set:
            value = getattr(self, field_name)

            if value is None and field_name not in nullable_fields:
                raise ValueError(f"{field_name} no puede ser null")

        return self