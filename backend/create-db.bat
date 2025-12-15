@echo off
echo Creating HRMS Database...
echo.
echo Please enter your MySQL root password when prompted.
echo.

REM Try to find MySQL in common locations
set MYSQL_PATH=
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
)
if exist "C:\Program Files\MySQL\MySQL Server 8.1\bin\mysql.exe" (
    set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.1\bin\mysql.exe
)
if exist "C:\xampp\mysql\bin\mysql.exe" (
    set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
)

if "%MYSQL_PATH%"=="" (
    echo MySQL not found in common locations.
    echo Please run this SQL manually in MySQL Workbench or command line:
    echo.
    echo CREATE DATABASE IF NOT EXISTS hrms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    echo.
    pause
    exit /b 1
)

"%MYSQL_PATH%" -u root -p -e "CREATE DATABASE IF NOT EXISTS hrms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Database 'hrms' created successfully!
    echo You can now start the Spring Boot application.
) else (
    echo.
    echo Failed to create database. Please check your MySQL credentials.
    echo You can also create it manually using MySQL Workbench.
)

pause

