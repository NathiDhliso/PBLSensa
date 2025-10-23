"""
Quick test script to verify Claude model works with AWS Bedrock
"""

import sys
import os
import time

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.bedrock_client import BedrockAnalogyGenerator

def test_claude_connection():
    """Test basic Claude connection and response"""
    
    print("="*80)
    print("🧪 TESTING CLAUDE MODEL CONNECTION")
    print("="*80)
    print()
    
    try:
        # Initialize client
        print("1️⃣  Initializing Bedrock client...")
        client = BedrockAnalogyGenerator(
            region_name="us-east-1",
            model_id="anthropic.claude-3-5-sonnet-20240620-v1:0"
        )
        print("   ✅ Client initialized successfully")
        print(f"   📍 Region: {client.region_name}")
        print(f"   🤖 Model: {client.model_id}")
        print()
        
        # Test simple prompt
        print("2️⃣  Sending test prompt to Claude...")
        test_prompt = """Please respond with a simple JSON object containing:
{
  "status": "success",
  "message": "Claude is working correctly!",
  "test_number": 42
}"""
        
        response = client.invoke_claude(test_prompt, max_tokens=200)
        print("   ✅ Response received!")
        print()
        print("   📄 Claude's Response:")
        print("   " + "-"*76)
        print("   " + response[:500])  # First 500 chars
        print("   " + "-"*76)
        print()
        
        # Wait to avoid rate limiting
        print("   ⏳ Waiting 2 seconds to avoid rate limiting...")
        time.sleep(2)
        print()
        
        # Test concept extraction prompt
        print("3️⃣  Testing concept extraction prompt...")
        concept_prompt = """Extract key concepts from this text:

"Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. Neural networks are computing systems inspired by biological neural networks."

Return JSON:
{
  "concepts": [
    {"term": "concept name", "definition": "brief definition"}
  ]
}"""
        
        concept_response = client.invoke_claude(concept_prompt, max_tokens=500)
        print("   ✅ Concept extraction response received!")
        print()
        print("   📄 Extracted Concepts:")
        print("   " + "-"*76)
        print("   " + concept_response[:500])
        print("   " + "-"*76)
        print()
        
        print("="*80)
        print("✅ ALL TESTS PASSED!")
        print("="*80)
        print()
        print("🎉 Claude model is working correctly with AWS Bedrock!")
        print("   You can now upload PDFs and extract concepts.")
        print()
        
        return True
        
    except Exception as e:
        print()
        print("="*80)
        print("❌ TEST FAILED")
        print("="*80)
        print()
        print(f"Error: {str(e)}")
        print()
        print("🔍 Troubleshooting:")
        print("   1. Check AWS credentials are configured")
        print("   2. Verify Bedrock model access in AWS Console")
        print("   3. Ensure you're in the correct AWS region (us-east-1)")
        print("   4. Check IAM permissions for Bedrock")
        print()
        
        return False

if __name__ == "__main__":
    success = test_claude_connection()
    sys.exit(0 if success else 1)
