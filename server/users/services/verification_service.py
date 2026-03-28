import random
import string

from ..models import VerificationCode

class VerificationService:
    @staticmethod
    def generate_pin(user):
        """Generates a 4-digit PIN, saves it, and returns it."""
        pin = ''.join(random.choices(string.digits, k=4))
        
        VerificationCode.objects.filter(user=user, is_used=False).update(is_used=True)
        
        VerificationCode.objects.create(user=user, code=pin)
        return pin

    @staticmethod
    def verify_pin(user, input_code):
        """Checks if the code is correct and not expired."""
        record = VerificationCode.objects.filter(
            user=user, 
            code=input_code, 
            is_used=False
        ).last()

        if record and record.is_valid():
            record.is_used = True
            record.save()
            
            user.is_verified = True
            user.save()
            return True
        return False