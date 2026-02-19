from datetime import datetime

from fastapi import Depends, HTTPException
from ..repository.note import NoteRepository, get_note_repository
from ..entries.schemas import NoteSchema, CreateNoteSchema, CreateNoteInputSchema, UpdateNoteSchema


class NoteService:
    def __init__(self, repository: NoteRepository):
        self.repository = repository

    async def get_all(self):
        note_models = await self.repository.get_all()
        notes = [NoteSchema.model_validate(note_model, from_attributes=True) for note_model in note_models]
        return notes

    async def get_by_id(self, id: int):
        note_model = await self.repository.get_by_id(id)
        if note_model:
            return NoteSchema.model_validate(note_model, from_attributes=True)
        raise HTTPException(status_code=404, detail="Note not found")

    async def create(self, note: CreateNoteInputSchema):
        create_note = CreateNoteSchema(**note.model_dump(), created_at=datetime.now())
        await self.repository.create(create_note)
        return create_note

    async def update(self, note_id: int, note: UpdateNoteSchema):
        updated_note = await self.repository.update(note_id, note)
        if updated_note:
            return NoteSchema.model_validate(updated_note, from_attributes=True)
        raise HTTPException(status_code=404, detail="Note not found")

    async def delete(self, note_id: int):
        await self.repository.delete(note_id)
        raise HTTPException(status_code=204)


def get_note_service(repository: NoteRepository = Depends(get_note_repository)) -> NoteService:
    return NoteService(repository)