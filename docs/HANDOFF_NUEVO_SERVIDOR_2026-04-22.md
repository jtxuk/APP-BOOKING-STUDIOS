# Handoff para nuevo servidor - App Reservas Millenia

Fecha: 2026-04-22

## 1) Estado confirmado

- Dominio WordPress principal actual: http://millenia.es (no tocar)
- App de reservas actual: http://reservas.millenia.es
- API actual: http://reservas.millenia.es/api
- No existe ni se usa api.reservas.millenia.es
- Objetivo: mover solo reservas.millenia.es a hosting nuevo con HTTPS y autoarranque

## 2) Decisiones

- No se separa en dos hostings.
- Toda la app de reservas vive bajo reservas.millenia.es.
- WordPress millenia.es se mantiene en su hosting actual.
- Se usara proxy Nginx del panel hacia puerto interno de Node.
- Si no se usa Passenger, garantizar autoarranque de Node (PM2 + reboot).

## 3) Backup y versionado

- Repo remoto: https://github.com/jtxuk/APP-BOOKING-STUDIOS.git
- Rama: main
- Commit de referencia: af16eab
- Mensaje: docs: agregar guia de soluciones rapidas para Dinahosting (HTTPS y autoarranque)
- Backup local disponible de la app

## 4) Archivos criticos a conservar

- backend/.env
- api/index.php
- api/.htaccess
- index.html
- metadata.json
- frontend/deploy_web_atomic.sh
- Resto del proyecto completo (incluyendo .git)

## 5) Base de datos

- No se hace backup extra de DB en esta fase.
- Se reutiliza la DB actual.
- backend/.env del nuevo hosting debe mantener DB_HOST, DB_NAME, DB_USER, DB_PASSWORD actuales.

## 6) Objetivo tecnico del nuevo hosting

- Crear hosting nuevo para reservas.millenia.es.
- Activar SSL/HTTPS (Lets Encrypt desde panel).
- Forzar redireccion HTTP -> HTTPS.
- Configurar proxy Nginx al puerto local de Node (actualmente previsto: 15025).
- Desplegar app y asegurar autoarranque tras reinicio.

## 7) Plan operativo corto

1. Crear hosting nuevo para reservas.millenia.es en Dinahosting.
2. Activar SSL y forzar HTTPS.
3. Subir codigo (backup o git clone).
4. Restaurar backend/.env con valores actuales.
5. Instalar dependencias backend:
   - cd backend
   - npm install --production
6. Configurar PORT segun panel (ejemplo: 15025).
7. Arrancar Node.
8. Configurar autoarranque:
   - Opcion A: gestor de procesos del panel
   - Opcion B: PM2 + @reboot
9. Validar:
   - /api/health
   - login real
   - creacion/cancelacion de reserva
10. Solo cuando todo este OK, retirar hosting viejo de reservas.

## 8) PM2 rapido

- cd /RUTA_DEL_NUEVO_HOSTING/backend
- npm install --production
- pm2 start server.js --name reservas-app
- pm2 save

Autoarranque sin Passenger/systemd:

- crontab -e
- Agregar:
  - @reboot sleep 10 && cd /RUTA_DEL_NUEVO_HOSTING/backend && $(which node) $(which pm2) start server.js --name reservas-app

## 9) Validacion final esperada

- https://reservas.millenia.es carga correctamente
- https://reservas.millenia.es/api/health responde 200 con JSON
- Tras reboot, la app vuelve sola sin intervencion manual

## 10) Riesgos y mitigacion

- Riesgo: cortar comandos largos con Ctrl+C.
  - Mitigacion: dejar terminar y validar salida.
- Riesgo: olvidar backend/.env en nuevo hosting.
  - Mitigacion: copiar .env antes de pruebas.
- Riesgo: puerto proxy distinto al PORT real de Node.
  - Mitigacion: igualar ambos y validar con curl.

## 11) Frase de continuidad para nuevo chat

"Continuamos migracion de reservas.millenia.es a nuevo hosting Dinahosting. WordPress millenia.es no se toca. Ya hay backup valido en /home/millenia/www/app-reservas-backup.tar.gz (gzip test OK) y repo actualizado (commit af16eab en main). Debemos desplegar app en hosting nuevo, restaurar backend/.env, configurar proxy Nginx del panel al PORT de Node, activar HTTPS y dejar autoarranque tras reboot."
