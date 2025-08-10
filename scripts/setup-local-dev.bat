@echo off
echo Setting up local development environment without Docker...
echo.

echo Installing dependencies...
npm install

echo.
echo Creating local environment file...
if not exist .env (
    copy .env.example .env
    echo .env file created. Please edit it with your local database settings.
) else (
    echo .env file already exists.
)

echo.
echo =================================================================
echo LOCAL DEVELOPMENT SETUP (without Docker)
echo =================================================================
echo.
echo 1. Install MySQL 8.0 locally:
echo    - Download from: https://dev.mysql.com/downloads/mysql/
echo    - Create database: starwars_pokemon_db
echo    - User: root / password: (your choice)
echo.
echo 2. Install Redis locally:
echo    - Windows: https://github.com/microsoftarchive/redis/releases
echo    - Or use Redis Cloud: https://redis.com/try-free/
echo.
echo 3. Update your .env file with:
echo    DB_HOST=localhost
echo    DB_NAME=starwars_pokemon_db
echo    DB_USER=root
echo    DB_PASSWORD=your_password
echo    REDIS_HOST=localhost
echo    REDIS_PORT=6379
echo.
echo 4. Run migrations and seeds:
echo    npm run migration:run
echo    npm run seed:run
echo.
echo 5. Start development server:
echo    npm run dev
echo.
echo =================================================================
pause