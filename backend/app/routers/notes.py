from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.testing.pickleable import User

from ..entries.schemas import CreateNoteSchema, CreateNoteInputSchema, UpdateNoteSchema, oauth2_scheme, UserSchema, \
    NoteSchema
from ..services.note import get_note_service, NoteService
from ..services.pemissions import NotePermission, get_note_permission
from ..services.token import get_current_user

router = APIRouter(prefix="/note",
                   tags=["note"])


@router.get("/")
async def get_notes(permission: NotePermission = Depends(get_note_permission)) -> list[NoteSchema]:
    '''
        Эндпоинт для получения всех заметок в системе. Доступно только админу
    '''
    result = await permission.read_all()
    return result

@router.get("/me")
async def get_my_notes(user: UserSchema = Depends(get_current_user), service: NoteService = Depends(get_note_service)) -> list[NoteSchema]:
    '''
        Эндпоинт для получения всех заметок аутентифицированного пользователя
    '''
    result = await service.get_by_user(user)
    return result

@router.get("/{id}")
async def get_note(id: int, permission_service: NotePermission = Depends(get_note_permission)) -> NoteSchema:
    '''
        Эндпоинт для получения определенной заметки по id. Доступно создателю
    '''
    return await permission_service.is_owner_read(id)

@router.post("/")
async def create_note(note: CreateNoteInputSchema, service: NoteService = Depends(get_note_service), user: UserSchema = Depends(get_current_user)) -> CreateNoteSchema:
    '''
        Эндпоинт для получения создания заметки. Доступно аутентифицированному пользователю
    '''
    result = await service.create(user, note)
    return result

@router.put("/{id}")
async def update_note(id: int, note: UpdateNoteSchema, permission_service: NotePermission = Depends(get_note_permission)) -> NoteSchema:
    '''
        Эндпоинт для обновления заметки. Доступно создателю
    '''
    return await permission_service.is_owner_update(id, note)

@router.delete("/{id}")
async def delete_note(id: int, permission_service: NotePermission = Depends(get_note_permission)):
    '''
        Эндпоинт для удаления заметки. Доступно создателю
    '''
    await permission_service.is_owner_delete(id)

