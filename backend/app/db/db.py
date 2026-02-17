from typing import Any, AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from ..entries.models import BaseTable
from backend.settings import settings


class Database:
    def __init__(self):
        self.url = settings.ASYNC_DB_URL
        self.engine = create_async_engine(url=self.url, echo=False)
        self.session_factory = async_sessionmaker(bind=self.engine)

    async def get_session(self) -> AsyncGenerator[AsyncSession, Any]:
        async with self.session_factory() as session:
            yield session

    async def init_tables(self):
        async with self.engine.begin() as conn:
            await conn.run_sync(BaseTable.metadata.create_all)


db = Database()