# Reservas Millenia - Sistema de Gestión de Estudios

## 🔴 ⚠️ **SISTEMA EN PRODUCCIÓN ACTIVA** ⚠️

**LA APLICACIÓN ESTÁ DESPLEGADA EN https://reservas.millenia.es CON USUARIOS REALES USANDO AHORA**

### 📖 SI ERES NUEVO O TIENES DUDAS - LEE ESTO PRIMERO:

👉 **[PRODUCCION_VS_DESARROLLO.md](./docs/PRODUCCION_VS_DESARROLLO.md)** - Explica diferencia entre desarrollo local y producción

El siguiente es obligatorio ANTES de hacer cambios:

👉 **[PRODUCTION_README.md](./PRODUCTION_README.md)** - Protocolo de seguridad en producción

## ⚡ Info Rápida

- **Frontend en Producción**: https://reservas.millenia.es (NO localhost ni QR)
- **Backend API**: https://reservas.millenia.es/api  
- **Usuarios**: REALES en base de datos de producción
- **Base de datos**: PostgreSQL con datos de producción

## 🚨 ACLARACIÓN CRÍTICA

> **Desarrollo local ≠ Desarrollo en servidor**
>
> Aunque sea "desarrollo" (editar código), si lo haces en `/home/millenia/www/app-reservas` es **PRODUCCIÓN**:
> - Usuarios REALES están usando la app AHORA
> - Cambios aparecen INMEDIATAMENTE sin testing
> - Un error rompe la app para TODOS
> 
> **Solo edita en el servidor en caso de EMERGENCIA.**

## ⛔ PROHIBIDO en Servidor Producción

- ❌ Ejecutar `npm start` (Expo) - la web se cae
- ❌ Ejecutar `seed.sql` - destruye datos reales
- ❌ Tocar `.env` - contiene secretos
- ❌ Usar `localhost` - no funciona en servidor remoto
- ❌ Truncar tablas o crear bases de datos
- ❌ Cambiar archivos compilados en `_expo/`
- ❌ Hacer cambios sin Git + backup

## 📚 Documentación

1. **[docs/PRODUCCION_VS_DESARROLLO.md](./docs/PRODUCCION_VS_DESARROLLO.md)** - 🔴 **LEER SI TIENES DUDAS**
2. **[PRODUCTION_README.md](./PRODUCTION_README.md)** - Protocolo de producción
3. [docs/README.md](./docs/README.md) - Funcionalidades del sistema
4. [docs/CHANGELOG.md](./docs/CHANGELOG.md) - Historial de cambios
5. [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Arquitectura técnica
6. [docs/DEVELOPMENT_WORKFLOW.md](./docs/DEVELOPMENT_WORKFLOW.md) - Workflow seguro
7. [backend/README.md](./backend/README.md) - API Backend

## � Estructura del Proyecto

```
app-reservas/
├── backend/          # API Node.js + Express (código fuente)
├── frontend/         # React Native/Expo (código fuente) ✅ Versionado en Git
├── _expo/            # Frontend compilado para web ⚠️ NO en Git (solo servidor)
├── docs/             # Documentación
└── .gitignore        # _expo/ excluido del repositorio
```

### 🔄 Workflow de Desarrollo

**Frontend**:
- **Editar**: `frontend/` (código fuente React Native)
- **Compilar + Deploy (recomendado)**: `./frontend/deploy_web_atomic.sh`
- **Deploy manual**: Solo en caso excepcional, copiando `frontend/dist/` completo
- **Git**: Solo `frontend/` está versionado, `_expo/` solo existe en servidor

**Backend**:
- **Editar**: `backend/` (código fuente Node.js)
- **Reiniciar**: `cd backend && npm start`
- **Git**: Todo `backend/` está versionado

## � WORKFLOW SEGURO: Desarrollo Local → Producción

Este es el flujo correcto para hacer cambios:

**PASO 1: Editar EN TU MÁQUINA (NO en servidor)**
```bash
cd /tu/ruta/app-reservas
vim frontend/screens/AdminScreen.js  # Editar
```

**PASO 2: Probar EN TU MÁQUINA (NO en servidor)**
```bash
cd frontend && npm start
# Abre http://localhost:8082 en tu navegador
# Verifica cambios funcionan correctamente
```

**PASO 3: Commit y Push a Git (después de testing exitoso)**
```bash
git add .
git commit -m "Agregar botón Ver Historial"
git push origin main
```

**PASO 4: Desplegar en servidor (SOLO después de todo lo anterior)**
```bash
# SSH a servidor
ssh usuario@reservas.millenia.es
cd /home/millenia/www/app-reservas
git pull
npm run build  # Si es necesario recompilar
# Reiniciar backend si es necesario
```

## Cambios Recientes (v1.0.7 - 9 Abril 2026)

### 🛡️ Estabilidad de sesión y caché
- ✅ **API sin caché**: Cabeceras `no-store/no-cache` en backend + proxy PHP + `.htaccess` del API
- ✅ **Logout automático por sesión expirada**: Si hay `401`, la app limpia sesión y vuelve a login
- ✅ **Revalidación al volver de segundo plano**: Web (`visibilitychange`) y móvil (`AppState`)
- ✅ **Recuperación de pantallas críticas**: Calendario y Mis Reservas recargan al foco y muestran botón Reintentar
- ✅ **Cambio de rol seguro**: Si un admin cambia un usuario de `admin` a `user` (o al revés), sus tokens anteriores quedan invalidados

### 📍 Alcance seguro
- ✅ Cambios aplicados solo en `app-reservas`
- ✅ No afecta otras apps de `/www` (incluido WordPress)

### 🧱 Nuevo proceso anti-cortes de VS Code
- ✅ Script atómico de despliegue frontend: `frontend/deploy_web_atomic.sh`
- ✅ Evita inconsistencias de hash (`index.html` vs `AppEntry-*.js`)
- ✅ Log de ejecución: `frontend/deploy_web_atomic.log`

## Cambios anteriores (v1.0.5 - 5 Marzo 2026)

### 🎨 Mejoras UI/UX
- ✅ **Select dropdown para ordenación**: Reemplazado badges por dropdown con "Fecha" por defecto
- ✅ **Campo búsqueda optimizado**: Reducido a 180px, placeholder "Buscar..."
- ✅ **Botón renombrado**: "Ver Historial" → "Historial"
- ✅ **Toggle reubicado**: Activo/Inactivo movido a modal de edición con mejor diseño

### 🐛 Corrección de Bugs
- ✅ **Login error messages**: Ahora se muestran en UI (cuadro rojo) en vez de Alert
- ✅ **Botón Eliminar fix**: Funciona correctamente en web (usa window.confirm)

## Versiones anteriores

### v1.0.4 (4 Marzo 2026)
- ✅ **Buscador en Gestión de Alumnos**: Campo "Buscar alumno..." para encontrar rápidamente alumnos por nombre/email/iniciales
- ✅ **Optimización de Pantalla Calendario**: Reducción de espacios para ver 4 slots sin scroll en móvil vertical
- ✅ **Fixes de fechas**: Corregido problema de "Invalid Date" en historial de reservas

### v1.0.3
- ✅ Botón "Ver Historial" en panel admin para historial de reservas
- ✅ Sistema de invalidación de sesiones (`token_version`)
- ✅ Forzar cambio de contraseña tras reset por admin
- ✅ Endpoint `POST /api/admin/users/:id/reset-password`
- ✅ Endpoint `GET /api/admin/bookings/history?userId=X`

---

**Entorno**: Producción  
**Última actualización**: 9 Abril 2026
