@echo off
chcp 65001 >nul
setlocal

REM ============================================================
REM  Sincroniza os repositorios do PROJETO DIGITAL com o GitHub.
REM  Roda no login (atalho na pasta Startup do Windows).
REM  GitHub e a fonte da verdade: fetch + reset --hard (descarta
REM  qualquer mudanca local nao commitada). Nao rode com trabalho
REM  local pendente.
REM  Log: _scripts\sync-github.log
REM ============================================================

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "ROOT=%%~fI"
set "LOG=%SCRIPT_DIR%sync-github.log"

>>"%LOG%" echo ============================================================
>>"%LOG%" echo [%date% %time%] Sync PROJETO DIGITAL

call :sync "evertonbrito.com"
call :sync "Concept\concept-site"
call :sync "segundo-cerebro"

>>"%LOG%" echo [%date% %time%] Fim.
exit /b 0

:sync
set "repo=%~1"
set "repoPath=%ROOT%\%repo%"
if not exist "%repoPath%\.git" goto :skip-norepo
pushd "%repoPath%"

set "branch="
for /f "delims=" %%b in ('git branch --show-current 2^>nul') do set "branch=%%b"
if not defined branch set "branch=main"

set "remote="
for /f "delims=" %%r in ('git remote 2^>nul') do set "remote=%%r"
if not defined remote goto :skip-noremote

>>"%LOG%" echo --- %repo% branch^=%branch% ---
git fetch origin >>"%LOG%" 2>&1
git reset --hard origin/%branch% >>"%LOG%" 2>&1
>>"%LOG%" echo     ok: %repo% sincronizado
popd
exit /b 0

:skip-noremote
>>"%LOG%" echo [skip] %repo% - sem remote configurado
popd
exit /b 0

:skip-norepo
>>"%LOG%" echo [skip] %repo% - nao encontrado / nao e repo git
exit /b 0
