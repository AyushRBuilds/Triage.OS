import os
import requests
from dotenv import load_dotenv

load_dotenv(".env")

api_key = os.getenv("OPENROUTER_API_KEY")
model = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-super-120b-a12b:free")

print(f"API Key: {api_key[:10]}...")
print(f"Model: {model}")

url = "https://openrouter.ai/api/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
}
payload = {
    "model": model,
    "messages": [{"role": "user", "content": "Hello, are you working?"}],
}

try:
    response = requests.post(url, headers=headers, json=payload, timeout=10)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
