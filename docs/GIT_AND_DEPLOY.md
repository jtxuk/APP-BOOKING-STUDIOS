# 🔧 Comandos Git y Deploy

## Inicializar Repositorio

```bash
cd booking-app
git init
git add .
git commit -m "Initial commit: Full booking app implementation"
git branch -M main
git remote add origin https://github.com/jtxuk/APP-BOOKING-STUDIOS.git
git push -u origin main
```

---

## Estructura .gitignore (ya incluida)

```
# Backend
backend/node_modules/
backend/.env
backend/.env.local
backend/*.log
backend/npm-debug.*

# Frontend
frontend/node_modules/
frontend/.env
frontend/.env.local
frontend/.expo/
frontend/.expo-shared/
frontend/dist/
frontend/*.log
frontend/npm-debug.*

# Sistema
.DS_Store
.idea/
.vscode/
*.swp
*.swo
```

---

## Configuración de Git

```bash
# Configurar usuario global (primera vez)
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"

# O local para este proyecto
git config user.name "Tu Nombre"
git config user.email "tu@email.com"
```

---

## Workflow Típico

```bash
# 1. Crear una rama para nuevas features
git checkout -b feature/nueva-caracteristica

# 2. Hacer cambios y commits
git add .
git commit -m "Agregar nueva característica"

# 3. Pushear la rama
git push origin feature/nueva-caracteristica

# 4. Crear Pull Request (en GitHub)

# 5. Mergear a main
git checkout main
git merge feature/nueva-caracteristica
git push origin main
```

---

## Deploy del Backend

### Opción 0: Dinahosting — reservas.millenia.es (estado actual 2026-04-22)

**Arquitectura activa**:
- Apache sirve el frontend estático (`index.html`, `_expo/`).
- `/api/*` → proxy PHP (`api/index.php`) → Node en `127.0.0.1:15025`.
- Node gestionado por PM2 local + cron `@reboot`.
- HTTPS activo. HTTP redirige 301 a HTTPS.
- Proxy Nginx del panel: **desactivado** (no necesario con esta arquitectura).

```bash
# Subir backend
rsync -qr --delete backend/ reservasmillenia@reservas.millenia.es:/home/reservasmillenia/www/backend/

# Instalar dependencias y reiniciar
ssh reservasmillenia@reservas.millenia.es "cd /home/reservasmillenia/www/backend && npm install --production && npx pm2 restart reservas-app"
```

**Nota**: El API público se expone vía `/api` usando el proxy PHP en `/home/reservasmillenia/www/api/index.php`. El puerto interno es 15025 (definido en `backend/.env`).

**Importante**: si haces `rsync --delete` del frontend a `/home/reservasmillenia/www/`, vuelve a subir también `/backend` y `/api`.

### Opción 1: Heroku (Gratis/Pagado)

```bash
# Instalar Heroku CLI
npm install -g heroku

# Login a Heroku
heroku login

# Crear app
heroku create booking-app-backend

# Agregar PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Ver credenciales BD
heroku config

# Deploy
git push heroku main

# Ver logs
heroku logs --tail
```

### Opción 2: DigitalOcean/AWS

```bash
# Crear droplet/EC2 con Node.js
# Copiar código a servidor
# npm install
# npm start (con PM2)

# Instalar PM2
npm install -g pm2

# Ejecutar en background
pm2 start server.js --name "booking-app"
pm2 save
pm2 startup
```

---

## Deploy del Frontend

### Opción 1: Expo Cloud (Recomendado)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login con cuenta Expo
eas login

# Build para iOS
eas build --platform ios

# Build para Android
eas build --platform android

# Submitir a App Store
eas submit --platform ios

# Submitir a Play Store
eas submit --platform android
```

### Opción 2: Build Local + TestFlight/Huawei

```bash
# iOS
expo run:ios --release

# Android
expo run:android --release
```

---

## Variables de Entorno en Producción

### Backend (Heroku)

```bash
heroku config:set PORT=5000
heroku config:set DB_HOST=your-postgres-host
heroku config:set DB_PORT=5432
heroku config:set DB_NAME=booking_app
heroku config:set DB_USER=postgres
heroku config:set DB_PASSWORD=your_secure_password
heroku config:set JWT_SECRET=your_long_secure_jwt_secret
heroku config:set NODE_ENV=production
```

### Frontend (Expo)

```bash
# En app.json o .env para producción
API_URL=https://booking-app-backend.herokuapp.com/api
```

---

## Actualizaciones y Hotfixes

### Versioning

```bash
# Actualizar version en package.json
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
npm version major   # 1.0.0 → 2.0.0

# Crear tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin --tags
```

### Hotfix

```bash
# Crear rama de hotfix
git checkout -b hotfix/bug-crítico

# Hacer fix
# ...

# Mergear a main y develop
git checkout main
git merge hotfix/bug-crítico
git checkout develop
git merge hotfix/bug-crítico

# Eliminar rama
git branch -d hotfix/bug-crítico
```

---

## Monitoreo en Producción

### Backend

```bash
# Ver logs en Heroku
heroku logs --tail

# Conectar a BD
PGPASSWORD=password psql -h host -U user -d db_name

# PM2 (si usas)
pm2 logs
pm2 monit
```

### Frontend

```bash
# Expo Analytics
# Ver en: https://expo.dev/projects/your-project

# Crashlytics (opcional)
npm install @react-native-firebase/crashlytics
```

---

## Backup de BD

```bash
# Crear backup
pg_dump -U postgres -h localhost booking_app > backup.sql

# Restaurar desde backup
psql -U postgres -d booking_app < backup.sql

# Backup automático (cron)
0 2 * * * pg_dump -U postgres booking_app > /backups/booking_app_$(date +\%Y\%m\%d).sql
```

---

## Integración Continua (GitHub Actions)

Crea `.github/workflows/main.yml`:

```yaml
name: CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2
      - uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: "booking-app-backend"
          heroku_email: ${{ secrets.HEROKU_EMAIL }}
```

---

## Seguridad en Producción

```bash
# 1. Cambiar JWT_SECRET
heroku config:set JWT_SECRET=$(openssl rand -hex 32)

# 2. Usar HTTPS
# Heroku lo hace automático

# 3. CORS configurado
# Solo permitir tu dominio frontend

# 4. Rate limiting
npm install express-rate-limit

# 5. Helmet para headers de seguridad
npm install helmet
app.use(helmet());

# 6. Validación de input
npm install joi
```

---

## Checklist Pre-Deploy

- [ ] Actualizar version en package.json
- [ ] Probar en staging
- [ ] Variables de entorno configuradas
- [ ] BD migrada/backupada
- [ ] Tests pasados
- [ ] No hay secrets en código
- [ ] CORS configurado
- [ ] HTTPS habilitado
- [ ] Monitoreo activo
- [ ] Plan de rollback

---

## Rollback (Si algo sale mal)

```bash
# Heroku
heroku releases
heroku rollback v123

# Git
git revert <commit-hash>
git push origin main

# Manual
git reset --hard <previous-commit>
git push origin main --force
```

---

**¡Listo para producción! 🚀**
