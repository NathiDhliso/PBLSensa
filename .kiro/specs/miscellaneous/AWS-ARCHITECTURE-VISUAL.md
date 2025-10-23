# AWS Architecture - Visual Guide

## 🏗️ Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER / FRONTEND                                │
│                    (React App + Cognito Auth)                           │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (Layer 8)                            │
│                    Rate Limiting + Usage Plans                          │
│                    /upload, /status, /feedback                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    APPLICATION LOAD BALANCER                             │
│                         (Public Subnets)                                │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
        ┌───────────────────┐     ┌───────────────────┐
        │   FARGATE API     │     │  FARGATE WORKER   │
        │   (Layer 8)       │     │   (Layer 1-5)     │
        │                   │     │                   │
        │ - FastAPI         │     │ - SQS Polling     │
        │ - Health Check    │     │ - PDF Processing  │
        │ - Upload Handler  │     │ - Keyword Extract │
        │ - Status API      │     │ - Concept Mapping │
        └─────────┬─────────┘     └─────────┬─────────┘
                  │                         │
                  │                         │
        ┌─────────┴─────────────────────────┴─────────┐
        │                                              │
        ▼                                              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  S3 BUCKET   │  │ ELASTICACHE  │  │  SQS QUEUE   │  │     RDS      │
│  (Layer 6)   │  │  (Layer 1)   │  │  (Layer 1)   │  │  (Layer 7)   │
│              │  │              │  │              │  │              │
│ - PDF Files  │  │ - Redis 7    │  │ - Main Queue │  │ - PostgreSQL │
│ - Artifacts  │  │ - Cache      │  │ - DLQ        │  │ - pgvector   │
│ - Logs       │  │ - Sessions   │  │              │  │ - 15 Tables  │
└──────┬───────┘  └──────────────┘  └──────────────┘  └──────────────┘
       │
       │ S3 Event
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    LAMBDA: PDF VALIDATOR (Layer 0)                    │
│                                                                        │
│  1. Validate PDF (PyPDF2)                                            │
│  2. Generate SHA256 hash                                             │
│  3. Check for encryption                                             │
│  4. Send to SQS queue                                                │
│  5. Fallback to Textract if needed                                   │
└──────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                        AI/ML SERVICES                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐ │
│  │   SAGEMAKER        │  │   BEDROCK          │  │   TEXTRACT       │ │
│  │   (Layer 3)        │  │   (Layer 5)        │  │   (Layer 0)      │ │
│  │                    │  │                    │  │                  │ │
│  │ - HDT-E Model      │  │ - Claude 3.5       │  │ - OCR Fallback   │ │
│  │ - Embeddings       │  │ - Concept Mapping  │  │ - Document Text  │ │
│  │ - Serverless       │  │ - RAG Workflow     │  │ - Table Extract  │ │
│  │ - 768 dimensions   │  │ - Relationships    │  │                  │ │
│  └────────────────────┘  └────────────────────┘  └──────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                    MONITORING & OBSERVABILITY                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐ │
│  │   CLOUDWATCH       │  │   X-RAY            │  │   APPCONFIG      │ │
│  │                    │  │                    │  │   (Layer 11)     │ │
│  │ - Dashboards       │  │ - Tracing          │  │                  │ │
│  │ - Alarms (P1-P3)   │  │ - Service Map      │  │ - Feature Flags  │ │
│  │ - Logs             │  │ - Performance      │  │ - A/B Testing    │ │
│  │ - Metrics          │  │ - Bottlenecks      │  │ - Rollouts       │ │
│  └────────────────────┘  └────────────────────┘  └──────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                    FEEDBACK & AUTOMATION (Layer 9)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐│
│  │   EVENTBRIDGE RULE (Weekly)                                        ││
│  │   ↓                                                                ││
│  │   LAMBDA: Feedback Processor                                       ││
│  │   - Aggregate user feedback                                        ││
│  │   - Apply consensus model (3+ users)                               ││
│  │   - Update keyword scores                                          ││
│  │   - Calculate reputation                                           ││
│  └────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow: PDF Upload → Concept Map

