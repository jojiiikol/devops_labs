from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from starlette.testclient import TestClient

from backend.app.entries.schemas import CreateUserSchema, UserSchema
from backend.app.main import app
from backend.app.entries.models import UserTable
from backend.app.repository.user import UserRepository
from backend.app.services.token import TokenService
from backend.app.services.user import UserService, get_user_service
from unittest.mock import AsyncMock

from backend.settings import settings

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
def token_service(user_service):
    return TokenService(user_service=user_service)

def test_hash_password(user_service):
    password = "VeryHardPassword"
    hashed_password = user_service.get_password_hash(password)
    verify_password = user_service.verify_password(password, hashed_password)
    assert verify_password == True

def test_token(token_service):
    data = {"sub": "test_user"}
    token = token_service.create_access_token(data)
    username = jwt.decode(token, settings.AUTH_SECRET_KEY, algorithms=[settings.AUTH_ALGORITHM])
    assert username.get("sub") == "test_user"

@pytest.mark.asyncio
async def test_succeed_get_current_user(token_service, user_service, mock_repository):
    test_user = UserTable(
        id=1,
        username="test_user",
        password=user_service.get_password_hash("test_password"),
        created_at=datetime.now(),
    )

    mock_repository.get_by_username.return_value = test_user

    form_data = OAuth2PasswordRequestForm(
        username="test_user",
        password="test_password",
        scope="",
        client_id=None,
        client_secret=None,
    )

    token = await token_service.get_token(form_data)
    token = token.get("access_token")
    user = await token_service.get_current_user(token)
    assert user == UserSchema.model_validate(test_user, from_attributes=True)

@pytest.mark.asyncio
async def test_expired_token(token_service, user_service, mock_repository):
    test_user = UserTable(
        id=1,
        username="test_user",
        password=user_service.get_password_hash("test_password"),
        created_at=datetime.now(),
    )

    mock_repository.get_by_username.return_value = test_user

    expired_token = jwt.encode(
        {
            "sub": "test_user",
            "exp": datetime.now(timezone.utc) - (timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)),
        },
        settings.AUTH_SECRET_KEY,
        algorithm=settings.AUTH_ALGORITHM,
    )

    with pytest.raises(HTTPException) as exc:
        await token_service.get_current_user(expired_token)

    assert exc.value.status_code == 401

@pytest.mark.asyncio
async def test_succeed_authenticate(user_service, mock_repository):
    test_user = UserTable(
        username="test_user",
        password=user_service.get_password_hash("test_password"),
        created_at=datetime.now(),
    )

    mock_repository.get_by_username.return_value = test_user
    user = await user_service.authenticate("test_username", "test_password")
    assert user == CreateUserSchema.model_validate(test_user, from_attributes=True)

@pytest.mark.asyncio
async def test_failed_by_password_authenticate(user_service, mock_repository):
    test_user = UserTable(
        username="test_user",
        password=user_service.get_password_hash("test_password"),
        created_at=datetime.now(),
    )

    mock_repository.get_by_username.return_value = test_user
    with pytest.raises(HTTPException) as exc:
        await user_service.authenticate("test_user", "123")

    assert exc.value.status_code == 401

@pytest.mark.asyncio
async def test_failed_by_user_not_found_authenticate(user_service, mock_repository):
    test_user = UserTable(
        username="test_user",
        password=user_service.get_password_hash("test_password"),
        created_at=datetime.now(),
    )

    mock_repository.get_by_username.return_value = test_user
    with pytest.raises(HTTPException) as exc:
        await user_service.authenticate("test_user1", "123")

    assert exc.value.status_code == 401


def test_token_endpoint_success(client, user_service, mock_repository):
    test_user = UserTable(
        id=1,
        username="test_user",
        password=user_service.get_password_hash("test_password"),
        created_at=datetime.now(),
    )

    mock_repository.get_by_username.return_value = test_user
    app.dependency_overrides[get_user_service] = lambda: user_service

    response = client.post(
        "/token",
        data={"username": "test_user", "password": "test_password"}
    )

    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"





