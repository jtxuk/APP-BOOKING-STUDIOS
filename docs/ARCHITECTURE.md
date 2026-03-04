# Arquitectura y Flujo de la Aplicación

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO                                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   ┌─────────┐              ┌──────────┐
   │ iOS App │              │Android App│
   └────┬────┘              └─────┬────┘
        │                         │
        └────────────┬────────────┘
                     │
              ┌──────▼──────┐
              │React Native │
              │+ Expo       │
              └──────┬──────┘
                     │ (HTTP/REST)
                     │
            ┌──────▼──────────────┐
            │ Apache (SPA + /api) │
            │ + Proxy PHP /api    │
            └──────┬──────────────┘
               │ (proxy interno)
            ┌──────▼──────────────┐
            │   Node.js Server    │
            │   (Express.js)      │
            │   Port: 5000        │
            └──────┬──────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
         ▼                        ▼
    ┌─────────┐          ┌──────────────┐
    │PostgreSQL│         │Token Storage │
    │Database  │         │(JWT)         │
    │8 Studios │         │(JWT)         │
    │4 Slots   │         └──────────────┘
    └──────────┘
    
      **Producción Web**: El frontend se sirve como SPA en Apache y todas las llamadas al API se enrutan por `/api`, que apunta a un proxy PHP. Ese proxy reenvía el header `Authorization` al backend para las rutas protegidas.
```

---

## 🔐 Flujo de Autenticación

```
1. Usuario abre app
   │
   ├─ ¿Token almacenado? ──SÍ──> Ir a HomeScreen
   │
   └─ NO ──> LoginScreen
             │
             ├─ Ingresa email y contraseña
             │
             ├─ POST /api/auth/login
             │
             ├─ Backend verifica credenciales
             │
             ├─ Si OK:
             │  ├─ Genera JWT token
             │  ├─ Retorna token + datos usuario
             │  └─ App guarda token en SecureStore
             │
             └─ Si FALLO:
                └─ Muestra error
```

---

## 📅 Flujo de Reserva

```
1. HomeScreen (Studio List)
   │
   ├─ GET /api/studios
   │
   └─ Muestra 6 estudios
      │
      └─ Usuario selecciona un estudio
         │
         ▼
2. CalendarScreen
   │
   ├─ Muestra calendario
   ├─ Bloquea sábados, domingos y festivos
   ├─ GET /api/studios/holidays
   │
   ├─ Usuario selecciona fecha
   │
   ├─ GET /api/studios/{id}/slots/{date}
   │
   └─ Muestra 4 slots disponibles/reservados
      │
      └─ Usuario selecciona un slot
         │
         ├─ ¿Slot disponible? ──NO──> Mostrar error
         │
         └─ SÍ ──> Validaciones en Backend:
                   ├─ ¿Máx 2 reservas activas? ──NO──> Error
                   ├─ ¿No consecutivo en mismo studio? ──NO──> Error
                   ├─ ¿Slot no ocupado? ──NO──> Error
                   │

---

## 👨‍💼 Flujo de Administración

```
1. Usuario Admin inicia sesión
   │
   ├─ ProfileScreen muestra botón "Gestión Alumnos"
   │
   └─ Presiona botón
      │
      ▼
2. AdminScreen
   │
   ├─ GET /api/admin/users
   │
   └─ Lista todos los usuarios con acciones:
      │
      ├─ Crear nuevo usuario
      │  └─ POST /api/admin/users
      │
      ├─ Editar usuario existente
      │  └─ PUT /api/admin/users/:id
      │
      ├─ Eliminar usuario
      │  └─ DELETE /api/admin/users/:id
      │
      └─ Activar/Desactivar usuario
         └─ PUT /api/admin/users/:id/toggle-active

3. CalendarScreen (modo admin)
   │
   ├─ Muestra slots con indicador admin
   │
   ├─ Admin puede tocar reservas existentes
   │
   └─ Confirmación de eliminación
      │
      ├─ GET /api/admin/bookings (buscar booking_id)
      │
      └─ DELETE /api/admin/bookings/:id
         │
         └─ Slot queda disponible
```

