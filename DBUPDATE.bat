@echo off
setlocal

REM Set PostgreSQL bin directory path
set PGBIN=C:\Program Files\PostgreSQL\17\bin
set PATH=%PGBIN%;%PATH%

REM Database connection settings
set PGHOST=localhost
set PGPORT=5432
set PGDATABASE=dental
set PGUSER=postgres
set PGPASSWORD=adrian143

echo Running database updates...

REM Run the SQL script
"%PGBIN%\psql.exe" -f updatedb.sql

if %ERRORLEVEL% NEQ 0 (
    echo Error running SQL script
    pause
    exit /b 1
)

echo Database update completed successfully
pause