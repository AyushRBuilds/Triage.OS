import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

try:
    res = supabase.table("patients").select("count", count="exact").execute()
    print(f"Patient count: {res.count}")
except Exception as e:
    print(f"Error: {e}")
