# 🔴 PRODUCCIÓN vs DESARROLLO - ENTENDER ESTO ES CRÍTICO

> **Si no entiende esto, NO EDITES EL CÓDIGO**

---

## 🎯 LA DISTINCIÓN MÁS IMPORTANTE

```
🏠 DESARROLLO LOCAL (tu máquina)
   ├─ http://localhost:8082
   ├─ Datos de prueba
   ├─ SIN usuarios reales
   └─ SEGURO para experimentar

🔴 DESARROLLO EN SERVIDOR (aunque sea "desarrollo", ES PRODUCCIÓN)
   ├─ https://reservas.millenia.es
   ├─ DATOS REALES de usuarios
   ├─ USUARIOS REALES pueden estar usando AHORA
   └─ PELIGROSO - un error afecta a TODOS
```

**La regla de oro:** Si editas en `/home/millenia/www/app-reservas`, es PRODUCCIÓN, aunque sea desarrollo.

---

## 🌐 LA APLICACIÓN EN PRODUCCIÓN

### Dónde está
- **URL:** https://reservas.millenia.es
- **Servidor:** VPS en producción
- **Base de datos:** PostgreSQL EN PRODUCCIÓN
- **Usuarios:** REALES, usando AHORA

### Cómo funciona
```
Usuario en navegador
    ↓
https://reservas.millenia.es
    ↓
Apache Web Server (servidor)
    ↓
    ├─ Frontend: SPA compilado (HTML/JS)
    └─ API: Proxy PHP en /api → Node.js (puerto 5000)
    ↓
PostgreSQL (datos reales)
```

### Archivos en producción
- **Frontend compilado:** `/home/millenia/www/app-reservas/_expo/static/js/web/`
- **Backend:**  `/home/millenia/www/app-reservas/backend/server.js`
- **Config:** `/home/millenia/www/app-reservas/backend/.env` (secretos)
- **BD:** PostgreSQL (con usuarios y reservas reales)

---

## 🏠 DESARROLLO LOCAL (tu máquina - SEGURO)

### Dónde está
- **Tu máquina local:** Mac, Linux, Windows (TU PC)
- **Frontend:** http://localhost:8082 (Expo Dev Server)
- **Backend:** http://localhost:5000 (Node.js)
- **Base de datos:** Tu instancia local de PostgreSQL con datos de PRUEBA
- **Usuarios afectados:** SOLO TÚ (nadie más tiene acceso)

### Cómo funciona
```
Tu navegador / Expo App
    ↓
http://localhost:8082 (Expo Metro Bundler)
    ↓
    ├─ Frontend React Native en tiempo real
    └─ Conexión directa a http://localhost:5000
    ↓
Tu PostgreSQL local (datos de prueba)
```

### Archivos en desarrollo
- **Código fuente:** `frontend/` y `backend/`
- **node_modules:** Descargas locales (NO están en Git)
- **`.env`:** TUS variables locales
- **BD:** Tu SQL local con `seed.sql`

---

## 🔴 DESARROLLO EN SERVIDOR = PRODUCCIÓN (⚠️ PELIGROSO)

### Aclaración Crítica

Aunque sea "desarrollo" (editar código), si lo haces EN EL SERVIDOR es **PRODUCCIÓN** porque:
- ✅ Usuarios REALES están usando la app EN ESTE MOMENTO
- ✅ Cambios aparecen INMEDIATAMENTE SIN testing
- ✅ Un error rompe la app para TODOS
- ✅ No hay forma de "deshacer" rápidamente si algo se daña

### Cómo funciona si editas directamente en servidor

```
Editas archivo en /home/millenia/www/app-reservas
        ↓
Cambio requiere reiniciar backend (si backend)
        ↓
TODOS LOS USUARIOS ven cambio (o error)
        ↓
Si hay bug, TODOS están afectados ahora
```

### Cuándo editar directamente en servidor

- ❌ **NUNCA** para desarrollar nuevas funciones (siempre local primero)
- ❌ **NUNCA** para experimentar o probar cosas
- ✅ **SOLO en emergencia:** Bug crítico que requiere fix inmediato

Si hay emergencia:
1. Edita directamente en `/home/millenia/www/app-reservas`
2. Reinicia backend si es necesario
3. DESPUÉS: Replica cambio en Git y tu máquina local
4. VERIFICA que funciona en desarrollo local
5. COMMIT a Git con explicación de emergencia

