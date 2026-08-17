import requests
import uuid
from django.conf import settings


class MomoError(Exception):
    pass


class MomoClient:
    """
    Thin wrapper around MTN MoMo Collections API.
    Docs: https://momodeveloper.mtn.com
    """

    def __init__(self):
        self.base_url = settings.MOMO_BASE_URL.rstrip('/')
        self.subscription_key = settings.MOMO_COLLECTION_SUBSCRIPTION_KEY
        self.api_user = settings.MOMO_API_USER
        self.api_key = settings.MOMO_API_KEY
        self.target_environment = settings.MOMO_TARGET_ENVIRONMENT
        self.callback_url = settings.MOMO_CALLBACK_URL
        # Dev/test mode: auto-approve collection requests instead of hitting
        # the network. Controlled by settings.MOMO_SIMULATE, not by whether
        # credentials happen to be present (they may be present but not
        # actually working yet). This is what lets "Simulate Payment" work
        # end-to-end without a functioning MoMo sandbox.
        self.simulate = settings.MOMO_SIMULATE

    def _get_access_token(self) -> str:
        url = f"{self.base_url}/collection/token/"
        resp = requests.post(
            url,
            auth=(self.api_user, self.api_key),
            headers={'Ocp-Apim-Subscription-Key': self.subscription_key},
            timeout=15,
        )
        if resp.status_code != 200:
            raise MomoError(f"Failed to get access token: {resp.status_code} {resp.text}")
        return resp.json()['access_token']

    def request_to_pay(self, reference_id: uuid.UUID, phone_number: str, amount: str,
                        currency: str = 'RWF', payer_message: str = '', payee_note: str = '') -> None:
        if self.simulate:
            return  # nothing to send — get_transaction_status will auto-approve

        token = self._get_access_token()
        url = f"{self.base_url}/collection/v1_0/requesttopay"

        payload = {
            "amount": str(amount),
            "currency": currency,
            "externalId": str(reference_id),
            "payer": {
                "partyIdType": "MSISDN",
                "partyId": self._normalize_phone(phone_number),
            },
            "payerMessage": payer_message or "Pamoja Rides booking fee",
            "payeeNote": payee_note or "Pamoja Rides booking fee",
        }

        headers = {
            "Authorization": f"Bearer {token}",
            "X-Reference-Id": str(reference_id),
            "X-Target-Environment": self.target_environment,
            "Ocp-Apim-Subscription-Key": self.subscription_key,
            "Content-Type": "application/json",
            "X-Callback-Url": self.callback_url,
        }

        resp = requests.post(url, json=payload, headers=headers, timeout=15)
        if resp.status_code != 202:
            raise MomoError(f"RequestToPay failed: {resp.status_code} {resp.text}")

    def get_transaction_status(self, reference_id: uuid.UUID) -> dict:
        if self.simulate:
            return {"status": "SUCCESSFUL"}

        token = self._get_access_token()
        url = f"{self.base_url}/collection/v1_0/requesttopay/{reference_id}"
        headers = {
            "Authorization": f"Bearer {token}",
            "X-Target-Environment": self.target_environment,
            "Ocp-Apim-Subscription-Key": self.subscription_key,
        }
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code != 200:
            raise MomoError(f"Status check failed: {resp.status_code} {resp.text}")
        return resp.json()

    @staticmethod
    def _normalize_phone(phone_number: str) -> str:
        """MoMo expects MSISDN without leading + or 0 (e.g. 250788123456)."""
        digits = ''.join(filter(str.isdigit, phone_number))
        if digits.startswith('0'):
            digits = '250' + digits[1:]
        if not digits.startswith('250'):
            digits = '250' + digits
        return digits


class MomoDisbursementClient:
    """
    Thin wrapper around MTN MoMo Disbursements API.
    Used for two things in escrow-lite:
      - releasing a driver's payout when a ride's destination is confirmed
      - refunding a passenger in full on a no-show
    Docs: https://momodeveloper.mtn.com
    """

    def __init__(self):
        self.base_url = settings.MOMO_BASE_URL.rstrip('/')
        self.subscription_key = settings.MOMO_DISBURSEMENT_SUBSCRIPTION_KEY
        self.api_user = settings.MOMO_DISBURSEMENT_API_USER
        self.api_key = settings.MOMO_DISBURSEMENT_API_KEY
        self.target_environment = settings.MOMO_TARGET_ENVIRONMENT
        self.callback_url = settings.MOMO_CALLBACK_URL
        self.simulate = settings.MOMO_SIMULATE

    def _get_access_token(self) -> str:
        url = f"{self.base_url}/disbursement/token/"
        resp = requests.post(
            url,
            auth=(self.api_user, self.api_key),
            headers={'Ocp-Apim-Subscription-Key': self.subscription_key},
            timeout=15,
        )
        if resp.status_code != 200:
            raise MomoError(f"Failed to get disbursement token: {resp.status_code} {resp.text}")
        return resp.json()['access_token']

    def transfer(self, reference_id: uuid.UUID, phone_number: str, amount: str,
                 currency: str = 'RWF', payer_message: str = '', payee_note: str = '') -> None:
        """Sends money out to a phone number (driver payout or passenger refund)."""
        if self.simulate:
            return  # pretend the transfer succeeded

        token = self._get_access_token()
        url = f"{self.base_url}/disbursement/v1_0/transfer"

        payload = {
            "amount": str(amount),
            "currency": currency,
            "externalId": str(reference_id),
            "payee": {
                "partyIdType": "MSISDN",
                "partyId": self._normalize_phone(phone_number),
            },
            "payerMessage": payer_message or "Pamoja Rides payout",
            "payeeNote": payee_note or "Pamoja Rides payout",
        }

        headers = {
            "Authorization": f"Bearer {token}",
            "X-Reference-Id": str(reference_id),
            "X-Target-Environment": self.target_environment,
            "Ocp-Apim-Subscription-Key": self.subscription_key,
            "Content-Type": "application/json",
            "X-Callback-Url": self.callback_url,
        }

        resp = requests.post(url, json=payload, headers=headers, timeout=15)
        if resp.status_code != 202:
            raise MomoError(f"Transfer failed: {resp.status_code} {resp.text}")

    def get_transfer_status(self, reference_id: uuid.UUID) -> dict:
        if self.simulate:
            return {"status": "SUCCESSFUL"}

        token = self._get_access_token()
        url = f"{self.base_url}/disbursement/v1_0/transfer/{reference_id}"
        headers = {
            "Authorization": f"Bearer {token}",
            "X-Target-Environment": self.target_environment,
            "Ocp-Apim-Subscription-Key": self.subscription_key,
        }
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code != 200:
            raise MomoError(f"Transfer status check failed: {resp.status_code} {resp.text}")
        return resp.json()

    @staticmethod
    def _normalize_phone(phone_number: str) -> str:
        digits = ''.join(filter(str.isdigit, phone_number))
        if digits.startswith('0'):
            digits = '250' + digits[1:]
        if not digits.startswith('250'):
            digits = '250' + digits
        return digits