# Workflow de Desarrollo - App Reservas Millenia

## 📋 Resumen

Este documento explica cómo trabajar con el código fuente y compilar para producción.

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

### 4. Desplegar a Producción

```bash
# Eliminar bundle anterior
rm -rf /home/millenia/www/app-reservas/_expo/*

# Copiar nuevo bundle
cp -r /home/millenia/www/app-reservas/frontend/dist/* /home/millenia/www/app-reservas/_expo/

# Verificar
ls -la /home/millenia/www/app-reservas/_expo/
```

### 5. Verificar en producción

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
- [ ] Compilar: `npx expo export --platform web`
- [ ] Copiar `frontend/dist/*` a `_expo/`
- [ ] Refrescar navegador en `http://reservas.millenia.es`
- [ ] Commit y push **solo frontend/** a GitHub (NO _expo/)

## ⚠️ Notas Importantes

1. **No editar nunca `_expo/` directamente**: Es código compilado/minificado
2. **Siempre trabajar en `frontend/`**: Es el código fuente legible
3. **Git ignora `_expo/`**: Solo existe en el servidor de producción
4. **Frontend necesita compilación**: Los cambios en `frontend/` no se ven hasta compilar

## 🔍 Debugging

**Si el frontend no muestra cambios**:
1. ¿Compilaste?: `cd frontend && npx expo export --platform web`
2. ¿Copiaste a _expo/?: `cp -r frontend/dist/* _expo/`
3. ¿Refrescaste navegador?: Ctrl+F5 (hard refresh)
4. ¿Hay errores en consola?: F12 → Console del navegador

**Si el backend no responde**:
1. ¿Está corriendo?: `ps aux | grep node`
2. ¿Puerto correcto?: Backend debe estar en puerto 5000
3. ¿Hay errores en logs?: `cat backend/output.log`

---

**Última actualización**: 4 Marzo 2026
