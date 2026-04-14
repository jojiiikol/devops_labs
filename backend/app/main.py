import asyncio
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware

from .metrics.middleware import setup_metrics_middleware
from .db.db import db
from .routers.notes import router as notes_router
from .routers.user import router as user_router
from .routers.token import router as token_router
from .routers.metrics import router as metrics_router
# chae
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application starting up...")
    print("Waiting 10 seconds for db up...")
    await asyncio.sleep(10)
    print("init db schema...")
    await db.init_tables()

    yield

    print("Application shutting down...")

app = FastAPI(lifespan=lifespan, docs_url="/api/docs")
app.add_middleware(
    CORSMiddleware,
)
api_router = APIRouter()

setup_metrics_middleware(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router.include_router(token_router)
api_router.include_router(notes_router)
api_router.include_router(user_router)
api_router.include_router(metrics_router)

app.include_router(api_router, prefix="/api")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
