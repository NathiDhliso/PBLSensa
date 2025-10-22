#!/bin/bash

# ============================================================================
# Database Migration Runner Script
# ============================================================================
# This script runs all database migrations in order and logs the results.
# 
# Usage:
#   ./run_migrations.sh
#
# Environment Variables Required:
#   DB_HOST     - Database host
#   DB_PORT     - Database port (default: 5432)
#   DB_NAME     - Database name
#   DB_USER     - Database user
#   DB_PASSWORD - Database password
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DB_PORT=${DB_PORT:-5432}
MIGRATIONS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../migrations" && pwd)"
LOG_FILE="migration_$(date +%Y%m%d_%H%M%S).log"

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================================================
# Validation
# ============================================================================

print_header "Database Migration Runner"

# Check required environment variables
if [ -z "$DB_HOST" ]; then
    print_error "DB_HOST environment variable is not set"
    exit 1
fi

if [ -z "$DB_NAME" ]; then
    print_error "DB_NAME environment variable is not set"
    exit 1
fi

if [ -z "$DB_USER" ]; then
    print_error "DB_USER environment variable is not set"
    exit 1
fi

if [ -z "$DB_PASSWORD" ]; then
    print_error "DB_PASSWORD environment variable is not set"
    exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    print_error "psql command not found. Please install PostgreSQL client."
    exit 1
fi

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    print_error "Migrations directory not found: $MIGRATIONS_DIR"
    exit 1
fi

# ============================================================================
# Database Connection Test
# ============================================================================

print_info "Testing database connection..."

export PGPASSWORD="$DB_PASSWORD"

if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
    print_error "Failed to connect to database"
    print_info "Host: $DB_HOST:$DB_PORT"
    print_info "Database: $DB_NAME"
    print_info "User: $DB_USER"
    exit 1
fi

print_success "Database connection successful"

# ============================================================================
# Get Migration Files
# ============================================================================

print_info "Scanning for migration files..."

# Get all .sql files in migrations directory, sorted by name
MIGRATION_FILES=($(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort))

if [ ${#MIGRATION_FILES[@]} -eq 0 ]; then
    print_warning "No migration files found in $MIGRATIONS_DIR"
    exit 0
fi

print_success "Found ${#MIGRATION_FILES[@]} migration file(s)"

# ============================================================================
# Run Migrations
# ============================================================================

print_header "Running Migrations"

SUCCESSFUL=0
SKIPPED=0
FAILED=0

for MIGRATION_FILE in "${MIGRATION_FILES[@]}"; do
    MIGRATION_NAME=$(basename "$MIGRATION_FILE")
    
    print_info "Processing: $MIGRATION_NAME"
    
    # Check if migration has already been applied
    ALREADY_APPLIED=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM migrations_log WHERE filename = '$MIGRATION_NAME'" 2>/dev/null || echo "0")
    
    ALREADY_APPLIED=$(echo "$ALREADY_APPLIED" | tr -d ' ')
    
    if [ "$ALREADY_APPLIED" -gt 0 ]; then
        print_warning "  Already applied, skipping..."
        ((SKIPPED++))
        continue
    fi
    
    # Run the migration
    START_TIME=$(date +%s)
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE" >> "$LOG_FILE" 2>&1; then
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        print_success "  Applied successfully (${DURATION}s)"
        ((SUCCESSFUL++))
    else
        print_error "  Failed to apply migration"
        print_error "  Check $LOG_FILE for details"
        ((FAILED++))
        
        # Ask if user wants to continue
        read -p "Continue with remaining migrations? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            break
        fi
    fi
done

# ============================================================================
# Summary
# ============================================================================

print_header "Migration Summary"

echo "Total migrations: ${#MIGRATION_FILES[@]}"
print_success "Successful: $SUCCESSFUL"
print_warning "Skipped: $SKIPPED"

if [ $FAILED -gt 0 ]; then
    print_error "Failed: $FAILED"
else
    print_success "Failed: $FAILED"
fi

echo ""
print_info "Log file: $LOG_FILE"

# ============================================================================
# Verify Migrations
# ============================================================================

print_header "Verification"

print_info "Checking migrations_log table..."

APPLIED_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM migrations_log" 2>/dev/null || echo "0")

APPLIED_COUNT=$(echo "$APPLIED_COUNT" | tr -d ' ')

print_success "Total migrations in log: $APPLIED_COUNT"

# Show recent migrations
print_info "Recent migrations:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
    "SELECT filename, applied_at, execution_time_ms FROM migrations_log ORDER BY applied_at DESC LIMIT 5"

# ============================================================================
# Exit
# ============================================================================

if [ $FAILED -gt 0 ]; then
    print_error "Some migrations failed. Please review the log file."
    exit 1
else
    print_success "All migrations completed successfully!"
    exit 0
fi
