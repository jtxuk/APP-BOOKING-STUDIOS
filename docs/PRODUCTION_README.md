# ⚠️ PRODUCCIÓN - LEER PRIMERO

## 🔴 ESTADO ACTUAL: SISTEMA EN PRODUCCIÓN

Este proyecto **NO es un entorno de desarrollo local**. Es un sistema **DESPLEGADO Y EN USO** con datos reales.

## 🌐 URLs de Producción

- **Frontend**: http://reservas.millenia.es
- **Backend API**: http://reservas.millenia.es/api
- **Health check**: http://reservas.millenia.es/api/health

## ⛔ NUNCA HACER

1. **NO ejecutar `backend/seed.sql`** - Destruirá TODOS los datos reales
2. **NO usar `localhost`** en ninguna prueba - estás en el servidor
3. **NO crear usuarios `@example.com`** - no existen, solo usuarios reales `@millenia.es`
4. **NO truncar tablas** - hay reservas y usuarios reales
5. **NO reiniciar PostgreSQL** sin coordinación con el equipo

## ✅ USUARIOS REALES

Los usuarios activos son del dominio `@millenia.es`:
- `josep@millenia.es` (admin)
- `sara@millenia.es`
- `vicente@millenia.es`
- `joan@millenia.es`
- `julen@millenia.es`
- `iñaki@millenia.es`

**NO hay usuarios de prueba ni contraseñas de testing publicadas.**

## 🗂️ BASE DE DATOS

- **Ubicación**: PostgreSQL en el servidor
- **Nombre**: `booking_app`
- **Estado**: Base de datos de producción con usuarios reales y ~reservas activas
- **Backups**: Deben hacerse ANTES de cualquier cambio en schema

## 📝 Cambios en Código

### Para hacer cambios:

1. **Editar archivos** en `/home/millenia/www/app-reservas/backend`
2. **Reiniciar backend**: Matar proceso `npm` y ejecutar `npm start` de nuevo
3. **Validar en dominio**: Probar en `http://reservas.millenia.es/api/...`
4. **NO usar localhost**: Todas las pruebas contra el dominio real

### Backend (Node.js)

```bash
# Ir al directorio
cd /home/millenia/www/app-reservas/backend

# Ver proceso actual
ps aux | grep node

# Reiniciar (matar terminal background ID si es necesario)
npm start  # En background o nueva sesión
```

### Frontend (React Native / Expo Web)

**Estructura**:
- `frontend/` = Código fuente (versionado en Git) ✅
- `_expo/` = Compilado para producción (NO en Git, solo en servidor) ⚠️

**Hacer cambios**:

```bash
# 1. Editar código fuente
vim frontend/screens/AdminScreen.js

# 2. Compilar (si node_modules no existe: npm install)
cd /home/millenia/www/app-reservas/frontend
npx expo export --platform web

# 3. Copiar a producción
rm -rf ../_expo/*
cp -r dist/* ../_expo/

# 4. Verificar en navegador
# http://reservas.millenia.es
```

**IMPORTANTE**: 
- Git versiona `frontend/` (código fuente)
- Git NO versiona `_expo/` (está en .gitignore)
- Apache sirve directamente desde `_expo/`

## 📚 Documentación Histórica

Los archivos en `/docs/` **contienen referencias históricas** a:
- `localhost` (desarrollo local que YA NO aplica)
- Usuarios `@example.com` (no existen)
- `seed.sql` (NUNCA ejecutar en producción)

**Ignorar esas referencias**: Fueron para desarrollo inicial, no producción.

## 🔧 Cambios Recientes (Marzo 2026)

- ✅ Botón "Ver Historial" en AdminScreen (ver reservas pasadas de usuarios)
- ✅ Sistema de invalidación de sesiones (`token_version`)
- ✅ Forzar cambio de contraseña tras reset por admin
- ✅ Validación de `must_change_password` en login
- ✅ Endpoint `POST /api/admin/users/:id/reset-password`
- ✅ Endpoint `GET /api/admin/bookings/history?userId=X`
- ✅ Estructura reorganizada: `frontend/` (fuente) vs `_expo/` (compilado)

## 📞 Contacto

Para cualquier operación crítica:
- Coordinar con el equipo antes de modificar BD
- Hacer backup antes de cambios de schema
- Probar cambios en endpoints nuevos sin afectar existentes

---

**Última actualización**: 4 Marzo 2026  
**Mantenedor**: Equipo Millenia
