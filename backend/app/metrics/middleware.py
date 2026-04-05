import time
from typing import Callable
from fastapi import Request, Response
from .metrics import REQUESTS, REQUEST_DURATION, ACTIVE_REQUESTS, ERRORS


class PrometheusMiddleware:

    async def __call__(self, request: Request, call_next: Callable) -> Response:
        method = request.method
        endpoint = request.url.path

        # Увеличиваем счетчик активных запросов
        ACTIVE_REQUESTS.inc()

        # Замеряем время выполнения
        start_time = time.time()

        try:
            response = await call_next(request)

            # Обновляем метрики после выполнения запроса
            status_code = response.status_code
            REQUESTS.labels(method=method, endpoint=endpoint, status=status_code).inc()
            REQUEST_DURATION.labels(method=method, endpoint=endpoint).observe(
                time.time() - start_time
            )

            # Логируем ошибки
            if status_code >= 400:
                ERRORS.labels(
                    method=method,
                    endpoint=endpoint,
                    error_type=f"http_{status_code}"
                ).inc()

            return response

        except Exception as e:
            # Обработка исключений
            status_code = 500
            REQUESTS.labels(method=method, endpoint=endpoint, status=status_code).inc()
            REQUEST_DURATION.labels(method=method, endpoint=endpoint).observe(
                time.time() - start_time
            )
            ERRORS.labels(
                method=method,
                endpoint=endpoint,
                error_type=type(e).__name__
            ).inc()
            raise

        finally:
            ACTIVE_REQUESTS.dec()


def setup_metrics_middleware(app):
    app.middleware("http")(PrometheusMiddleware())
    return app