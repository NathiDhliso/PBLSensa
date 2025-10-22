# Implementation Plan

-
  1. [x] Database Schema and Migrations

  - Create database migration file for new tables (chapter_analogies,
    memory_techniques, learning_mantras, analogy_feedback, chapter_complexity)
  - Add new columns to users table (learning_style, background, education_level,
    interests array)
  - Create indexes for performance optimization
  - Write migration rollback script
  - _Requirements: 1.1, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

-
  2. [ ] User Profile Enhancement
- [x] 2.1 Update profile data models

  - Extend UserProfile TypeScript interface with learning_style, background,
    education_level fields
  - Update UpdateProfileRequest model to include new fields
  - Add LearningStyle and EducationLevel type definitions
  - Update COMMON_INTERESTS list with more comprehensive options
  - _Requirements: 1.1, 1.2_

- [ ] 2.2 Update profile API endpoints
  - Modify PATCH /api/users/{user_id}/profile endpoint to handle new fields
  - Add validation for learning_style enum values
  - Add validation for interests array (max 20 items)
  - Update GET /api/users/{user_id}/profile to return new fields
  - _Requirements: 1.1, 1.2, 9.1, 9.2_

- [ ] 2.3 Create profile editor UI component
  - Build ProfileEditor component with learning style selector (radio buttons or
    dropdown)
  - Add interests TagInput with autocomplete from COMMON_INTERESTS
  - Add background text input field
  - Add education level selector
  - Implement form validation and error handling
  - Add save button with loading state
  - _Requirements: 1.1, 1.3, 1.4, 10.1, 10.2_

- [ ]* 2.4 Write profile component tests
  - Unit tests for ProfileEditor component
  - Integration tests for profile update API
  - Test validation rules
  - _Requirements: 1.1_

-
  3. [ ] Content Analysis Service
- [ ] 3.1 Implement ChapterContentAnalyzer class
  - Create extract_chapter_content method to query processed_documents table
  - Parse JSONB structured_content to extract specific chapter
  - Return ChapterContent dataclass with text and metadata
  - _Requirements: 2.1, 2.2, 2.6_

- [ ] 3.2 Implement complexity calculation
  - Create calculate_complexity_score method with multi-factor analysis
  - Calculate concept density (concepts per 1000 words)
  - Calculate vocabulary difficulty (average word length, technical term ratio)
  - Calculate relationship complexity (cross-reference count)
  - Normalize score to 0.0-1.0 range
  - Store results in chapter_complexity table
  - _Requirements: 2.3, 2.4, 2.6_

- [ ] 3.3 Implement key concept extraction
  - Create get_key_concepts method querying keywords table
  - Filter by chapter_id and order by score and exam_relevance_score
  - Return top N concepts (default 7)
  - Include context snippets for each concept
  - _Requirements: 2.2, 2.5_

- [ ]* 3.4 Write content analyzer tests
  - Unit tests for complexity calculation
  - Unit tests for concept extraction
  - Test edge cases (empty chapters, very long chapters)
  - _Requirements: 2.1, 2.2, 2.3_

-
  4. [ ] AWS Bedrock Integration
- [ ] 4.1 Create BedrockAnalogyGenerator class
  - Initialize boto3 bedrock-runtime client
  - Set model_id to Claude 3.5 Sonnet
  - Configure max_tokens, temperature, and top_p parameters
  - Add error handling and logging
  - _Requirements: 3.1, 3.2_

- [ ] 4.2 Implement prompt construction
  - Create _construct_prompt method with template
  - Include user profile data (interests, learning_style, background,
    education_level)
  - Include chapter content (title, key concepts, complexity score)
  - Format prompt to request JSON response with analogies, memory techniques,
    and mantras
  - Optimize prompt length to minimize token usage
  - _Requirements: 3.3, 3.4, 12.5_

- [ ] 4.3 Implement Bedrock API call with retry logic
  - Create _call_bedrock method using invoke_model API
  - Implement exponential backoff retry (3 attempts)
  - Handle throttling and service errors
  - Log all API calls with token counts
  - Track costs using CostTracker
  - _Requirements: 3.5, 3.6, 3.7, 12.1, 12.2_

- [ ] 4.4 Implement response parsing and validation
  - Create _parse_response method to extract JSON from Bedrock response
  - Validate response structure matches expected format
  - Handle malformed responses gracefully
  - Return AnalogyGenerationResult dataclass
  - _Requirements: 3.5, 3.8_

