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
mkdir -p /home/millenia/www/app-reservas/api
```

### 1.3 Desde tu Mac, sube el backend
```bash
# En tu Mac, desde la carpeta del proyecto
cd "/Users/oficina2/APP BOOKING WRKSPC"
scp -r backend/* root@tu-vps.dinahosting.com:/home/millenia/www/app-reservas/backend/
```

**Nota**: el archivo `backend/config/holidays.js` controla los festivos bloqueados.

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

## 🌐 Paso 2: Configurar Apache + Proxy PHP

En este VPS el puerto 5000 no es accesible externamente. Por eso el API se expone vía un proxy PHP en `/api`.

### 2.1 Proxy PHP en /api

```bash
cat > /home/millenia/www/app-reservas/api/index.php << 'PHP'
<?php
$target = "http://127.0.0.1:5000" . $_SERVER["REQUEST_URI"];
$method = $_SERVER["REQUEST_METHOD"];

if ($method === 'OPTIONS') {
    http_response_code(204);
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    exit;
}

$headers = [];
$incomingHeaders = function_exists('getallheaders') ? getallheaders() : [];
foreach ($incomingHeaders as $k => $v) {
    if (!in_array(strtolower($k), ["host", "connection"])) {
        $headers[] = $k . ": " . $v;
    }
}
if (!array_key_exists('Authorization', $incomingHeaders)) {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
    if ($auth) {
        $headers[] = "Authorization: " . $auth;
    }
}

$body = null;
if ($method !== "GET" && $method !== "HEAD") {
    $body = file_get_contents("php://input");
}

if (function_exists("curl_init")) {
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => $target,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 30
    ]);
    if ($body !== null) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
    }
    $response = curl_exec($curl);
    $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $content_type = curl_getinfo($curl, CURLINFO_CONTENT_TYPE);
    if ($response === false) {
        http_response_code(502);
        echo json_encode(["error" => "Backend unavailable: " . curl_error($curl)]);
        curl_close($curl);
        exit;
    }
    curl_close($curl);
} else {
    $opts = [
        "http" => [
            "method" => $method,
            "header" => implode("\r\n", $headers),
            "timeout" => 30
        ]
    ];
    if ($body !== null) {
        $opts["http"]["content"] = $body;
    }
    $response = @file_get_contents($target, false, stream_context_create($opts));
    if ($response === false) {
        http_response_code(502);
        echo json_encode(["error" => "Backend unavailable"]);
        exit;
    }
    $http_code = 200;
    $content_type = "application/json";
}

http_response_code($http_code);
header("Content-Type: " . ($content_type ?: "application/json"));
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
echo $response;
?>
PHP
```

**Importante**: si haces `rsync --delete` del frontend a `/home/millenia/www/app-reservas/`, vuelve a subir también `/backend` y `/api`.

### 2.2 .htaccess de /api

```bash
cat > /home/millenia/www/app-reservas/api/.htaccess << 'HT'
<IfModule mod_rewrite.c>
  RewriteEngine On

  <IfModule mod_setenvif.c>
    SetEnvIfNoCase Authorization "(.+)" HTTP_AUTHORIZATION=$1
  </IfModule>

  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]

  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  RewriteRule ^ index.php [QSA,L]
</IfModule>
HT
```

### 2.3 .htaccess raíz (SPA)

```bash
cat > /home/millenia/www/app-reservas/.htaccess << 'HT'
<IfModule mod_rewrite.c>
  RewriteEngine On

  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]

  RewriteCond %{REQUEST_URI} !^/api/
  RewriteRule ^ index.html [L]
</IfModule>
HT
```

---

## 📱 Paso 3: Compilar y Subir Frontend

### 3.1 En tu Mac, compila la versión web
```bash
cd "/Users/oficina2/APP BOOKING WRKSPC/frontend"

# Compilar
npx expo export -p web
```

### 3.2 Subir al servidor
```bash
rsync -qr --delete "dist/" "millenia@tu-vps.dinahosting.com:/home/millenia/www/app-reservas/"
```

---

## 🔒 Paso 4: Configurar SSL (HTTPS) - OPCIONAL

```bash
# En el servidor - Solo para el subdominio reservas
apt update
apt install certbot python3-certbot-nginx
certbot --nginx -d reservas.millenia.es
```

**Nota**: El SSL de tu sitio actual no se verá afectado.

---

## ✅ Verificación

1. **Backend**: Visita `http://reservas.millenia.es/api/health`
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

### Ver logs de Apache:
```bash
tail -f /var/log/apache2/error.log
```

### Verificar que el backend está corriendo:
```bash
curl http://localhost:5000/api/studios
```