---

## 🎨 Sistema de Estilos Globales

```
frontend/constants/
│
├─ Colors.js
│  ├─ Colores primarios (#0E6BA8)
│  ├─ Colores de error (#f44336)
│  ├─ Colores de fondo
│  └─ Colores de badges por categoría
│
└─ GlobalStyles.js
   ├─ Estilos de botones
   ├─ Estilos de tarjetas
   ├─ Estilos de inputs
   ├─ Estilos de texto
   └─ Configuración de navegación (stackScreenOptions)

Uso en componentes:
  import { Colors } from '../constants/Colors';
  import { GlobalStyles } from '../constants/GlobalStyles';
  
  <View style={GlobalStyles.card}>
    <Text style={GlobalStyles.title}>Título</Text>
  </View>
```

---
                   └─ SÍ ──> POST /api/bookings/create
                           │
                           ├─ Crea booking en BD
                           │
                           ├─ Retorna confirmación
                           │
                           └─ Actualiza calendar view
```

---

## 📋 Flujo de Mis Reservas

```
1. MyBookingsScreen
   │
   ├─ GET /api/bookings/my-bookings
   │
   ├─ Obtiene lista de reservas del usuario
   │
   └─ Muestra tarjetas con cada reserva
      │
      └─ Usuario selecciona "Cancelar"
         │
         ├─ Confirma cancelación
         │
         ├─ DELETE /api/bookings/{id}
         │
         ├─ Backend verifica propiedad
         │
         ├─ Marca como 'cancelled'
         │
         └─ Actualiza la lista
```

---

## 🗂️ Estructura de Bases de Datos

### Tabla: users
```
id (PK)           INTEGER PRIMARY KEY
username          VARCHAR(50) UNIQUE NOT NULL
email             VARCHAR(100) UNIQUE NOT NULL
password_hash     VARCHAR(255) NOT NULL
initials          VARCHAR(3) UNIQUE NOT NULL
created_at        TIMESTAMP DEFAULT NOW()
```

### Tabla: studios
```
id (PK)           INTEGER PRIMARY KEY
name              VARCHAR(100) NOT NULL
description       TEXT
created_at        TIMESTAMP DEFAULT NOW()
```

### Tabla: time_slots
```
id (PK)           INTEGER PRIMARY KEY
studio_id (FK)    INTEGER REFERENCES studios
slot_number       INTEGER (1-4)
start_time        VARCHAR(5) HH:MM
end_time          VARCHAR(5) HH:MM
slot_date         DATE
created_at        TIMESTAMP DEFAULT NOW()
UNIQUE(studio_id, slot_number, slot_date)
```

### Tabla: bookings
```
id (PK)           INTEGER PRIMARY KEY
user_id (FK)      INTEGER REFERENCES users
studio_id (FK)    INTEGER REFERENCES studios
time_slot_id (FK) INTEGER REFERENCES time_slots
booking_date      DATE
status            VARCHAR(20) DEFAULT 'confirmed'
created_at        TIMESTAMP DEFAULT NOW()
cancelled_at      TIMESTAMP
UNIQUE(time_slot_id)  ← Previene doble reserva
```

---

## 🔄 Validaciones de Negocio

### Backend (Críticas)
```javascript
// En POST /bookings/create

1. Usuario autenticado? (JWT válido)
   └─ Si NO → 401 Unauthorized

2. ¿Campos requeridos presentes?
   └─ Si NO → 400 Bad Request

3. ¿Usuario tiene < 2 reservas activas?
   └─ Si NO → 400 "Maximum 2 bookings allowed"

4. ¿Slot ya está reservado?
   └─ Si SÍ → 400 "Time slot is already booked"

5. ¿Hay reservas consecutivas en mismo studio?
   └─ Si SÍ → 400 "Cannot book consecutive slots"

6. Insertar booking en BD
   └─ Si éxito → 201 Created + booking data
```

### Frontend (UX)
```javascript
// Validaciones visuales/preventivas