- [ ] 4.5 Implement main generate_analogies method
  - Orchestrate content analysis, prompt construction, and Bedrock call
  - Handle errors with fallback to cached/generic analogies
  - Store generated content in database
  - Return complete result with analogies, memory techniques, and mantras
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8_

- [ ]* 4.6 Write Bedrock integration tests
  - Unit tests for prompt construction
  - Unit tests for response parsing
  - Mock Bedrock API for integration tests
  - Test error handling and retry logic
  - _Requirements: 3.1, 3.2, 3.5_

-
  5. [ ] Caching and Storage Layer
- [ ] 5.1 Implement cache key generation
  - Create generate_cache_key function using chapter_id and profile hash
  - Hash user profile (interests, learning_style, education_level) with MD5
  - Format: "analogies:{chapter_id}:{profile_hash}"
  - _Requirements: 8.1, 8.2_

- [ ] 5.2 Implement cache storage operations
  - Create store_analogies_cache method to insert into chapter_analogies table
  - Set expires_at timestamp (30 days from creation)
  - Store all metadata (model_version, token counts, cost)
  - Create store_memory_techniques and store_mantras methods
  - _Requirements: 8.1, 8.3, 8.4_

- [ ] 5.3 Implement cache retrieval operations
  - Create get_cached_analogies method querying by cache_key
  - Check expires_at timestamp and skip expired entries
  - Join with analogy_feedback to get average ratings
  - Return None if cache miss
  - _Requirements: 8.2, 8.7_

- [ ] 5.4 Implement cache invalidation
  - Create invalidate_user_cache method to delete expired analogies
  - Trigger invalidation on profile updates (interests or learning_style change)
  - Create background job to clean up expired cache entries
  - _Requirements: 8.3, 8.5_

- [ ]* 5.5 Write caching tests
  - Test cache key generation consistency
  - Test cache hit/miss scenarios
  - Test expiration logic
  - Test invalidation on profile change
  - _Requirements: 8.1, 8.2, 8.3_

-
  6. [ ] Backend API Endpoints
- [ ] 6.1 Implement POST /api/chapters/{chapter_id}/generate-analogies
  - Accept chapter_id path parameter and user_id query parameter
  - Accept optional force_regenerate flag
  - Check cache first unless force_regenerate is true
  - Call BedrockAnalogyGenerator if cache miss
  - Check user rate limit (10 generations per day)
  - Return AnalogyGenerationResponse with cached flag
  - _Requirements: 9.1, 9.2, 9.3, 12.3, 12.4_

- [ ] 6.2 Implement GET /api/chapters/{chapter_id}/analogies
  - Accept chapter_id and user_id parameters
  - Retrieve cached analogies from database
  - Include average ratings and rating counts
  - Return 404 if no analogies found
  - _Requirements: 9.4, 9.5_

- [ ] 6.3 Implement GET /api/chapters/{chapter_id}/complexity
  - Query chapter_complexity table
  - Return complexity score, level (beginner/intermediate/advanced), and
    breakdown
  - Calculate estimated study time based on complexity and word count
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 6.4 Implement POST /api/analogies/{analogy_id}/feedback
  - Accept analogy_id, user_id, rating (1-5), and optional comment
  - Validate rating is between 1 and 5
  - Insert into analogy_feedback table (upsert on conflict)
  - Update user reputation score if feedback is constructive
  - Return success response
  - _Requirements: 7.1, 7.2, 7.6, 7.7, 9.6, 9.7_

- [ ] 6.5 Implement GET /api/analogies/{analogy_id}/feedback
  - Query analogy_feedback table for aggregated stats
  - Calculate average rating and rating distribution
  - Return FeedbackSummary with counts per rating level
  - _Requirements: 7.3, 7.4, 9.8_

- [ ]* 6.6 Write API endpoint tests
  - Integration tests for all endpoints
  - Test authentication and authorization
  - Test rate limiting
  - Test error responses (404, 400, 500)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

-
  7. [ ] Cost Monitoring and Rate Limiting
- [ ] 7.1 Implement CostTracker class
  - Create log_bedrock_call method to calculate and store costs
  - Use Claude 3.5 Sonnet pricing ($3/M input tokens, $15/M output tokens)
  - Insert into cost_tracking table
  - Create get_daily_cost method to sum today's costs
  - Create send_cost_alert method for threshold breaches ($50/day)
  - _Requirements: 12.1, 12.2, 12.7_