---

## ⚠️ DIFERENCIAS CRÍTICAS

| Elemento | 🏠 Desarrollo Local (Tu PC) | 🔴 Desarrollo en Servidor (Producción) |
|----------|-----------|-----------|
| **URL de la app** | http://localhost:8082 | https://reservas.millenia.es |
| **Backend API** | http://localhost:5000 | https://reservas.millenia.es/api |
| **Cómo se inicia** | `cd frontend && npm start` EN TU PC | Ya está corriendo en servidor |
| **Ver cambios** | Recarga automática (Hot reload) | Necesitas reiniciar (afecta usuarios) |
| **Datos** | Datos de prueba (seed.sql) | **DATOS REALES - NO TOCAR** |
| **`.env`** | Tu archivo local (ignorado en Git) | `/home/millenia/www/app-reservas/backend/.env` (secretos) |
| **Base de datos** | Tu PostgreSQL local | PostgreSQL en servidor VPS |
| **Acceso** | Solo tú | Todos los usuarios reales |
| **`node_modules/`** | Tu descarga local | Ya instalado en servidor |
| **Usuarios afectados** | NADIE | TODOS |
| **Riesgo de error** | BAJO (solo tú) | ALTO (todos afectados) |
| **Testing antes** | Recomendado | OBLIGATORIO |

---

## 🚀 FLUJO CORRECTO DE DESARROLLO

### 1. Editar código (TU MÁQUINA)
```bash
cd /tu/path/a/app-reservas
vi frontend/screens/AdminScreen.js
# Haces cambios
```
✅ Cambios locales solamente

### 2. Probar en desarrollo local (TU MÁQUINA)
```bash
cd frontend
npm start
# Expo abre en http://localhost:8082
# Ves cambios en tiempo real
```
✅ Sin afectar a usuarios reales

### 3. Verificar en producción (SOLO SI LISTO)
```bash
cd /home/millenia/www/app-reservas
git status
git commit -m "Agregar botón de historial"
git push
```
✅ Cambios en Git

### 4. Desplegar en servidor (DESPUÉS DE TESTING)
```bash
# EN EL SERVIDOR, NO EN TU PC
cd /home/millenia/www/app-reservas
git pull
npm run build  # Recompilar frontend
# Reiniciar backend si es necesario
```
✅ Usuarios reales ven cambios

---

## 🔴 COSAS QUE NUNCA DEBES HACER EN PRODUCCIÓN

❌ `cd /home/millenia/www/app-reservas && npm start` (Expo) - rompe la web
❌ `npm run dev` en backend - consume recursos
❌ Ejecutar `seed.sql` - destruye datos reales
❌ Editar directamente `/home/millenia/www/app-reservas/.env`
❌ Tocar `_expo/static/` - es compilado, no código fuente
❌ `rm -rf node_modules` en servidor
❌ Crear bases de datos nuevas sin respaldo

---

## ✅ FLUJO DE CAMBIOS CORRECTO

```
1. Editar en tu PC
   frontend/screens/AdminScreen.js

2. Probar en tu PC
   http://localhost:8082

3. Commit en Git
   git add .
   git commit -m "Agregar botón historial"

4. Push a repositorio
   git push origin main

5. (DESPUÉS) Desplegar en servidor
   SSH a servidor
   cd /home/millenia/www/app-reservas
   git pull
   npm run build (si es necesario)
```

---

## 🎯 RESUMEN FINAL

| Pregunta | Respuesta |
|----------|-----------|
| ¿Dónde edito código? | Tu máquina en `/tu/ruta/app-reservas` |
| ¿Dónde pruebo código? | Tu máquina en `http://localhost:8082` |
| ¿Cómo veo cambios en producción? | Despliega después de testing |
| ¿Qué pasa si ejecuto `npm start` en servidor? | La web se cae para TODOS |
| ¿Puedo ejecutar `seed.sql` en servidor? | NO - destruye datos reales |
| ¿Mi `.env` local funciona en servidor? | NO - servidor tiene su propio `.env` |

---

## 📞 EN CASO DE DUDA

Si no estás 100% seguro de qué hacer:
1. **NO hagas nada en el servidor** (`/home/millenia/www/app-reservas`)
2. **Edita y prueba en tu máquina**
3. **Commit en Git**
4. **Avisa antes de desplegar**

**Recuerda:** Una línea de código mal desplegada rompe la app para todos.
