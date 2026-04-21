import smtplib

sender_email = "atsresumepro01@gmail.com"
sender_password = "slenoxlcycxwczsh" # <-- यहाँ डालें
receiver_email = "atsresumepro01@gmail.com" # खुद को ही भेज कर देखते हैं

try:
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login(sender_email, sender_password)
    server.sendmail(sender_email, receiver_email, "Test Subject\n\nThis is a test email.")
    server.quit()
    print("✅ SUCCESS! Email chala gaya. Password ekdum sahi hai!")
except Exception as e:
    print(f"❌ ERROR: {e}")