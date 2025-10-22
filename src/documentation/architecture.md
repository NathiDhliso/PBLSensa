Complete Software Architecture Blueprint
Perspective-Based Learning + Sensa Learn Platform
Production-Ready AWS Architecture v7.0
Frontend Layer
Web Application
Framework: React 18 + TypeScript + Vite

Single Page Application with code-splitting and lazy loading for optimal performance

State Management: Zustand + React Query (TanStack Query)

Zustand for global UI state

React Query for server state management and caching

UI Component Library: Tailwind CSS + shadcn/ui + Lucide Icons

Accessible, customizable components with consistent design system

Visualization: D3.js v7 + React Flow

D3 for concept map rendering with zoom/pan

React Flow for interactive node graphs

Real-time Updates: WebSocket (Socket.io-client) + Server-Sent Events

WebSocket for processing status updates

SSE for long-running task notifications

Mobile Apps
Platform: React Native (iOS/Android) + Expo

Shared business logic with web

Native performance for mobile users

Hosting & CDN
Service: AWS Amplify Hosting + CloudFront

Amplify for CI/CD integration

CloudFront for global edge caching and SSL

Backend Layer (PBL Core)
Layer 0: File Validation & Pre-Processing
Service: AWS Lambda (Python 3.11) + Amazon Textract

PDF validation with PyPDF2

SHA256 hashing

OCR fallback for scanned documents

Layer 1: Caching & Task Queue
Services: Amazon ElastiCache (Redis 7.x) + Amazon SQS + AWS Fargate

Versioned cache keys

SQS with DLQ

Fargate workers poll queue

Layer 2: PDF Parsing & Normalization
Service: LlamaParse API + Custom Python Pipeline

Markdown extraction with fallback chain

Hierarchy normalization to consistent ID scheme

Layer 3: Document Embeddings
Service: Amazon SageMaker Serverless (howey/HDT-E model)

Batched embedding generation

Handles large documents with chunked requests

Layer 4: Keyword Extraction
Methods: KeyBERT + YAKE + spaCy TextRank (Ensemble)

Multi-method extraction

Exam relevance scoring via cosine similarity

Layer 5: RAG & Concept Mapping
Service: Amazon Bedrock (Claude 3.5 Sonnet) + pgvector search

Chapter-scoped semantic search with neighbor expansion

Primary node + reference node strategy

Layer 8: API Layer
Framework: FastAPI (Python) on AWS Fargate + API Gateway

RESTful endpoints with rate limiting via Usage Plans

OpenAPI documentation

Layer 9: Feedback Loop
Service: AWS Lambda + EventBridge (weekly schedule)

Consensus-based feedback processing (3+ users)

Reputation scoring

Layer 10: Multi-Document Synthesis
Method: Custom Entity Resolution Algorithm

Cosine similarity for node merging

Homograph detection via subject field

Data & Storage Layer
Primary Database
Service: Amazon RDS for PostgreSQL 15 + pgvector extension

Multi-AZ deployment

Automated backups

Point-in-time recovery

Schema Tables:

processed_documents: maps, pipeline_version, subject

courses and course_documents: course management

user_annotations: feedback data

user_profiles: age_range, location, interests (JSONB)

analogy_feedback: thumbs up/down ratings

user_progress: streaks, badges, completed chapters

chapter_complexity: High/Medium/Low scores

Object Storage
Service: Amazon S3 (Standard & Intelligent-Tiering)

Original PDFs, processed artifacts

Lifecycle policies for 90-day retention

Auto-deletion after 2 years

Vector Search
Service: RDS pgvector with HNSW indexes

Embedding storage and similarity search for RAG retrieval

Entity resolution

Cache Layer
Service: ElastiCache for Redis (cluster mode enabled)

Versioned concept maps

Session data

Rate limit counters

TTL: 7 days for maps

AI & Machine Learning Layer
Language Model
Service: Amazon Bedrock - Claude 3.5 Sonnet

RAG context synthesis

Concept summarization

Analogy generation

Conflict resolution

Embedding Model
Service: SageMaker Serverless - howey/HDT-E

Hierarchical document embeddings

Auto-scaling

Batch inference

NLP Pipeline
Tools: spaCy 3.x + transformers (HuggingFace)

Entity recognition

Keyword extraction

Text preprocessing

Feature Flags & A/B Testing
Service: AWS AppConfig

Test new models, prompts, and pipeline improvements on user subsets before rollout

Integration & Third-Party Services
Audio Narration
Service: Eleven Labs API

Text-to-speech for concept summaries and analogies

Natural voice synthesis

Focus Music
Service: Brain.fm API

Scientifically designed focus music integration

Embedded player widget

Document Parsing
Services: LlamaParse API (primary) + Amazon Textract (fallback)

Exponential backoff retry logic

Automatic fallback chain for resilience

Real-time Communication
Service: Socket.io (WebSocket) on Fargate

Processing status updates

Conflict resolution notifications

Collaborative features

Email Service
Service: Amazon SES

Transactional emails (verification, password reset)

Weekly progress reports

DevOps & Infrastructure
Infrastructure as Code
Tools: AWS CDK (TypeScript) + CloudFormation

Full stack definition in code

