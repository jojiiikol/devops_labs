from datetime import timedelta, datetime, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from jwt import InvalidTokenError

from backend.app.entries.schemas import oauth2_scheme
from backend.app.services.user import UserService, get_user_service
from backend.settings import settings


class TokenService:
    def __init__(self, user_service: UserService):
        self.user_service = user_service


    def create_access_token(self, data: dict):
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.AUTH_SECRET_KEY, algorithm=settings.AUTH_ALGORITHM)
        return encoded_jwt

    async def get_token(self, form_data: OAuth2PasswordRequestForm):
        user = await self.user_service.authenticate(form_data.username, form_data.password)
        access_token = self.create_access_token(
            data={"sub": user.username}
        )
        return {"access_token": access_token, "token_type": "bearer"}

    async def get_current_user(self, token: str):
        try:
            payload = jwt.decode(token, settings.AUTH_SECRET_KEY, algorithms=[settings.AUTH_ALGORITHM])
            username = payload.get("sub")
        except InvalidTokenError:
            raise HTTPException(status_code=401)
        user = await self.user_service.get_by_username(username)
        return user

def get_token_service(user_service: UserService = Depends(get_user_service)):
    return TokenService(user_service)

async def get_current_user(
    token_service: TokenService = Depends(get_token_service),
    token: str = Depends(oauth2_scheme),
):
    return await token_service.get_current_user(token)
