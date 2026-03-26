from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class UniversalBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            # Look for matches in phone, email, OR username
            user = User.objects.get(
                Q(phone_number=username) | 
                Q(email=username) | 
                Q(username=username)
            )
        except User.DoesNotExist:
            return None

        if user.check_password(password):
            return user
        return None