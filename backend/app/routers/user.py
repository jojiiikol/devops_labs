from fastapi import APIRouter, Depends, HTTPException

from ..entries.schemas import CreateUserInputSchema, \
    UpdateUserInputSchema, UserSchema
from ..services.pemissions import UserPermission, get_user_permission
from ..services.token import get_current_user
from ..services.user import UserService, get_user_service

router = APIRouter(prefix="/user",
                   tags=["user"])


@router.get("/")
async def get_users(service: UserService = Depends(get_user_service)):
    '''
        Эндпоинт для получения списка пользователей.
    '''
    result = await service.get_all()
    return result

@router.get("/me")
async def get_me(user: UserSchema = Depends(get_current_user)):
    '''
        Эндпоинт для информации о себе.
    '''
    return user

@router.get("/{id}")
async def get_user(id: int, service: UserService = Depends(get_user_service)):
    '''
        Эндпоинт для информации о юзере по id.
    '''
    user = await service.get_by_id(id)
    return user

@router.post("/")
async def create_user(user: CreateUserInputSchema, service: UserService = Depends(get_user_service)):
    '''
        Эндпоинт для создания пользователя.
    '''
    result = await service.create(user)
    return result

@router.put("/{id}")
async def update_user(id: int, user: UpdateUserInputSchema, permission: UserPermission = Depends(get_user_permission)):
    '''
        Эндпоинт для обновления данных о юзере. Доступно только к своему профилю
    '''
    result = await permission.is_owner_update(id, user)
    return result

@router.delete("/{id}")
async def delete_user(id: int, permission: UserPermission = Depends(get_user_permission)):
    '''
        Эндпоинт для удаления юзера. Доступно только к своему профилю
    '''
    await permission.is_owner_delete(id)

