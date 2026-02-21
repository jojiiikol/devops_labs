import uvicorn
from fastapi import FastAPI
from .routers.notes import router as notes_router
from .routers.user import router as user_router
from .routers.token import router as token_router

app = FastAPI()
app.include_router(token_router)
app.include_router(notes_router)
app.include_router(user_router)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
