"""
Test the updated SOAP pipeline with OpenRouter LLM formatting
"""
import os
import sys
from dotenv import load_dotenv
load_dotenv()

# Add the backend dir to path
sys.path.insert(0, os.path.dirname(__file__))

API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = os.getenv("OPENROUTER_MODEL")
print(f"OpenRouter API Key available: {bool(API_KEY)}")
print(f"Model: {MODEL}")

raw_text = "elderly patient 72 years old bought in unconscious after fault complaining of difficulty breathing and abdominal pain before losing conscious heart rate 140 BPM SP or 282% DP by 60 temperature 19.2 suspected internal bleeding and sepsis immediate 4 fluid and zone 1 gram started CT Scan order"

if API_KEY:
    try:
        from ai.soap_pipeline import run_pipeline
        result = run_pipeline(raw_text)
        
        print("\n=== SOAP Pipeline Result ===")
        print(f"\nS: {result['subjective']}")
        print(f"\nO: {result['objective']}")
        print(f"\nA: {result['assessment']}")
        print(f"\nP: {result['plan']}")
        print(f"\nUrgency: {result['urgency_level']} ({result['urgency_confidence']:.1%})")
        print(f"Entities: {len(result['entities'])} found")
        for e in result['entities']:
            print(f"  - {e['text']} ({e['label']})")
    except Exception as e:
        import traceback
        traceback.print_exc()
else:
    print("No API key — cannot test")
