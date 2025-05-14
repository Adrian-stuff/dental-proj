@echo off

set repo_url=https://github.com/Adrian-stuff/dental-proj.git
set project_dir=dental-proj
set build_command=bun run build

echo Checking for the '%project_dir%' directory...
if not exist "%project_dir%" (
    echo Moving batch file up one directory...
    move "%~f0" ".."
    cd ..
    echo Cloning the repository...
    git clone "%repo_url%"
    if errorlevel 1 goto error_clone
    cd "%project_dir%"
) else (
    echo '%project_dir%' directory exists. Updating the repository...
    cd "%project_dir%"
    git pull origin main
    if errorlevel 1 goto error_pull
)

echo Attempting to build the project...
bun install
%build_command%
if errorlevel 1 goto error_build

echo Done. Project updated and build attempted.
goto end

:error_clone
echo Error during Git clone. Please check your network connection.
goto end

:error_pull
echo Error during Git pull. Please check your Git repository.
goto end

:error_build
echo Error during the build process. Please check the build command and your project setup.
goto end

:end
pause