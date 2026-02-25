#!/bin/bash
# =============================================================================
# SikaFlow — Validate GitHub Actions workflows locally
# =============================================================================
# Usage:  ./scripts/validate-workflows.sh
# Prereq: actionlint installed (https://github.com/rhysd/actionlint)
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "🔍 Validating GitHub Actions workflows..."
echo ""

# Check actionlint is available
if ! command -v actionlint &> /dev/null; then
    # Try local install (Windows)
    if [ -f "$LOCALAPPDATA/actionlint/actionlint.exe" ]; then
        ACTIONLINT="$LOCALAPPDATA/actionlint/actionlint.exe"
    else
        echo -e "${RED}❌ actionlint not found.${NC}"
        echo ""
        echo "Install it:"
        echo "  macOS:   brew install actionlint"
        echo "  Windows: Invoke-WebRequest -Uri 'https://github.com/rhysd/actionlint/releases/download/v1.7.7/actionlint_1.7.7_windows_amd64.zip' -OutFile actionlint.zip"
        echo "  Linux:   curl -sL https://github.com/rhysd/actionlint/releases/download/v1.7.7/actionlint_1.7.7_linux_amd64.tar.gz | tar xz"
        exit 1
    fi
else
    ACTIONLINT="actionlint"
fi

# Run actionlint
ERRORS=$($ACTIONLINT 2>&1) || true

if [ -z "$ERRORS" ]; then
    echo -e "${GREEN}✅ All workflows are valid!${NC}"
    exit 0
else
    echo -e "${RED}❌ Workflow errors found:${NC}"
    echo ""
    echo "$ERRORS"
    exit 1
fi