```
1. USER UPLOADS PDF
   │
   ├─→ Frontend → API Gateway → ALB → Fargate API
   │
   └─→ Upload to S3 Bucket
       │
       └─→ S3 Event triggers Lambda (Layer 0)
           │
           ├─→ Validate PDF (PyPDF2)
           ├─→ Generate SHA256 hash
           ├─→ Check cache (ElastiCache)
           │   └─→ If cached: Return immediately
           │
           └─→ Send to SQS Queue

2. WORKER PROCESSES PDF
   │
   ├─→ Fargate Worker polls SQS
   │
   ├─→ Layer 2: Parse PDF
   │   ├─→ Try LlamaParse API
   │   └─→ Fallback: Textract + Claude
   │
   ├─→ Layer 2.1: Normalize Hierarchy
   │   └─→ Map to consistent IDs (chapter_1_section_2)
   │
   ├─→ Layer 3: Generate Embeddings
   │   ├─→ Chunk text (512 tokens)
   │   ├─→ Call SageMaker (HDT-E)
   │   └─→ Store in RDS (pgvector)
   │
   ├─→ Layer 4: Extract Keywords
   │   ├─→ KeyBERT
   │   ├─→ YAKE
   │   ├─→ spaCy TextRank
   │   └─→ Merge & deduplicate
   │
   └─→ Layer 5: Generate Concept Map
       ├─→ RAG: Search similar chunks (pgvector)
       ├─→ Call Bedrock (Claude 3.5 Sonnet)
       ├─→ Generate relationships
       ├─→ Create graph structure
       └─→ Store in RDS + Cache

3. USER RETRIEVES MAP
   │
   ├─→ Frontend → API Gateway → ALB → Fargate API
   │
   ├─→ Check cache (ElastiCache)
   │   └─→ If hit: Return immediately
   │
   └─→ Query RDS
       └─→ Return concept map JSON
```

## 🔄 Processing Pipeline Details

### Layer 0: PDF Validation (Lambda)
```
Input: S3 Event (PDF uploaded)
│
├─→ Download PDF from S3
├─→ Validate with PyPDF2
│   ├─→ Check encryption
│   ├─→ Check corruption
│   └─→ Count pages
│
├─→ Generate SHA256 hash
├─→ Check cache (Redis)
│   └─→ Key: processed:{hash}:v{version}
│
└─→ Send to SQS
    └─→ Message: {hash, s3_key, num_pages}
```

### Layer 1: Caching & Queuing
```
SQS Queue
│
├─→ Main Queue (documents-queue)
│   ├─→ Visibility timeout: 300s
│   ├─→ Max receives: 5
│   └─→ Redrive to DLQ
│
└─→ Dead Letter Queue (DLQ)
    └─→ Manual inspection

ElastiCache (Redis)
│
├─→ Cache Keys
│   ├─→ processed:{hash}:v1.0.0
│   ├─→ keywords:{doc_id}
│   └─→ map:{doc_id}
│
└─→ TTL: 7 days
```

### Layer 2: PDF Parsing
```
Input: SQS Message
│
├─→ Try LlamaParse API
│   ├─→ Convert to Markdown
│   ├─→ Extract structure
│   └─→ Success? → Continue
│
└─→ Fallback Chain
    ├─→ Try Textract
    │   └─→ Extract text + tables
    │
    └─→ Try PyPDF2
        └─→ Basic text extraction
```

### Layer 3: Embeddings (SageMaker)
```
Input: Parsed text
│
├─→ Chunk text (512 tokens, 50 overlap)
│
├─→ Batch chunks (max 10 per request)
│
├─→ Call SageMaker Endpoint
│   ├─→ Model: howey/HDT-E
│   ├─→ Output: 768-dim vectors
│   └─→ Serverless (cold start: 30-60s)
│
└─→ Store in RDS
    └─→ Table: document_chunks
        └─→ Column: embedding vector(768)
```

### Layer 4: Keyword Extraction
```
Input: Full text
│
├─→ Method 1: KeyBERT
│   ├─→ Transformer-based
│   └─→ Top 20 keywords
│
├─→ Method 2: YAKE
│   ├─→ Statistical
│   └─→ Top 20 keywords
│
├─→ Method 3: spaCy
│   ├─→ NLP-based
│   └─→ Noun chunks
│
└─→ Merge & Deduplicate
    ├─→ Normalize (lowercase)
    ├─→ Score by consensus
    └─→ Store in RDS
```

