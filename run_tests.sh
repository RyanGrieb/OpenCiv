#!/bin/bash

# Cleanup function to kill processes on specific ports
cleanup() {
    echo "Cleaning up existing processes..."
    # Kill process on port 2000 (Server) and 1234 (Client)
    fuser -k 2000/tcp > /dev/null 2>&1
    fuser -k 1234/tcp > /dev/null 2>&1
    # Check for any lingering node processes related to the project (optional but safer)
    # pkill -f "run_tests.sh" || true # Be careful not to kill self if name matches
}

# Run cleanup before starting
cleanup

# Give ports a moment to free up
sleep 1

# Kill background jobs on exit
trap 'kill $(jobs -p)' EXIT

echo "Starting Server in Test Mode..."
cd server
npm run start:test &
SERVER_PID=$!
cd ..

echo "Starting Client..."
cd client
npm run dev &
CLIENT_PID=$!
cd ..

# Wait for server and client to initialize (rough heuristic, or wait for port)
echo "Waiting for services to start..."
sleep 10

echo "Server and Client running."
echo "Please open your browser to: http://localhost:1234?test=true"

# Keep script running to keep processes alive
wait
