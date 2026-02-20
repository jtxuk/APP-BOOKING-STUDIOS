#!/bin/bash

# Script de build para frontend web

echo "🌐 Compilando Frontend para web"

cd frontend

# Instalar dependencias
npm install

# Exportar para web
npx expo export -p web

echo "✅ Frontend compilado en dist/"
echo "📁 Sube el contenido de dist/ a tu servidor web"
