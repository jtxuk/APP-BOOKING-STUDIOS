#!/bin/bash

# Script de deployment para servidor Dinahosting

echo "🚀 Deployment Backend en Dinahosting"

# 1. Instalar dependencias
npm install --production

# 2. Configurar PM2 para mantener el servidor corriendo
npm install -g pm2

# 3. Iniciar aplicación con PM2
pm2 start server.js --name booking-backend

# 4. Configurar PM2 para auto-inicio
pm2 startup
pm2 save

echo "✅ Backend desplegado en puerto 5000"
echo "📝 Configurar nginx/apache para proxy reverso"
