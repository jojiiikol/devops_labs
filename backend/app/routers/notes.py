from fastapi import APIRouter, Depends, HTTPException

from ..entries.schemas import CreateNoteSchema, CreateNoteInputSchema, UpdateNoteSchema, oauth2_scheme, UserSchema
from ..services.note import get_note_service, NoteService
from ..services.token import get_current_user

router = APIRouter(prefix="/note",
                   tags=["note"])


@router.get("/")
async def get_notes(token: str = Depends(get_current_user), service: NoteService = Depends(get_note_service)):
    result = await service.get_all()
    return result

@router.get("/{id}")
async def get_note(id: int, service: NoteService = Depends(get_note_service)):
    note = await service.get_by_id(id)
    return note

@router.post("/")
async def create_note(note: CreateNoteInputSchema, service: NoteService = Depends(get_note_service)):
    result = await service.create(note)
    return result

@router.put("/{id}")
async def update_note(id: int, note: UpdateNoteSchema, service: NoteService = Depends(get_note_service)):
    result = await service.update(id, note)
    return result

@router.delete("/{id}")
async def delete_note(id: int, service: NoteService = Depends(get_note_service)):
    await service.delete(id)

