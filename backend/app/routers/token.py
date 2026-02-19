from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from backend.app.services.token import TokenService, get_token_service

router = APIRouter(prefix="/token", tags=["Token"])


@router.post("/")
async def token(form_data: OAuth2PasswordRequestForm = Depends(), service: TokenService = Depends(get_token_service)) -> dict:
    user_token = await service.get_token(form_data)
    return user_token
