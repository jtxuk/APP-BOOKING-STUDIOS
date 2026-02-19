# 🚀 Guía de Inicio Rápido

## Requisitos Previos

- Node.js 14+ y npm
- PostgreSQL 12+ (recomendado: Postgres.app para macOS)
- Expo CLI instalado globalmente: `npm install -g expo-cli`

---

## 1️⃣ Configuración del Backend

### Paso 1: Instalar dependencias
```bash
cd backend
npm install
```

### Paso 2: Configurar variables de entorno
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de PostgreSQL:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=booking_app
DB_USER=postgres
DB_PASSWORD=tu_contraseña_postgres
JWT_SECRET=tu_clave_secreta_muy_segura
NODE_ENV=development
```

### Paso 3: Crear la base de datos
```bash
# Con Postgres.app (macOS):
/Applications/Postgres.app/Contents/Versions/latest/bin/psql -U oficina2 -c "CREATE DATABASE booking_app;"

# O con PostgreSQL estándar:
createdb booking_app

# O en psql:
psql -U postgres -c "CREATE DATABASE booking_app;"
```

### Paso 4: Inicializar el schema y datos
```bash
# Con Postgres.app (macOS):
/Applications/Postgres.app/Contents/Versions/latest/bin/psql -U oficina2 -d booking_app -f seed.sql

# O con PostgreSQL estándar:
psql -U postgres -d booking_app -f seed.sql
```

**Nota**: El script `seed.sql` ahora incluye:
- TRUNCATE para evitar duplicados
- 8 estudios con categorías
- 7 usuarios de prueba con acceso temporal
- Slots solo para días laborables (lunes a viernes)
- Sistema automático de cálculo de `fin_acceso`

### Paso 5: Iniciar el servidor
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5000`

---

## 2️⃣ Configuración del Frontend

### Paso 1: Instalar dependencias
```bash
cd frontend
npm install
```

### Paso 2: Configurar variables de entorno
```bash
cp .env.example .env
```

**Importante**: La app detecta automáticamente la IP usando `expo-constants`, pero puedes configurar manualmente en `.env` si lo necesitas:

**Para desarrollo local (web/emulador en la misma máquina):**
```env
API_URL=http://localhost:5000/api
```

**Para dispositivo físico o emulador Android/iOS:**
```env
API_URL=http://192.168.X.X:5000/api
```
(Reemplaza `192.168.X.X` con tu IP local)

**Detección automática** (recomendado):
No configures `API_URL` y la app usará `Constants.expoConfig.hostUri` automáticamente.

---

## 3️⃣ Usuarios de Prueba

### Usuario Administrador
```
Email: juan@example.com
Password: 123456
Rol: admin
```

**Capacidades del administrador:**
- ✅ Crear, editar y eliminar usuarios
- ✅ Activar/desactivar usuarios
- ✅ Ver todas las reservas de todos los usuarios
- ✅ Eliminar cualquier reserva desde el calendario
- ✅ Bloquear/desbloquear slots
- ✅ Sin límite de 2 reservas
- ✅ Puede reservar slots consecutivos

### Usuarios Estudiantes
```
Email: maria@example.com / Password: 123456 (PME)
Email: carlos@example.com / Password: 123456 (EST-SUP)
Email: ana@example.com / Password: 123456 (ING)
Email: luis@example.com / Password: 123456 (PME+ING)
```

---

## 4️⃣ Funcionalidades Principales

### Para Usuarios Normales
1. **Login**: Inicia sesión con email y contraseña
2. **Explorar Estudios**: Ve los 8 estudios disponibles con sus características
3. **Reservar Slots**: Selecciona fecha y horario (máximo 2 reservas activas)
4. **Mis Reservas**: Ve y cancela tus reservas activas
5. **Perfil**: Ve tu información y cierra sesión

### Para Administradores
1. **Gestión de Alumnos**: 
   - Crear nuevos usuarios con categoría y fechas de acceso
   - Editar información de usuarios existentes
   - Activar/desactivar cuentas
   - Eliminar usuarios

2. **Gestión de Reservas**:
   - Ver todas las reservas en el calendario
   - Eliminar reservas de cualquier usuario
   - Sin restricciones de límite o slots consecutivos

3. **Control de Slots**:
   - Bloquear horarios para mantenimiento
   - Desbloquear horarios previamente bloqueados

### Paso 3: Iniciar la aplicación

