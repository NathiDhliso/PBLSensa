"""
Test if PDF has extractable text using pdfplumber
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pdfplumber

# Path to the PDF
pdf_path = "Patel H. Exam Ref AZ-104 Microsoft Azure Administrator 2022.pdf"

print("="*80)
print("🔍 TESTING PDF TEXT EXTRACTION")
print("="*80)
print()
print(f"📄 PDF: {pdf_path}")
print()

try:
    # Open PDF
    print("1️⃣  Opening PDF...")
    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        print(f"   ✅ PDF opened successfully")
        print(f"   📊 Total pages: {total_pages}")
        print()
        
        # Test first 5 pages
        print("2️⃣  Testing text extraction from first 5 pages...")
        print()
        
        pages_with_text = 0
        pages_without_text = 0
        total_chars = 0
        
        for i in range(min(5, total_pages)):
            page_num = i + 1
            page = pdf.pages[i]
            text = page.extract_text()
            
            if text and len(text.strip()) > 50:
                pages_with_text += 1
                total_chars += len(text)
                print(f"   ✅ Page {page_num}: {len(text)} characters")
                print(f"      Preview: {text[:150].strip()}...")
                print()
            else:
                pages_without_text += 1
                print(f"   ⚠️  Page {page_num}: No extractable text (likely image/scan)")
                print()
        
        print("="*80)
        print("📊 EXTRACTION SUMMARY")
        print("="*80)
        print(f"Total pages tested: {min(5, total_pages)}")
        print(f"Pages with text: {pages_with_text}")
        print(f"Pages without text: {pages_without_text}")
        print(f"Total characters extracted: {total_chars:,}")
        print()
        
        if pages_with_text > 0:
            print("✅ PDF HAS EXTRACTABLE TEXT!")
            print("   The PDF can be processed for concept extraction.")
            print()
            print("   Average chars per page:", total_chars // pages_with_text if pages_with_text > 0 else 0)
            print()
        else:
            print("❌ PDF HAS NO EXTRACTABLE TEXT!")
            print("   This PDF appears to be scanned images without OCR.")
            print("   You would need OCR (Optical Character Recognition) to extract text.")
            print()
        
        # Test a middle page
        if total_pages > 100:
            print("3️⃣  Testing middle page (page 100)...")
            middle_page = pdf.pages[99]
            middle_text = middle_page.extract_text()
            
            if middle_text and len(middle_text.strip()) > 50:
                print(f"   ✅ Page 100: {len(middle_text)} characters")
                print(f"      Preview: {middle_text[:150].strip()}...")
                print()
            else:
                print(f"   ⚠️  Page 100: No extractable text")
                print()
        
        print("="*80)
        print("🎯 CONCLUSION")
        print("="*80)
        
        if pages_with_text >= 3:
            print("✅ This PDF is READY for concept extraction!")
            print("   Most pages have extractable text.")
            print()
            print("   Next steps:")
            print("   1. Wait 5 minutes (for AWS rate limit to reset)")
            print("   2. Restart backend: .\\restart-backend.ps1")
            print("   3. Upload the PDF through the UI")
            print("   4. Watch backend terminal for extraction logs")
        elif pages_with_text > 0:
            print("⚠️  This PDF has MIXED content")
            print("   Some pages have text, others are images.")
            print("   Extraction will work but may skip image-only pages.")
        else:
            print("❌ This PDF is NOT suitable for text extraction")
            print("   All tested pages are images without OCR.")
            print("   You need an OCR-processed version of this PDF.")
        
        print()
        
except FileNotFoundError:
    print("❌ PDF file not found!")
    print(f"   Looking for: {pdf_path}")
    print()
    print("   Make sure the PDF is in the project root directory.")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print()
    import traceback
    traceback.print_exc()
