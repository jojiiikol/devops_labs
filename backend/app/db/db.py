import asyncio
from typing import Any, AsyncGenerator

from datetime import datetime
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from ..entries.models import BaseTable, UserTable
from backend.settings import settings


class Database:
    def __init__(self):
        self.url = settings.ASYNC_DB_URL
        self.engine = create_async_engine(url=self.url, echo=False)
        self.session_factory = async_sessionmaker(bind=self.engine, expire_on_commit=False)

    async def get_session(self) -> AsyncGenerator[AsyncSession, Any]:
        async with self.session_factory() as session:
            yield session

    async def init_tables(self):
        async with self.engine.begin() as conn:
            await conn.run_sync(BaseTable.metadata.create_all)

        async with self.session_factory() as session:
            query = select(UserTable.id).limit(1)
            result = await session.execute(query)
            user = result.one_or_none()
            if not user:
                admin_user = UserTable(
                    username="admin",
                    password=PasswordHash.recommended().hash("admin"),
                    created_at=datetime.now(),
                )
                session.add(admin_user)
                await session.commit()


db = Database()

if __name__ == "__main__":
    asyncio.run(db.init_tables())