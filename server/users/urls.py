from django.urls import path
from .views import GoogleSigninView, SignupView, SigninView, VerifyEmailView, MeView, UpdateProfileView

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('verify-code/', VerifyEmailView.as_view(), name='verify-code'),
    path('signin/', SigninView.as_view(), name='signin'),
    path('google-auth/', GoogleSigninView.as_view(), name='google-auth'),
    path('me/', MeView.as_view(), name='me'),
    path('me/update/', UpdateProfileView.as_view(), name='update-profile'),
]