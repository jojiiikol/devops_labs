from datetime import datetime

from fastapi import Depends
from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from ..entries.models import NotesTable
from ..db.db import db
from ..entries.schemas import CreateNoteSchema, UpdateNoteSchema


class NoteRepository:
    def __init__(self, session: AsyncSession):
        self.session: AsyncSession = session

    async def get_all(self):
        query = select(NotesTable).options(selectinload(NotesTable.user))
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_by_id(self, note_id: int) -> NotesTable:
        query = select(NotesTable).where(NotesTable.id == note_id).options(selectinload(NotesTable.user))
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_user(self, user_id: int):
        query = select(NotesTable).where(NotesTable.user_id == user_id).options(selectinload(NotesTable.user))
        result = await self.session.execute(query)
        return result.scalars().all()

    async def update(self, note_id: int, note: UpdateNoteSchema):
        query = select(NotesTable).where(NotesTable.id == note_id).options(selectinload(NotesTable.user))
        result = await self.session.execute(query)
        note_model = result.scalar_one_or_none()
        if note_model:
            updated_data = note.model_dump(exclude_unset=True, exclude_none=True)
            for key, value in updated_data.items():
                setattr(note_model, key, value)
            note_model.updated_at = datetime.now()
            await self.session.commit()
            await self.session.refresh(note_model, ["user"])
            return note_model
        return None

    async def create(self, note: CreateNoteSchema):
        model_note = NotesTable(**note.model_dump())
        self.session.add(model_note)
        await self.session.commit()
        return model_note

    async def delete(self, note_id: int):
        query = delete(NotesTable).where(NotesTable.id == note_id)
        await self.session.execute(query)
        await self.session.commit()


def get_note_repository(session: AsyncSession = Depends(db.get_session)) -> NoteRepository:
    return NoteRepository(session)