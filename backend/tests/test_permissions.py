import pytest
from unittest.mock import AsyncMock
from fastapi import HTTPException
from starlette.status import HTTP_403_FORBIDDEN
from datetime import datetime

from backend.app.entries.schemas import UserSchema, NoteSchema, UpdateNoteSchema, UpdateUserInputSchema
from backend.app.services.note import NoteService
from backend.app.services.pemissions import NotePermission, UserPermission

@pytest.fixture
def test_user():
    return UserSchema(id=1, username="user1", created_at=datetime.now())

@pytest.fixture
def admin_user():
    return UserSchema(id=2, username="admin", created_at=datetime.now())

@pytest.fixture
def test_note(test_user):
    return NoteSchema(id=1, title="title", description="description", created_at=datetime.now(), user=test_user, updated_at=datetime.now())


@pytest.fixture
def note_service():
    return AsyncMock()

@pytest.fixture
def user_service():
    return AsyncMock()

@pytest.mark.asyncio
async def test_admin_read_all(admin_user, note_service):
    note_service.get_all.return_value = []
    note_permission = NotePermission(user=admin_user, service=note_service)
    result = await note_permission.read_all()
    assert result == []

@pytest.mark.asyncio
async def test_not_admin_read_all(test_user, note_service):
    note_service.get_all.return_value = []
    note_permission = NotePermission(user=test_user, service=note_service)
    with pytest.raises(HTTPException) as exc:
        await note_permission.read_all()
    assert exc.value.status_code == 403

@pytest.mark.asyncio
async def test_owner_read(test_user, note_service, test_note):
    note_service.get_by_id.return_value = test_note
    note_permission = NotePermission(user=test_user, service=note_service)
    result = await note_permission.is_owner_read(1)
    assert result == test_note

@pytest.mark.asyncio
async def test_not_owner_read(admin_user, note_service, test_note):
    note_service.get_by_id.return_value = test_note
    note_permission = NotePermission(user=admin_user, service=note_service)
    with pytest.raises(HTTPException) as exc:
        await note_permission.is_owner_read(1)
    assert exc.value.status_code == 403

@pytest.mark.asyncio
async def test_owner_update(test_user, note_service, test_note):
    note_service.get_by_id.return_value = test_note
    note_service.update.return_value = test_note
    note_permission = NotePermission(user=test_user, service=note_service)
    result = await note_permission.is_owner_update(1, UpdateNoteSchema())
    assert result == test_note

@pytest.mark.asyncio
async def test_not_owner_update(admin_user, note_service, test_note):
    note_service.get_by_id.return_value = test_note
    note_service.update.return_value = test_note
    note_permission = NotePermission(user=admin_user, service=note_service)
    with pytest.raises(HTTPException) as exc:
        await note_permission.is_owner_update(1, UpdateNoteSchema())
    assert exc.value.status_code == 403

@pytest.mark.asyncio
async def test_owner_delete(test_user, note_service, test_note):
    note_service.get_by_id.return_value = test_note
    note_permission = NotePermission(user=test_user, service=note_service)
    await note_permission.is_owner_delete(1)

@pytest.mark.asyncio
async def test_not_owner_delete(admin_user, note_service, test_note):
    note_service.get_by_id.return_value = test_note
    note_permission = NotePermission(user=admin_user, service=note_service)
    with pytest.raises(HTTPException) as exc:
        await note_permission.is_owner_delete(1)
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_owner_delete_user(test_user, user_service):
    user_service.get_by_id.return_value = test_user
    user_permission = UserPermission(user=test_user, service=user_service)
    await user_permission.is_owner_delete(1)

@pytest.mark.asyncio
async def test_not_owner_delete_user(admin_user, user_service, test_user):
    user_service.get_by_id.return_value = test_user
    user_permission = UserPermission(user=admin_user, service=user_service)
    with pytest.raises(HTTPException) as exc:
        await user_permission.is_owner_delete(1)
    assert exc.value.status_code == 403

@pytest.mark.asyncio
async def test_owner_update_user(test_user, user_service):
    user_service.get_by_id.return_value = test_user
    user_service.update.return_value = test_user
    user_permission = UserPermission(user=test_user, service=user_service)
    result = await user_permission.is_owner_update(1, UpdateUserInputSchema())
    assert result == test_user

@pytest.mark.asyncio
async def test_not_owner_update_user(admin_user, user_service, test_user):
    user_service.get_by_id.return_value = test_user
    user_service.update.return_value = test_user
    user_permission = UserPermission(user=admin_user, service=user_service)
    with pytest.raises(HTTPException) as exc:
        await user_permission.is_owner_update(1, UpdateUserInputSchema())
    assert exc.value.status_code == 403