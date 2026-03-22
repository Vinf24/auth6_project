from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from user_auth.models import MFAChallenge
import secrets

def code_6_digits():
    return str(secrets.randbelow(900000) + 100000)

def create_mfa_challenge(user, purpose):
    MFAChallenge.objects.filter(
        user=user,
        purpose=purpose,
        is_used=False
    ).update(is_used=True)

    code = code_6_digits()
    hashed_code = make_password(code)
    channel = 'email'

    mfa_challenge = MFAChallenge.objects.create(
        user=user, 
        code_hash=hashed_code, 
        channel=channel, 
        purpose=purpose
    )

    return mfa_challenge, code

def verify_mfa(challenge, code, expected_purpose):
    if challenge.purpose != expected_purpose:
        return False

    if challenge.is_used:
        return False

    if challenge.expires_at < timezone.now():
        return False

    if challenge.attempts >= challenge.max_attempts:
        return False

    if not check_password(code, challenge.code_hash):
        challenge.attempts += 1
        challenge.save(update_fields=["attempts"])
        return False

    challenge.is_used = True
    challenge.save(update_fields=["is_used"])

    return True