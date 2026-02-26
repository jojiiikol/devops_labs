FROM postgres:16-alpine

# Map backend-style DB_* vars to Postgres image vars (POSTGRES_*) at runtime.
COPY docker/postgres/entrypoint.sh /usr/local/bin/devops-entrypoint.sh
RUN chmod +x /usr/local/bin/devops-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/devops-entrypoint.sh"]
CMD ["postgres"]

