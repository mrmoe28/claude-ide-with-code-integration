#!/bin/bash

echo "Starting Claude Code IDE development server..."

# Start the dev server in background
npm run dev &

# Store the process ID
DEV_PID=$!

# Wait for server to be ready
echo "Waiting for server to start..."
sleep 3

# Open browser
echo "Opening browser..."
open http://localhost:3000

# Keep the script running
echo "Server running at http://localhost:3000"
echo "Press Ctrl+C to stop"

# Wait for the dev server process
wait $DEV_PID