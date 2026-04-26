from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from users.utils.jwt_utils import decode_token

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token: str):
    try:
        user_id = decode_token(token)
        if not user_id:
            return AnonymousUser()
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()

class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode("utf-8")
        token = None
        for param in query_string.split("&"):
            if param.startswith("token="):
                token = param.split("=", 1)[1]

        scope["user"] = await get_user_from_token(token) if token else AnonymousUser()
        return await self.app(scope, receive, send)