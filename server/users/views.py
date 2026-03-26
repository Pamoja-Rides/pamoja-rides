from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib import auth

from .utils.google_util import GoogleAuthService
from .serializers import UserSignupSerializer, UserSerializer
from .utils.jwt_utils import generate_token

User = auth.get_user_model()

class SignupView(APIView):
    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({'token': generate_token(user)}, status=201)
        return Response(serializer.errors, status=400)

class SigninView(APIView):
    def post(self, request):
        login_id = request.data.get('phone_number') 
        password = request.data.get('password')

        user = auth.authenticate(username=login_id, password=password)

        if user:
            return Response({
                'user': UserSerializer(user).data,
                'token': generate_token(user)
            }, status=200)
        return Response({'error': 'Invalid Credentials'}, status=401)

class GoogleSigninView(APIView):
    def post(self, request):
        access_token = request.data.get('access_token')

        if not access_token:
            return Response({'error': 'No access token provided'}, status=400)
            
        user_info = GoogleAuthService.get_user_info(access_token)
        
        if not user_info:
            return Response({'error': 'Invalid Google access token'}, status=401)
            
        email = user_info.get("email")
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email,
                "first_name": user_info.get("given_name", ""),
                "last_name": user_info.get("family_name", ""),
                "is_verified": user_info.get("is_verified", False)
            }
        )

        return Response({
            'user': UserSerializer(user).data,
            'token': generate_token(user)
        }, status=200)