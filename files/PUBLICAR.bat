@echo off
title SIGNES.STUDIO - Publicador de Archivos
chcp 65001 > nul
cd /d "%~dp0.."

echo =================================================================
echo   SIGNES.STUDIO — Publicador de Archivos y Transferencias
echo =================================================================
echo.
node publish-files.js

echo.
pause

