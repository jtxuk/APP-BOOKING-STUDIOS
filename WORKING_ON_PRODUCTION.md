# ✅ Checklist: Trabajando en Producción

## Antes de empezar

- [ ] Leí **PRODUCTION_README.md**
- [ ] Entiendo que estoy en el **servidor de producción**
- [ ] NO voy a ejecutar `seed.sql`
- [ ] Usaré **reservas.millenia.es**, no localhost
- [ ] Tengo las credenciales de un usuario real (no @example.com)

## Para hacer cambios en backend

```bash
# 1. Ir al directorio
cd /home/millenia/www/app-reservas/backend

# 2. Ver procesos node actuales
ps aux | grep node

# 3. Editar archivos necesarios
nano routes/auth.js  # (o el archivo que necesites)

# 4. Reiniciar backend
# Si hay proceso background, matar primero, luego:
npm start &

# 5. Validar que funciona
curl -sS http://reservas.millenia.es/api/health
# Debe retornar: {"status":"Backend is running"}
```

## Para probar endpoints

```bash
# ❌ MAL (localhost)
curl http://localhost:5000/api/health

# ✅ BIEN (dominio de producción)
curl http://reservas.millenia.es/api/health
```

## Para login de prueba

```bash
# ❌ MAL (usuario que no existe)
curl -X POST http://reservas.millenia.es/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@example.com","password":"123456"}'

# ✅ BIEN (usuario real - consultar admin para credenciales)
curl -X POST http://reservas.millenia.es/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@millenia.es","password":"password_real"}'
```

## Estructura de archivos importantes

```
/home/millenia/www/app-reservas/
├── README.md                     ← Inicio (lee esto primero)
├── PRODUCTION_README.md          ← ⚠️ CRÍTICO - Advertencias de producción
├── backend/
│   ├── server.js                 ← Entry point del backend
│   ├── routes/                   ← Endpoints (auth, admin, bookings, etc.)
│   ├── middleware/auth.js        ← Validación JWT y token_version
│   ├── config/database.js        ← Pool de PostgreSQL + migrations
│   └── seed.sql                  ← ⚠️ NUNCA ejecutar en producción
├── docs/
│   ├── CHANGELOG.md              ← Historial de cambios
│   └── ARCHITECTURE.md           ← Documentación técnica
└── index.html                    ← Frontend compilado (servido por Apache)
```

## URLs de producción

| Servicio | URL |
|----------|-----|
| Frontend | http://reservas.millenia.es |
| Backend Health | http://reservas.millenia.es/api/health |
| Login | http://reservas.millenia.es/api/auth/login |
| Studios | http://reservas.millenia.es/api/studios |
| Profile | http://reservas.millenia.es/api/users/profile |
| Admin Users | http://reservas.millenia.es/api/admin/users |

## En caso de error

1. **Backend no responde**:
   ```bash
   cd /home/millenia/www/app-reservas/backend
   ps aux | grep node  # Ver si hay proceso corriendo
   npm start &         # Reiniciar
   ```

2. **Error de BD**:
   ```bash
   # Verificar conexión PostgreSQL
   psql -U postgres -d booking_app -c "SELECT COUNT(*) FROM users;"
   ```

3. **Token inválido**:
   - Es normal tras reset de contraseña (incrementa `token_version`)
   - Usuario debe hacer login nuevamente

4. **CORS error**:
   - Verificar que la petición viene de `reservas.millenia.es`
   - No usar `localhost` en producción

## Usuarios reales actuales

```bash
# Ver usuarios en BD
cd /home/millenia/www/app-reservas/backend
node -e "
const db = require('./config/database');
db.query('SELECT id, email, role FROM users ORDER BY id').then(r => {
  console.table(r.rows);
  process.exit(0);
});
"
```

## ⚠️ Nunca hacer

1. `psql -d booking_app -f backend/seed.sql` ← Destruye TODO
2. `TRUNCATE TABLE users;` ← Borra usuarios reales
3. `DROP DATABASE booking_app;` ← Catastrófico
4. Cambiar esquema de BD sin backup
5. Probar contra localhost (no es tu máquina, es el servidor)

---

**Recuerda**: Siempre usa `reservas.millenia.es`, nunca `localhost`.

**Última actualización**: 4 Marzo 2026
