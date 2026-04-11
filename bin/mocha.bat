@echo off
setlocal enabledelayedexpansion

call .\bin\compile.bat
set ZING_MP3_LIVE=1
bun run --bun mocha