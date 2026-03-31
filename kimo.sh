#!/bin/bash

# Kimo Labs CLI - Unified Service Management
# Usage: ./kimo.sh [command]

COLOR_BLUE='\033[0;34m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_NC='\033[0m' # No Color

function log_info() {
    echo -e "${COLOR_BLUE}[INFO]${COLOR_NC} $1"
}

function log_success() {
    echo -e "${COLOR_GREEN}[SUCCESS]${COLOR_NC} $1"
}

function log_warn() {
    echo -e "${COLOR_YELLOW}[WARN]${COLOR_NC} $1"
}

function log_error() {
    echo -e "${COLOR_RED}[ERROR]${COLOR_NC} $1"
}

case "$1" in
    dev)
        log_info "Starting Kimo Labs in LOCAL DEVELOPMENT mode (No Docker)..."
        
        # Start ChromaDB locally if docker is available
        if docker ps >/dev/null 2>&1; then
            log_info "Starting ChromaDB container for local dev..."
            docker-compose up -d chroma-server
        fi

        # Start Backend
        log_info "Launching FastAPI Backend..."
        export PYTHONPATH=$PYTHONPATH:$(pwd)/apps
        export CHROMA_HOST=localhost
        export CHROMA_PORT=8002
        source .venv/bin/activate
        # Run backend on 8001 to match frontend expectations
        python -m uvicorn apps.backend.app.main:app --host 0.0.0.0 --port 8001 --reload &
        BACKEND_PID=$!

        # Start Frontend
        log_info "Launching Next.js Frontend..."
        cd apps/frontend
        npm run dev &
        FRONTEND_PID=$!
        cd - > /dev/null

        log_success "Kimo Labs is running (Local)!"
        log_info "Frontend: http://localhost:3000"
        log_info "Backend: http://localhost:8001"
        
        # Handle termination
        trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM
        wait
        ;;

    up)
        log_info "Starting Kimo Labs in STABLE DOCKER mode..."
        docker-compose -f docker-compose.yml up -d --build
        log_success "Kimo Labs is running in background!"
        log_info "Frontend: http://localhost:3000"
        log_info "Backend: http://localhost:8001"
        ;;

    up-dev)
        log_info "Starting Kimo Labs in DOCKER HOT-RELOAD mode..."
        docker-compose -f docker-compose.dev.yml up --build
        ;;

    stop)
        log_info "Stopping all Kimo Labs containers..."
        docker-compose -f docker-compose.yml down
        docker-compose -f docker-compose.dev.yml down
        log_success "Stopped."
        ;;

    logs)
        log_info "Tailing Kimo Labs logs..."
        docker-compose -f docker-compose.yml logs -f
        ;;

    help|*)
        echo "Kimo Labs Unified CLI"
        echo ""
        echo "Usage: ./kimo.sh [command]"
        echo ""
        echo "Commands:"
        echo "  dev       - Run backend and frontend locally (hot-reload, native)"
        echo "  up        - Run all services in Docker (stable, background)"
        echo "  up-dev    - Run all services in Docker (hot-reload, foreground)"
        echo "  stop      - Stop all Docker services"
        echo "  logs      - Tail Docker logs"
        echo "  help      - Show this help message"
        ;;
esac
