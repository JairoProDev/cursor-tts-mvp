import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
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
        const panel = vscode.window.createWebviewPanel(
            'ttsReader',
            'Lector de Texto',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Configurar el contenido del webview
        panel.webview.html = getWebviewContent(text);

        // Manejar mensajes del webview
        panel.webview.onDidReceiveMessage(
            message => {
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
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(text: string): string {
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
        .text-display .highlight {
            background-color: var(--vscode-editor-selectionBackground, #264f78);
            color: var(--vscode-editor-selectionForeground, #fff);
            border-radius: 2px;
            padding: 0 2px;
        }
        .controls {
            display: flex;
            gap: 10px;
            margin: 20px 0;
        }
        .voice-select {
            margin-bottom: 10px;
        }
        .rate-pitch-controls {
            margin-bottom: 10px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .rate-pitch-controls label {
            font-size: 13px;
            margin-bottom: 2px;
        }
        .rate-pitch-controls input[type="range"] {
            width: 100%;
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
        <div class="voice-select">
            <label for="voiceSelect">Voz:</label>
            <select id="voiceSelect"></select>
        </div>
        <div class="rate-pitch-controls">
            <label for="rateRange">Velocidad: <span id="rateValue">1</span></label>
            <input type="range" id="rateRange" min="0.5" max="2" step="0.05" value="1">
            <label for="pitchRange">Tono: <span id="pitchValue">1</span></label>
            <input type="range" id="pitchRange" min="0" max="2" step="0.05" value="1">
        </div>
        <div class="text-display" id="textDisplay">${escapeHtml(text)}</div>
        <div class="controls">
            <button id="playBtn">▶️ Reproducir</button>
            <button id="pauseBtn" disabled>⏸️ Pausar</button>
            <button id="stopBtn" disabled>⏹️ Detener</button>
            <button id="clipboardBtn">📋 Leer portapapeles</button>
        </div>
        <div id="status" class="status info" style="display: none;"></div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        let synth = window.speechSynthesis;
        let utterance = null;
        let isPlaying = false;
        let isPaused = false;
        let voices = [];
        let selectedVoice = null;
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        const status = document.getElementById('status');
        const voiceSelect = document.getElementById('voiceSelect');
        const rateRange = document.getElementById('rateRange');
        const pitchRange = document.getElementById('pitchRange');
        const rateValue = document.getElementById('rateValue');
        const pitchValue = document.getElementById('pitchValue');
        const clipboardBtn = document.getElementById('clipboardBtn');
        const textDisplay = document.getElementById('textDisplay');
        let originalText = ${JSON.stringify(text)};

        function showStatus(message, isError = false) {
            status.textContent = message;
            status.className = 'status ' + (isError ? 'error' : 'info');
            status.style.display = 'block';
        }

        function updateButtons() {
            playBtn.disabled = isPlaying;
            pauseBtn.disabled = !isPlaying;
            stopBtn.disabled = !isPlaying;
            if (isPlaying && isPaused) {
                pauseBtn.textContent = '▶️ Reanudar';
            } else {
                pauseBtn.textContent = '⏸️ Pausar';
            }
        }

        function detectLanguage(text) {
            // Heurística simple: si contiene letras acentuadas o 'ñ', es español
            if (/[áéíóúüñÁÉÍÓÚÜÑ¿¡]/.test(text)) return 'es';
            // Si contiene solo caracteres ASCII, probablemente inglés
            if (/^[\x00-\x7F]*$/.test(text)) return 'en';
            // Si contiene caracteres franceses
            if (/[çàâêîôûëïüœÇÀÂÊÎÔÛËÏÜŒ]/.test(text)) return 'fr';
            // Por defecto, inglés
            return 'en';
        }

        function selectVoiceByLang(lang) {
            const idx = voices.findIndex(v => v.lang && v.lang.startsWith(lang));
            if (idx !== -1) voiceSelect.selectedIndex = idx;
        }

        // Al poblar voces, sugerir la voz según el idioma detectado
        function populateVoices() {
            voices = synth.getVoices();
            voiceSelect.innerHTML = '';
            voices.forEach((voice, i) => {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = voice.name + ' (' + voice.lang + ')' + (voice.default ? ' [default]' : '');
                voiceSelect.appendChild(option);
            });
            // Detectar idioma del texto y sugerir voz
            const lang = detectLanguage(originalText);
            selectVoiceByLang(lang);
        }

        // Guardar y restaurar configuración en localStorage
        function saveSettings() {
            localStorage.setItem('tts_voice', voiceSelect.value);
            localStorage.setItem('tts_rate', rateRange.value);
            localStorage.setItem('tts_pitch', pitchRange.value);
        }
        function loadSettings() {
            const v = localStorage.getItem('tts_voice');
            const r = localStorage.getItem('tts_rate');
            const p = localStorage.getItem('tts_pitch');
            if (v !== null) voiceSelect.value = v;
            if (r !== null) { rateRange.value = r; rateValue.textContent = r; }
            if (p !== null) { pitchRange.value = p; pitchValue.textContent = p; }
        }
        voiceSelect.addEventListener('change', saveSettings);
        rateRange.addEventListener('change', saveSettings);
        pitchRange.addEventListener('change', saveSettings);
        // Llamar después de poblar voces
        synth.onvoiceschanged = () => { populateVoices(); loadSettings(); };
        populateVoices();
        loadSettings();

        function highlightWord(index, wordArray) {
            if (!textDisplay) return;
            let html = '';
            for (let i = 0; i < wordArray.length; i++) {
                if (i === index) {
                    html += '<span class="highlight">' + escapeHtml(wordArray[i]) + '</span> ';
                } else {
                    html += escapeHtml(wordArray[i]) + ' ';
                }
            }
            textDisplay.innerHTML = html.trim();
        }

        function clearHighlight() {
            if (textDisplay) textDisplay.innerHTML = escapeHtml(originalText);
        }

        function speak() {
            if (isPlaying) return;
            synth.cancel();
            utterance = new SpeechSynthesisUtterance(originalText);
            const voiceIdx = parseInt(voiceSelect.value, 10);
            if (voices[voiceIdx]) utterance.voice = voices[voiceIdx];
            utterance.rate = parseFloat(rateRange.value);
            utterance.pitch = parseFloat(pitchRange.value);
            const words = originalText.split(/\s+/);
            utterance.onboundary = function(event) {
                if (event.name === 'word') {
                    // Calcular el índice de la palabra actual
                    let charIndex = event.charIndex;
                    let count = 0, idx = 0;
                    for (let i = 0; i < words.length; i++) {
                        count += words[i].length + 1;
                        if (charIndex < count) {
                            idx = i;
                            break;
                        }
                    }
                    highlightWord(idx, words);
                }
            };
            utterance.onstart = () => {
                isPlaying = true;
                isPaused = false;
                updateButtons();
                showStatus('Leyendo texto...');
                vscode.postMessage({ command: 'started' });
            };
            utterance.onend = () => {
                isPlaying = false;
                isPaused = false;
                updateButtons();
                showStatus('Lectura completada');
                vscode.postMessage({ command: 'finished' });
                clearHighlight();
            };
            utterance.onerror = (event) => {
                isPlaying = false;
                isPaused = false;
                updateButtons();
                showStatus('Error en la síntesis de voz: ' + event.error, true);
                vscode.postMessage({ command: 'error', text: event.error });
                clearHighlight();
            };
            synth.speak(utterance);
        }

        function pauseOrResume() {
            if (synth.speaking && !synth.paused) {
                synth.pause();
                isPaused = true;
                showStatus('Lectura pausada');
                updateButtons();
            } else if (synth.paused) {
                synth.resume();
                isPaused = false;
                showStatus('Reanudando lectura...');
                updateButtons();
            }
        }

        function stop() {
            synth.cancel();
            isPlaying = false;
            isPaused = false;
            updateButtons();
            showStatus('Lectura detenida');
        }

        async function speakClipboard() {
            if (!navigator.clipboard) {
                showStatus('El navegador no soporta la API del portapapeles', true);
                return;
            }
            try {
                const clipText = await navigator.clipboard.readText();
                if (!clipText || clipText.trim().length === 0) {
                    showStatus('El portapapeles está vacío.', true);
                    return;
                }
                synth.cancel();
                utterance = new SpeechSynthesisUtterance(clipText);
                const voiceIdx = parseInt(voiceSelect.value, 10);
                if (voices[voiceIdx]) utterance.voice = voices[voiceIdx];
                utterance.rate = parseFloat(rateRange.value);
                utterance.pitch = parseFloat(pitchRange.value);
                utterance.onstart = () => {
                    isPlaying = true;
                    isPaused = false;
                    updateButtons();
                    showStatus('Leyendo texto del portapapeles...');
                    vscode.postMessage({ command: 'started' });
                };
                utterance.onend = () => {
                    isPlaying = false;
                    isPaused = false;
                    updateButtons();
                    showStatus('Lectura completada');
                    vscode.postMessage({ command: 'finished' });
                };
                utterance.onerror = (event) => {
                    isPlaying = false;
                    isPaused = false;
                    updateButtons();
                    showStatus('Error en la síntesis de voz: ' + event.error, true);
                    vscode.postMessage({ command: 'error', text: event.error });
                };
                synth.speak(utterance);
            } catch (err) {
                showStatus('No se pudo leer el portapapeles: ' + err, true);
            }
        }

        playBtn.addEventListener('click', speak);
        pauseBtn.addEventListener('click', pauseOrResume);
        stopBtn.addEventListener('click', stop);
        clipboardBtn.addEventListener('click', speakClipboard);

        if (!synth) {
            showStatus('La síntesis de voz no está disponible en este navegador', true);
            vscode.postMessage({ command: 'error', text: 'TTS no disponible' });
        } else {
            showStatus('Listo para leer. Selecciona "Reproducir" para comenzar.');
        }
        updateButtons();
    </script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function deactivate() {}
