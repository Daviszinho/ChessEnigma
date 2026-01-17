# Guía de Despliegue en VM de Azure - ChessEnigma

Esta guía detalla los pasos para hospedar la aplicación ChessEnigma en una Máquina Virtual (VM) de Azure con Ubuntu.

## 1. Provisión de la VM en Azure
1. Crea una VM con **Ubuntu 22.04 LTS**.
2. Tamaño recomendado: `Standard_B1s` o `Standard_B2s`.
3. En **Networking (Redes)**, abre los puertos:
   - **80** (HTTP)
   - **443** (HTTPS)
   - **22** (SSH)

## 2. Configuración del Servidor
Conéctate por SSH e instala las dependencias:

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js (v20) usando NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20

# Clonar repositorio
git clone https://github.com/Daviszinho/ChessEnigma.git
cd ChessEnigma
npm install
npm run build
```

## 3. Gestión del Proceso (PM2)
Para que la app corra en segundo plano y se reinicie sola:

```bash
sudo npm install -g pm2
pm2 start npm --name "chess-enigma" -- start
pm2 save
pm2 startup
```

## 4. Proxy Inverso (Nginx) y SSL
Instala Nginx para manejar el tráfico web:

```bash
sudo apt install nginx -y
```

Configura `/etc/nginx/sites-available/default` para apuntar a `http://localhost:3000`.

Para HTTPS (Gratis con Let's Encrypt):
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx
```
