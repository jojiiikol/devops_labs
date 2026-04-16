import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from ..app.main import app, db


@pytest.fixture
def mock_db_init():
    with patch.object(db, 'init_tables', new_callable=AsyncMock) as mock:
        yield mock


@pytest.fixture
def mock_sleep():
    with patch('asyncio.sleep', new_callable=AsyncMock) as mock:
        yield mock


def test_lifespan_integration(mock_db_init, mock_sleep):

    with TestClient(app) as client:
        mock_sleep.assert_called_once_with(10)
        mock_db_init.assert_called_once()

        response = client.get("/")
        assert response.status_code in (200, 404)

