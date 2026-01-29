#!/bin/bash

# Pre-PR validation hook
# Runs tests, build, and app verification before allowing PR creation

# Read the command from stdin (JSON input from Claude)
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -o '"command":"[^"]*"' | sed 's/"command":"//;s/"$//')

# Only run checks for PR creation
if [[ "$COMMAND" != *"gh pr create"* ]]; then
    exit 0
fi

echo "🔍 Pre-PR checks starting..."

# Change to project directory
cd "$CLAUDE_PROJECT_DIR" || exit 1

# 1. Run tests
echo ""
echo "📋 Running tests..."
if ! npm test 2>&1; then
    echo ""
    echo "❌ Tests failed! Fix failing tests before creating PR."
    exit 2
fi
echo "✅ Tests passed"

# 2. Run build
echo ""
echo "🔨 Running build..."
if ! npm run build 2>&1; then
    echo ""
    echo "❌ Build failed! Fix build errors before creating PR."
    exit 2
fi
echo "✅ Build succeeded"

# 3. Start app and verify it loads
echo ""
echo "🌐 Verifying app loads..."

# Start the app in background
npm run start &
APP_PID=$!

# Wait for app to start
sleep 5

# Try to curl the app
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo "✅ App loads successfully"
    kill $APP_PID 2>/dev/null
    wait $APP_PID 2>/dev/null
else
    echo "❌ App failed to respond! Verify the app runs correctly before creating PR."
    kill $APP_PID 2>/dev/null
    wait $APP_PID 2>/dev/null
    exit 2
fi

echo ""
echo "✅ All pre-PR checks passed!"
exit 0
