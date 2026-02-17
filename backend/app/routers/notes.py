from fastapi import APIRouter

router = APIRouter(prefix="/note",
                   tags=["note"])


@router.get("/", tags=["note"])
async def get_notes():
    return {"notes": ["alala", "alala", "alala"]}

@router.get("/id", tags=["note"])
async def get_note(id: int):
    return {"note": "1"}

@router.post("/", tags=["note"])
async def create_note():
    return {"note": "1"}

@router.put("/", tags=["note"])
async def update_note():
    return {"note": "1"}

@router.delete("/", tags=["note"])
async def delete_note():
    return {"note": "1"}

