from datetime import datetime

from fastapi import Depends
from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from ..entries.models import NotesTable, UserTable
from ..db.db import db
from ..entries.schemas import NoteSchema, CreateNoteSchema, UpdateNoteSchema, CreateNoteInputSchema, CreateUserSchema


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session: AsyncSession = session

    async def get_all(self):
        query = select(UserTable).options(joinedload(UserTable.notes))
        result = await self.session.execute(query)
        return result.unique().scalars().all()

    async def get_by_id(self, user_id: int) -> NotesTable:
        query = select(UserTable).where(UserTable.id == user_id).options(joinedload(UserTable.notes))
        result = await self.session.execute(query)
        return result.unique().scalar_one_or_none()

    async def get_by_username(self, username: str) -> NotesTable:
        query = select(UserTable).where(UserTable.username == username)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def update(self, user_id: int, user: UpdateNoteSchema):
        query = select(UserTable).where(UserTable.id == user_id)
        result = await self.session.execute(query)
        user_model = result.scalar_one_or_none()
        if user_model:
            updated_data = user.model_dump(exclude_unset=True, exclude_none=True)
            for key, value in updated_data.items():
                setattr(user_model, key, value)
            await self.session.commit()
            await self.session.refresh(user_model)
            return user_model
        return None

    async def create(self, user: CreateUserSchema):
        model_user = UserTable(**user.model_dump())
        self.session.add(model_user)
        await self.session.commit()
        return model_user

    async def delete(self, user_id: int):
        query = delete(UserTable).where(UserTable.id == user_id)
        await self.session.execute(query)
        await self.session.commit()


def get_user_repository(session: AsyncSession = Depends(db.get_session)) -> UserRepository:
    return UserRepository(session)