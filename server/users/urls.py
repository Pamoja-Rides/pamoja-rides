from django.urls import path
from .views import GoogleSigninView, SignupView, SigninView

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('signin/', SigninView.as_view(), name='signin'),
    path('google-auth/', GoogleSigninView.as_view(), name='google-auth')
]