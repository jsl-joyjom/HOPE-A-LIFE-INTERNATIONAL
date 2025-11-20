#!/bin/bash
# Auto-push script for GitHub
# This script commits and pushes all changes automatically

echo "🔄 Checking for changes..."

# Check if there are any changes
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ No changes to commit"
    exit 0
fi

# Add all changes
echo "📦 Adding all changes..."
git add .

# Commit with timestamp
COMMIT_MSG="Auto-commit: $(date '+%Y-%m-%d %H:%M:%S') - $(git status --short | head -1 | cut -c4-)"
echo "💾 Committing: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
else
    echo "❌ Error pushing to GitHub"
    exit 1
fi

