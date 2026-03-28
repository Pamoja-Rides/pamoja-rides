import resend
import os

class MessageServices:
    def __init__(self) -> None:
        resend.api_key = os.getenv('RESEND_API_KEY')
        self.client = resend 

    def send_email(self, recipient_email, subject, body):
        try:
            params = {
                "from": "Pamoja Rides <onboarding@resend.dev>",
                "to": [recipient_email],
                "subject": subject,
                "html": f"<strong>{body}</strong>",
            }
            
            self.client.Emails.send(params)
            
            return {"status": "success", "message": "Email sent successfully"}
        except Exception as e:
            print(f"Resend Error: {e}")
            return {"status": "error", "message": str(e)}