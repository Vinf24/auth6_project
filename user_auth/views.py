from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from user_auth.serializers import LoginSerializer, VerifyMFASerializer, RegisterSerializer
from user_auth.models import MFAChallenge
from django.contrib.auth.hashers import make_password
from user_auth.services.mfa_service import create_mfa_challenge, verify_mfa
import secrets
from django.utils import timezone
from user_auth.services.email_service import send_mfa_code_email

# Create your views here.

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "message": "User registered successfully",
            "user": {
                "id": user.id,
                "names": user.names,
                "lastnames": user.lastnames,
                "email": user.email
            }
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        if user.mfa_required:
            mfa_challenge, code = create_mfa_challenge(user, "login")

            send_mfa_code_email(user, code)

            return Response({
                "message": "MFA required", 
                "challenge_id": mfa_challenge.id
            }, status=status.HTTP_200_OK)
        else:
            user.last_login_at = timezone.now()
            user.save(update_fields=['last_login_at'])

        return Response({
            "message": "Login successful",
            "mfa_required": False,
            "user": {
                "id": user.id,
                "names": user.names,
                "lastnames": user.lastnames,
                "email": user.email
            }
        }, status=status.HTTP_200_OK)


class MFAChallengeView(APIView):
    def post(self, request):
        serializer = VerifyMFASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        challenge_id = serializer.validated_data['challenge_id']
        code = serializer.validated_data['code']

        try:
            mfa_challenge = MFAChallenge.objects.get(id=challenge_id)
        except MFAChallenge.DoesNotExist:
            return Response({"error": "Invalid MFA challenge"}, status=status.HTTP_400_BAD_REQUEST)

        valid = verify_mfa(mfa_challenge, code, "login")

        if not valid:
            return Response({"error": "Invalid MFA code"}, status=status.HTTP_400_BAD_REQUEST)

        user = mfa_challenge.user
        user.last_login_at = timezone.now()
        user.save()
        mfa_challenge.is_used = True
        mfa_challenge.save()

        return Response({
            "message": "MFA verification successful",
            "user": {
                "id": user.id,
                "email": user.email
            }
        }, status=status.HTTP_200_OK)