1. Mostrar solo slots futuros
2. Desactivar visualmente slots booked
3. Desactivar botón de reserva si hay error
4. Mostrar contador de reservas activas
5. Confirmar antes de cancelar
```

---

## 📡 Endpoints Disponibles

### Authentication
```
POST /api/auth/login
├─ Input: { email, password }
├─ Output: { token, user: { id, username, email, initials } }
└─ Status: 200 OK o 401 Unauthorized
```

### Studios
```
GET /api/studios
├─ Headers: Authorization: Bearer <token>
├─ Output: [{ id, name, description }, ...]
└─ Status: 200 OK

GET /api/studios/:studioId/slots/:date
├─ Headers: Authorization: Bearer <token>
├─ Params: date format YYYY-MM-DD
├─ Output: [{ id, slot_number, start_time, end_time, status, initials }, ...]
└─ Status: 200 OK
```

### Bookings
```
POST /api/bookings/create
├─ Headers: Authorization: Bearer <token>
├─ Input: { studioId, timeSlotId, bookingDate }
├─ Output: { id, user_id, studio_id, time_slot_id, status, created_at }
└─ Status: 201 Created

GET /api/bookings/my-bookings
├─ Headers: Authorization: Bearer <token>
├─ Output: [{ id, studio_name, slot_number, start_time, end_time, slot_date, status }, ...]
└─ Status: 200 OK

DELETE /api/bookings/:bookingId
├─ Headers: Authorization: Bearer <token>
├─ Output: { id, status: 'cancelled', cancelled_at }
└─ Status: 200 OK
```

### Users
```
GET /api/users/profile
├─ Headers: Authorization: Bearer <token>
├─ Output: { id, username, email, initials, must_change_password }
└─ Status: 200 OK

PUT /api/users/change-password
├─ Headers: Authorization: Bearer <token>
├─ Input: { currentPassword, newPassword }
├─ Output: { message, token_version }
├─ Validación: Requiere contraseña actual correcta, mín. 6 caracteres
└─ Status: 200 OK
```

### Admin (Gestión de Usuarios)
```
GET /api/admin/users
├─ Headers: Authorization: Bearer <token> (solo admin)
├─ Output: [{ id, name, email, category, role, fin_acceso, activo }, ...]
└─ Status: 200 OK

POST /api/admin/users/:id/reset-password
├─ Headers: Authorization: Bearer <token> (solo admin)
├─ Input: { newPassword }
├─ Output: { message, user: { id, name, email, must_change_password } }
├─ Acción: Resetea contraseña, marca must_change_password=true, invalida sesiones
└─ Status: 200 OK
```

---

## 🔐 Seguridad

### JWT (JSON Web Tokens)
```
- Expiración: 24 horas
- Se almacena en SecureStore (encriptado en dispositivo)
- Se envía en header: Authorization: Bearer <token>
- Se valida en cada request protegido
- Incluye: id, email, phone, name, initials, category, role, token_version
```

### Invalidación de Sesiones (token_version)
```
- Cada usuario tiene campo token_version (INTEGER, default=1)
- Se incrementa al cambiar contraseña (usuario o admin)
- JWT incluye el token_version al momento de login
- Middleware valida que token_version en JWT === token_version en BD
- Si no coinciden, token es rechazado automáticamente
- Caso de uso: Si admin resetea tu contraseña, tu sesión actual se invalida
```

### Forzar Cambio de Contraseña
```
- Campo: must_change_password (BOOLEAN, default=false)
- Admin puede resetear contraseña con POST /api/admin/users/:id/reset-password
- Usuario recibe must_change_password: true al hacer login
- Frontend debe forzar cambio de contraseña antes de acceso
- Se limpia automáticamente al cambiar con PUT /api/users/change-password
```

### Hashing de Contraseñas
```
- Algoritmo: bcryptjs con salt 10
- Se compara en login sin nunca guardar plain text
```

### CORS
```
- Backend acepta requests de:
  - reservas.millenia.es (Producción)
  - localhost solo para desarrollo local (no en servidor)
  - Dispositivos en misma red (desarrollo)
