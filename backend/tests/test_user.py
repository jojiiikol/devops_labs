from datetime import datetime
from unittest.mock import AsyncMock

from fastapi import HTTPException

from backend.app.entries.models import UserTable

import pytest
from starlette.testclient import TestClient

from backend.app.entries.schemas import CreateUserInputSchema, UpdateUserInputSchema, UserSchema, CreateUserSchema
from backend.app.main import app
from backend.app.repository.user import UserRepository
from backend.app.services.pemissions import get_user_permission
from backend.app.services.user import UserService, get_user_service


@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def mock_repository():
    return AsyncMock(spec=UserRepository)

@pytest.fixture
def user_service(mock_repository):
    return UserService(repository=mock_repository)

@pytest.fixture
def mock_user_service():
    return AsyncMock()

@pytest.fixture
def mock_permission_user_service():
    return AsyncMock()

@pytest.fixture
def permission_service():
    return AsyncMock()

@pytest.mark.asyncio
async def test_create_user_success(user_service, mock_repository):
    mock_repository.get_by_username.return_value = None
    mock_repository.create.return_value = None

    input_data = CreateUserInputSchema(username="test_user", password="test_pass")
    created_user = await user_service.create(input_data)

    assert created_user.username == input_data.username
    assert user_service.verify_password("test_pass", created_user.password)

@pytest.mark.asyncio
async def test_create_user_already_exists(user_service, mock_repository):
    mock_repository.get_by_username.return_value = UserTable(id=1, username="test_user", password="hashed", created_at=datetime.now())

    input_data = CreateUserInputSchema(username="test_user", password="test_pass")
    with pytest.raises(HTTPException) as exc:
        await user_service.create(input_data)
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_get_by_id_found(user_service, mock_repository):
    mock_user = UserTable(id=1, username="test_user", password="hashed", created_at=datetime.now())
    mock_repository.get_by_id.return_value = mock_user

    user = await user_service.get_by_id(1)
    assert user.username == "test_user"

@pytest.mark.asyncio
async def test_get_by_id_not_found(user_service, mock_repository):
    mock_repository.get_by_id.return_value = None
    with pytest.raises(HTTPException) as exc:
        await user_service.get_by_id(999)
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_update_user_success(user_service, mock_repository):
    mock_repository.update.return_value = UserTable(id=1, username="user1", password="hashed", created_at=datetime.now())
    input_data = UpdateUserInputSchema(password="new_pass")
    user = await user_service.update(1, input_data)
    assert user.username == "user1"

@pytest.mark.asyncio
async def test_update_user_not_found(user_service, mock_repository):
    mock_repository.update.return_value = None
    input_data = UpdateUserInputSchema(password="new_pass")
    with pytest.raises(HTTPException) as exc:
        await user_service.update(999, input_data)
    assert exc.value.status_code == 404

@pytest.mark.asyncio
async def test_delete_user(user_service, mock_repository):
    mock_repository.delete.return_value = None
    with pytest.raises(HTTPException) as exc:
        await user_service.delete(1)
    assert exc.value.status_code == 204
    mock_repository.delete.assert_awaited_once_with(1)

@pytest.mark.asyncio
async def test_get_all(user_service, mock_repository):
    mock_repository.get_all.return_value = [UserTable(id=1, username="user1", password="", created_at=datetime.now(), notes=[])]
    result = await user_service.get_all()
    assert result == [UserSchema.model_validate(user_model, from_attributes=True) for user_model in result]

@pytest.mark.asyncio
async def test_get_by_username_found(user_service, mock_repository):
    mock_user = UserTable(id=1, username="test_user", password="hashed", created_at=datetime.now())
    mock_repository.get_by_username.return_value = mock_user

    user = await user_service.get_by_username("test_user")
    assert user.username == "test_user"

@pytest.mark.asyncio
async def test_get_by_username_not_found(user_service, mock_repository):
    mock_repository.get_by_username.return_value = None
    with pytest.raises(HTTPException) as exc:
        await user_service.get_by_username("test_user")
    assert exc.value.status_code == 404

@pytest.mark.asyncio
async def test_get_by_username_additional_found(user_service, mock_repository):
    mock_user = UserTable(id=1, username="test_user", password="", created_at=datetime.now(), notes=[])
    mock_repository.get_by_username_additional.return_value = mock_user

    user = await user_service.get_by_username_additional("test_user")
    assert user.username == "test_user"

@pytest.mark.asyncio
async def test_get_by_username_additional_not_found(user_service, mock_repository):
    mock_repository.get_by_username_additional.return_value = None
    with pytest.raises(HTTPException) as exc:
        await user_service.get_by_username_additional("test_user")
    assert exc.value.status_code == 404

@pytest.mark.asyncio
async def test_get_all_route(client, mock_user_service):
    app.dependency_overrides[get_user_service] = lambda: mock_user_service
    mock_user_service.get_all.return_value = []

    response = client.get(
        "/user",
    )

    assert response.status_code == 200
    body = response.json()
    assert [] == body

@pytest.mark.asyncio
async def test_get_by_id_route(client, mock_user_service):
    app.dependency_overrides[get_user_service] = lambda: mock_user_service
    user = UserSchema(id=1, username="test", created_at=datetime.now())
    mock_user_service.get_by_id.return_value = user

    response = client.get(
        "/user/1",
    )

    assert response.status_code == 200
    body = response.json()
    assert user == UserSchema.model_validate(body)

@pytest.mark.asyncio
async def test_create_user_route(client, mock_user_service):
    app.dependency_overrides[get_user_service] = lambda: mock_user_service
    user = CreateUserSchema(username="test", created_at=datetime.now(), password="test")
    user_create = CreateUserInputSchema(username="test", password="test")
    mock_user_service.create.return_value = user

    response = client.post(
        "/user",
        json=user_create.model_dump()
    )

    assert response.status_code == 200
    body = response.json()
    assert user == CreateUserSchema.model_validate(body)

@pytest.mark.asyncio
async def test_update_user_route(client, mock_permission_user_service):
    app.dependency_overrides[get_user_permission] = lambda: mock_permission_user_service
    user = UserSchema(id=1, username="test", created_at=datetime.now())
    update_user = UpdateUserInputSchema(username="test", password="test")
    mock_permission_user_service.is_owner_update.return_value = user

    response = client.put(
        "/user/1",
        json=update_user.model_dump()
    )

    assert response.status_code == 200
    body = response.json()
    assert user == UserSchema.model_validate(body)

@pytest.mark.asyncio
async def test_delete_user_route(client, mock_permission_user_service):
    app.dependency_overrides[get_user_permission] = lambda: mock_permission_user_service

    response = client.delete(
        "/user/1",
    )

    assert response.status_code == 200


