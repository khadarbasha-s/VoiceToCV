#!/bin/bash

set -euo pipefail

# Resolve repository root (directory containing this script)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend"
BACKEND_VENV_DIR="$BACKEND_DIR/venv"

info() {
  echo "[run_app] $1"
}

# Activate Python virtual environment
if [ -d "$BACKEND_VENV_DIR/Scripts" ]; then
  # Windows-style virtual environment
  source "$BACKEND_VENV_DIR/Scripts/activate"
elif [ -d "$BACKEND_VENV_DIR/bin" ]; then
  # POSIX-style virtual environment
  source "$BACKEND_VENV_DIR/bin/activate"
else
  info "Python virtual environment not found in $BACKEND_VENV_DIR"
  info "Create it with: python -m venv backend/venv"
  exit 1
fi

# Install backend dependencies
info "Installing backend dependencies"
pip install -r "$BACKEND_DIR/requirements.txt"

# Run pending migrations and start Django server
cd "$BACKEND_DIR"
info "Applying Django migrations"
python manage.py migrate
info "Starting Django backend on http://127.0.0.1:8000"
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

# Switch back to repo root to avoid confusing relative paths
cd "$REPO_ROOT"

# Install frontend dependencies (if missing) and start React app
cd "$FRONTEND_DIR"
if [ ! -d node_modules ]; then
  info "Installing frontend dependencies"
  npm install
fi
info "Starting React frontend on http://localhost:3000"
npm start &
FRONTEND_PID=$!

# Return to repo root and wait for either process to exit
cd "$REPO_ROOT"
info "Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID"
info "Press Ctrl+C to stop both services"

cleanup() {
  info "Stopping services..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
}

trap cleanup INT TERM

wait $BACKEND_PID
wait $FRONTEND_PID
