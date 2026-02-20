from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.testing.pickleable import User

from ..entries.schemas import CreateNoteSchema, CreateNoteInputSchema, UpdateNoteSchema, oauth2_scheme, UserSchema
from ..services.note import get_note_service, NoteService
from ..services.pemissions import NotePermission, get_note_permission
from ..services.token import get_current_user

router = APIRouter(prefix="/note",
                   tags=["note"])


@router.get("/")
async def get_notes(user: UserSchema = Depends(get_current_user), service: NoteService = Depends(get_note_service)):
    result = await service.get_all()
    return result

@router.get("/{id}")
async def get_note(id: int, permission_service: NotePermission = Depends(get_note_permission)):
    return await permission_service.is_owner_read(id)

@router.post("/")
async def create_note(note: CreateNoteInputSchema, service: NoteService = Depends(get_note_service), user: UserSchema = Depends(get_current_user)):
    result = await service.create(user, note)
    return result

@router.put("/{id}")
async def update_note(id: int, note: UpdateNoteSchema, permission_service: NotePermission = Depends(get_note_permission)):
    return await permission_service.is_owner_update(id, note)

@router.delete("/{id}")
async def delete_note(id: int, permission_service: NotePermission = Depends(get_note_permission)):
    await permission_service.is_owner_delete(id)

