from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, phone_number=None, password=None, **extra_fields):
        if not phone_number and not extra_fields.get('username'):
            raise ValueError('A phone number or username is required')
        user = self.model(phone_number=phone_number, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(phone_number, password, **extra_fields)

class User(AbstractUser):
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    preferred_language = models.CharField(max_length=2, default='en')

    # Django Admin uses this field to label the user
    USERNAME_FIELD = 'phone_number' 
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = UserManager()

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.phone_number or self.username or "Unknown User"