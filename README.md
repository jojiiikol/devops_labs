# ITMO DevOps
# Приложение "Заметки"

## Локальный запуск
### Клон проекта
```bash
git clone https://github.com/jojiiikol/devops_labs
cd devops_labs
```

### Postgres в Docker
В репозитории есть `docker-compose.postgres.yml`, который поднимает Postgres и берёт переменные из `backend/.env`.

1. Создать `backend/.env` по шаблону:

```bash
cp backend/.env.template backend/.env
```

2. Указать значения (минимально):
- **DB_HOST**: `localhost`
- **DB_PORT**: `5432`
- **DB_NAME**: например `notes`
- **DB_USER**: например `postgres`
- **DB_PASSWORD**: например `postgres`

3. Запустить контейнер:

```bash
docker compose -f docker-compose.postgres.yml up -d --build
```

Остановить:

```bash
docker compose -f docker-compose.postgres.yml down
```

### Установка зависимостей
```bash
python -m venv backend/.venv
source backend/.venv/bin/activate  # или backend/.venv/Scripts/activate
pip install -r requirements.txt
```

### Настройка виртуальных переменных
1. Создать файл `backend/.env`
2. Установить переменные в файл по примеру из `backend/.env.template`

### Создание схемы БД
```bash
python -m backend.app.db.db
```
Скрипт создаст схему БД и определит пользователя admin:admin

### Запуск
```bash
python -m backend.app.main
```
Swagger доступен по адресу `http://127.0.0.1:8000/docs#/`

### Frontend (Vite)
По умолчанию фронтенд ходит в API на `http://localhost:8000`. При необходимости можно переопределить через `VITE_API_BASE_URL`.

```bash
cd Frontend
npm install
npm run dev
```

Открыть в браузере: `http://localhost:5173`
