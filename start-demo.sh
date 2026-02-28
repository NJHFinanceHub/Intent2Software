#!/bin/bash
# start-demo.sh - Start all Intent2Software demo services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Starting Intent2Software Demo ==="

# 1. Start PostgreSQL if not running
if ! pg_isready -q 2>/dev/null; then
  echo "[1/4] Starting PostgreSQL..."
  pg_ctlcluster 16 main start 2>/dev/null || true
  sleep 2
else
  echo "[1/4] PostgreSQL already running"
fi

# 2. Start Redis if not running
if ! redis-cli ping -q 2>/dev/null | grep -q PONG; then
  echo "[2/4] Starting Redis..."
  redis-server --daemonize yes 2>/dev/null
  sleep 1
else
  echo "[2/4] Redis already running"
fi

# 3. Start Backend if not running
if ! curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
  echo "[3/4] Starting Backend on port 3000..."
  cd "$SCRIPT_DIR/backend"
  nohup npx tsx watch src/index.ts > /tmp/backend.log 2>&1 &
  disown
  cd "$SCRIPT_DIR"

  # Wait for backend to be ready
  for i in $(seq 1 15); do
    if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
else
  echo "[3/4] Backend already running"
fi

# 4. Start Frontend if not running
if ! curl -s http://localhost:5173/ >/dev/null 2>&1; then
  echo "[4/4] Starting Frontend on port 5173..."
  cd "$SCRIPT_DIR/frontend"
  nohup npx vite > /tmp/frontend.log 2>&1 &
  disown
  cd "$SCRIPT_DIR"

  # Wait for frontend to be ready
  for i in $(seq 1 15); do
    if curl -s http://localhost:5173/ >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
else
  echo "[4/4] Frontend already running"
fi

echo ""
echo "=== Health Check ==="

# Verify all services
BACKEND_STATUS=$(curl -s http://localhost:3000/api/health 2>/dev/null || echo "FAILED")
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ 2>/dev/null || echo "FAILED")
PG_STATUS=$(pg_isready -q 2>/dev/null && echo "OK" || echo "FAILED")
REDIS_STATUS=$(redis-cli ping 2>/dev/null || echo "FAILED")

echo "  PostgreSQL:  $PG_STATUS"
echo "  Redis:       $REDIS_STATUS"
echo "  Backend:     $BACKEND_STATUS"
echo "  Frontend:    HTTP $FRONTEND_STATUS"
echo ""
echo "  Frontend URL:  http://localhost:5173"
echo "  Backend API:   http://localhost:3000/api/health"
echo ""
echo "  Logs: tail -f /tmp/backend.log /tmp/frontend.log"
