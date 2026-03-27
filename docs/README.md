# Booking App - Sistema de Reservas para Estudios de Grabación

> 🔴 **⚠️ SISTEMA EN PRODUCCIÓN ACTIVA**
> 
> **ESTA APLICACIÓN ESTÁ DESPLEGADA EN https://reservas.millenia.es**
> - ✅ Usuarios REALES usando el sistema ahora
> - ✅ Base de datos en PRODUCCIÓN con datos reales
> - ❌ **NO abrir en localhost ni con Expo Go**
> - ❌ **NO ejecutar seed.sql en el servidor**
> 
> Si editas código, **DEBE recompilarse y desplegarse correctamente** o romperás la app para usuarios reales.

Aplicación completa (iOS, Android y Web) para reservar slots de 3 horas en 8 estudios de grabación. En producción se sirve como SPA en Apache y el API se expone vía proxy PHP en `/api`.

## Estructura del Proyecto

```
booking-app/
├── api/               # Proxy PHP para /api (producción)
│   ├── index.php
│   └── .htaccess
├── backend/           # Node.js + Express API
│   ├── server.js      # Entry point
│   ├── package.json   # Dependencies
│   ├── config/        # Database configuration
│   ├── middleware/    # Auth middleware
│   └── routes/        # API endpoints
└── frontend/          # React Native + Expo
    ├── App.js         # Main app component
    ├── screens/       # Screen components
    ├── services/      # API service layer
    └── package.json   # Dependencies
```

## Requisitos Cumplidos

✅ **Autenticación**: Solo usuarios registrados pueden reservar (JWT)
✅ **8 Estudios**: Acceso a 8 estudios de grabación con categorías específicas
✅ **4 Slots por día**: Cada estudio tiene 4 turnos de 3 horas (08:00-20:00)
✅ **Solo días laborables**: Sábados y domingos bloqueados (aparecen en rojo)
✅ **Festivos bloqueados**: Lista configurable y visibles en rojo en el calendario
✅ **Máximo 2 reservas**: Los usuarios pueden reservar máximo 2 slots (solo cuentan las vigentes)
✅ **No consecutivos**: No se pueden reservar 2 slots seguidos en el mismo estudio
✅ **Sin solapamientos**: Nunca dos usuarios reservan el mismo slot
✅ **Cancelación limitada**: Solo se puede cancelar hasta 15 minutos antes del inicio
✅ **Sin reservas en pasado**: No se permiten reservas en fechas pasadas ni en slots de hoy cuyo inicio ya haya pasado
✅ **Reservas vigentes**: Solo aparecen en "Mis Reservas" las activas (presentes y futuras)
✅ **Histórico completo**: Sistema de histórico de reservas consultable por admins
✅ **Usuario por iniciales**: Los usuarios se muestran por sus iniciales (hasta 4 caracteres, formato libre)
✅ **Iniciales visibles**: Cada slot reservado muestra las iniciales del usuario en un badge compacto
✅ **Gestión de reservas**: Ver, crear y cancelar reservas
✅ **Sin registro frontend**: Solo se registran usuarios desde el backend
✅ **Sin pagos**: No hay procesamiento de pagos
✅ **Categorías de usuarios**: PME, EST-SUP, ING, PME+ING
✅ **Control de acceso temporal**: Sistema automático de expiración por curso
✅ **Admins sin fin de acceso**: El rol admin no tiene fecha de expiración
✅ **Interfaz en español**: Logo personalizado, color corporativo #0E6BA8 y calendario en español
✅ **Panel de administración**: Gestión completa de alumnos (crear, editar, eliminar, activar/desactivar)
✅ **Gestión de reservas admin**: Los administradores pueden eliminar reservas desde el calendario
✅ **Admins sin restricciones**: Los administradores pueden reservar cualquier día (fines de semana, festivos) sin límite de slots
✅ **Lógica PME+ING por curso**: Acceso a PME los 2 primeros cursos, ING a partir del 3º (corte 20 septiembre)
✅ **Cambio de categoría rastreado**: `category_start_date` registra cuándo cambió la categoría; `fin_acceso` se recalcula automáticamente
✅ **Estudio C exclusivo PME**: Solo alumnos PME tienen acceso al Estudio C
✅ **Error claro por iniciales duplicadas**: El admin ve mensaje específico en modal si las iniciales ya están en uso
✅ **Estilos globales**: Sistema centralizado de colores y estilos (Colors.js, GlobalStyles.js)
✅ **Control de slots bloqueados**: Visualización de slots bloqueados por administradores
✅ **Cambio de contraseña**: Funcionalidad para que los usuarios cambien su contraseña
✅ **Generación dinámica de slots**: El backend crea automáticamente slots para cualquier fecha solicitada
✅ **UI mejorada**: Categorías colapsables, ordenación por nombre/fecha, badges organizados

## ⚠️ DESARROLLO LOCAL - NO CONFUNDIR CON PRODUCCIÓN

**LA APP EN PRODUCCIÓN ESTÁ EN: https://reservas.millenia.es**

