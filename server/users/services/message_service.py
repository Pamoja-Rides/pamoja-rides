import africastalking
import os
import smtplib
import ssl # Added for secure connection
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

class MessageServices:
    def __init__(self) -> None:
        # Africa's Talking Config
        self.username = os.getenv('AT_USERNAME')
        self.api_key = os.getenv('AT_API_KEY')
        africastalking.initialize(self.username, self.api_key)
        self.sms = africastalking.SMS
        self.sender_id = os.getenv('AT_SENDER_ID')

        # SMTP Config (New)
        self.email_host = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
        self.email_port = int(os.getenv('EMAIL_PORT', 465))
        self.email_user = os.getenv('EMAIL_USER')
        self.email_pass = os.getenv('EMAIL_APP_PASSWORD')

    def send_verification(self, phone_number):
        try:
            message = "Welcome to the Carpooling App! Your account has been created successfully."
            recipients = [phone_number] 
            response = self.sms.send(message, recipients, self.sender_id)
            return response
        except Exception as e:
            print(f"SMS Error: {e}")
            return None

    def send_email(self, recipient_email, subject, body):
        """
        Sends an email using SMTP SSL (Port 465).
        """
        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = subject
        msg['From'] = self.email_user
        msg['To'] = recipient_email

        context = ssl.create_default_context()

        try:
            with smtplib.SMTP_SSL(self.email_host, self.email_port, context=context) as server:
                server.login(self.email_user, self.email_pass)
                server.send_message(msg)
            return {"status": "success", "message": "Email sent successfully"}
        except Exception as e:
            print(f"SMTP Error: {e}")
            return {"status": "error", "message": str(e)}
