#!/bin/bash

# ============================================================================
# Terraform Backend Setup Script
# ============================================================================
# This script creates the S3 bucket and DynamoDB table needed for Terraform
# remote state management and locking.
#
# Usage:
#   ./setup-terraform-backend.sh [environment]
#
# Example:
#   ./setup-terraform-backend.sh development
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
ENVIRONMENT=${1:-development}
AWS_REGION=${AWS_REGION:-us-east-1}

# Resource names
if [ "$ENVIRONMENT" = "production" ]; then
    S3_BUCKET="pbl-terraform-state"
    DYNAMODB_TABLE="pbl-terraform-locks"
else
    S3_BUCKET="pbl-terraform-state-dev"
    DYNAMODB_TABLE="pbl-terraform-locks-dev"
fi

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Terraform Backend Setup - ${ENVIRONMENT}${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "${BLUE}S3 Bucket:${NC} $S3_BUCKET"
echo -e "${BLUE}DynamoDB Table:${NC} $DYNAMODB_TABLE"
echo -e "${BLUE}Region:${NC} $AWS_REGION"
echo ""

# Confirm
read -p "Continue with setup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Setup cancelled${NC}"
    exit 0
fi

# ============================================================================
# Create S3 Bucket
# ============================================================================

echo -e "${BLUE}Creating S3 bucket for Terraform state...${NC}"

if aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
    echo -e "${YELLOW}✓ S3 bucket already exists${NC}"
else
    if [ "$AWS_REGION" = "us-east-1" ]; then
        aws s3api create-bucket \
            --bucket "$S3_BUCKET" \
            --region "$AWS_REGION"
    else
        aws s3api create-bucket \
            --bucket "$S3_BUCKET" \
            --region "$AWS_REGION" \
            --create-bucket-configuration LocationConstraint="$AWS_REGION"
    fi
    echo -e "${GREEN}✓ S3 bucket created${NC}"
fi

# Enable versioning
echo -e "${BLUE}Enabling versioning...${NC}"
aws s3api put-bucket-versioning \
    --bucket "$S3_BUCKET" \
    --versioning-configuration Status=Enabled
echo -e "${GREEN}✓ Versioning enabled${NC}"

# Enable encryption
echo -e "${BLUE}Enabling encryption...${NC}"
aws s3api put-bucket-encryption \
    --bucket "$S3_BUCKET" \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            },
            "BucketKeyEnabled": true
        }]
    }'
echo -e "${GREEN}✓ Encryption enabled${NC}"

# Block public access
echo -e "${BLUE}Blocking public access...${NC}"
aws s3api put-public-access-block \
    --bucket "$S3_BUCKET" \
    --public-access-block-configuration \
        BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
echo -e "${GREEN}✓ Public access blocked${NC}"

# Add lifecycle policy
echo -e "${BLUE}Adding lifecycle policy...${NC}"
aws s3api put-bucket-lifecycle-configuration \
    --bucket "$S3_BUCKET" \
    --lifecycle-configuration '{
        "Rules": [{
            "ID": "DeleteOldVersions",
            "Status": "Enabled",
            "Filter": {},
            "NoncurrentVersionExpiration": {
                "NoncurrentDays": 90
            }
        }]
    }'
echo -e "${GREEN}✓ Lifecycle policy added${NC}"

# Add tags
echo -e "${BLUE}Adding tags...${NC}"
aws s3api put-bucket-tagging \
    --bucket "$S3_BUCKET" \
    --tagging "TagSet=[
        {Key=Project,Value=pbl},
        {Key=Environment,Value=$ENVIRONMENT},
        {Key=ManagedBy,Value=Terraform},
        {Key=Purpose,Value=TerraformState}
    ]"
echo -e "${GREEN}✓ Tags added${NC}"

# ============================================================================
# Create DynamoDB Table
# ============================================================================

echo -e "${BLUE}Creating DynamoDB table for state locking...${NC}"

if aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION" 2>/dev/null; then
    echo -e "${YELLOW}✓ DynamoDB table already exists${NC}"
else
    aws dynamodb create-table \
        --table-name "$DYNAMODB_TABLE" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "$AWS_REGION" \
        --tags Key=Project,Value=pbl Key=Environment,Value="$ENVIRONMENT" Key=ManagedBy,Value=Terraform Key=Purpose,Value=StateLocking
    
    echo -e "${BLUE}Waiting for table to be active...${NC}"
    aws dynamodb wait table-exists --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION"
    echo -e "${GREEN}✓ DynamoDB table created${NC}"
fi

# ============================================================================
# Summary
# ============================================================================

echo ""
echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}Terraform Backend Setup Complete!${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""
echo -e "${BLUE}Backend Configuration:${NC}"
echo ""
echo "terraform {"
echo "  backend \"s3\" {"
echo "    bucket         = \"$S3_BUCKET\""
echo "    key            = \"$ENVIRONMENT/terraform.tfstate\""
echo "    region         = \"$AWS_REGION\""
echo "    encrypt        = true"
echo "    dynamodb_table = \"$DYNAMODB_TABLE\""
echo "  }"
echo "}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Update your Terraform backend configuration with the values above"
echo "2. Run: terraform init"
echo "3. Run: terraform plan"
echo "4. Run: terraform apply"
echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
