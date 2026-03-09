FROM python:3.9-slim-bookworm
WORKDIR /app
ENV TZ='Europe/Moscow'\
    PYTHONDONTWRITEBYTECODE=1\
    PYTHONUNBUFFERED=1


RUN apt-get update

COPY . .

COPY requirements.txt .

RUN pip install -r requirements.txt


CMD ["python", "-m", "app.main"]