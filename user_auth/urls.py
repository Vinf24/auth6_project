from django.urls import path
from user_auth.views import LoginView, MFAChallengeView, RegisterView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('verify-mfa/', MFAChallengeView.as_view(), name='verify_mfa'),
    path('register/', RegisterView.as_view(), name='register'),
]