Esta sección es **ÚNICAMENTE para desarrollo local en tu máquina**.

- 🟢 Desarrollo local → `localhost:5000` + Expo (solo tu máquina)
- 🔴 Producción → `reservas.millenia.es` (usuarios reales)

**NO** hagas nada de lo siguiente EN el servidor de producción.

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Editar `.env` con las credenciales de PostgreSQL:
```
DB_HOST=localhost  # Solo para desarrollo local, en producción usa el host real
DB_PORT=5432
DB_NAME=booking_app
DB_USER=postgres
DB_PASSWORD=tu_contraseña
JWT_SECRET=tu_clave_secreta
```

Crear la base de datos:
```sql
CREATE DATABASE booking_app;
```

Iniciar el servidor:
```bash
npm run dev  # Modo desarrollo con nodemon (desarrollo local)
npm start    # Modo producción (usado en servidor)
```

El backend estará disponible:
- Producción: `http://reservas.millenia.es/api`
- Desarrollo local: `http://localhost:5000`

Para festivos bloqueados, edita la lista en `backend/config/holidays.js`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

El frontend detecta automáticamente el entorno:
- Producción en `reservas.millenia.es` → usa `http://reservas.millenia.es/api`
- Desarrollo local → usa `http://localhost:5000/api`

Iniciar la app:
```bash
npm start      # Expo dev server
npm run ios    # iOS
npm run android # Android
npm run web    # Web
```

## Endpoints del Backend

### Autenticación
- `POST /api/auth/login` - Login (email, password)

### Estudios
- `GET /api/studios` - Obtener todos los estudios
- `GET /api/studios/:studioId/slots/:date` - Obtener slots de un estudio en una fecha
- `GET /api/studios/holidays` - Obtener lista de festivos bloqueados

### Administración (requiere rol admin)
- `GET /api/admin/users` - Obtener todos los usuarios
- `POST /api/admin/users` - Crear nuevo alumno
- `PUT /api/admin/users/:id` - Actualizar alumno
- `DELETE /api/admin/users/:id` - Eliminar alumno
- `PUT /api/admin/users/:id/toggle-active` - Activar/desactivar alumno
- `GET /api/admin/bookings` - Obtener todas las reservas
- `DELETE /api/admin/bookings/:id` - Eliminar cualquier reserva
- `POST /api/admin/slots/block` - Bloquear un slot
- `DELETE /api/admin/slots/:id/block` - Desbloquear un slot

### Reservas
- `POST /api/bookings/create` - Crear una nueva reserva
- `GET /api/bookings/my-bookings` - Obtener mis reservas
- `DELETE /api/bookings/:bookingId` - Cancelar una reserva

### Perfil
- `GET /api/users/profile` - Obtener perfil del usuario
- `PUT /api/users/change-password` - Cambiar contraseña

## Pantallas de la App

1. **Login**: Acceso restringido con email y contraseña
2. **Estudios**: Lista de 8 estudios disponibles
3. **Calendario**: Calendario en español con selección de fecha y horarios
     - Al reservar un slot, se muestra un diálogo de confirmación con el formato:
         "<Nombre Estudio>\n<fecha larga>\n<horario>\n¿Confirmar?"
     - En móvil, el layout es compacto: calendario y los 4 slots caben en pantalla sin scroll.
4. **Mis Reservas**: Visualización y cancelación de reservas
5. **Perfil**: Información del usuario, cambio de contraseña y cierre de sesión
6. **Gestión de Alumnos** (admin): Panel completo de administración con categorías colapsables

## Reglas de Negocio

- **2 reservas máximo**: Un usuario solo puede tener 2 reservas activas
- **No consecutivos**: Si reserva 2 slots, no pueden ser en horarios seguidos del mismo estudio
- **Horarios**: 8:00-11:00, 11:00-14:00, 14:00-17:00, 17:00-20:00
- **Identificación**: Los usuarios se muestran por sus iniciales (3 letras del nombre)
- **Cancelación**: Los usuarios pueden cancelar sus propias reservas en cualquier momento

## Próximos Pasos

1. Crear usuarios en PostgreSQL (no hay registro en frontend)
2. Crear estudios en la BD
3. Generar los time slots para cada estudio y fecha
4. Instalar dependencias (npm install en backend y frontend)
5. Configurar variables de entorno (.env)
6. Ejecutar el backend
7. Ejecutar el frontend

## Notas Técnicas

- **Backend**: Express.js con PostgreSQL
- **Frontend**: React Native con Expo para iOS/Android/Web
- **Producción Web**: Apache sirve SPA en `/home/millenia/www/app-reservas` y proxy PHP en `/api`
- **Auth**: JWT (tokens de 24 horas)
- **BD**: PostgreSQL con relaciones entre usuarios, estudios, slots y reservas

## Seguridad

- Passwords hasheados con bcryptjs
- Autenticación JWT en rutas protegidas
- Validación de reglas de negocio en el backend
- Verificación de propiedad de reservas antes de cancelar
