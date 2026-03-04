# Reservas Millenia - Sistema de Gestión de Estudios

## 🔴 ⚠️ ENTORNO DE PRODUCCIÓN ⚠️

**Este sistema está DESPLEGADO Y FUNCIONANDO en producción.**

### 📖 Antes de hacer CUALQUIER cosa, lee:

👉 **[PRODUCTION_README.md](./PRODUCTION_README.md)** 👈

## ⚡ Info Rápida

- **Frontend**: http://reservas.millenia.es
- **Backend API**: http://reservas.millenia.es/api
- **Usuarios**: Reales `@millenia.es` (no hay usuarios de prueba)
- **Base de datos**: PostgreSQL con datos de producción

## ⛔ NO Hacer

- ❌ Ejecutar `seed.sql`
- ❌ Usar `localhost` en pruebas
- ❌ Crear usuarios `@example.com`
- ❌ Truncar tablas
- ❌ Hacer cambios sin backup

## 📚 Documentación

- **[PRODUCTION_README.md](./PRODUCTION_README.md)** - **LEER PRIMERO** 🔴
- [docs/README.md](./docs/README.md) - Funcionalidades del sistema
- [docs/CHANGELOG.md](./docs/CHANGELOG.md) - Historial de cambios
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Arquitectura técnica
- [backend/README.md](./backend/README.md) - API Backend

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
- **Compilar**: `cd frontend && npx expo export --platform web`
- **Deploy**: Copiar `frontend/dist/*` a `_expo/`
- **Git**: Solo `frontend/` está versionado, `_expo/` solo existe en servidor

**Backend**:
- **Editar**: `backend/` (código fuente Node.js)
- **Reiniciar**: `cd backend && npm start`
- **Git**: Todo `backend/` está versionado

## 🛠️ Cambios Recientes (v1.0.3)

- ✅ Botón "Ver Historial" en panel admin para historial de reservas
- ✅ Sistema de invalidación de sesiones (`token_version`)
- ✅ Forzar cambio de contraseña tras reset por admin
- ✅ Endpoint `POST /api/admin/users/:id/reset-password`
- ✅ Endpoint `GET /api/admin/bookings/history?userId=X`

---

**Entorno**: Producción  
**Última actualización**: 4 Marzo 2026
