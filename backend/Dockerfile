FROM python:3.9-slim-bookworm
WORKDIR /app
ENV TZ='Europe/Moscow'\
    PYTHONDONTWRITEBYTECODE=1\
    PYTHONUNBUFFERED=1\
    PYTHONPATH=/app


RUN apt-get update

COPY settings.py ./app
COPY app/db ./app
COPY app/entries ./app
COPY app/repository ./app
COPY app/routers ./app
COPY app/services ./app



ENTRYPOINT ["top", "-b"]