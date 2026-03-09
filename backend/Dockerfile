FROM python:3.9-slim-bookworm
WORKDIR /app
ENV TZ='Europe/Moscow'\
    PYTHONDONTWRITEBYTECODE=1\
    PYTHONUNBUFFERED=1\
    PYTHONPATH=/app


RUN apt-get update

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY .env .
COPY ./*.py .


COPY ./app/*.py ./app/
COPY ./app/entries ./app/entries
COPY ./app/db ./app/db
COPY ./app/repository ./app/repository
COPY ./app/routers ./app/routers
COPY ./app/services ./app/services

CMD ["python", "-m", "app.main"]