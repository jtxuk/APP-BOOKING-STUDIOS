# Changelog - Booking App

> ⚠️ **NOTA DE PRODUCCIÓN**: Este sistema está desplegado en `reservas.millenia.es` con usuarios reales.  
> Referencias a `localhost` o usuarios `@example.com` son históricas. Ver `PRODUCTION_README.md`.

## [Actualización 5 Marzo 2026 (v1.0.5)]

### 🎨 Mejoras UI/UX en Gestión de Alumnos

- **Select dropdown para ordenación**: Reemplazado badges por dropdown select
  - Ordenación por defecto: **Fecha** (más reciente primero)
  - Dropdown estilizado igual que campo de búsqueda
  - z-index correcto para aparecer sobre lista de usuarios
  - Opciones: "Fecha" y "Nombre"
  - Ocupa menos espacio en barra superior

- **Campo de búsqueda optimizado**: Reducido ancho a 180px para mejor layout
  - Placeholder cambiado: "Buscar alumno..." → "Buscar..."
  - Todos los controles ahora caben en una línea sin overflow

- **Botón Historial renombrado**: "Ver Historial" → "Historial"
  - Texto más corto y directo
  - Mejor aprovechamiento de espacio en móvil

- **Toggle Activo/Inactivo reubicado**:
  - ❌ Eliminado de vista principal de gestión (más limpio)
  - ✅ Movido a modal de edición con estilo mejorado
  - Usa diseño visual bonito (fondo gris, border, switch + label con colores)
  - Etiqueta "Estado del alumno:"

### 🐛 Corrección de Bugs

- **Login error handling**: Ahora muestra mensajes de error correctamente
  - Errores se muestran en UI (cuadro rojo) en vez de Alert.alert
  - Mensajes específicos: "Credenciales inválidas", "Usuario desactivado", etc.
  - Mejor feedback visual para usuarios web
  - Errores se limpian al intentar nuevo login
  - Console logging mejorado para debugging

- **Botón Eliminar fix**: Ahora funciona correctamente en web
  - Usa `window.confirm()` en plataforma web
  - Mantiene `Alert.alert()` para mobile nativo
  - Confirmación funcionando en ambas plataformas

### 📦 Deployments

- 7 compilaciones y deployments exitosos en producción
- Bundles generados: `AppEntry-1968d928...`, `AppEntry-53118f58...`, `AppEntry-d62a34f4...`, `AppEntry-a39e3d55...`, `AppEntry-316e7d32...`, `AppEntry-89649f64...`, `AppEntry-057fa84a...`
- Todos los cambios activos en https://reservas.millenia.es

## [Actualización 4 Marzo 2026 (v1.0.4)]

### Buscador en Gestión de Alumnos

- **Campo de búsqueda**: Nuevo campo "Buscar alumno..." en la pantalla de Gestión de Alumnos
  - Ubicado a la derecha del botón "Ordenar por"
  - Busca en tiempo real por: nombre, email, iniciales
  - Filtra dinámicamente la lista de alumnos mientras escribes
  - Actualiza contador de alumnos por categoría según resultados
  - Mejora significativa para encontrar alumnos rápidamente cuando hay muchos

### Optimización de Pantalla de Calendario para Móvil

- **Reducción de espacios**: Padding y márgenes comprimidos para móvil vertical
  - Padding general: 15px → 8-10px
  - Altura de slots: optimizada (padding 12 → 8px, márgenes reducidos)
  - Fuentes ajustadas: Título 20pt → 18pt, slots 16pt → 14pt
- **Objetivo cumplido**: 4 slots visibles sin scroll en móvil vertical
  - Calendario mantiene legibilidad completa
  - Todos los slots de la fecha visible sin necesidad de desplazarse
  - Experiencia móvil mejorada significativamente

## [Actualización 4 Marzo 2026 (v1.0.3)]

### � Documentación de Producción

