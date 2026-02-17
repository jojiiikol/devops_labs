from fastapi import APIRouter

from ..db.db import db

router = APIRouter(prefix="/db")

@router.post("/")
async def create_db():
    await db.init_tables()
    return {"message": "database created"}
