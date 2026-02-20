from datetime import datetime

from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import typing as tp

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class UserSchema(BaseModel):
    id: int
    username: str

class CreateUserInputSchema(BaseModel):
    username: str
    password: str

class CreateUserSchema(BaseModel):
    username: str
    password: str
    created_at: datetime

class UpdateUserInputSchema(BaseModel):
    username: tp.Optional[str] = None
    password: tp.Optional[str] = None

class UserAdditionalSchema(BaseModel):
    id: int
    username: str
    notes: list["NoteSchema"]



class NoteSchema(BaseModel):
    id: int
    title: str
    description: tp.Optional[str] = None
    user: UserSchema
    created_at: datetime
    updated_at: tp.Optional[datetime] = None

class CreateNoteInputSchema(BaseModel):
    title: str
    description: tp.Optional[str] = None

class CreateNoteSchema(BaseModel):
    title: str
    description: tp.Optional[str] = None
    user_id: int
    created_at: datetime

class UpdateNoteSchema(BaseModel):
    title: tp.Optional[str] = None
    description: tp.Optional[str] = None





