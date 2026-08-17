from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib import auth

from .utils.google_util import GoogleAuthService
from .services.message_service import MessageServices
from .services.verification_service import VerificationService
from .serializers import (
    UserSignupSerializer,
    UserSerializer,
    UserProfileSerializer,
    UpdateProfileSerializer,
)
from .utils.jwt_utils import generate_token

User = auth.get_user_model()


class SignupView(APIView):
    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    user = serializer.save()
                    pin = VerificationService.generate_pin(user)
                    message_service = MessageServices()
                    if user.email:
                        email_res = message_service.send_email(
                            user.email,
                            "Verify your email",
                            f'Your 4 digits pin: {pin}',
                        )
                        if email_res.get("status") == "error":
                            raise Exception("Email delivery failed")
                    token = generate_token(user)
                return Response({'token': token}, status=201)
            except Exception as e:
                return Response({'error': f'Registration failed: {str(e)}'}, status=500)
        return Response(serializer.errors, status=400)


class VerifyEmailView(APIView):
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        resend = request.data.get('resend')

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'error': 'User not found'}, status=404)

        try:
            with transaction.atomic():
                if resend:
                    pin = VerificationService.generate_pin(user)
                    message_service = MessageServices()
                    message_service.send_email(user.email, "Verify your email", f'Your new pin: {pin}')
                    return Response({'message': 'Code resent successfully'}, status=200)

                if VerificationService.verify_pin(user, code):
                    token = generate_token(user)
                    return Response({
                        'message': 'Account verified successfully',
                        'token': token,
                    }, status=200)

            return Response({'error': 'Invalid or expired code'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class SigninView(APIView):
    def post(self, request):
        login_id = request.data.get('phone_number')
        password = request.data.get('password')
        user = auth.authenticate(username=login_id, password=password)

        if user:
            if not user.is_verified:
                return Response(
                    {'error': 'Account not verified. Please check your email.'},
                    status=403,
                )
            try:
                return Response({
                    'user': UserSerializer(user).data,
                    'token': generate_token(user),
                }, status=200)
            except Exception as e:
                return Response({'error': f'Login failed: {str(e)}'}, status=500)

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
        google_verified = user_info.get("email_verified", False)

        try:
            with transaction.atomic():
                user, _ = User.objects.get_or_create(
                    email=email,
                    defaults={
                        "username": email,
                        "first_name": user_info.get("given_name", ""),
                        "last_name": user_info.get("family_name", ""),
                        "is_verified": google_verified,
                    },
                )
                if not user.is_verified and google_verified:
                    user.is_verified = True
                    user.save()

                response_data = {
                    'user': UserSerializer(user).data,
                    'token': generate_token(user),
                }
            return Response(response_data, status=200)
        except Exception as e:
            return Response({'error': f'Google authentication failed: {str(e)}'}, status=500)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserProfileSerializer(request.user).data)


class UpdateProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        serializer = UpdateProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        if serializer.is_valid():
            serializer.save()
            return Response(UserProfileSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)