```

### Validación de Propiedad
```
- Antes de cancelar booking, verifica que pertenezca al usuario
- Previene que un usuario cancele reservas de otros
```

---

## 📊 Reglas de Negocio

### Máximo 2 Reservas
```
- User puede tener máximo 2 bookings activos (status='confirmed')
- No se puede crear 3era reserva hasta cancelar una
- Validado en Backend antes de INSERT
```

### No Consecutivos en Mismo Studio
```
- User NO puede reservar Slot 1 y 2 en Studio A
- User NO puede reservar Slot 2 y 3 en Studio A
- User puede reservar Slot 1 en Studio A y Slot 1 en Studio B (diferente studio)
- User puede reservar Slot 1 en Studio A y Slot 3 en Studio A (diferente slot)
- Validado en Backend con query: 
  SELECT COUNT(*) FROM bookings WHERE user_id=? AND studio_id=? AND status='confirmed'
```

### Identificación por Iniciales
```
- Cada usuario tiene campo 'initials' (3 caracteres)
- Se genera del nombre (ej: Juan Perez → JPZ)
- Se muestra en calendario cuando slot está booked
- Se usa para identificar usuario visualmente
```

### Disponibilidad de Horas
```
- 08:00-11:00 (Slot 1)
- 11:00-14:00 (Slot 2)
- 14:00-17:00 (Slot 3)
- 17:00-20:00 (Slot 4)
- Time slots se generan automáticamente por el backend al iniciar
- Se crean dinámicamente para 30+ días hacia el futuro
- ⚠️ El archivo seed.sql es SOLO para referencia histórica
```

---

## 🚀 Flujo de Deployment (Futuro)

```
1. Backend
   ├─ Deploy a Heroku/AWS
   ├─ Usar managed PostgreSQL
   └─ Configurar variables de entorno

2. Frontend
   ├─ Build para iOS: expo build:ios
   ├─ Build para Android: expo build:android
   ├─ O usar EAS Build (Expo)
   └─ Submit a App Store/Play Store
```

---

## 🧪 Testing Manual

### Test 1: Login
- [ ] Abrir app
- [ ] Ingresar email y contraseña incorrectos → Error
- [ ] Ingresar credenciales válidas → Ingresa a home

### Test 2: Reserva Simple
- [ ] Seleccionar estudio
- [ ] Seleccionar fecha
- [ ] Seleccionar slot disponible
- [ ] Confirmar reserva
- [ ] Ver en "Mis Reservas"

### Test 3: Máximo 2 Reservas
- [ ] Reservar slot 1
- [ ] Reservar slot 2
- [ ] Intentar reservar slot 3 → Error "Maximum 2 bookings"

### Test 4: No Consecutivos
- [ ] Reservar Studio A, Slot 1
- [ ] Intentar reservar Studio A, Slot 2 → Error
- [ ] Reservar Studio B, Slot 2 → OK (diferente studio)

### Test 5: Cancelación
- [ ] Ir a "Mis Reservas"
- [ ] Cancelar una reserva
- [ ] Confirmar en alerta
- [ ] Debe desaparecer de lista
- [ ] Slot debe aparecer disponible en calendario

---

## 📱 Pantallas de la App

```
Login Screen
├─ Email input
├─ Password input
└─ Login button

Home (Studio List)
├─ 8 cards con estudios
│  ├─ BOX 1, BOX 2, BOX 4, BOX 5, BOX 6
│  ├─ ESTUDIO B, ESTUDIO C, ESTUDIO D
│  └─ Con categorías (ING, PME, EST-SUP)
└─ Cada card → Calendar Screen

Calendar Screen
├─ Calendario con selección de fecha
├─ 4 slots por día (3h cada uno)
├─ Visual feedback: disponible (verde) vs booked (rojo)
└─ Booking flow

My Bookings Screen
├─ Lista de reservas activas
├─ Información: Studio, Horario, Fecha
├─ Botón cancelar
└─ Empty state si no hay reservas

Profile Screen
├─ Avatar con iniciales
├─ Nombre y email
├─ Botón logout
└─ Logout confirmation
```

---

Actualizado: Enero 2026