**Opción A: Expo (recomendado para empezar)**
```bash
npm start
```
Luego escanea el QR con la app Expo Go en tu teléfono.

**Opción B: iOS**
```bash
npm run ios
```
Requiere macOS y Xcode.

**Opción C: Android**
```bash
npm run android
```
Requiere Android Studio y emulador.

**Opción D: Web (para pruebas rápidas)**
```bash
npm start
# Presiona 'w'
```

---

## 3️⃣ Usuarios de Prueba

Después de ejecutar `init-db.sh`, puedes usar estos usuarios:

| Email | Contraseña | Iniciales |
|-------|-----------|-----------|
| juan@example.com | 123456 | JPZ |
| maria@example.com | 123456 | MGC |
| carlos@example.com | 123456 | CLP |
| sofia@example.com | 123456 | SMZ |
| miguel@example.com | 123456 | MRZ |
---

## 6️⃣ Estudios Disponibles

Se han creado 8 estudios con categorías específicas:

| Estudio | Descripción | Categorías |
|---------|-------------|-----------|
| BOX 1 | Producción, Mezcla y Mastering | PME, EST-SUP |
| BOX 2 | Producción, Mezcla y Mastering | ING |
| BOX 4 | Producción, Mezcla y Mastering | ING, PME |
| BOX 5 | Producción, Sintetizadores | PME |
| BOX 6 | Producción, Sintetizadores | PME, EST-SUP |
| ESTUDIO B | Mezcla y Mastering | ING |
| ESTUDIO C | Grabación | PME, EST-SUP |
| ESTUDIO D | Grabación | ING, EST-SUP |
---

## 4️⃣ Crear un Usuario Nuevo

### Opción A: Directamente en PostgreSQL
```bash
psql -h localhost -U postgres -d booking_app
```

```sql
-- Primero, genera el hash de la contraseña:
-- Usa el script: node hash-password.js tu_contraseña

INSERT INTO users (username, email, password_hash, initials)
VALUES ('Tu Nombre', 'tu@email.com', 'hash_de_arriba', 'TUN');
```

### Opción B: Usar el script helper
```bash
node hash-password.js tu_contraseña
```
Copia el hash y úsalo en la INSERT de arriba.

---

## 5️⃣ Verificar que Todo Funciona

### Backend
```bash
curl http://localhost:5000/api/health
# Debe retornar: {"status":"Backend is running"}
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "123456"
  }'
```

---

## 🐛 Troubleshooting

### PostgreSQL no inicia
```bash
# Reinicia PostgreSQL
brew services restart postgresql  # macOS
sudo systemctl restart postgresql # Linux
```

### Puerto 5000 ya está en uso
```bash
# Busca qué proceso está usando el puerto
lsof -i :5000

# Cambia el puerto en .env
PORT=5001
```

### No puedo conectar desde el emulador
- En Android: Usa `10.0.2.2` en lugar de `localhost`
- En iOS: Usa `192.168.X.X` (tu IP local)
- Asegúrate que tu máquina y dispositivo estén en la misma red

### Errores de BD
```bash
# Reinicia la BD limpiamente
dropdb -U postgres booking_app
createdb -U postgres booking_app
./init-db.sh
```

---

## 📁 Estructura Final

```
booking-app/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   ├── seed.sql
│   ├── init-db.sh
│   ├── hash-password.js
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   └── routes/
│       ├── auth.js
│       ├── studios.js
│       ├── bookings.js
│       └── users.js
├── frontend/
│   ├── App.js
│   ├── app.json
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   ├── services/
│   │   └── api.js
│   └── screens/
│       ├── LoginScreen.js
│       ├── StudioListScreen.js
│       ├── CalendarScreen.js
│       ├── MyBookingsScreen.js
│       └── ProfileScreen.js
└── README.md
```

---

## 🎯 Próximos Pasos Después de Empezar

1. Prueba el login con un usuario de ejemplo
2. Navega por los estudios disponibles
3. Intenta reservar un slot de prueba
4. Visualiza tus reservas en "Mis Reservas"
5. Prueba cancelar una reserva
6. Verifica las restricciones (máx 2 reservas, no consecutivas)

---

## 📚 Documentación Adicional

- Backend: Ver `backend/README.md`
- Frontend: Ver `frontend/README.md`
- General: Ver `README.md`

¡Listo! 🎉 La aplicación debería estar funcionando correctamente.
