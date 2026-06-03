# Docker

**Taskfile** = dev local only. **VPS** = Dokploy + image Docker Hub (không chạy `task` trên server).

## Dev

```bash
cp docker/.env.example docker/.env
task dev            # Next.js dev :3333 trên host
```

| Service | URL |
|---------|-----|
| Dashboard (dev) | http://localhost:3333 |

Build + preview static local:

```bash
task build
task preview
```

Preview image Docker (profile `app`):

```bash
docker compose -f docker/docker-compose.dev.yml --env-file docker/.env --profile app up -d
```

**Tên Docker (prefix `fpt-`):** project `fpt-fe-dev` / `fpt-fe-prod`, container `fpt-dashboard-dev` / `fpt-dashboard-prod`, network `fpt-net-fe-*`. Image: `fpt-admission-dashboard`.

## Prod (Dokploy)

1. GitHub push `main` → image `{DOCKER_USERNAME}/fpt-admission-dashboard:latest`
2. Dokploy: compose file **`docker/docker-compose.prod.yml`**
3. Env trên Dokploy UI (không commit `docker/.env`):

```env
DOCKER_USERNAME=...
APP_TAG=latest
PORT=3333
```

`NEXT_PUBLIC_API_BASE_URL` cấu hình trong **workflow env** (`.github/workflows/deploy.yml`), bake lúc build image.

Registry credentials Dokploy: `DOCKER_USERNAME` + `DOCKER_PASSWORD`.

## Files

| File | Mục đích |
|------|----------|
| `Dockerfile` | Build static export + `serve` |
| `docker-compose.dev.yml` | Preview image (profile app) |
| `docker-compose.prod.yml` | Dashboard prod |
| `.env.example` | Mẫu biến (dev copy → `.env`) |
