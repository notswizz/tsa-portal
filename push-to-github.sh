#!/bin/bash

# Script to commit changes and push to GitHub
# Usage: ./push-to-github.sh "Your commit message here"

# Check if a commit message was provided
if [ -z "$1" ]; then
    echo "Error: Please provide a commit message"
    echo "Usage: ./push-to-github.sh \"Your commit message here\""
    exit 1
fi

# Store the commit message
COMMIT_MESSAGE="$1"

# Add all changes to staging
echo "Adding all changes to git staging..."
git add .

# Commit changes with the provided message
echo "Committing changes with message: $COMMIT_MESSAGE"
git commit -m "$COMMIT_MESSAGE"

# Get remote name (first remote in the list)
REMOTE_NAME=$(git remote | head -n 1)
if [ -z "$REMOTE_NAME" ]; then
    echo "❌ No git remote configured. Please set up a remote repository first."
    echo "Use: git remote add <name> <url>"
    exit 1
fi

# Push to the current branch
CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
echo "Pushing to branch: $CURRENT_BRANCH using remote: $REMOTE_NAME"
git push $REMOTE_NAME $CURRENT_BRANCH

# Check if push was successful
if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed changes to GitHub"
else
    echo "❌ Failed to push changes to GitHub"
    exit 1
fi

exit 0 