# 🔧 SOLUCIONES RÁPIDAS - DINAHOSTING

## Situación Actual — 2026-04-22 ✅ RESUELTO

- ✅ Hosting: Dinahosting — nuevo hosting para reservas.millenia.es
- ✅ HTTPS: activo con Let's Encrypt. HTTP redirige 301 a HTTPS.
- ✅ Autoarranque: PM2 local (sin -g) + cron `@reboot pm2 resurrect`.
- ✅ API proxy: Apache → PHP bridge (`/api/index.php`) → Node en `127.0.0.1:15025`.
- ✅ Frontend: URL de API cambiada a `/api` (relativa) para evitar mixed-content.
- ✅ WordPress millenia.es: no tocado, sigue en hosting anterior.

> Para restaurar desde cero ver sección **Restauración rápida** al final del documento.

---

## 🚀 SOLUCIÓN 1: Autoarranque del Backend (PM2)

### Problema
Cuando reinicia el servidor VPS, PM2 no relanza `app-reservas` porque:
- `pm2 startup` falló silenciosamente (hosting compartido no tiene systemd)
- El proceso muere y nadie lo relanza

### Solución: Configurar Cron `@reboot` (2 minutos)

**Paso 1**: Conectar por SSH
```bash
ssh usuario@reservas.millenia.es
# o el host exacto que uses para SSH
```

**Paso 2**: Editar crontab
```bash
crontab -e
```

**Paso 3**: Agregar esta línea al final del archivo (preserva las líneas existentes)
```bash
@reboot sleep 15 && PATH=/usr/local/bin:/usr/bin:/bin && /home/reservasmillenia/www/backend/node_modules/.bin/pm2 resurrect
```

> ⚠️ Ruta correcta para el servidor actual: `/home/reservasmillenia/www/backend`.
> PM2 se instala **local** (`npm install pm2` dentro de backend), no global.

**Paso 4**: Guardar y cerrar (en nano: `Ctrl+O`, `Enter`, `Ctrl+X`)

**Paso 5**: Verificar que se guardó
```bash
crontab -l
# Debe mostrar tu línea @reboot
```

### Cómo funciona

```
1. Servidor reinicia
   ↓
2. Cron ejecuta la línea @reboot después de 10 segundos
   ↓
3. Node + PM2 arrancan server.js
   ↓
4. App está disponible automáticamente
```

**Ventajas**:
- ✅ No necesita permisos root
- ✅ No afecta a otras webs del servidor
- ✅ PM2 + cron juntos: si el proceso muere durante el día, PM2 lo relanza
- ✅ Funciona en hosting compartido

---

## 🔐 SOLUCIÓN 2: HTTPS (SSL Gratis)

### Problema
El dominio es HTTP. Apache no tiene certificado SSL.

### Solución: Pedir Certificado Let's Encrypt (5-10 minutos)

**Opción A: Panel de Control de Dinahosting** (más fácil)

1. Van a `cpanel.dinahosting.com` u otro panel que usen
2. Buscan "SSL" o "HTTPS" o "Let's Encrypt"
3. Instalan certificado gratis para `reservas.millenia.es`
4. Panel automáticamente redirige HTTP → HTTPS
5. **Listo en 2-3 minutos**

**Opción B: Línea de Comando** (si tienen acceso root/sudo)

```bash
# En el servidor
ssh usuario@reservas.millenia.es

# Instalar certbot (si no está)
sudo apt update
sudo apt install certbot python3-certbot-apache

# Generar certificado para tu dominio
sudo certbot --apache -d reservas.millenia.es

# Automáticamente:
# - Crea el certificado
# - Configura Apache para HTTPS
# - Habilita renovación automática
```

### Verificación

Después de instalar el certificado:
```bash
# Debe funcionar (secure lock en navegador)
https://reservas.millenia.es

# HTTP debe redirigir automáticamente
curl -I http://reservas.millenia.es
# Debe retornar: HTTP/1.1 301 Moved Permanently (redirect a HTTPS)
```

### Si Dinahosting dice "no disponible Let's Encrypt"

Pueden:
1. Comprar certificado pagado (generalmente ~$10-15/año)
2. O cambiar a hosting cloud (DigitalOcean, Hetzner, Linode, AWS) donde Let's Encrypt es gratis y siempre disponible

---

## ✅ Checklist de Verificación

Después de aplicar ambas soluciones:

### Autoarranque
- [ ] SSH al servidor
- [ ] `ps aux | grep node` → muestra `server.js` corriendo
- [ ] Curl: `curl http://reservas.millenia.es/api/health` → `{"status":"Backend is running"}`
- [ ] Reiniciar servidor (solo si puedo hacerlo sin afectar otros servicios)
- [ ] Verificar que después del reinicio el proceso arranca automáticamente

### HTTPS
- [ ] `curl -I https://reservas.millenia.es` → HTTP/1.1 200 OK
- [ ] Navegador: browser muestra candado 🔒 (lock icon) en barra de dirección
- [ ] `curl -I http://reservas.millenia.es` → retorna 301 redirect a HTTPS
- [ ] Login funciona sobre HTTPS

---

## 📊 Antes vs Después

| Aspecto | Antes | Después |
|--------|-------|---------|
| **URL** | http://reservas.millenia.es | https://reservas.millenia.es |
| **Tras reinicio** | ❌ Cae, requiere fix manual | ✅ Arranca automáticamente |
| **Seguridad** | HTTP sin encriptación | 🔒 HTTPS con TLS |
| **Certificado** | Ninguno | Let's Encrypt (gratuito, renovado automático) |
| **Tiempo downtime** | Indeterminado (hasta que nos demos cuenta) | 0 segundos (arranca automático) |

---

## 🤔 ¿Y si cambio de hosting después?

Si en el futuro quieren migrar a un hosting cloud (DigitalOcean, Hetzner, AWS):
- Estos pasos siguen siendo válidos (o más simples con systemd)
- HTTPS con Let's Encrypt funciona igual
- La app se porta sin cambios
- Solo hay que:
  1. Hacer backup de BD + código
  2. Desplegar en nuevo servidor
  3. Cambiar DNS
  4. HTTPS se configura igual o más fácil

**Recomendación**: Primero arreglen estos dos problemas en Dinahosting (5 minutos). Si después la experiencia sigue siendo inestable, **entonces** migrar a hosting cloud resulta justificado.

---

## 📞 Soporte

Si tienen dudas con Dinahosting:
- **Soporte Dinahosting**: soporte@dinahosting.com (responden rápido)
- Pedir: "Necesito instalar certificado Let's Encrypt para reservas.millenia.es"
- Pedir: "¿Cómo acceso SSH para ejecutar comandos?"

---

---

## Restauración rápida (si el proceso Node muere)

```bash
cd /home/reservasmillenia/www/backend
npx pm2 start server.js --name reservas-app
npx pm2 save
```

Verificar:
```bash
curl https://reservas.millenia.es/api/health
# → {"status":"Backend is running"}
```

**Última actualización**: 22 Abril 2026