- **PRODUCTION_README.md**: Documento crítico con advertencias de producción
- **README.md raíz**: Nuevo README principal con enlace a documentación de producción
- **Advertencias en docs**: Agregadas notas de producción en todos los documentos principales
- **seed.sql protegido**: Advertencia visible para prevenir ejecución en producción
- **Referencias actualizadas**: 
  - `localhost` → `reservas.millenia.es` en ejemplos
  - `@example.com` → `@millenia.es` en referencias de usuarios
  - Notas sobre datos reales vs históricos

### �🔐 Seguridad de Contraseña Mejorada

- **Reset de contraseña por admin**: Nuevo endpoint `POST /api/admin/users/:id/reset-password`
  - Admin puede resetear contraseña de cualquier usuario
  - Usuario recibe flag `must_change_password: true` en login
  - Obliga al usuario a cambiar contraseña en el siguiente login
  - Invalida todas las sesiones previas del usuario

- **Invalidación de sesiones**: Implementado sistema `token_version`
  - Todos los tokens incluyen `token_version`
  - Cada cambio de contraseña (usuario + admin reset) incrementa `token_version`
  - Middleware valida que `token_version` en JWT coincida con el de BD
  - Si no coinciden, el token es rechazado automáticamente
  - Garantiza que cambios de contraseña invaliden sesiones inmediatamente

- **Mejoras en campos de usuario**:
  - Nuevo campo: `must_change_password BOOLEAN DEFAULT false`
  - Nuevo campo: `token_version INTEGER DEFAULT 1`
  - Validación de usuario activo en login
  - Retorno de `must_change_password` al cliente en login

- **Seguridad en endpoints de cambio**:
  - `PUT /api/users/change-password`: Requiere contraseña actual, limpia `must_change_password`
  - `POST /api/admin/users/:id/reset-password`: Solo para admins, marca para cambio obligatorio

## [Actualización 3 Marzo 2026 (v1.0.2)]

### 🎨 Mejoras de UI/UX

