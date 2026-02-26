# ITMO DevOps
# Приложение "Заметки"

## Локальный запуск
### Клон проекта
```git clone https://github.com/jojiiikol/devops_labs```
### Установка зависимостей
1. ```ppython -m venv backend/.venv```
2. ```source .venv/bin/activate``` или ```.venv/Scripts/activate```
3. ```pip install -r requirements.txt```
### Настройка виртуальных переменных
1. Создать файл .env в папке backend
2. Установить переменные в файл по примеру из .env.template
### Создание схемы БД
```python -m backend.app.db.db```
Скрипт создаст схему БД и определит пользователя admin:admin
### Запуск
```python -m backend.app.main```
Swagger доступен по адресу http://127.0.0.1:8000/docs#/
