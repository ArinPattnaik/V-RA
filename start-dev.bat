@echo off
echo ===================================================
echo   Starting VÉRA Local Development Environment...
echo ===================================================
echo.

echo [1/3] Starting ML Service (Python backend)...
start "VÉRA ML Service" cmd /k "cd ml-service && echo Installing ML requirements... && pip install -r requirements.txt && echo Starting FastAPI server... && uvicorn main:app --reload --port 8000"

echo [2/3] Starting Node.js Backend API...
start "VÉRA Backend" cmd /k "cd backend && echo Installing Backend dependencies... && npm install && echo Starting Node server... && npm run dev"

echo [3/3] Starting Next.js Frontend...
start "VÉRA Frontend" cmd /k "cd frontend && echo Installing Frontend dependencies... && npm install && echo Starting Next.js dev server... && npm run dev"

echo.
echo All services are starting up in separate command windows!
echo Frontend will be at: http://localhost:3000
echo Backend API will be at: http://localhost:3001
echo ML Service will be at: http://localhost:8000
echo.
pause
