import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("ANTHROPIC_API_KEY")

if not api_key:
    print("❌ Error: No ANTHROPIC_API_KEY found in .env")
    exit(1)

print(f"✅ Found API key starting with: {api_key[:12]}...")

print("⏳ Testing API connection to Anthropic...")
client = anthropic.Anthropic(api_key=api_key)

try:
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=20,
        messages=[{"role": "user", "content": "Just say 'Hello! API is working.'"}]
    )
    print("✅ Success! Anthropic responded:")
    print("-----------------------------------")
    print(response.content[0].text)
    print("-----------------------------------")
    print("Your credits and billing are perfectly fine!")
except anthropic.AuthenticationError:
    print("❌ Error: Your API key is invalid.")
except anthropic.RateLimitError:
    print("❌ Error: You are out of credits or hit a rate limit.")
except Exception as e:
    print(f"❌ Unknown error occurred: {e}")
