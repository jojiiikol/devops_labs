FROM python:3.9-alpine3.19 as base
WORKDIR /app
ENV TZ='Europe/Moscow'\
    PYTHONDONTWRITEBYTECODE=1\
    PYTHONUNBUFFERED=1\
    PYTHONPATH=/app

FROM base as builder
RUN apk update

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt && \
    find /usr/local/lib/python3.9/site-packages -name "*.pyc" -delete && \
    find /usr/local/lib/python3.9/site-packages -type d -name "__pycache__" -delete

FROM builder as project
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

COPY .env .
COPY ./*.py .


COPY ./app/*.py ./app/
COPY ./app/entries ./app/entries
COPY ./app/db ./app/db
COPY ./app/repository ./app/repository
COPY ./app/routers ./app/routers
COPY ./app/services ./app/services

CMD ["python", "-m", "app.main"]