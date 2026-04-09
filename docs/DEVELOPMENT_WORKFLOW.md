# Workflow de Desarrollo - App Reservas Millenia

> 🔴 **⚠️ ATENCIÓN: SISTEMA EN PRODUCCIÓN**
> 
> - 🌐 **LA APP REAL ESTÁ EN:** https://reservas.millenia.es
> - ✅ **Usuarios REALES la usan ahora**
> - ❌ **NO es un proyecto local ni de desarrollo**
> - ⚠️ **Cualquier error rompe la app para usuarios reales**
>
> Este documento explica cómo trabajar **SEGURAMENTE** con código fuente en una máquina local y luego desplegarlo en producción.

## 📋 Diferencia: Desarrollo vs Producción

| Aspecto | 🏠 Desarrollo Local (Tu PC) | 🔴 Servidor (PRODUCCIÓN, aunque edites código) |
|---------|-------------------|---------------------------------------|
| **URL** | http://localhost:5000 | https://reservas.millenia.es |
| **Frontend** | `npm start` en tu PC (Expo) | Apache + compilado |
| **Backend** | `npm run dev` en tu PC (nodemon) | Node.js en VPS |
| **BD** | Datos de prueba (seed.sql) | **DATOS REALES - NO TOCAR** |
| **`.env`** | Tus valores locales | Secretos del servidor privado |
| **Acceso** | Solo tú | **Usuarios REALES** |
| **Si hay error** | Solo tú ves el problema | TODOS ven el error |

**REGLA DE ORO CRÍTICA:** 
- Editar en `/home/millenia/www/app-reservas` = PRODUCCIÓN, aunque sea "código"
- Cambios son INMEDIATOS sin testing
- Un error afecta TODOS los usuarios
- SOLO en emergencia, NUNCA para desarrollo normal

## 📋 Resumen

Este documento explica cómo trabajar con el código fuente DE FORMA SEGURA en desarrollo local.

## 🗂️ Estructura de Carpetas

```
app-reservas/
├── backend/           # ✅ Código fuente API (Node.js + Express)
│   ├── routes/        # Endpoints de la API
│   ├── middleware/    # Autenticación, validación
│   ├── config/        # Base de datos, configuración
│   └── package.json
│
├── frontend/          # ✅ Código fuente Frontend (React Native/Expo)
│   ├── screens/       # Pantallas de la app
│   ├── services/      # API calls (axios)
│   ├── constants/     # Colores, estilos
│   ├── App.js         # Entry point
│   └── package.json
│
└── _expo/             # ⚠️ COMPILADO (NO tocar, NO en Git)
    └── static/        # Bundle JavaScript para web
```

## 🔄 Git y Versionado

**Versionado en Git**:
- ✅ `backend/` (código fuente completo)
- ✅ `frontend/` (código fuente completo)
- ✅ `docs/` (documentación)

**NO versionado** (en `.gitignore`):
- ❌ `_expo/` (compilado, solo existe en servidor)
- ❌ `node_modules/` (dependencias)
- ❌ `.env` (variables de entorno)

## 🛠️ Desarrollo Backend

### Editar código

```bash
cd /home/millenia/www/app-reservas/backend
vim routes/admin.js  # o el archivo que necesites
```

### Reiniciar servidor

```bash
# Encontrar proceso actual
ps aux | grep "node.*server.js"

# Matar proceso
kill <PID>

# Reiniciar
npm start
```

### Verificar

```bash
curl http://reservas.millenia.es/api/health
```

## 🎨 Desarrollo Frontend

### 1. Editar código fuente

```bash
cd /home/millenia/www/app-reservas/frontend
vim screens/AdminScreen.js  # o el archivo que necesites
```

### 2. Verificar dependencias

```bash
# Si no existe node_modules/
npm install
```

### 3. Compilar para Web

```bash
cd /home/millenia/www/app-reservas/frontend
npx expo export --platform web
```

**Resultado**: Se genera carpeta `frontend/dist/` con el bundle compilado

### 4. Desplegar a Producción (recomendado: script atómico)

```bash
cd /home/millenia/www/app-reservas
./frontend/deploy_web_atomic.sh
```

Este script:
- Compila web (`expo export`)
- Verifica que exista `AppEntry-*.js`
- Despliega de forma atómica (`_expo`, `index.html`, `metadata.json`)
- Valida que el hash de `index.html` coincida con el bundle real
- Evita dejar la web en blanco si se corta el proceso

### 5. Despliegue manual (solo si hace falta)

```bash
# Eliminar bundle anterior
rm -rf /home/millenia/www/app-reservas/_expo/*

# Copiar nuevo bundle
cp -r /home/millenia/www/app-reservas/frontend/dist/* /home/millenia/www/app-reservas/_expo/

# Verificar
ls -la /home/millenia/www/app-reservas/_expo/
```

### 6. Verificar en producción

Abrir navegador: http://reservas.millenia.es

**Nota**: Apache sirve los archivos de `_expo/` directamente, así que los cambios son inmediatos (refrescar navegador con Ctrl+F5).

## 📦 Commits y Push

### Después de hacer cambios

```bash
cd /home/millenia/www/app-reservas

# Ver cambios
git status

# Agregar solo código fuente (backend/ y frontend/)
git add backend/ frontend/ docs/

# Commit
git commit -m "feat: Descripción del cambio"

# Push a GitHub
git push origin main
```

**IMPORTANTE**: 
- NO commitear `_expo/` (ya está en `.gitignore`)
- NO commitear `node_modules/`
- NO commitear `.env`

## 🚀 Checklist de Deploy

Cuando hagas cambios en **Backend**:
- [ ] Editar código en `backend/`
- [ ] Reiniciar servidor Node.js
- [ ] Probar endpoint en `http://reservas.millenia.es/api/...`
- [ ] Commit y push a GitHub

Cuando hagas cambios en **Frontend**:
- [ ] Editar código en `frontend/`
- [ ] Ejecutar: `./frontend/deploy_web_atomic.sh`
- [ ] Refrescar navegador en `http://reservas.millenia.es`
- [ ] Commit y push **solo frontend/** a GitHub (NO _expo/)

## ⚠️ Notas Importantes

1. **No editar nunca `_expo/` directamente**: Es código compilado/minificado
2. **Siempre trabajar en `frontend/`**: Es el código fuente legible
3. **Git ignora `_expo/`**: Solo existe en el servidor de producción
4. **Frontend necesita compilación**: Los cambios en `frontend/` no se ven hasta compilar

## 🔍 Debugging

**Si el frontend no muestra cambios**:
1. ¿Ejecutaste deploy atómico?: `./frontend/deploy_web_atomic.sh`
2. ¿Hash sincronizado?: comprobar `AppEntry-<hash>` en `index.html` y en `_expo/static/js/web/`
3. ¿Refrescaste navegador?: Ctrl+F5 (hard refresh)
4. ¿Hay errores en consola?: F12 → Console del navegador

**Si VS Code se reinicia durante la compilación**:
1. Vuelve a ejecutar `./frontend/deploy_web_atomic.sh`
2. No hagas copias parciales manuales mientras el build está a medias
3. Verifica el log: `tail -n 50 /home/millenia/www/app-reservas/frontend/deploy_web_atomic.log`

**Si el backend no responde**:
1. ¿Está corriendo?: `ps aux | grep node`
2. ¿Puerto correcto?: Backend debe estar en puerto 5000
3. ¿Hay errores en logs?: `cat backend/output.log`

---

**Última actualización**: 9 Abril 2026
