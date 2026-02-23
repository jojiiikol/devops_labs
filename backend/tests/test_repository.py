from datetime import datetime

import pytest
import asyncio

import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from backend.app.db.db import db
from backend.app.entries.models import BaseTable, UserTable
from backend.app.entries.schemas import CreateUserSchema, UpdateUserInputSchema, UpdateNoteSchema, CreateNoteSchema
from backend.app.repository.note import NoteRepository
from backend.app.repository.user import UserRepository

DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture
async def async_session():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        await conn.run_sync(BaseTable.metadata.create_all)

    async_session_maker = sessionmaker(
        engine, expire_on_commit=False, class_=AsyncSession
    )

    async with async_session_maker() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(BaseTable.metadata.drop_all)


@pytest.mark.asyncio
async def test_create_user(async_session: AsyncSession):
    repo = UserRepository(async_session)

    new_user = CreateUserSchema(username="testuser", password="secret", created_at=datetime.now())
    created_user = await repo.create(new_user)

    assert created_user.id is not None
    assert created_user.username == "testuser"

    user = await repo.get_by_id(1)
    assert user == created_user

    user = await repo.get_by_id(2)
    assert user is None


@pytest.mark.asyncio
async def test_get_user(async_session: AsyncSession):
    repo = UserRepository(async_session)

    new_user = CreateUserSchema(username="testuser", password="secret", created_at=datetime.now())
    created_user = await repo.create(new_user)

    assert created_user.id is not None
    assert created_user.username == "testuser"

    user = await repo.get_by_id(1)
    assert user == created_user

    user = await repo.get_by_username("testuser")
    assert user == created_user

    user = await repo.get_by_username("testuser2")
    assert user is None

    users = await repo.get_all()
    assert users == [created_user]
    assert len(users) == 1

@pytest.mark.asyncio
async def test_update_user(async_session: AsyncSession):
    repo = UserRepository(async_session)

    new_user = CreateUserSchema(username="testuser", password="secret", created_at=datetime.now())
    created_user = await repo.create(new_user)

    assert created_user.id is not None
    assert created_user.username == "testuser"

    user = await repo.update(1, UpdateUserInputSchema(username="new_username", password="new_password"))
    assert user.username == "new_username"
    assert user.password == "new_password"

@pytest.mark.asyncio
async def test_update_user(async_session: AsyncSession):
    repo = UserRepository(async_session)

    new_user = CreateUserSchema(username="testuser", password="secret", created_at=datetime.now())
    created_user = await repo.create(new_user)

    await repo.delete(1)

    user = await repo.get_by_id(1)
    assert user is None

    user = await repo.update(1, UpdateUserInputSchema(username="new_username", password=""))
    assert user is None

@pytest.mark.asyncio
async def test_create_notes(async_session: AsyncSession):
    note_repo = NoteRepository(async_session)
    user_repo = UserRepository(async_session)

    new_user = CreateUserSchema(username="testuser", password="secret", created_at=datetime.now())
    created_user = await user_repo.create(new_user)

    new_note = CreateNoteSchema(title="title", description="description", user_id=created_user.id, created_at=datetime.now())
    created_note = await note_repo.create(new_note)

    assert created_note.title == "title"
    assert created_note.description == "description"
    assert created_note.user_id == created_user.id

@pytest.mark.asyncio
async def test_get_notes(async_session: AsyncSession):
    note_repo = NoteRepository(async_session)
    user_repo = UserRepository(async_session)

    new_user = CreateUserSchema(username="testuser", password="secret", created_at=datetime.now())
    created_user = await user_repo.create(new_user)

    new_note = CreateNoteSchema(title="title", description="description", user_id=created_user.id,
                                created_at=datetime.now())
    created_note = await note_repo.create(new_note)

    find_note = await note_repo.get_by_id(1)
    assert find_note == created_note

    find_note = await note_repo.get_by_user(1)
    assert find_note == [created_note]

    find_note = await note_repo.get_by_id(2)
    assert find_note is None

    find_note = await note_repo.get_all()
    assert len(find_note) == 1

@pytest.mark.asyncio
async def test_update_notes(async_session: AsyncSession):
    note_repo = NoteRepository(async_session)
    user_repo = UserRepository(async_session)

    new_user = CreateUserSchema(username="testuser", password="secret", created_at=datetime.now())
    created_user = await user_repo.create(new_user)

    new_note = CreateNoteSchema(title="title", description="description", user_id=created_user.id,
                                created_at=datetime.now())
    created_note = await note_repo.create(new_note)

    update_note = await note_repo.update(1, UpdateNoteSchema(title="new_title", description="new_description",))
    assert update_note.title == "new_title"
    assert update_note.description == "new_description"
    assert update_note.user_id == created_user.id
    assert update_note.id == created_note.id

    update_note = await note_repo.update(2, UpdateNoteSchema(title="title", description="new_description",))
    assert update_note is None


@pytest.mark.asyncio
async def test_delete_notes(async_session: AsyncSession):
    note_repo = NoteRepository(async_session)
    user_repo = UserRepository(async_session)

    new_user = CreateUserSchema(username="testuser", password="secret", created_at=datetime.now())
    created_user = await user_repo.create(new_user)

    new_note = CreateNoteSchema(title="title", description="description", user_id=created_user.id,
                                created_at=datetime.now())
    created_note = await note_repo.create(new_note)

    await note_repo.delete(1)
    find_note = await note_repo.get_by_id(1)
    assert find_note is None

@pytest.mark.asyncio
async def test_get_by_username_additional(async_session: AsyncSession):
    note_repo = NoteRepository(async_session)
    user_repo = UserRepository(async_session)

    new_user = CreateUserSchema(username="testuser", password="secret", created_at=datetime.now())
    created_user = await user_repo.create(new_user)

    new_note = CreateNoteSchema(title="title", description="description", user_id=created_user.id,
                                created_at=datetime.now())
    created_note = await note_repo.create(new_note)

    find_user = await user_repo.get_by_username_additional("testuser")
    assert find_user == created_user
    assert find_user.notes == [created_note]

    find_user = await user_repo.get_by_username("testuser2")
    assert find_user is None


