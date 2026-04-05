from fastapi import APIRouter
from fastapi import Response
from prometheus_client import generate_latest, REGISTRY, CONTENT_TYPE_LATEST

router = APIRouter(
    prefix="/metrics",
    tags=["metrics"],
)

@router.get("/")
async def get_metrics():
    return Response(
        content=generate_latest(REGISTRY),
        media_type=CONTENT_TYPE_LATEST
    )