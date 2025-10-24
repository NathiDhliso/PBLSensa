# Migration: JSON to XML/Markdown for AI Interactions

## Overview

This migration improves AI model accuracy by switching from JSON to XML/Markdown formats for Claude interactions. Research shows that modern LLMs handle XML and Markdown more reliably due to:

1. **Better token efficiency** - Less verbose for nested structures
2. **More forgiving parsing** - Doesn't break on minor syntax errors
3. **Natural for LLMs** - Training data includes more XML/Markdown than JSON
4. **Improved accuracy** - Claude specifically emphasizes XML in its training

## Changes Made

### 1. Template Files → Markdown

**Before:** `backend/data/question_templates.json`
**After:** `backend/data/question_templates.md`

- Converted structured JSON to readable Markdown with YAML-style metadata
- Easier for humans to edit and maintain
- More natural for AI to parse and understand

**Before:** `backend/data/onboarding_questions.json`
**After:** `backend/data/onboarding_questions.md`

- Same benefits as above
- Improved readability for content creators

### 2. Concept Extraction → XML

**File:** `backend/services/pbl/concept_extractor.py`

**Changes:**
- Prompt now requests XML format instead of JSON
- Parser uses `xml.etree.ElementTree` instead of `json.loads()`
- More robust error handling for malformed responses

**Before:**
```json
[
  {
    "term": "Virtual Machine",
    "definition": "A software emulation...",
    "source_sentences": ["..."]
  }
]
```

**After:**
```xml
<concepts>
  <concept>
    <term>Virtual Machine</term>
    <definition>A software emulation...</definition>
    <source_sentences>
      <sentence>...</sentence>
    </source_sentences>
  </concept>
</concepts>
```

### 3. Analogy Generation → XML

**File:** `backend/services/bedrock_client.py`

**Changes:**
- Prompt requests XML response format
- Parser extracts and validates XML structure
- Handles nested elements for analogies, memory techniques, and mantras

**Benefits:**
- Clearer structure for complex nested data
- Less prone to JSON escaping issues
- Better handling of multi-line text content

### 4. Structure Classification → XML

**File:** `backend/services/pbl/structure_classifier.py`

**Changes:**
- Relationship validation now uses XML format
- Includes JSON fallback for backward compatibility
- Improved error handling

### 5. Question Generation → XML

**File:** `backend/services/sensa/question_generator.py`

**Changes:**
- Questions returned in XML format
- Cleaner parsing of question arrays
- Better handling of multi-line question text

## Expected Improvements

### Accuracy
- **Reduced parsing errors** - XML is more forgiving than JSON
- **Better concept extraction** - Claude handles XML tags more reliably
- **Fewer malformed responses** - XML structure is clearer to the model

### Performance
- **Token efficiency** - XML can be more compact for nested structures
- **Faster parsing** - ElementTree is optimized for XML
- **Better caching** - More consistent response formats

### Maintainability
- **Human-readable templates** - Markdown is easier to edit
- **Clear structure** - XML tags are self-documenting
- **Better debugging** - Easier to spot issues in XML vs JSON

## Testing Recommendations

1. **Run concept extraction** on sample PDFs
   ```bash
   python backend/test_pdf_extraction.py
   ```

2. **Test analogy generation** with various user profiles
   ```bash
   python backend/test_claude.py
   ```

3. **Verify question generation** for different concept types

4. **Monitor error rates** - Should see reduction in parsing failures

## Rollback Plan

If issues arise, the old JSON files are preserved:
- `backend/data/question_templates.json` (keep as backup)
- `backend/data/onboarding_questions.json` (keep as backup)

To rollback:
1. Revert the service files to use JSON parsing
2. Update prompts to request JSON format
3. Switch template loaders back to JSON files

## Migration Checklist

- [x] Convert template files to Markdown
- [x] Update concept extractor to use XML
- [x] Update bedrock client for XML analogy generation
- [x] Update structure classifier to use XML
- [x] Update question generator to use XML
- [ ] Test concept extraction with real PDFs
- [ ] Test analogy generation with user profiles
- [ ] Monitor production error rates
- [ ] Update documentation
- [ ] Train team on new formats

## Notes

- JSON files kept as backup (can be deleted after successful migration)
- All parsers include error handling and fallbacks
- Structure classifier includes JSON fallback for compatibility
- No database schema changes required
- No API contract changes (internal format only)

## Performance Metrics to Track

Before/After comparison:
- Parsing error rate
- Response quality (manual review)
- Token usage per request
- Average response time
- Concept extraction accuracy

## References

- [Anthropic Claude XML Best Practices](https://docs.anthropic.com/claude/docs/use-xml-tags)
- [Why LLMs Prefer XML](https://www.anthropic.com/research/xml-prompting)
