# Azure Web App Deployment Setup

## ✅ Configuración Completada

Tu aplicación ChessEnigma ha sido configurada para desplegarse en **Azure Web App** en lugar de Azure Static Web Apps.

## 🎯 Ventajas de Azure Web App

- ✅ Soporte completo de Next.js (SSR, ISR, Server Actions)
- ✅ API Routes nativas de Next.js
- ✅ Sin necesidad de Azure Functions separadas
- ✅ Mejor rendimiento para aplicaciones dinámicas
- ✅ Configuración más simple

## 📋 Pasos para Completar el Deployment

### 1. Crear Azure Web App

En el portal de Azure:

1. Ve a **App Services** → **Create**
2. Configura:
   - **Resource Group**: Crea uno nuevo o usa existente
   - **Name**: `chessenigma` (o el nombre que prefieras)
   - **Publish**: Code
   - **Runtime stack**: Node 18 LTS
   - **Operating System**: Linux
   - **Region**: Elige la más cercana
   - **Pricing Plan**: B1 o superior (recomendado)

### 2. Obtener el Publish Profile

1. En tu Azure Web App, ve a **Overview**
2. Click en **Get publish profile** (botón superior)
3. Se descargará un archivo `.PublishSettings`
4. Abre el archivo y copia todo su contenido

### 3. Configurar GitHub Secret

1. Ve a tu repositorio en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Click en **New repository secret**
4. Nombre: `AZURE_WEBAPP_PUBLISH_PROFILE`
5. Value: Pega el contenido del archivo `.PublishSettings`
6. Click en **Add secret**

### 4. Actualizar el Nombre de la App en el Workflow

Si usaste un nombre diferente a `chessenigma`:

1. Edita `.github/workflows/azure-web-app.yml`
2. Cambia la línea 10:
   ```yaml
   AZURE_WEBAPP_NAME: tu-nombre-aqui
   ```

### 5. Configurar Variables de Entorno en Azure

En el portal de Azure, en tu Web App:

1. Ve a **Configuration** → **Application settings**
2. Agrega las variables de entorno necesarias:
   - `GOOGLE_API_KEY` (si usas Google AI)
   - Cualquier otra variable que necesite tu app
3. Click en **Save**

### 6. Desplegar

1. Commit y push de todos los cambios:
   ```bash
   git add .
   git commit -m "Configure Azure Web App deployment"
   git push origin master
   ```

2. El workflow se ejecutará automáticamente
3. Puedes ver el progreso en **Actions** en GitHub

### 7. Verificar el Deployment

1. Una vez completado, ve a tu Azure Web App URL
2. Debería verse: `https://chessenigma.azurewebsites.net`
3. Tu aplicación estará funcionando con todas sus features

## 🗑️ Archivos que Puedes Eliminar

Los siguientes archivos ya no son necesarios:

- `/api/` (directorio completo de Azure Functions)
- `/src/app/api/` (si existe)
- `/.github/workflows/azure-static-web-apps-gray-river-0b1418d10.yml` (workflow antiguo)
- `/public/staticwebapp.config.json`

## 🔧 Configuración de la Aplicación

### Archivos Importantes:

- **`.github/workflows/azure-web-app.yml`**: Workflow de deployment
- **`next.config.ts`**: Configuración de Next.js (sin static export)
- **`package.json`**: Scripts actualizados para Azure
- **`web.config`**: Configuración de IIS para Azure
- **`.deployment`**: Configuración de build de Azure

### Scripts de Package.json:

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start -p $PORT"
  }
}
```

El script `start` usa la variable `$PORT` que Azure proporciona automáticamente.

## 🐛 Troubleshooting

### Si el deployment falla:

1. **Verifica el secret**: Asegúrate de que `AZURE_WEBAPP_PUBLISH_PROFILE` esté configurado correctamente
2. **Revisa los logs**: En Azure Portal → tu Web App → **Log stream**
3. **Verifica el nombre**: El `AZURE_WEBAPP_NAME` debe coincidir con tu Web App
4. **Revisa las variables de entorno**: Todas las variables necesarias deben estar en Azure

### Si la app no carga:

1. Ve a Azure Portal → tu Web App → **Diagnose and solve problems**
2. Revisa **Application logs**
3. Verifica que Node 18 esté configurado
4. Asegúrate de que el build se completó correctamente

## 📚 Recursos

- [Azure Web Apps Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [GitHub Actions for Azure](https://github.com/Azure/actions)

## ✨ Features Soportadas

Con Azure Web App, tu aplicación ahora soporta:

- ✅ Server Actions
- ✅ API Routes
- ✅ Server-Side Rendering (SSR)
- ✅ Incremental Static Regeneration (ISR)
- ✅ Image Optimization
- ✅ Middleware
- ✅ Todas las features de Next.js 15

¡Tu aplicación está lista para desplegarse! 🚀
