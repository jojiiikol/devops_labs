from datetime import datetime

from argon2 import PasswordHasher
from fastapi import Depends, HTTPException
from pwdlib import PasswordHash

from ..entries.schemas import UserSchema, CreateUserInputSchema, CreateUserSchema, \
    UpdateUserInputSchema, UserAdditionalSchema
from ..repository.user import UserRepository, get_user_repository


class UserService:
    def __init__(self, repository: UserRepository):
        self.repository = repository
        self.password_hasher = PasswordHash.recommended()


    async def get_all(self):
        user_models = await self.repository.get_all()
        users = [UserSchema.model_validate(user_model, from_attributes=True) for user_model in user_models]
        return users

    async def get_by_id(self, id: int):
        user_model = await self.repository.get_by_id(id)
        if user_model:
            return UserAdditionalSchema.model_validate(user_model, from_attributes=True)
        return HTTPException(status_code=404, detail="User not found")

    async def get_by_username(self, username: str):
        user_model = await self.repository.get_by_username(username)
        if user_model:
            return CreateUserSchema.model_validate(user_model, from_attributes=True)
        raise HTTPException(status_code=404, detail="User not found")

    async def create(self, user: CreateUserInputSchema):
        create_user = CreateUserSchema(
            username=user.username,
            password=self.get_password_hash(user.password),
            created_at=datetime.now(),
        )
        await self.repository.create(create_user)
        return create_user

    async def update(self, id: int, user: UpdateUserInputSchema):
        updated_user = await self.repository.update(id, user)
        if updated_user:
            return UserSchema.model_validate(updated_user, from_attributes=True)
        return HTTPException(status_code=404, detail="User not found")

    async def delete(self, id: int):
        await self.repository.delete(id)
        raise HTTPException(status_code=204)

    async def authenticate(self, username: str, password: str):
        user = await self.repository.get_by_username(username)
        if not user:
            raise HTTPException(status_code=401)

        user = CreateUserSchema.model_validate(user, from_attributes=True)
        if self.verify_password(password, user.password):
            return user
        raise HTTPException(status_code=401)

    def get_password_hash(self, password: str) -> str:
        return self.password_hasher.hash(password)

    def verify_password(self, password: str, hashed_password: str) -> bool:
        return self.password_hasher.verify(password, hashed_password)


def get_user_service(repository: UserRepository = Depends(get_user_repository)) -> UserService:
    return UserService(repository)