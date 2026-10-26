FROM node:22-bookworm-slim AS runtime
WORKDIR /build
COPY package.json package-lock.json ./
COPY kernel/package.json kernel/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/brainlab/package.json apps/brainlab/package.json
RUN npm ci
COPY kernel kernel
COPY scripts scripts
COPY content content
RUN npm run build:runtime

FROM python:3.12-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends libstdc++6 libatomic1 && rm -rf /var/lib/apt/lists/*
COPY --from=runtime /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
COPY backend/requirements.lock ./requirements.lock
RUN pip install --no-cache-dir -r requirements.lock && useradd --create-home appuser
COPY backend/app ./app
COPY backend/migrations ./migrations
COPY backend/alembic.ini ./alembic.ini
COPY --from=runtime /build/backend/runtime ./runtime
USER appuser
ENV APP_ENV=production
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/ready', timeout=3)"
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--no-proxy-headers"]
