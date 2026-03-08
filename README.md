# ChessEnigma

Una aplicación de ajedrez interactiva con puzzles de ajedrez generados por IA, construida con Next.js y tecnología moderna.

## 🎯 Características

- **Puzzles de Ajedrez**: Resuelve puzzles de ajedrez generados por IA con diferentes niveles de dificultad
- **Interfaz Moderna**: Diseño responsive y elegante utilizando Tailwind CSS y componentes Radix UI
- **PWA Compatible**: Instalable como aplicación nativa para acceso offline
- **Multilingüe**: Soporte para múltiples idiomas
- **Base de Datos Oracle**: Todos los datos de puzzles están almacenados en Oracle Database
- **Análisis en Tiempo Real**: Motor de ajedrez basado en chess.js para validación de movimientos

## 🚀 Tecnologías Utilizadas

- **Frontend**: Next.js 15, React 19, TypeScript
- **Estilos**: Tailwind CSS, shadcn/ui components
- **Ajedrez**: chess.js, react-chessboard
- **Base de Datos**: Oracle Database
- **IA**: Google AI (Genkit)
- **PWA**: @ducanh2912/next-pwa
- **Estado**: React Hooks, TanStack Query

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd ChessEnigma
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env.local
# Configura tus credenciales de Oracle y Google AI
```

4. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:9002`

## 🏗️ Arquitectura

### Base de Datos Oracle
- **Almacenamiento**: Todos los puzzles de ajedrez están almacenados en Oracle Database
- **Conexión**: Via REST API utilizando Oracle ORDS (Oracle REST Data Services)
- **URL**: `https://g2611a32d6a01f3-oraclelearning.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/v_puzzle_mate_random_row/`
- **Formato**: JSON con estructura `{"items": [{"fen": "...", "moves": "...", ...}]}`

### Estructura del Proyecto
```
src/
├── app/                 # App Router de Next.js
│   ├── page.tsx        # Página principal del juego
│   └── actions.ts      # Server actions para puzzles
├── components/         # Componentes React reutilizables
├── hooks/             # Hooks personalizados
├── ai/                # Lógica de IA y Genkit
└── lib/               # Utilidades y configuración
```

## 🎮 Cómo Jugar

1. **Nuevo Puzzle**: Haz clic en "New Puzzle" para cargar un nuevo desafío
2. **Tu Turno**: Mueve las piezas cuando sea tu turno (indicado en el estado)
3. **Pistas**: Usa "Show Hint" para obtener una pista sobre el siguiente movimiento
4. **Reiniciar**: "Reset Puzzle" para empezar el puzzle actual desde el principio
5. **Instalar App**: Instala la aplicación como PWA para mejor experiencia.

## 🔧 Configuración de Oracle

La aplicación se conecta a Oracle Database a través de REST API ORDS:

- **Endpoint**: `https://g2611a32d6a01f3-oraclelearning.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/v_puzzle_mate_random_row/`
- **Método**: GET
- **Autenticación**: Configurada en el endpoint de Oracle Cloud
- **Respuesta**: JSON con puzzles aleatorios de ajedrez

No se requiere configuración local de conexión directa a la base de datos.

## 🌐 Despliegue

### Build para Producción
```bash
npm run build
npm start
```



**Nota**: La conexión a Oracle Database está configurada directamente en el endpoint REST API, no requiere variables de entorno adicionales.

## 📱 PWA Features

La aplicación incluye soporte completo para PWA:

- **Instalación**: Botón de instalación nativo cuando el navegador lo soporta
- **Offline Access**: Funcionalidad básica sin conexión
- **App-like Experience**: Interfaz nativa en dispositivos móviles
- **Service Worker**: Caching inteligente para mejor rendimiento

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una feature branch (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la branch (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - mira el archivo [LICENSE](LICENSE) para detalles.

## 🙏 Agradecimientos

- **chess.js**: Librería fundamental para la lógica de ajedrez
- **react-chessboard**: Componente de tablero de ajedrez interactivo
- **Oracle**: Base de datos robusta para almacenamiento de puzzles
- **Google AI**: Generación de puzzles con inteligencia artificialn dev