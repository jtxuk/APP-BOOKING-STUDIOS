# Guía de Deployment - VPS Dinahosting

## 📋 Requisitos Previos

Tu VPS debe tener:
- Node.js 14+ instalado
- PostgreSQL (ya lo tienes en pgsql03.dinaserver.com)
- Nginx o Apache configurado
- Acceso SSH

---

## 🚀 Paso 1: Preparar Backend

### 1.1 Conectar por SSH
```bash
ssh root@tu-vps.dinahosting.com
```

### 1.2 Crear directorio para la app
```bash
mkdir -p /home/millenia/www/app-reservas/backend
mkdir -p /home/millenia/www/app-reservas/frontend
```

### 1.3 Desde tu Mac, sube el backend
```bash
# En tu Mac, desde la carpeta del proyecto
cd "/Users/oficina2/APP BOOKING WRKSPC"
scp -r backend/* root@tu-vps.dinahosting.com:/home/millenia/www/app-reservas/backend/
```

### 1.4 En el servidor, instala dependencias
```bash
cd /home/millenia/www/app-reservas/backend
npm install --production
```

### 1.5 Crea el archivo .env en el servidor
```bash
cat > /home/millenia/www/app-reservas/backend/.env << EOF
PORT=5000
DB_HOST=pgsql03.dinaserver.com
DB_PORT=5432
DB_NAME=booking_app
DB_USER=TU_USUARIO_DB
DB_PASSWORD=TU_PASSWORD_DB
JWT_SECRET=tu_clave_secreta_muy_segura
NODE_ENV=production
EOF
```

### 1.6 Instala PM2 para mantener el servidor corriendo
```bash
npm install -g pm2
pm2 start server.js --name app-reservas
pm2 startup
pm2 save
```

---

## 🌐 Paso 2: Configurar Nginx

### 2.1 Crear configuración de Nginx para el subdominio

**IMPORTANTE**: Esta configuración NO afectará tu sitio web actual.

```bash
# Crear archivo de configuración SEPARADO para la app de reservas
cat > /etc/nginx/sites-available/app-reservas << 'EOF'
server {
    listen 80;
    server_name reservas.millenia.es;
    
    # Frontend - Servir archivos estáticos
    location / {
        root /home/millenia/www/app-reservas/frontend;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }
    
    # Backend - Proxy reverso
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

**Nota**: Tu sitio web actual seguirá funcionando en `tudominio.com` sin cambios.

### 2.2 Activar el sitio
```bash
ln -s /etc/nginx/sites-available/app-reservas /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 📱 Paso 3: Compilar y Subir Frontend

### 3.1 En tu Mac, compila la versión web
```bash
cd "/Users/oficina2/APP BOOKING WRKSPC/frontend"

# Crear archivo .env para producción (usa el subdominio)
cat > .env << EOF
REACT_APP_API_URL=https://reservas.millenia.es/api
EOF

# Compilar
npx expo export -p web
```

### 3.2 Subir al servidor
```bash
scp -r dist/* root@tu-vps.dinahosting.com:/home/millenia/www/app-reservas/frontend/
```

---

## 🔒 Paso 4: Configurar SSL (HTTPS) - OPCIONAL pero RECOMENDADO

```bash
# En el servidor - Solo para el subdominio reservas
apt update
apt install certbot python3-certbot-nginx
certbot --nginx -d reservas.millenia.es
```

**Nota**: El SSL de tu sitio actual no se verá afectado.

---

## ✅ Verificación

1. **Backend**: Visita `http://reservas.millenia.es/api/studios`
2. **Frontend**: Visita `http://reservas.millenia.es`
3. **Login**: Prueba con juan@example.com / 123456
4. **Tu sitio actual**: Verifica que `http://millenia.es` sigue funcionando normalmente

---

## 🔄 Para Actualizar la App en el Futuro

### Backend:
```bash
cd /home/millenia/www/app-reservas/backend
git pull  # Si usas git
# O sube los archivos nuevamente con scp
npm install --production
pm2 restart app-reservas
```

### Frontend:
```bash
# En tu Mac
cd frontend
npx expo export -p web
scp -r dist/* root@tu-vps:/home/millenia/www/app-reservas/frontend/
```

---

## 🆘 Solución de Problemas

### Ver logs del backend:
```bash
pm2 logs app-reservas
```

### Reiniciar backend:
```bash
pm2 restart app-reservas
```

### Ver logs de Nginx:
```bash
tail -f /var/log/nginx/error.log
```

### Verificar que el backend está corriendo:
```bash
curl http://localhost:5000/api/studios
```
