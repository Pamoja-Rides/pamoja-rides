import requests

class GoogleAuthService:
    @staticmethod
    def get_user_info(access_token):
        """
        No Client Secret needed. 
        We use the access_token to fetch the user's profile directly.
        """
        # Google's tokeninfo or userinfo endpoints work without a secret
        userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        response = requests.get(
            userinfo_url, 
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if response.status_code == 200:
            return response.json()
        return None