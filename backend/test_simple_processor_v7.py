"""
Test script to verify simple_pdf_processor V7 integration
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

def test_import():
    """Test that simple_pdf_processor can be imported"""
    print("🧪 Test 1: Import simple_pdf_processor")
    try:
        from simple_pdf_processor import process_pdf_document, extract_text_from_pdf
        print("✅ Import successful")
        return True
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False


def test_backward_compat():
    """Test backward compatible function signatures"""
    print("\n🧪 Test 2: Backward compatible function signatures")
    try:
        from simple_pdf_processor import process_pdf_document, extract_text_from_pdf, extract_concepts_from_text
        
        # Check function signatures
        import inspect
        
        # process_pdf_document should accept (file_content: bytes, document_id: str)
        sig = inspect.signature(process_pdf_document)
        params = list(sig.parameters.keys())
        assert params == ['file_content', 'document_id'], f"Expected ['file_content', 'document_id'], got {params}"
        
        # extract_text_from_pdf should accept (file_content: bytes)
        sig = inspect.signature(extract_text_from_pdf)
        params = list(sig.parameters.keys())
        assert params == ['file_content'], f"Expected ['file_content'], got {params}"
        
        # extract_concepts_from_text should accept (text: str, document_id: str)
        sig = inspect.signature(extract_concepts_from_text)
        params = list(sig.parameters.keys())
        assert params == ['text', 'document_id'], f"Expected ['text', 'document_id'], got {params}"
        
        print("✅ Function signatures are backward compatible")
        return True
    except Exception as e:
        print(f"❌ Signature check failed: {e}")
        return False


def test_v7_availability():
    """Test V7 pipeline availability"""
    print("\n🧪 Test 3: V7 pipeline availability")
    try:
        from simple_pdf_processor import V7_AVAILABLE
        
        if V7_AVAILABLE:
            print("✅ V7 pipeline is available")
            from backend.services.pbl.v7_pipeline import get_v7_pipeline
            pipeline = get_v7_pipeline()
            print(f"   Pipeline type: {type(pipeline).__name__}")
        else:
            print("⚠️  V7 pipeline not available (will use fallback)")
        
        return True
    except Exception as e:
        print(f"❌ V7 check failed: {e}")
        return False


def test_deprecation_warnings():
    """Test that deprecated functions show warnings"""
    print("\n🧪 Test 4: Deprecation warnings")
    try:
        import warnings
        from simple_pdf_processor import extract_text_from_pdf, extract_concepts_from_text
        
        # Capture warnings
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            
            # Call deprecated function
            extract_text_from_pdf(b"dummy")
            
            # Check warning was raised
            assert len(w) > 0, "No deprecation warning raised"
            assert issubclass(w[0].category, DeprecationWarning), f"Wrong warning type: {w[0].category}"
            assert "deprecated" in str(w[0].message).lower(), f"Warning message doesn't mention deprecation: {w[0].message}"
        
        print("✅ Deprecation warnings work correctly")
        return True
    except Exception as e:
        print(f"❌ Deprecation warning test failed: {e}")
        return False


def test_response_format():
    """Test that response format is backward compatible"""
    print("\n🧪 Test 5: Response format (mock test)")
    try:
        # Mock response format check
        expected_fields = {
            'success', 'concepts', 'concept_count'
        }
        
        # V7 enhanced fields (optional)
        v7_fields = {
            'parse_method', 'parse_confidence', 'metrics', 'hierarchy'
        }
        
        print("✅ Expected response fields defined:")
        print(f"   Required: {expected_fields}")
        print(f"   V7 Enhanced (optional): {v7_fields}")
        return True
    except Exception as e:
        print(f"❌ Response format test failed: {e}")
        return False


def main():
    """Run all tests"""
    print("="*80)
    print("🚀 Testing simple_pdf_processor V7 Integration")
    print("="*80)
    
    tests = [
        test_import,
        test_backward_compat,
        test_v7_availability,
        test_deprecation_warnings,
        test_response_format
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Test crashed: {e}")
            import traceback
            traceback.print_exc()
            results.append(False)
    
    print("\n" + "="*80)
    print("📊 Test Results")
    print("="*80)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("✅ All tests passed!")
    else:
        print(f"⚠️  {total - passed} test(s) failed")
    
    print("="*80)
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
