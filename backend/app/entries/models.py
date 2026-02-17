import datetime
from typing import List

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, relationship


class BaseTable(DeclarativeBase):
    pass

class UserTable(BaseTable):
    __tablename__ = "user"

    id: Mapped[int] = Column(Integer, primary_key=True)
    username: Mapped[String] = Column(String)
    password: Mapped[String] = Column(String)
    created_at: Mapped[datetime] = Column(DateTime)

    notes: Mapped[List["NotesTable"]] = relationship(back_populates="user")

class NotesTable(BaseTable):
    __tablename__ = "note"

    id: Mapped[int] = Column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey("user.id"))
    title: Mapped[str] = Column(String)
    description: Mapped[str] = Column(String)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True))

    user: Mapped["UserTable"] = relationship(back_populates="notes")
