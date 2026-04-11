@echo off
setlocal enabledelayedexpansion

if exist dist (
    rmdir /s /q dist
)

call bun run build:esm
call bun run build:cjs

if exist dist\esm\types (
    rmdir /s /q dist\esm\types
)

if exist dist\cjs\types (
    rmdir /s /q dist\cjs\types
)