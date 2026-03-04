# 📊 Diagramas y Flujos Visuales

## 🔄 Flujo General de Autenticación

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  1. PRIMERA APERTURA DE LA APP                                  │
│  ────────────────────────────────────────────────────────────   │
│                                                                   │
│     ┌──────────────┐                                             │
│     │  App Abre    │                                             │
│     └──────┬───────┘                                             │
│            │                                                      │
│            ▼                                                      │
│     ┌──────────────────────┐                                     │
│     │ ¿Token en SecureStore?│                                    │
│     └──────┬───────────┬────┘                                    │
│            │           │                                          │
│         NO │           │ SÍ                                      │
│            │           │                                          │
│            ▼           ▼                                          │
│     ┌──────────────┐  ┌──────────────────┐                       │
│     │ LoginScreen  │  │ HomeScreen       │                       │
│     │              │  │ (Estudios)       │                       │
│     │ Email        │  └──────────────────┘                       │
│     │ Password     │                                             │
│     │ [Login]      │                                             │
│     └──────┬───────┘                                             │
│            │                                                      │
│            ▼                                                      │
│     ┌──────────────────────┐                                     │
│     │ POST /api/auth/login │                                     │
│     │ Server verifica      │                                     │
│     └──────┬───────────┬────┘                                    │
│            │           │                                          │
│         OK │           │ ERROR                                   │
│            │           │                                          │
│            ▼           ▼                                          │
│     ┌──────────────┐  ┌──────────────┐                           │
│     │ Guardar      │  │ Mostrar      │                           │
│     │ Token en     │  │ Error        │                           │
│     │ SecureStore  │  │              │                           │
│     └──────┬───────┘  └──────────────┘                           │
│            │                                                      │
│            ▼                                                      │
│     ┌──────────────────────┐                                     │
│     │ HomeScreen           │                                     │
│     │ (Tab Navigator)      │                                     │
│     │ ├─ Estudios          │                                     │
│     │ ├─ Mis Reservas      │                                     │
│     │ └─ Perfil            │                                     │
│     └──────────────────────┘                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📅 Flujo de Reserva Detallado

```
┌────────────────────────────────────────────────────────────────┐
│  FLUJO COMPLETO DE RESERVA                                     │
└────────────────────────────────────────────────────────────────┘

1. PANTALLA INICIAL - ESTUDIOS
   ┌──────────────────────────┐
   │ GET /api/studios         │
   │ ↓                        │
   │ BOX 1    │ BOX 2         │
   │ BOX 4    │ BOX 5         │
   │ BOX 6    │ ESTUDIO B     │
   │ ESTUDIO C│ ESTUDIO D     │
   └──────────────────────────┘
          │
          ▼
2. USUARIO SELECCIONA ESTUDIO
   ┌──────────────────────────┐
   │ Ir a CalendarScreen      │
   │ studio = Studio A        │
   └──────────────────────────┘
          │
          ▼
3. CALENDARIO
   ┌──────────────────────────┐
   │ Mostrar Calendario       │
  │ Bloquear festivos        │
   │ Seleccionar Fecha        │
   │ (default: hoy)           │
   └──────────────────────────┘
          │
          ▼
4. CARGAR HORARIOS
   ┌──────────────────────────┐
   │ GET /api/studios/1/      │
   │ slots/2026-01-16         │
   └──────────────────────────┘
          │
          ▼
5. MOSTRAR SLOTS
   ┌──────────────────────────┐
   │ 08:00-11:00 DISPONIBLE   │ ← Verde
   │ 11:00-14:00 JPZ          │ ← Rojo (Reservado)
   │ 14:00-17:00 DISPONIBLE   │ ← Verde
   │ 17:00-20:00 DISPONIBLE   │ ← Verde
   └──────────────────────────┘
          │
          ▼
6. USUARIO SELECCIONA SLOT
   ┌──────────────────────────┐
   │ Tap en 08:00-11:00       │
   └──────────────────────────┘
          │
          ▼
7. VALIDACIONES EN BACKEND
   ┌──────────────────────────┐
   │ POST /api/bookings/      │
   │ create                   │
   │ {                        │
   │   studioId: 1,           │
   │   timeSlotId: 123,       │
   │   bookingDate: 2026-01-16│
   │ }                        │
   └──────────────────────────┘
          │
          ├─ ¿Usuario autenticado? ──NO──> 401 Error
          │
          ├─ ¿< 2 reservas? ──NO──> 400 "Max 2 bookings"
          │
          ├─ ¿Slot disponible? ──NO──> 400 "Slot booked"
          │
          ├─ ¿No consecutivo? ──NO──> 400 "Consecutive slots"
          │
          ▼
8. CREAR BOOKING
   ┌──────────────────────────┐
   │ INSERT INTO bookings     │
   │ status = 'confirmed'     │
   │ ↓                        │
   │ 201 Created              │
   └──────────────────────────┘
          │
          ▼
9. ACTUALIZAR UI
   ┌──────────────────────────┐
   │ Mostrar confirmación     │
   │ Recargar slots           │
   │ Slot 1 ahora dice "TUN"  │
   └──────────────────────────┘
          │
          ▼
10. USUARIO VE EN "MIS RESERVAS"
    ┌──────────────────────────┐
    │ GET /api/bookings/       │
    │ my-bookings              │
    │ ↓                        │
    │ Studio A                 │
    │ 08:00-11:00              │
    │ 2026-01-16               │
    │ [Cancelar]               │
    └──────────────────────────┘
```