- [ ] 7.2 Implement RateLimiter class
  - Create check_user_limit method querying generation count per user per day
  - Set limit to 10 generations per day
  - Create get_reset_time method returning midnight tomorrow
  - Return appropriate error message when limit exceeded
  - _Requirements: 12.3, 12.4_

- [ ]* 7.3 Write cost monitoring tests
  - Test cost calculation accuracy
  - Test daily cost aggregation
  - Test rate limit enforcement
  - Test alert triggering
  - _Requirements: 12.1, 12.2, 12.3_

-
  8. [ ] Frontend Components - Complexity Indicators
- [ ] 8.1 Create ComplexityIndicator component
  - Accept score (0.0-1.0), conceptCount, and estimatedTime props
  - Map score to visual representation (stars, badge, or color gradient)
  - Use Sensa Learn colors: soft-sage (0.0-0.3), gentle-sky (0.3-0.6),
    warm-coral (0.6-1.0)
  - Add tooltip showing breakdown (concept count, estimated time)
  - Make responsive for mobile, tablet, desktop
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 10.7, 10.10_

- [ ] 8.2 Integrate complexity indicators into chapter list
  - Update SensaCourseDetailPage to fetch complexity data
  - Display ComplexityIndicator next to each chapter title
  - Add loading skeleton while complexity data loads
  - Handle missing complexity data gracefully
  - _Requirements: 6.1, 6.2, 10.2, 10.7_

-
  9. [ ] Frontend Components - Analogy Display
- [ ] 9.1 Create AnalogyCard component
  - Accept analogy object and onRate callback
  - Display concept name as header with icon
  - Display analogy text with readable typography
  - Show "Based on your interest in: {interest}" badge
  - Add star rating component (1-5 stars)
  - Display average rating and rating count
  - Use Sensa Learn brand colors (warm-coral, gentle-sky, soft-sage)
  - Make responsive and accessible
  - _Requirements: 7.1, 7.2, 7.3, 10.3, 10.4, 10.8, 10.10_

- [ ] 9.2 Create MemoryTechniqueCard component
  - Display technique type with appropriate icon (brain, lightbulb, etc.)
  - Show technique text with clear formatting
  - Display application instructions
  - Use visual hierarchy to separate sections
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 10.5_

- [ ] 9.3 Create LearningMantraCard component
  - Display mantra text with inspiring typography
  - Use gradient backgrounds from Sensa Learn palette
  - Show explanation text below mantra
  - Add subtle animations on hover
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.6_

- [ ] 9.4 Create FeedbackModal component
  - Modal for detailed feedback with star rating
  - Optional text comment field
  - Submit and cancel buttons
  - Show loading state during submission
  - Display success message after submission
  - _Requirements: 7.1, 7.2, 7.6, 10.8_

-
  10. [ ] Frontend Hooks and State Management
- [ ] 10.1 Create useChapterAnalogies hook
  - Use React Query to fetch analogies for a chapter
  - Accept courseId and chapterId parameters
  - Set staleTime to 30 minutes
  - Handle loading and error states
  - _Requirements: 10.1, 10.2_

- [ ] 10.2 Create useGenerateAnalogies mutation hook
  - Use React Query mutation for POST
    /api/chapters/{chapter_id}/generate-analogies
  - Accept chapterId and forceRegenerate parameters
  - Invalidate analogies query on success
  - Handle rate limit errors with user-friendly message
  - _Requirements: 10.1, 10.2, 10.9_

- [ ] 10.3 Create useAnalogyFeedback mutation hook
  - Use React Query mutation for POST /api/analogies/{analogy_id}/feedback
  - Accept analogyId, rating, and optional comment
  - Invalidate analogy query on success to refresh ratings
  - Show toast notification on success
  - _Requirements: 7.1, 7.2, 10.8_

- [ ] 10.4 Create useChapterComplexity hook
  - Fetch complexity data for a chapter
  - Cache results for 1 hour
  - Handle missing complexity data
  - _Requirements: 6.1, 6.2, 6.3_

-
  11. [ ] Update SensaCourseDetailPage
- [ ] 11.1 Add chapter selection and navigation
  - Create chapter list sidebar or tabs
  - Display ComplexityIndicator for each chapter
  - Highlight selected chapter
  - Make responsive for mobile (collapsible sidebar)
  - _Requirements: 10.1, 10.7, 10.10_

