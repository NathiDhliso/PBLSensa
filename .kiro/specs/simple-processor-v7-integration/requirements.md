# Requirements Document: Replace Simple PDF Processor with V7 Pipeline

## Introduction

The current `simple_pdf_processor.py` uses basic regex pattern matching to extract concepts from PDFs, producing imprecise results with ~65-75% confidence. However, the codebase already has a sophisticated V7 pipeline with:

- Multi-method extraction (LlamaParse, Textract, pdfplumber)
- Ensemble concept extraction (KeyBERT + YAKE + spaCy)
- RAG-powered relationship detection
- Hierarchical structure preservation
- 70%+ confidence scores

**Current State**: 
- `simple_pdf_processor.py` is used by Flask backend for basic PDF processing
- V7 pipeline exists but is separate from the simple processor
- Two parallel systems doing similar work with different quality levels

**Desired State**: 
- Simple processor replaced with V7 pipeline integration
- Single, high-quality PDF processing path
- Backward compatibility maintained for existing API endpoints
- Improved accuracy for all PDF processing

---

## Requirements

### Requirement 1: Replace Simple Processor with V7 Pipeline

**User Story:** As a developer, I want to use the advanced V7 pipeline instead of the simple regex processor, so that all PDF processing benefits from higher accuracy.

#### Acceptance Criteria

1. WHEN a PDF is processed THEN the system SHALL use the V7 pipeline instead of simple_pdf_processor
2. WHEN processing completes THEN the system SHALL return results in the same format as before (backward compatibility)
3. WHEN the V7 pipeline is used THEN confidence scores SHALL be 70%+ (vs 65-75% with simple processor)
4. WHEN concepts are extracted THEN they SHALL include methods_found and extraction_methods fields
5. WHEN relationships are detected THEN they SHALL include similarity_score and claude_confidence fields
6. WHEN processing fails THEN the system SHALL log detailed error information
7. WHEN the simple processor is removed THEN no existing functionality SHALL break

---

### Requirement 2: Maintain Backward Compatibility

**User Story:** As a system administrator, I want existing API endpoints to continue working, so that no client code breaks.

#### Acceptance Criteria

1. WHEN existing endpoints are called THEN they SHALL return the same response structure
2. WHEN response structure is maintained THEN new fields SHALL be added (not removed)
3. WHEN new fields are added THEN they SHALL be optional for backward compatibility
4. WHEN processing completes THEN the response SHALL include both old and new fields
5. WHEN clients use old fields THEN they SHALL continue to work
6. WHEN clients use new fields THEN they SHALL get enhanced V7 data

---

### Requirement 3: Simplify Codebase

**User Story:** As a developer, I want to remove duplicate PDF processing code, so that the codebase is easier to maintain.

#### Acceptance Criteria

1. WHEN integration is complete THEN simple_pdf_processor.py SHALL be deprecated or removed
2. WHEN simple processor is removed THEN all references SHALL be updated to use V7 pipeline
3. WHEN V7 pipeline is used THEN it SHALL be the single source of truth for PDF processing
4. WHEN code is simplified THEN documentation SHALL be updated
5. WHEN changes are made THEN they SHALL be tracked in version control

---

### Requirement 4: Preserve Existing Features

**User Story:** As a user, I want all existing PDF processing features to continue working, so that my workflow is not disrupted.

#### Acceptance Criteria

1. WHEN a PDF is uploaded THEN it SHALL be processed successfully
2. WHEN concepts are extracted THEN they SHALL include term, definition, confidence
3. WHEN processing completes THEN results SHALL be stored in the database
4. WHEN results are retrieved THEN they SHALL be displayed correctly
5. WHEN errors occur THEN they SHALL be handled gracefully
6. WHEN processing status is checked THEN it SHALL show accurate progress

---

## Success Criteria

The integration will be considered successful when:

1. ✅ Simple processor is replaced with V7 pipeline
2. ✅ All existing API endpoints continue to work
3. ✅ Confidence scores improve to 70%+
4. ✅ No breaking changes to client code
5. ✅ Codebase is simplified (duplicate code removed)
6. ✅ Documentation is updated

---

## Out of Scope

The following are explicitly out of scope for this integration:

- New features beyond what V7 already provides
- UI changes (V7 components already exist)
- Database schema changes (V7 migrations already exist)
- New API endpoints (V7 endpoints already exist)

---

## Dependencies

### Existing Infrastructure
- V7 Pipeline (already implemented)
- V7 API endpoints (already implemented)
- V7 database schema (migrations already exist)
- V7 frontend components (already implemented)

### Required Actions
- Update Flask backend to use V7 pipeline
- Remove or deprecate simple_pdf_processor.py
- Update documentation

---

## Technical Constraints

- Must maintain backward compatibility
- Must not break existing API contracts
- Must reuse existing V7 implementation
- Must not duplicate code

---

## Acceptance Testing Scenarios

### Scenario 1: Process PDF with V7 Pipeline
```
GIVEN a user uploads a PDF via existing endpoint
WHEN the backend processes it
THEN the system should:
  - Use V7 pipeline instead of simple processor
  - Return results in existing format
  - Include new V7 fields (confidence, methods_found, etc.)
  - Complete successfully
```

### Scenario 2: Backward Compatibility
```
GIVEN a client using the old API format
WHEN they request PDF processing
THEN the system should:
  - Process with V7 pipeline
  - Return response with old field names
  - Include new fields as optional additions
  - Not break client code
```

### Scenario 3: Improved Accuracy
```
GIVEN a PDF is processed with V7 pipeline
WHEN results are compared to simple processor
THEN the system should:
  - Show 70%+ confidence (vs 65-75%)
  - Extract more accurate concepts
  - Detect more relationships
  - Provide better structure preservation
```

---

**Status**: Ready for Design Phase  
**Priority**: P1 - High (Code Quality & Accuracy)  
**Estimated Effort**: 1-2 days for integration  
**Expected Benefit**: Improved accuracy, simplified codebase
