@echo off
title Enviar PapelSys para o GitHub
color 0A
echo ===================================================
echo     ENVIANDO PROJETO PAPELSYS PARA O GITHUB
echo ===================================================
echo.
cd /d "%~dp0"
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ===================================================
    echo   SUCESSO! Projeto enviado para o seu GitHub!
    echo   Acesse: https://github.com/carlosandreest55/papelsys-perdas-papel
    echo ===================================================
) else (
    echo.
    echo Se o repositorio ainda nao foi criado no GitHub, crie em:
    echo https://github.com/new (nome: papelsys-perdas-papel)
    echo E depois execute este arquivo novamente.
)
pause