- **Logo actualizado**: "Booking Millenia" → "Reservas Millenia" en pantalla de login
- **Iniciales visibles en slots**: Las iniciales del usuario que reservó un slot ahora se muestran siempre en el calendario
  - Badge azul compacto (#0E6BA8) con las iniciales
  - Tamaño optimizado para móvil (11px)
  - Solo visible en slots reservados (desaparece al cancelar)
  - Visible para todos los usuarios (alumnos y admins)

### 📅 Sistema de Reservas Mejorado

- **Cancelación con límite temporal**: Los usuarios solo pueden cancelar hasta 15 minutos antes del inicio del slot
- **Reservas vigentes**: Solo se muestran en "Mis Reservas" las reservas activas (presentes y futuras)
  - Las reservas pasadas desaparecen automáticamente de la vista del usuario
  - Solo reservas vigentes cuentan para el límite de 2 reservas por usuario
- **Histórico de reservas**: Sistema completo de histórico en backend
  - Guarda todas las reservas (confirmadas, canceladas, completadas)
  - Timestamp de cancelación cuando aplica
  - Endpoint `/api/admin/bookings/history` para consulta de admins
  - Filtros por usuario y estado

## [Actualización 20 Febrero 2026 (v1.0.1)]

### 📅 Festivos Bloqueados

- **Lista de festivos en backend** para bloquear días completos
- **Calendario en rojo** para festivos (igual que fines de semana)
- **Endpoint `/api/studios/holidays`** para consumir desde frontend

### 👤 Acceso Admin

- **Admins sin fecha fin de acceso** (`fin_acceso` queda en NULL)

### 🏷️ Badge de Rol

- **Badge de rol para alumnos** ahora muestra `ALUMN`

## [Actualización 20 Febrero 2026 (v1.0.0)]

### 🚀 Producción Web (reservas.millenia.es)

- **Proxy PHP en `/api`** para exponer el backend detrás de Apache
- **Reenvío de `Authorization`** (SetEnvIfNoCase + fallback en PHP)
- **Soporte de preflight `OPTIONS`** en el proxy
- **SPA routing** con `.htaccess` en la raíz

### 🔧 Ajustes de Backend/Frontend

- **CORS restringido** a `reservas.millenia.es` y localhost
- **Servidor escuchando en `0.0.0.0`** para ejecución en VPS
- **API URL** basada en hostname (producción vs desarrollo)
- **Logout en web** usando confirmación nativa (`window.confirm`)
- **Timeout del cliente** ampliado y mejor logging de respuestas

### 🧩 UX Web (mensajes y confirmaciones)

- **Alertas nativas en web** para errores de reserva y estados de slots
- **Confirmación web** para cancelar reservas desde Calendario
- **Confirmación web** para cancelar reservas desde Mis Reservas

## [Actualización 19 Febrero 2026]

### 🎨 Mejoras de Interfaz

- **Cambio de terminología**: "Usuario" → "Alumno" en toda la aplicación
  - Pantalla "Gestión de Usuarios" ahora es "Gestión de Alumnos"
  - Botones y mensajes actualizados ("Agregar Alumno", "Editar Alumno", etc.)
  - Contador de categorías muestra "X alumno(s)"

- **Calendario en español**
  - Meses: Enero, Febrero, Marzo, etc.
  - Días de la semana: Lun, Mar, Mié, Jue, Vie, Sáb, Dom
  - Formato configurado con `localeConfig` en react-native-calendars

- **Mejoras en Gestión de Alumnos**
  - Categorías colapsadas por defecto para mejor organización
  - Separación de 10px entre secciones de categorías
  - Switch "Alumno Activo" reducido al 80% (más compacto)
  - Corrección de error de sintaxis en `badgesContainer`

- **Unificación de colores**
  - Botón "Cambiar Contraseña" ahora usa el color corporativo #0E6BA8
  - Consistencia visual en toda la aplicación

### 🔧 Correcciones Técnicas

- Eliminado título redundante "Gestión de Usuarios" del componente (se mostraba debajo del header)
- Arreglado error de sintaxis faltante en AdminScreen.js (propiedad `badgesContainer`)
- Estado inicial de categorías configurado como colapsadas

### 📝 Funcionalidades Previas Mantenidas

- Panel de administración con SectionList y categorías colapsables
- Ordenación por nombre o fecha de registro
- Generación dinámica de slots de tiempo
- Sistema de cambio de contraseña seguro
- Control de acceso temporal por categoría
- Validaciones de reservas (máximo 2, no consecutivas)

---

## [Actualización Anterior - Enero 2026]

### ✨ Nuevas Funcionalidades

- **Cambio de contraseña**
  - Endpoint backend: `PUT /api/users/change-password`
  - Modal en ProfileScreen con validación
  - Verificación de contraseña actual con bcrypt
  - Mínimo 6 caracteres para nueva contraseña

- **Generación dinámica de slots**
  - Backend crea automáticamente slots para cualquier fecha solicitada
  - Solo días laborables (lunes a viernes)
  - 4 slots por día: 08:00-11:00, 11:00-14:00, 14:00-17:00, 17:00-20:00

- **Panel de administración mejorado**
  - Vista SectionList con categorías (PME, EST-SUP, ING, PME+ING)
  - Ordenación por nombre o fecha de registro
  - Categorías colapsables con indicador visual (▶/▼)
  - Tarjetas de usuario rediseñadas con 3 líneas
  - Badges alineados a la derecha (iniciales, categoría, rol)
  - Switch para activar/desactivar alumnos

### 🎨 Mejoras de UI/UX

- Sistema centralizado de estilos (Colors.js, GlobalStyles.js)
- Logo personalizado "Booking Millenia"
- Color corporativo #0E6BA8 aplicado consistentemente
- Eliminación de archivos de documentación redundantes
- Mejora en la visualización de información de usuarios

### 🗄️ Base de Datos

- PostgreSQL online (pgsql03.dinaserver.com)
- 8 estudios con categorías específicas
- Sistema de control de acceso temporal
- Usuarios con roles (admin, alum)

---

## Instalación

Ver [QUICKSTART.md](QUICKSTART.md) para instrucciones detalladas de instalación y configuración.

## Estructura

Ver [FILE_STRUCTURE.md](FILE_STRUCTURE.md) para la estructura completa del proyecto.

## Arquitectura

Ver [ARCHITECTURE.md](ARCHITECTURE.md) para detalles técnicos de la arquitectura.
