@echo off
cd /d "%~dp0"
python serve.py
if errorlevel 1 python3 serve.py
pause
