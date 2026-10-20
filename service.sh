#!/usr/bin/env bash
# Runs the NexChat backend and frontend in the background.
# Usage: ./service.sh {start|stop|restart|status|logs [backend|frontend]}

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT/logs"
BACKEND_PORT=3000
FRONTEND_PORT=5173

mkdir -p "$LOG_DIR"

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti tcp:"$port" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "Port $port in use (PID: $(echo $pids | tr '\n' ' ')) - killing..."
    kill $pids 2>/dev/null
    sleep 1
    pids=$(lsof -ti tcp:"$port" 2>/dev/null)
    [ -n "$pids" ] && kill -9 $pids 2>/dev/null
  fi
}

kill_pidfile() {
  local file="$LOG_DIR/$1.pid"
  if [ -f "$file" ]; then
    # Kill the whole process group (npm + node children)
    kill -- -"$(cat "$file")" 2>/dev/null
    rm -f "$file"
  fi
}

start() {
  stop >/dev/null

  echo "Starting backend on port $BACKEND_PORT..."
  cd "$ROOT/backend" || exit 1
  setsid nohup npm run dev >"$LOG_DIR/backend.log" 2>&1 < /dev/null &
  echo $! >"$LOG_DIR/backend.pid"

  echo "Starting frontend on port $FRONTEND_PORT..."
  cd "$ROOT/frontend" || exit 1
  setsid nohup npm run dev -- --port "$FRONTEND_PORT" --strictPort >"$LOG_DIR/frontend.log" 2>&1 < /dev/null &
  echo $! >"$LOG_DIR/frontend.pid"

  sleep 3
  status
  echo ""
  echo "Logs: $LOG_DIR/backend.log, $LOG_DIR/frontend.log"
  echo "Follow logs: ./service.sh logs"
}

stop() {
  echo "Stopping services..."
  kill_pidfile backend
  kill_pidfile frontend
  kill_port "$BACKEND_PORT"
  kill_port "$FRONTEND_PORT"
  echo "Stopped."
}

status() {
  for svc in "backend:$BACKEND_PORT" "frontend:$FRONTEND_PORT"; do
    name=${svc%%:*}
    port=${svc##*:}
    if lsof -ti tcp:"$port" >/dev/null 2>&1; then
      echo "  $name: running (port $port)"
    else
      echo "  $name: NOT running (check $LOG_DIR/$name.log)"
    fi
  done
}

logs() {
  case "$1" in
    backend)  tail -f "$LOG_DIR/backend.log" ;;
    frontend) tail -f "$LOG_DIR/frontend.log" ;;
    *)        tail -f "$LOG_DIR/backend.log" "$LOG_DIR/frontend.log" ;;
  esac
}

case "$1" in
  start)   start ;;
  stop)    stop ;;
  restart) start ;;
  status)  status ;;
  logs)    logs "$2" ;;
  *) echo "Usage: $0 {start|stop|restart|status|logs [backend|frontend]}"; exit 1 ;;
esac