Reproducible environments

Automated provisioning

CI/CD Pipeline
Tools: GitHub Actions + AWS CodePipeline + CodeBuild

Automated testing

Security scanning

Blue-green deployments

Pipeline Stages:

Unit Tests (pytest, Jest)

Integration Tests (Postman/Newman)

Security Scan (Snyk, AWS Inspector)

Build & Push Docker Images (ECR)

Deploy to Dev → Staging → Production

Automated Rollback on Failure

Container Registry
Service: Amazon ECR

Private Docker image repository with vulnerability scanning

Image lifecycle policies

Environment Strategy
Environments: Dev, Staging, Production (isolated VPCs)

Dev: feature branches

Staging: pre-prod testing

Prod: blue-green deployment

Secrets Management
Services: AWS Secrets Manager + Parameter Store

API keys

Database credentials

Rotation policies

Least-privilege access

Security & Compliance
Authentication
Service: Amazon Cognito User Pools

OAuth 2.0

MFA support

Password policies

Social login integration

Authorization
Method: JWT tokens + IAM Role-Based Access Control

Stateless auth with short-lived tokens

Refresh token rotation

API Security
Service: API Gateway with WAF + Usage Plans

Rate limiting

DDoS protection

IP whitelisting

Data Encryption
Method: KMS (at rest) + TLS 1.3 (in transit)

S3 encryption

RDS encryption

Encrypted EBS volumes

Certificate management via ACM

GDPR Compliance
Features: Data Deletion API + Audit Logging

DELETE endpoint for user data

Cascade deletion

Anonymized feedback retention

Network Security
Setup: VPC with private subnets + Security Groups

RDS and Fargate in private subnets

NAT Gateway for outbound

NACLs for defense-in-depth

Monitoring & Observability
Distributed Tracing
Service: AWS X-Ray

End-to-end request tracing

Performance bottleneck identification

Service map visualization

Metrics & Dashboards
Service: Amazon CloudWatch + Custom Metrics

Pipeline latency

Cache hit rates

Feedback quality

API response times

Error rates

Log Aggregation
Service: CloudWatch Logs + Insights

Centralized logging

Log queries

Retention policies (30 days standard, 1 year for audit)

Alerting Strategy
Services: CloudWatch Alarms + SNS + PagerDuty

Alert Levels:

P1 (Critical): 5min response

P2 (Error): 30min response

P3 (Warning): next business day

Key Alerts:

SQS queue depth over 100 messages (P2)

Fargate task failure rate over 5% (P1)

API error rate over 1% (P2)

RDS connection pool exhaustion (P1)

Cache hit rate below 70% (P3)

LlamaParse API failure (P2, triggers fallback)

User Analytics
Service: AWS Pinpoint + Custom Events

User engagement tracking

Feature usage

Conversion funnels

Retention cohorts

Error Tracking
Service: Sentry (Frontend & Backend)

Real-time error reporting

Stack traces

Release tracking

User context

Performance Monitoring
Service: CloudWatch RUM (Real User Monitoring)

Frontend performance metrics

Core Web Vitals

User session replay

Cost Management & Optimization
First-Year Estimated Cost
Total: $12,000 - $18,000

Based on 5,000 active users

20,000 documents processed/month

Major Cost Centers
Bedrock API calls: ~40%

RDS (db.r6g.large Multi-AZ): ~25%

Fargate compute: ~15%

S3 + data transfer: ~10%

SageMaker Serverless: ~10%

Optimization Strategies
Aggressive caching (70%+ hit rate target)

Batch Bedrock requests

S3 Intelligent-Tiering

RDS Reserved Instances (after 3 months)

CloudWatch Logs retention policies

Cost Monitoring
Tools: AWS Cost Explorer + Budgets + Custom Alerts

Daily cost tracking

Budget alerts at 80% and 100%

Anomaly detection

API Endpoints Reference
PBL Core
POST /upload-document

GET /status/[task_id]

POST /feedback

GET /courses

POST /courses

GET /courses/[course_id]/documents

POST /courses/[course_id]/documents

GET /concept-map/course/[course_id]

GET /concept-map/document/[doc_id]

GET /concept-map/chapter/[chapter_id]

Sensa Learn
GET /sensa-learn/dashboard/[course_id]

GET /sensa-learn/chapter/[chapter_id]/summary

GET /sensa-learn/chapter/[chapter_id]/analogies

PUT /profile

GET /profile

POST /feedback/analogy

GET /progress/[user_id]

POST /progress/chapter-complete

GET /badges/[user_id]

Disaster Recovery & Business Continuity
RPO (Recovery Point Objective): 15 minutes
RDS automated backups every 15 min

S3 versioning enabled

Point-in-time recovery

RTO (Recovery Time Objective): 1 hour
Multi-AZ RDS failover: 1-2 min

Fargate task replacement: under 30 sec

Full regional failover: under 1 hour

Recovery Procedures
Cache Failure: Automatic fallback to RDS, alert DevOps

SQS Failures: Tasks move to DLQ, manual review and replay

LlamaParse Outage: Automatic fallback to Textract + Bedrock

Regional Failure: Manual promotion of read replica in backup region

Data Corruption: Point-in-time restore from automated backups