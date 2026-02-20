from fastapi import Depends, HTTPException
from starlette.status import HTTP_403_FORBIDDEN
from watchfiles import awatch

from backend.app.entries.schemas import NoteSchema, UserSchema, UpdateNoteSchema
from backend.app.services.note import NoteService, get_note_service
from backend.app.services.token import TokenService, get_token_service, get_current_user

class NotePermission:
    def __init__(self, user: UserSchema, service: NoteService):
        self.user = user
        self.service = service


    async def is_owner_read(self, id: int):
        obj = await self.service.get_by_id(id)
        if obj.user.id == self.user.id:
            return obj
        raise HTTPException(status_code=HTTP_403_FORBIDDEN)

    async def is_owner_update(self, id: int, update_data: UpdateNoteSchema):
        obj = await self.service.get_by_id(id)
        if obj.user.id == self.user.id:
            return await self.service.update(id, update_data)
        raise HTTPException(status_code=HTTP_403_FORBIDDEN)

    async def is_owner_delete(self, id: int):
        obj = await self.service.get_by_id(id)
        if obj.user.id == self.user.id:
            return await self.service.delete(id)
        raise HTTPException(status_code=HTTP_403_FORBIDDEN)

def get_note_permission(user: UserSchema = Depends(get_current_user), service: NoteService = Depends(get_note_service)):
    return NotePermission(user, service)




