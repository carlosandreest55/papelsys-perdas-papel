@echo off
title PapelSys - Sistema de Apontamento de Perdas & IA Copilot
color 0B
echo ===================================================================
echo   FABRICA DE PAPEL - SISTEMA DE APONTAMENTO DE PERDAS ^& IA COPILOT
echo ===================================================================
echo.
echo Iniciando o servidor PapelSys...
cd /d "%~dp0"
start http://localhost:3000
node server.js
pause