- [ ] 11.2 Add personalized learning section
  - Create section for analogies with header and icon
  - Display loading skeletons while analogies load
  - Render AnalogyCard components for each analogy
  - Add "Regenerate" button with confirmation dialog
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 11.3 Add memory techniques section
  - Create section with header and icon
  - Render MemoryTechniqueCard components
  - Use grid layout for multiple techniques
  - _Requirements: 10.5_

- [ ] 11.4 Add learning mantras section
  - Create section with gradient background
  - Display LearningMantraCard components in grid
  - Add subtle animations
  - _Requirements: 10.6_

- [ ] 11.5 Add error handling and empty states
  - Show friendly error message if analogy generation fails
  - Add retry button for failed requests
  - Display empty state if no analogies available
  - Handle rate limit errors with countdown timer
  - _Requirements: 10.9_

- [ ] 11.6 Add loading states
  - Implement skeleton loaders for all sections
  - Show loading spinner during generation
  - Add progress indicator for long-running operations
  - _Requirements: 10.2_

-
  12. [ ] Infrastructure and Deployment
- [ ] 12.1 Add Bedrock permissions to ECS task role
  - Update IAM policy to include bedrock:InvokeModel permission
  - Specify Claude 3.5 Sonnet model ARN
  - Deploy updated IAM policy via Terraform
  - _Requirements: 3.1, 3.2_

- [ ] 12.2 Configure environment variables
  - Add BEDROCK_REGION to environment config
  - Add BEDROCK_MODEL_ID to environment config
  - Add DAILY_COST_THRESHOLD to environment config
  - Add USER_GENERATION_LIMIT to environment config
  - _Requirements: 3.1, 12.2, 12.3_

- [ ] 12.3 Deploy database migrations
  - Run migration script on development database
  - Verify all tables and indexes created successfully
  - Test rollback script
  - Deploy to production database
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ] 12.4 Set up CloudWatch alarms
  - Create alarm for daily Bedrock cost > $50
  - Create alarm for generation error rate > 5%
  - Create alarm for cache hit rate < 70%
  - Configure SNS topics for alert notifications
  - _Requirements: 12.2_

- [ ] 12.5 Deploy backend services
  - Build and push Docker image with new code
  - Deploy to ECS Fargate
  - Verify health checks pass
  - Monitor logs for errors
  - _Requirements: 3.1, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [ ] 12.6 Deploy frontend updates
  - Build production frontend bundle
  - Deploy to S3/CloudFront
  - Verify all new components render correctly
  - Test on multiple devices and browsers
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10_

-
  13. [ ] Testing and Quality Assurance
- [ ] 13.1 Perform end-to-end testing
  - Test complete flow: profile update → chapter view → analogy generation →
    feedback
  - Test caching behavior (first load vs. cached load)
  - Test rate limiting (exceed daily limit)
  - Test error scenarios (Bedrock failure, network issues)
  - _Requirements: All_

- [ ] 13.2 Perform load testing
  - Simulate 100 concurrent users generating analogies
  - Measure response times and throughput
  - Verify database performance under load
  - Check for memory leaks or resource exhaustion
  - _Requirements: 8.7_

- [ ] 13.3 Perform cost analysis
  - Generate analogies for 100 chapters
  - Calculate actual costs vs. estimates
  - Verify cost tracking accuracy
  - Optimize prompt if costs are too high
  - _Requirements: 12.1, 12.2, 12.5_

- [ ] 13.4 Perform user acceptance testing
  - Have beta users test the feature
  - Collect feedback on analogy quality
  - Measure user satisfaction with ratings
  - Identify areas for improvement
  - _Requirements: 7.1, 7.2, 7.3_

-
  14. [ ] Documentation and Launch
- [ ] 14.1 Write user documentation
  - Create guide on setting up profile for best analogies
  - Document how to rate and provide feedback
  - Explain complexity indicators
  - Add FAQ section
  - _Requirements: 1.1, 6.1, 7.1_

- [ ] 14.2 Write developer documentation
  - Document Bedrock integration architecture
  - Document API endpoints with examples
  - Document database schema
  - Add troubleshooting guide
  - _Requirements: 3.1, 9.1, 11.1_

- [ ] 14.3 Create monitoring dashboard
  - Set up Grafana dashboard for key metrics
  - Display daily costs, generation counts, cache hit rate
  - Show average ratings and user feedback trends
  - Add alerts for anomalies
  - _Requirements: 12.1, 12.2_

- [ ] 14.4 Prepare launch announcement
  - Write blog post explaining the feature
  - Create demo video showing personalized analogies
  - Prepare social media posts
  - Schedule launch date
  - _Requirements: All_
