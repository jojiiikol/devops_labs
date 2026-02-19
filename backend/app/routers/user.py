from fastapi import APIRouter, Depends, HTTPException

from ..entries.schemas import CreateNoteSchema, CreateNoteInputSchema, UpdateNoteSchema, CreateUserInputSchema, \
    UpdateUserInputSchema
from ..services.note import get_note_service, NoteService
from ..services.user import UserService, get_user_service

router = APIRouter(prefix="/user",
                   tags=["user"])


@router.get("/")
async def get_users(service: UserService = Depends(get_user_service)):
    result = await service.get_all()
    return result

@router.get("/{id}")
async def get_user(id: int, service: UserService = Depends(get_user_service)):
    user = await service.get_by_id(id)
    return user

@router.get("/{username}")
async def get_user(username: str, service: UserService = Depends(get_user_service)):
    user = await service.get_by_username(username)
    return user

@router.post("/")
async def create_user(user: CreateUserInputSchema, service: UserService = Depends(get_user_service)):
    result = await service.create(user)
    return result

@router.put("/{id}")
async def update_user(id: int, user: UpdateUserInputSchema, service: UserService = Depends(get_user_service)):
    result = await service.update(id, user)
    return result

@router.delete("/{id}")
async def delete_user(id: int, service: UserService = Depends(get_user_service)):
    await service.delete(id)

