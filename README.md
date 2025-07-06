# Cursor TTS MVP - Lector de Texto Seleccionado

Una extensión simple y eficiente para VS Code/Cursor que permite leer en voz alta el texto seleccionado usando la síntesis de voz del navegador.

## 🚀 Características

- **Interfaz web integrada**: Utiliza el Webview API de VS Code para una experiencia fluida
- **Controles de reproducción**: Reproducir, pausar y detener la lectura
- **Detección automática de voces en español**: Prioriza voces en español cuando están disponibles
- **Manejo de errores robusto**: Notificaciones claras sobre el estado de la lectura
- **Diseño responsive**: Se adapta al tema de VS Code
- **Atajo de teclado**: `Ctrl+Alt+H` para activar rápidamente

## 📦 Instalación

### Desde el archivo VSIX
1. Descarga el archivo `cursor-tts-mvp-0.1.0.vsix`
2. En VS Code/Cursor, ve a **Extensions** (Ctrl+Shift+X)
3. Haz clic en el menú de tres puntos (...) y selecciona **Install from VSIX...**
4. Selecciona el archivo descargado

### Desde el código fuente
```bash
git clone <tu-repositorio>
cd cursor-tts-mvp
npm install
npm run compile
npm run package
```

## 🎯 Uso

1. **Selecciona texto** en cualquier editor de VS Code/Cursor
2. **Presiona `Ctrl+Alt+H`** o usa el comando "Leer texto seleccionado"
3. **Se abrirá una pestaña web** con el texto y controles de reproducción
4. **Haz clic en "Reproducir"** para escuchar el texto
5. **Usa los controles** para pausar o detener la lectura

## 🛠️ Desarrollo

### Prerrequisitos
- Node.js (versión 14 o superior)
- npm o yarn
- VS Code o Cursor

### Scripts disponibles
```bash
npm run compile    # Compila TypeScript a JavaScript
npm run package    # Crea el paquete VSIX
```

### Estructura del proyecto
```
cursor-tts-mvp/
├── src/
│   └── extension.ts      # Código principal de la extensión
├── out/
│   └── extension.js      # Código compilado
├── package.json          # Configuración del proyecto
├── tsconfig.json         # Configuración de TypeScript
└── .gitignore           # Archivos ignorados por Git
```

## 🔧 Tecnologías utilizadas

- **TypeScript**: Para el desarrollo del código principal
- **VS Code Extension API**: Para la integración con VS Code/Cursor
- **Webview API**: Para la interfaz web integrada
- **Web Speech API**: Para la síntesis de voz

## 🐛 Solución de problemas

### La síntesis de voz no funciona
- Verifica que tu navegador soporte la Web Speech API
- Asegúrate de que el sistema tenga voces instaladas
- En algunos sistemas, puede ser necesario instalar paquetes de voces adicionales

### La extensión no se activa
- Verifica que VS Code/Cursor sea compatible (versión 1.70.0 o superior)
- Revisa la consola de desarrollador para errores

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias, por favor:

1. Revisa los issues existentes
2. Crea un nuevo issue con detalles del problema
3. Incluye información sobre tu sistema operativo y versión de VS Code/Cursor

---

**Desarrollado con ❤️ para la comunidad de desarrolladores** 