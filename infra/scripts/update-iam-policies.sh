#!/bin/bash
# A robust script to manage a single IAM policy for the PBL project.
# This version uses a create-then-update logic to be more resilient.

set -e

# --- Configuration ---
USER_NAME="PBL_Sensa"
POLICY_NAME="PBL-Development-TerraformPolicy"
POLICY_DESCRIPTION="All-in-one policy for the PBL Terraform project"

# --- Get Paths ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
POLICY_FILE="${PROJECT_ROOT}/infra/iam-policies/pbl-development-policy.json"

# --- Main Logic ---
echo "Processing policy: ${POLICY_NAME}..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"
POLICY_DOCUMENT=$(cat "$POLICY_FILE")

# Try to create the policy. If it fails (because it exists), then update it.
if aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document "$POLICY_DOCUMENT" \
    --description "$POLICY_DESCRIPTION" &>/dev/null; then
  
  echo "  -> Policy created successfully."

else
  echo "  -> Policy already exists. Cleaning up old versions before update..."
  
  # Get all non-default policy versions
  NON_DEFAULT_VERSIONS=$(aws iam list-policy-versions --policy-arn "$POLICY_ARN" \
    --query 'Versions[?IsDefaultVersion==`false`].VersionId' --output text)
  
  # Delete each non-default version
  for version_id in $NON_DEFAULT_VERSIONS; do
    echo "     - Deleting old version: $version_id"
    aws iam delete-policy-version --policy-arn "$POLICY_ARN" --version-id "$version_id"
  done
  
  echo "  -> Creating new policy version..."
  aws iam create-policy-version \
    --policy-arn "$POLICY_ARN" \
    --policy-document "$POLICY_DOCUMENT" \
    --set-as-default
fi

echo "  ✓ Policy is up to date."
echo "Attaching policy to user: $USER_NAME..."
aws iam attach-user-policy --user-name "$USER_NAME" --policy-arn "$POLICY_ARN"

echo ""
echo "✓ IAM setup complete!"
echo "  Attached ${POLICY_ARN} to ${USER_NAME}."