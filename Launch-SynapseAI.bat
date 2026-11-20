@echo off
title SynapseAI Enterprise RLHF Platform
color 0b
echo ========================================================
echo         SYNAPSE-AI ENTERPRISE RLHF PLATFORM
echo       Next-Gen Human Evaluation & Anti-Abuse Engine
echo ========================================================
echo.
cd /d "%~dp0"

echo [1/2] Starting Backend Server & SQLite Database (Port 5000)...
start "SynapseAI Backend" cmd /k "cd server && npm start"

echo [2/2] Starting Frontend UI (Port 5174)...
start "SynapseAI Client" cmd /k "cd client && npm run dev"

timeout /t 3 /nobreak > nul
echo.
echo Launching browser at http://localhost:5174 ...
start "" "http://localhost:5174"
echo.
echo Platform is ONLINE! Press any key to exit this launcher window.
pause