---

## 🗄️ Modelo de Datos (ER Diagram)

```
┌──────────────────┐
│      USERS       │
├──────────────────┤
│ id (PK)          │
│ username         │
│ email (UNIQUE)   │
│ password_hash    │
│ initials         │◄─────────┐
│ created_at       │          │
└──────────────────┘          │
         ▲                     │
         │ (1:N)              │
         │                     │
    ┌────┴──────────────┐      │
    │                   │      │
    │                   │      │
┌───┴───────────┐   ┌──┴──────────────┐
│   BOOKINGS    │   │    STUDIOS      │
├───────────────┤   ├─────────────────┤
│ id (PK)       │   │ id (PK)         │
│ user_id (FK)  ├──►│ name            │
│ studio_id (FK)├──►│ description     │
│ time_slot_id  │   │ created_at      │
│ booking_date  │   └────────┬────────┘
│ status        │            │ (1:N)
│ created_at    │            │
│ cancelled_at  │            │
└───┬───────────┘            │
    │                        │
    │ (N:1)                  │
    │                        │
    │   ┌────────────────────┘
    │   │
    └──►│
        │
    ┌───┴─────────────────┐
    │   TIME_SLOTS        │
    ├─────────────────────┤
    │ id (PK)             │
    │ studio_id (FK)      │
    │ slot_number (1-4)   │
    │ start_time (HH:MM)  │
    │ end_time (HH:MM)    │
    │ slot_date (DATE)    │
    │ created_at          │
    │                     │
    │ UNIQUE(studio_id,   │
    │ slot_number,        │
    │ slot_date)          │
    └─────────────────────┘
```

---

## 🏗️ Arquitectura de Componentes Frontend

```
┌─────────────────────────────────────────────────────┐
│                   App.js (Root)                      │
│  - NavigationContainer                              │
│  - Stack Navigator (Auth/App)                       │
└──────────────┬──────────────────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   ┌─────────┐   ┌──────────────────┐
   │ Auth    │   │ Authenticated    │
   │ Stack   │   │ Stack (Tabs)     │
   └─────────┘   └──────────────────┘
        │                 │
        │                 ├─ StudioStack
        │                 │  ├─ StudioListScreen
        │                 │  └─ CalendarScreen
        │                 │
        │                 ├─ MyBookingsScreen
        │                 │
        │                 └─ ProfileScreen
        │
        └─ LoginScreen


FLUJO:
LoginScreen (form)
     │
     ├─ Validación local
     │
     ├─ Llamar api.js
     │     │
     │     └─ POST /auth/login
     │
     └─ Si OK: Guardar token + ir a home
       Si FAIL: Mostrar error
```

---

## 🔐 Flujo de Seguridad

