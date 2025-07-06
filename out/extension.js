"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
function activate(context) {
    let disposable = vscode.commands.registerCommand('cursor-tts-mvp.readSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No hay editor activo.');
            return;
        }
        const selection = editor.selection;
        let text = editor.document.getText(selection);
        if (!text || text.trim().length === 0) {
            vscode.window.showInformationMessage('Selecciona el texto que deseas escuchar.');
            return;
        }
        // Crear un webview para el TTS
        const panel = vscode.window.createWebviewPanel('ttsReader', 'Lector de Texto', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        // Configurar el contenido del webview
        panel.webview.html = getWebviewContent(text);
        // Manejar mensajes del webview
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'started':
                    vscode.window.showInformationMessage('Leyendo texto seleccionado...');
                    break;
                case 'finished':
                    vscode.window.showInformationMessage('Lectura finalizada.');
                    panel.dispose();
                    break;
                case 'error':
                    vscode.window.showErrorMessage(`Error en TTS: ${message.text}`);
                    panel.dispose();
                    break;
            }
        }, undefined, context.subscriptions);
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function getWebviewContent(text) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lector de Texto</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
        }
        .text-display {
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            white-space: pre-wrap;
            line-height: 1.5;
        }
        .controls {
            display: flex;
            gap: 10px;
            margin: 20px 0;
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .status {
            margin-top: 15px;
            padding: 10px;
            border-radius: 4px;
            font-weight: 500;
        }
        .status.info {
            background-color: var(--vscode-infoBar-background);
            color: var(--vscode-infoBar-foreground);
        }
        .status.error {
            background-color: var(--vscode-errorForeground);
            color: var(--vscode-editor-background);
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Lector de Texto Seleccionado</h2>
        <div class="text-display">${escapeHtml(text)}</div>
        
        <div class="controls">
            <button id="playBtn">▶️ Reproducir</button>
            <button id="pauseBtn" disabled>⏸️ Pausar</button>
            <button id="stopBtn" disabled>⏹️ Detener</button>
        </div>
        
        <div id="status" class="status info" style="display: none;"></div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let synth = window.speechSynthesis;
        let utterance = null;
        let isPlaying = false;

        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        const status = document.getElementById('status');

        function showStatus(message, isError = false) {
            status.textContent = message;
            status.className = 'status ' + (isError ? 'error' : 'info');
            status.style.display = 'block';
        }

        function updateButtons() {
            playBtn.disabled = isPlaying;
            pauseBtn.disabled = !isPlaying;
            stopBtn.disabled = !isPlaying;
        }

        function speak() {
            if (isPlaying) return;

            // Detener cualquier síntesis en curso
            synth.cancel();

            // Crear nueva utterance
            utterance = new SpeechSynthesisUtterance(${JSON.stringify(text)});
            
            // Configurar voz en español si está disponible
            const voices = synth.getVoices();
            const spanishVoices = voices.filter(v => v.lang && v.lang.startsWith('es'));
            if (spanishVoices.length > 0) {
                utterance.voice = spanishVoices[0];
            }

            // Configurar eventos
            utterance.onstart = () => {
                isPlaying = true;
                updateButtons();
                showStatus('Leyendo texto...');
                vscode.postMessage({ command: 'started' });
            };

            utterance.onend = () => {
                isPlaying = false;
                updateButtons();
                showStatus('Lectura completada');
                vscode.postMessage({ command: 'finished' });
            };

            utterance.onerror = (event) => {
                isPlaying = false;
                updateButtons();
                showStatus('Error en la síntesis de voz: ' + event.error, true);
                vscode.postMessage({ command: 'error', text: event.error });
            };

            // Iniciar síntesis
            synth.speak(utterance);
        }

        function pause() {
            if (synth.speaking) {
                synth.pause();
                showStatus('Lectura pausada');
            }
        }

        function stop() {
            synth.cancel();
            isPlaying = false;
            updateButtons();
            showStatus('Lectura detenida');
        }

        // Event listeners
        playBtn.addEventListener('click', speak);
        pauseBtn.addEventListener('click', pause);
        stopBtn.addEventListener('click', stop);

        // Verificar si TTS está disponible
        if (!synth) {
            showStatus('La síntesis de voz no está disponible en este navegador', true);
            vscode.postMessage({ command: 'error', text: 'TTS no disponible' });
        } else {
            showStatus('Listo para leer. Selecciona "Reproducir" para comenzar.');
        }

        // Inicializar botones
        updateButtons();
    </script>
</body>
</html>`;
}
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function deactivate() { }
exports.deactivate = deactivate;
