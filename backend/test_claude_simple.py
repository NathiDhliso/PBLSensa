"""
Simple single-call test for Claude
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.bedrock_client import BedrockAnalogyGenerator

print("="*80)
print("🧪 SIMPLE CLAUDE TEST")
print("="*80)
print()

try:
    client = BedrockAnalogyGenerator()
    print("✅ Client initialized")
    print(f"🤖 Model: {client.model_id}")
    print()
    
    print("📤 Sending prompt...")
    response = client.invoke_claude("Say 'Hello from Claude!' in JSON format", max_tokens=100)
    
    print("✅ SUCCESS!")
    print()
    print("📄 Response:")
    print(response)
    print()
    print("="*80)
    print("🎉 CLAUDE IS WORKING!")
    print("="*80)
    
except Exception as e:
    print(f"❌ Error: {e}")
    print()
    if "ThrottlingException" in str(e):
        print("⏳ Rate limit hit - wait 30 seconds and try again")
        print("   This means Claude IS working, just too many requests!")
    else:
        print("🔍 Check AWS credentials and Bedrock access")
