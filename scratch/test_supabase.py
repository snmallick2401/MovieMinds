import requests
import os
from dotenv import load_dotenv

load_dotenv(".env")
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

payload = {
    "email": "snmallick2401@gmail.com",
    "password": "s9939668767"
}
headers = {
    "apikey": key,
    "Content-Type": "application/json"
}
response = requests.post(f"{url}/auth/v1/token?grant_type=password", json=payload, headers=headers)
print(f"Status: {response.status_code}")
print(response.text)
