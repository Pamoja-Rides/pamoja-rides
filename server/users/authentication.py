from rest_framework import authentication, exceptions
from django.contrib.auth import get_user_model
from .utils.jwt_utils import decode_token

User = get_user_model()

class RawJWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        user_id = decode_token(token)

        if not user_id:
            raise exceptions.AuthenticationFailed('Invalid or expired token')

        try:
            user = User.objects.get(pk=user_id)
            return (user, None)
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('User no longer exists')