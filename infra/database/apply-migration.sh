#!/bin/bash
# Apply database migration to AWS RDS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-development}"
DEVELOPER_ID="${2:-dev}"
REGION="${3:-eu-west-1}"
ROLLBACK="${4:-false}"

SECRET_NAME="pbl/$ENVIRONMENT/$DEVELOPER_ID/db-credentials"
RDS_ENDPOINT="pbl-development-dev-db.cn82qs0k811m.eu-west-1.rds.amazonaws.com"
DATABASE_NAME="pbl_development"
PORT=5432

echo -e "${CYAN}🗄️  Database Migration Script${NC}"
echo -e "${CYAN}================================${NC}"
echo ""

if [ "$ROLLBACK" = "true" ]; then
    MIGRATION_FILE="migrations/20250122_0006_ai_analogy_generation_rollback.sql"
    echo -e "${YELLOW}⚠️  ROLLBACK MODE - This will remove the AI analogy tables!${NC}"
else
    MIGRATION_FILE="migrations/20250122_0006_ai_analogy_generation.sql"
    echo -e "${GREEN}✅ MIGRATION MODE - This will create AI analogy tables${NC}"
fi

echo ""

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${CYAN}📋 Configuration:${NC}"
echo "   Environment: $ENVIRONMENT"
echo "   Region: $REGION"
echo "   RDS Endpoint: $RDS_ENDPOINT"
echo "   Database: $DATABASE_NAME"
echo "   Migration File: $MIGRATION_FILE"
echo ""

# Check if AWS CLI is installed
echo -e "${CYAN}🔍 Checking AWS CLI...${NC}"
if ! command -v aws &> /dev/null; then
    echo -e "${RED}   ❌ AWS CLI not found. Please install it first.${NC}"
    echo -e "${YELLOW}   Download from: https://aws.amazon.com/cli/${NC}"
    exit 1
fi
echo -e "${GREEN}   ✅ AWS CLI found: $(aws --version)${NC}"

# Check if psql is installed
echo -e "${CYAN}🔍 Checking PostgreSQL client...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}   ❌ psql not found. Please install PostgreSQL client.${NC}"
    echo -e "${YELLOW}   Ubuntu/Debian: sudo apt-get install postgresql-client${NC}"
    echo -e "${YELLOW}   macOS: brew install postgresql${NC}"
    exit 1
fi
echo -e "${GREEN}   ✅ psql found: $(psql --version)${NC}"

echo ""

# Retrieve database credentials from AWS Secrets Manager
echo -e "${CYAN}🔐 Retrieving database credentials from AWS Secrets Manager...${NC}"
SECRET_JSON=$(aws secretsmanager get-secret-value \
    --secret-id "$SECRET_NAME" \
    --region "$REGION" \
    --query SecretString \
    --output text 2>&1)

if [ $? -ne 0 ]; then
    echo -e "${RED}   ❌ Failed to retrieve secret${NC}"
    echo ""
    echo -e "${YELLOW}   Possible issues:${NC}"
    echo -e "${YELLOW}   1. AWS credentials not configured (run 'aws configure')${NC}"
    echo -e "${YELLOW}   2. Insufficient IAM permissions${NC}"
    echo -e "${YELLOW}   3. Secret does not exist in region $REGION${NC}"
    exit 1
fi

DB_USERNAME=$(echo "$SECRET_JSON" | jq -r '.username')
DB_PASSWORD=$(echo "$SECRET_JSON" | jq -r '.password')

echo -e "${GREEN}   ✅ Credentials retrieved successfully${NC}"
echo -e "   Username: $DB_USERNAME"

echo ""

# Confirm before proceeding
if [ "$ROLLBACK" = "true" ]; then
    echo -e "${YELLOW}⚠️  WARNING: You are about to ROLLBACK the migration!${NC}"
    echo -e "${YELLOW}   This will DROP the following tables:${NC}"
    echo -e "${YELLOW}   - chapter_analogies${NC}"
    echo -e "${YELLOW}   - memory_techniques${NC}"
    echo -e "${YELLOW}   - learning_mantras${NC}"
    echo -e "${YELLOW}   - analogy_feedback${NC}"
    echo -e "${YELLOW}   - chapter_complexity${NC}"
else
    echo -e "${CYAN}📝 Ready to apply migration:${NC}"
    echo -e "${CYAN}   This will CREATE the following tables:${NC}"
    echo -e "${CYAN}   - chapter_analogies (with indexes and triggers)${NC}"
    echo -e "${CYAN}   - memory_techniques${NC}"
    echo -e "${CYAN}   - learning_mantras${NC}"
    echo -e "${CYAN}   - analogy_feedback${NC}"
    echo -e "${CYAN}   - chapter_complexity${NC}"
    echo -e "${CYAN}   - analogy_statistics (view)${NC}"
    echo -e "${CYAN}   - user_generation_stats (view)${NC}"
fi

echo ""
read -p "Do you want to proceed? (yes/no): " confirmation
if [ "$confirmation" != "yes" ]; then
    echo -e "${YELLOW}❌ Migration cancelled by user${NC}"
    exit 0
fi

echo ""

# Apply migration
echo -e "${CYAN}🚀 Applying migration to database...${NC}"
echo ""

export PGPASSWORD="$DB_PASSWORD"

if psql -h "$RDS_ENDPOINT" -p "$PORT" -U "$DB_USERNAME" -d "$DATABASE_NAME" -f "$MIGRATION_FILE"; then
    echo ""
    echo -e "${GREEN}✅ Migration applied successfully!${NC}"
    
    if [ "$ROLLBACK" != "true" ]; then
        echo ""
        echo -e "${CYAN}📊 New tables created:${NC}"
        echo -e "${GREEN}   ✅ chapter_analogies${NC}"
        echo -e "${GREEN}   ✅ memory_techniques${NC}"
        echo -e "${GREEN}   ✅ learning_mantras${NC}"
        echo -e "${GREEN}   ✅ analogy_feedback${NC}"
        echo -e "${GREEN}   ✅ chapter_complexity${NC}"
        echo ""
        echo -e "${CYAN}📈 Views created:${NC}"
        echo -e "${GREEN}   ✅ analogy_statistics${NC}"
        echo -e "${GREEN}   ✅ user_generation_stats${NC}"
    fi
else
    echo ""
    echo -e "${RED}❌ Migration failed!${NC}"
    unset PGPASSWORD
    exit 1
fi

unset PGPASSWORD

echo ""
echo -e "${GREEN}🎉 Database migration complete!${NC}"
echo ""

# Verify tables were created (only for forward migration)
if [ "$ROLLBACK" != "true" ]; then
    echo -e "${CYAN}🔍 Verifying tables...${NC}"
    export PGPASSWORD="$DB_PASSWORD"
    
    VERIFY_QUERY="SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('chapter_analogies', 'memory_techniques', 'learning_mantras', 'analogy_feedback', 'chapter_complexity') ORDER BY table_name;"
    
    echo ""
    echo -e "${CYAN}Tables found in database:${NC}"
    psql -h "$RDS_ENDPOINT" -p "$PORT" -U "$DB_USERNAME" -d "$DATABASE_NAME" -t -c "$VERIFY_QUERY" || true
    
    unset PGPASSWORD
fi

echo ""
echo -e "${CYAN}✨ Next steps:${NC}"
echo "   1. Test the new endpoints in your backend"
echo "   2. Generate some test analogies"
echo "   3. Check the CloudWatch dashboard for any errors"
echo ""
