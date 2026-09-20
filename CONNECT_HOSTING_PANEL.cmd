@echo off
start "" powershell.exe -NoProfile -STA -WindowStyle Hidden -ExecutionPolicy RemoteSigned -File "%~dp0scripts\connect-hosting-panel.ps1"
