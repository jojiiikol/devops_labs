

import pytest
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from backend.app.db.db import Database
from backend.app.entries.models import UserTable


@pytest.mark.asyncio
async def test_init_tables_creates_admin():
    # Создаём временный экземпляр Database с in-memory SQLite
    db = Database()
    db.url = "sqlite+aiosqlite:///:memory:"
    db.engine = create_async_engine(db.url, echo=False)
    db.session_factory = async_sessionmaker(bind=db.engine, expire_on_commit=False)

    # Вызываем init_tables
    await db.init_tables()

    # Проверяем, что admin пользователь создан
    async for session in db.get_session():
        query = select(UserTable).where(UserTable.username == "admin")
        result = await session.execute(query)
        user = result.scalar_one_or_none()

        assert user is not None
        assert user.username == "admin"
        # Опционально проверяем хеш пароля
        assert PasswordHash.recommended().verify("admin", user.password)