```
┌──────────────────────────────────────────────┐
│  1. CLIENTE (Frontend React Native)          │
│                                              │
│  axios.interceptors.request.use(config => {  │
│    token = SecureStore.getItem('userToken')  │
│    config.headers.Authorization =            │
│      'Bearer ' + token                       │
│    return config                             │
│  })                                          │
└──────────────────────────────────────────────┘
              │
              │ Envía request con token
              │
              ▼
┌──────────────────────────────────────────────┐
│  2. SERVIDOR (Backend Express)               │
│                                              │
│  app.use((req, res, next) => {               │
│    const token = req.headers.authorization   │
│    jwt.verify(token, JWT_SECRET)             │
│    if valid → next()                         │
│    if invalid → 401 Unauthorized             │
│  })                                          │
└──────────────────────────────────────────────┘
              │
              ├─ Valid JWT
              │  │
              │  ▼
              │ ┌─────────────────────┐
              │ │ Procesar request    │
              │ │ Validar negocio     │
              │ │ Ejecutar query      │
              │ │ Retornar 200/201    │
              │ └─────────────────────┘
              │
              └─ Invalid/Expired
                 │
                 ▼
              ┌─────────────────────┐
              │ Retornar 401        │
              │ Error: "Invalid     │
              │ token"              │
              │                     │
              │ Cliente → Login     │
              │ de nuevo            │
              └─────────────────────┘
```

---

## 📊 Estados de Booking

```
                    ┌─────────┐
                    │ created │ (temporal)
                    └────┬────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ confirmed    │
                  │ (activa)     │
                  └─┬──────────┬─┘
                    │          │
              [Cancelar]   [Pasa el tiempo]
                    │          │
                    ▼          ▼
              ┌──────────┐  ┌─────────┐
              │cancelled │  │completed│
              │(anuladda)│  │(pasada) │
              └──────────┘  └─────────┘


En la BD guardamos:
- status: 'confirmed' o 'cancelled'
- Si cancelled: cancelled_at = CURRENT_TIMESTAMP
```

---

## 🌊 Request/Response HTTP

### Login

```http
POST /api/auth/login HTTP/1.1
Host: reservas.millenia.es
Content-Type: application/json

{
  "email": "usuario@millenia.es",
  "password": "contraseña"
}

---

HTTP/1.1 200 OK
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Nombre Usuario",
    "email": "usuario@millenia.es",
    "initials": "NUS"
  }
}
```

### Get Slots

```http
GET /api/studios/1/slots/2026-01-16 HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

---

HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": 101,
    "slot_number": 1,
    "start_time": "08:00",
    "end_time": "11:00",
    "studio_id": 1,
    "status": "available",
    "user_id": null,
    "initials": null
  },
  {
    "id": 102,
    "slot_number": 2,
    "start_time": "11:00",
    "end_time": "14:00",
    "studio_id": 1,
    "status": "booked",
    "user_id": 2,
    "initials": "MGC"
  }
]
```

### Create Booking

```http
POST /api/bookings/create HTTP/1.1
Host: localhost:5000
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "studioId": 1,
  "timeSlotId": 101,
  "bookingDate": "2026-01-16"
}

---

HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": 1,
  "user_id": 1,
  "studio_id": 1,
  "time_slot_id": 101,
  "booking_date": "2026-01-16",
  "status": "confirmed",
  "created_at": "2026-01-16T10:30:00.000Z"
}
```

---

## 📱 Navegación en la App

```
LOGIN
  │
  └─[Login válido]──► HOME (Tab Navigator)
                        │
                        ├─ STUDIOS TAB
                        │  ├─ StudioListScreen
                        │  │  └─ Tap studio → CalendarScreen
                        │  │
                        │  └─ CalendarScreen
                        │     └─ Tap slot → createBooking()
                        │
                        ├─ MY BOOKINGS TAB
                        │  └─ MyBookingsScreen
                        │     └─ Tap cancel → cancelBooking()
                        │
                        └─ PROFILE TAB
                           └─ ProfileScreen
                              └─ Tap logout → LoginScreen
```

---

## ⏱️ Timeline de Ejecución

```
Usuario abre app
│
├─ 0ms: App.js monta
│
├─ 50ms: Lee token de SecureStore
│
├─ 100ms: Si no hay token → LoginScreen
│
├─ 200ms: Usuario ingresa credenciales
│
├─ 300ms: Presiona "Iniciar Sesión"
│
├─ 350ms: Valida campos locales
│
├─ 400ms: POST /api/auth/login
│
├─ 500ms: Backend verifica en BD
│
├─ 550ms: Retorna token
│
├─ 600ms: Guarda en SecureStore (encriptado)
│
├─ 650ms: Navega a HomeScreen
│
├─ 700ms: Carga lista de estudios
│
├─ 750ms: GET /api/studios
│
├─ 850ms: Muestra 6 estudios
│
└─ Usuario puede interactuar
```

---

Estos diagramas te ayudan a entender cómo funciona toda la aplicación visualmente.
