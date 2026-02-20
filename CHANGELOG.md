# Changelog - Booking App

## [Actualización 20 Febrero 2026]

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
