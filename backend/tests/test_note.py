from datetime import datetime
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException
from sqlalchemy.testing.pickleable import User
from starlette.testclient import TestClient

from backend.app.entries.schemas import NoteSchema, UserSchema, CreateNoteSchema, CreateNoteInputSchema, \
    UpdateNoteSchema
from backend.app.main import app
from backend.app.repository.note import NoteRepository
from backend.app.services.note import NoteService, get_note_service
from backend.app.entries.models import NotesTable, UserTable
from backend.app.services.pemissions import get_note_permission
from backend.app.services.token import get_current_user


@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def mock_repository():
    return AsyncMock(spec=NoteRepository)

@pytest.fixture
def note_service(mock_repository):
    return NoteService(repository=mock_repository)

@pytest.fixture
def mock_note_service():
    return AsyncMock()

@pytest.fixture
def note_permission_service(mock_repository):
    return AsyncMock()

@pytest.mark.asyncio
async def test_get_all(note_service, mock_repository):
    notes_db = [NotesTable(id=1, user=UserTable(id=1, username="test_user", password="test_pass", created_at=datetime.now()), title="title", description="description",
                                                       created_at=datetime.now(), updated_at=datetime.now())]
    mock_repository.get_all.return_value = notes_db
    notes = await note_service.get_all()
    assert notes == [NoteSchema.model_validate(note, from_attributes=True) for note in notes_db]

@pytest.mark.asyncio
async def test_get_by_id(note_service, mock_repository):
    notes_db = NotesTable(id=1, user=UserTable(id=1, username="test_user", password="test_pass", created_at=datetime.now()), title="title", description="description",
                                                       created_at=datetime.now(), updated_at=datetime.now())
    mock_repository.get_by_id.return_value = notes_db
    notes = await note_service.get_by_id(1)
    assert notes == NoteSchema.model_validate(notes_db, from_attributes=True)

@pytest.mark.asyncio
async def test_get_by_id_not_found(note_service, mock_repository):
    mock_repository.get_by_id.return_value = None
    with pytest.raises(HTTPException) as exc:
        await note_service.get_by_id("1")
    assert exc.value.status_code == 404

@pytest.mark.asyncio
async def test_get_by_user(note_service, mock_repository):
    notes_db = [NotesTable(id=1,
                          user=UserTable(id=1, username="test_user", password="test_pass", created_at=datetime.now()),
                          title="title", description="description",
                          created_at=datetime.now(), updated_at=datetime.now())]
    mock_repository.get_by_user.return_value = notes_db
    notes = await note_service.get_by_user(UserSchema(id=1, username="test_user", created_at=datetime.now()))
    assert notes == [NoteSchema.model_validate(note, from_attributes=True) for note in notes_db]

@pytest.mark.asyncio
async def test_create_note(note_service, mock_repository):
    created_at = datetime.now()
    note_db = NotesTable(id=1,
                          user_id=1,
                          title="title", description="description",
                          created_at=created_at, updated_at=datetime.now())
    mock_repository.create.return_value = note_db

    user = UserTable(id=1, username="test_user", password="test_pass", created_at=datetime.now())
    note_create = CreateNoteInputSchema(title="title", description="description")
    note = await note_service.create(note=note_create, user=user)
    note.created_at = created_at
    assert note == CreateNoteSchema.model_validate(note_db, from_attributes=True)

@pytest.mark.asyncio
async def test_update_note(note_service, mock_repository):
    updated_at = datetime.now()
    user = UserTable(id=1, username="test_user", password="test_pass", created_at=datetime.now())
    note_db = NotesTable(id=1,
                         user=user,
                         title="title", description="description",
                         created_at=updated_at, updated_at=updated_at)

    mock_repository.update.return_value = note_db

    note_update = UpdateNoteSchema(title="title", description="description")
    note = await note_service.update(note_id=1, note=note_update)
    note.updated_at = updated_at
    assert note == NoteSchema.model_validate(note_db, from_attributes=True)

@pytest.mark.asyncio
async def test_update_note_not_found(note_service, mock_repository):
    mock_repository.update.return_value = None

    note_update = UpdateNoteSchema(title="title", description="description")
    with pytest.raises(HTTPException) as exc:
        await note_service.update(note_id=1, note=note_update)
    assert exc.value.status_code == 404

@pytest.mark.asyncio
async def test_delete_note(note_service, mock_repository):
    mock_repository.delete.return_value = None
    with pytest.raises(HTTPException) as exc:
        await note_service.delete(1)
    assert exc.value.status_code == 204
    mock_repository.delete.assert_awaited_once_with(1)


@pytest.mark.asyncio
async def test_get_all_route(client, note_permission_service):
    app.dependency_overrides[get_note_permission] = lambda: note_permission_service
    note_permission_service.read_all.return_value = []

    response = client.get(
        "/note",
    )

    assert response.status_code == 200
    body = response.json()
    assert [] == body

@pytest.mark.asyncio
async def test_get_by_id_route(client, note_permission_service):
    app.dependency_overrides[get_note_permission] = lambda: note_permission_service
    note = NoteSchema(id=1, user=UserSchema(username="test", id=1, created_at=datetime.now()), title="title", description="description", created_at=datetime.now(), updated_at=datetime.now())
    note_permission_service.is_owner_read.return_value = note

    response = client.get(
        "/note/1",
    )

    assert response.status_code == 200
    body = response.json()
    assert note == NoteSchema.model_validate(body)

@pytest.mark.asyncio
async def test_create_note_route(client, mock_note_service):
    app.dependency_overrides[get_note_service] = lambda: mock_note_service
    app.dependency_overrides[get_current_user] = lambda: UserSchema(username="test", id=1, created_at=datetime.now())
    return_note = CreateNoteSchema(title="title", description="description", created_at=datetime.now(), user_id=1)
    mock_note_service.create.return_value = return_note

    create_note = CreateNoteInputSchema(title="title", description="description")


    response = client.post(
        "/note",
        json=create_note.model_dump()
    )

    assert response.status_code == 200
    body = response.json()
    assert return_note == CreateNoteSchema.model_validate(body)

@pytest.mark.asyncio
async def test_update_user_route(client, note_permission_service):
    app.dependency_overrides[get_note_permission] = lambda: note_permission_service
    app.dependency_overrides[get_current_user] = lambda: UserSchema(username="test", id=1, created_at=datetime.now())
    return_note = NoteSchema(title="title", description="description", created_at=datetime.now(), user=UserSchema(username="test", id=1, created_at=datetime.now()), updated_at=datetime.now(), id=1)
    update_note = UpdateNoteSchema(title="title", description="description")
    note_permission_service.is_owner_update.return_value = return_note

    response = client.put(
        "/note/1",
        json=update_note.model_dump()
    )

    assert response.status_code == 200
    body = response.json()
    assert return_note == NoteSchema.model_validate(body)

@pytest.mark.asyncio
async def test_delete_user_route(client, note_permission_service):
    app.dependency_overrides[get_note_permission] = lambda: note_permission_service

    response = client.delete(
        "/note/1",
    )

    assert response.status_code == 200