@echo off
cd /d "%~dp0.."
set NODE="C:\Program Files\nodejs\node.exe"
%NODE% "_scripts\loop-agentes.mjs" >> "_scripts\loop-agentes.log" 2>&1