### Layer 5: RAG Concept Mapping
```
Input: Keywords + Embeddings
│
├─→ For each keyword:
│   │
│   ├─→ Generate embedding
│   │
│   ├─→ Search similar chunks (pgvector)
│   │   └─→ SELECT * FROM search_similar_chunks(
│   │       query_embedding,
│   │       threshold=0.7,
│   │       limit=10
│   │   )
│   │
│   ├─→ Build context (top 5 chunks)
│   │
│   └─→ Call Bedrock (Claude 3.5)
│       ├─→ Prompt: "Identify relationships..."
│       ├─→ Response: JSON graph
│       └─→ Parse relationships
│
└─→ Build Graph
    ├─→ Nodes: Keywords
    ├─→ Edges: Relationships
    ├─→ Metadata: Scores, context
    └─→ Store in RDS + Cache
```

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. NETWORK SECURITY                                        │
│     ├─→ VPC with private subnets                           │
│     ├─→ Security groups (least privilege)                  │
│     ├─→ NAT Gateway for outbound                           │
│     └─→ No public IPs on compute                           │
│                                                              │
│  2. DATA ENCRYPTION                                         │
│     ├─→ S3: KMS encryption at rest                         │
│     ├─→ RDS: KMS encryption at rest                        │
│     ├─→ ElastiCache: Encryption in transit                 │
│     └─→ Secrets Manager: Encrypted secrets                 │
│                                                              │
│  3. AUTHENTICATION                                          │
│     ├─→ Cognito User Pool                                  │
│     ├─→ JWT tokens                                         │
│     ├─→ MFA support                                        │
│     └─→ Password policy                                    │
│                                                              │
│  4. AUTHORIZATION                                           │
│     ├─→ IAM roles (least privilege)                        │
│     ├─→ Resource-based policies                            │
│     ├─→ API Gateway authorizers                            │
│     └─→ Row-level security (RDS)                           │
│                                                              │
│  5. MONITORING                                              │
│     ├─→ CloudWatch Logs                                    │
│     ├─→ X-Ray tracing                                      │
│     ├─→ CloudTrail audit logs                              │
│     └─→ GuardDuty (optional)                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 💰 Cost Optimization Strategies

```
┌─────────────────────────────────────────────────────────────┐
│                   COST OPTIMIZATION                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  COMPUTE                                                     │
│  ├─→ Use Fargate Spot (70% savings)                        │
│  ├─→ Right-size tasks (CPU/memory)                         │
│  ├─→ Auto-scaling policies                                 │
│  └─→ Stop dev environments overnight                       │
│                                                              │
│  DATABASE                                                    │
│  ├─→ Use db.t4g.micro for dev ($15 vs $30)                │
│  ├─→ Enable auto-pause (Aurora Serverless)                 │
│  ├─→ Optimize queries (reduce IOPS)                        │
│  └─→ Use read replicas only if needed                      │
│                                                              │
│  STORAGE                                                     │
│  ├─→ S3 Lifecycle policies (move to IA)                   │
│  ├─→ Delete old logs (7-day retention)                     │
│  ├─→ Compress artifacts                                    │
│  └─→ Use S3 Intelligent-Tiering                            │
│                                                              │
│  NETWORKING                                                  │
│  ├─→ Use VPC endpoints (save NAT costs)                   │
│  ├─→ Minimize cross-AZ traffic                             │
│  ├─→ CloudFront for static assets                          │
│  └─→ Direct Connect for high volume                        │
│                                                              │
│  AI/ML                                                       │
│  ├─→ Batch requests (reduce API calls)                    │
│  ├─→ Cache embeddings aggressively                         │
│  ├─→ Use smaller models when possible                      │
│  └─→ Monitor token usage                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📈 Scaling Strategy

```
LOW TRAFFIC (0-100 users)
├─→ 1 Fargate task (API)
├─→ 1 Fargate task (Worker)
├─→ db.t4g.micro
├─→ cache.t4g.micro
└─→ Cost: ~$50-80/month

MEDIUM TRAFFIC (100-1000 users)
├─→ 2-4 Fargate tasks (API)
├─→ 2-3 Fargate tasks (Worker)
├─→ db.t4g.medium
├─→ cache.t4g.small
└─→ Cost: ~$200-400/month

HIGH TRAFFIC (1000-10000 users)
├─→ 5-10 Fargate tasks (API)
├─→ 5-8 Fargate tasks (Worker)
├─→ db.r6g.large (or Aurora)
├─→ cache.r6g.large
├─→ Multi-AZ deployment
└─→ Cost: ~$800-1500/month
```

## 🎯 Performance Targets

```
LATENCY TARGETS
├─→ API Response: < 200ms (p95)
├─→ PDF Upload: < 2s
├─→ Processing: < 5 min (100-page PDF)
├─→ Concept Map Retrieval: < 500ms
└─→ Cache Hit: < 50ms

THROUGHPUT TARGETS
├─→ API: 100 req/s
├─→ Uploads: 10/min
├─→ Processing: 20 docs/hour
└─→ Concurrent Users: 100+

AVAILABILITY TARGETS
├─→ API: 99.9% uptime
├─→ Processing: 99% success rate
├─→ Data Durability: 99.999999999%
└─→ RTO: < 1 hour, RPO: < 5 minutes
```

---

This visual guide complements the detailed documentation in:
- `AWS-FULL-STACK-SUMMARY.md`
- `AWS-DEPLOYMENT-GUIDE.md`
- `QUICK-START-AWS.md`
