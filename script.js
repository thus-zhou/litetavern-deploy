const SETTINGS_KEY = 'rpg_settings';
const HISTORY_KEY = 'rpg_history';
const CHAR_LIST_KEY = 'rpg_char_list';
const CATEGORY_LIST_KEY = 'rpg_category_list';
const THEME_KEY = 'rpg_theme';
const CHECKPOINTS_KEY = 'rpg_checkpoints';

// DOM Elements
const views = {
    settings: document.getElementById('settings-view'),
    chat: document.getElementById('chat-view')
};

const inputs = {
    // Theme
    themeSelect: document.getElementById('themeSelect'),

    // Category Elements
    categorySelect: document.getElementById('categorySelect'),
    categorySettingsPanel: document.getElementById('categorySettingsPanel'),
    categoryName: document.getElementById('categoryName'),
    categoryPrompt: document.getElementById('categoryPrompt'),

    // AI Functional Instructions
    aiInstructions: document.getElementById('aiInstructions'),
    languageSelect: document.getElementById('languageSelect'),
    contextLimit: document.getElementById('contextLimit'),

    // Quick Commands Manager
    cmdName: document.getElementById('cmdName'),
    cmdContent: document.getElementById('cmdContent'),
    cmdScope: document.getElementById('cmdScope'),
    cmdList: document.getElementById('cmdList'),

    // User Persona
    userName: document.getElementById('userName'),
    userDesc: document.getElementById('userDesc'),

    // Character Elements
    charSelect: document.getElementById('charSelect'),
    charName: document.getElementById('charName'),
    systemPrompt: document.getElementById('systemPrompt'),
    worldLore: document.getElementById('worldLore'),
    mission: document.getElementById('mission'),
    currentScenario: document.getElementById('currentScenario'),
    // Lorebook
    loreKey: document.getElementById('loreKey'),
    loreContent: document.getElementById('loreContent'),
    loreList: document.getElementById('lorebookList'),
    
    apiUrl: document.getElementById('apiUrl'),
    apiKey: document.getElementById('apiKey'),
    modelName: document.getElementById('modelName'),
    
    // Model Params
    temperature: document.getElementById('temperature'),
    maxTokens: document.getElementById('maxTokens'),
    minOutput: document.getElementById('minOutput'),
    presencePenalty: document.getElementById('presencePenalty'),
    frequencyPenalty: document.getElementById('frequencyPenalty'),
    
    // Appearance
    fontSizeSelect: document.getElementById('fontSizeSelect'),
    typingSpeedSelect: document.getElementById('typingSpeedSelect'),

    userInput: document.getElementById('userInput'),
    
    // Checkpoints
    checkpointName: document.getElementById('checkpointName')
};

const hud = {
    time: document.getElementById('timeDisplay'),
    weather: document.getElementById('weatherDisplay'),
    location: document.getElementById('locationDisplay'),
    weatherLayer: document.getElementById('weather-layer'),
    hudBar: document.getElementById('hudBar'),
    toggleHudBtn: document.getElementById('toggleHudBtn'),
    quickMenuBtn: document.getElementById('quickMenuBtn'),
    quickMenu: document.getElementById('quickMenu'),
    quickCmdBar: document.getElementById('quickCmdBar'),
    toast: document.getElementById('toast')
};

const labels = {
    tempValue: document.getElementById('tempValue'),
    presenceValue: document.getElementById('presenceValue'),
    frequencyValue: document.getElementById('frequencyValue'),
    contextLimitValue: document.getElementById('contextLimitValue')
};

const buttons = {
    // Tool Bar
    import: document.getElementById('importBtn'),
    importFile: document.getElementById('importFile'),
    export: document.getElementById('exportBtn'),
    sync: document.getElementById('syncBtn'),
    stats: document.getElementById('statsBtn'),
    randomEvent: document.getElementById('randomEventBtn'),

    // Category Buttons
    addCategory: document.getElementById('addCategoryBtn'),
    editCategory: document.getElementById('editCategoryBtn'),
    saveCategory: document.getElementById('saveCategoryBtn'),
    deleteCategory: document.getElementById('deleteCategoryBtn'),

    // Character Buttons
    importCard: document.getElementById('importCardBtn'),
    importCardInput: document.getElementById('importCardInput'),
    addLore: document.getElementById('addLoreBtn'),
    
    saveChar: document.getElementById('saveCharBtn'),
    deleteChar: document.getElementById('deleteCharBtn'),
    start: document.getElementById('startBtn'),
    back: document.getElementById('backBtn'),
    clear: document.getElementById('clearBtn'),
    send: document.getElementById('sendBtn'),
    
    // Quick Menu
    toggleTime: document.getElementById('toggleTimeBtn'),
    toggleWeather: document.getElementById('toggleWeatherBtn'),
    toggleSound: document.getElementById('toggleSoundBtn'),
    randomEventQuick: document.getElementById('randomEventQuickBtn'),
    summarize: document.getElementById('summarizeBtn'),
    undo: document.getElementById('undoBtn'),
    regen: document.getElementById('regenBtn'),
    
    // Quick Command Buttons
    addCmd: document.getElementById('addCmdBtn'),
    
    // Checkpoints
    checkpoint: document.getElementById('checkpointBtn'),
    closeCheckpoint: document.getElementById('closeCheckpointBtn'),
    saveCheckpoint: document.getElementById('saveCheckpointBtn'),

    // Sync Panel
    syncModalBtn: document.getElementById('syncModalBtn'),
    closeSyncBtn: document.getElementById('closeSyncBtn'),
    setIdentityPc: document.getElementById('setIdentityPc'),
    setIdentityMobile: document.getElementById('setIdentityMobile'),
    cloudUploadBtn: document.getElementById('cloudUploadBtn'),
    cloudDownloadBtn: document.getElementById('cloudDownloadBtn')
};

const panels = {
    checkpoint: document.getElementById('checkpointPanel'),
    checkpointList: document.getElementById('checkpointList'),
    sync: document.getElementById('syncPanel'),
    eventSelection: document.getElementById('eventSelectionPanel'),
    eventOptionsList: document.getElementById('eventOptionsList')
};

const eventButtons = {
    cancel: document.getElementById('cancelEventBtn'),
    regen: document.getElementById('regenEventBtn')
};

const audio = {
    msgSound: document.getElementById('msgSound'),
    ambienceForest: document.getElementById('ambienceForest'),
    ambienceRain: document.getElementById('ambienceRain')
};

const ui = {
    chatTitle: document.getElementById('chatTitle'),
    chatHistory: document.getElementById('chatHistory'),
    chatAvatar: document.getElementById('chatAvatar')
};

const QUICK_CMDS_KEY = 'rpg_quick_cmds';

// State
let state = {
    // Current working settings
    settings: {
        id: null, 
        categoryId: 'default',
        
        aiInstructions: '',
        language: 'zh',
        contextLimit: 0, // 0 = unlimited

        userName: '',
        userDesc: '',

        charName: '',
        systemPrompt: '',
        worldLore: '',
        mission: '',
        currentScenario: '',
        charEventConditions: '',
        lorebook: [], // Array of { key, content }
        
        avatar: null, // Base64 or URL
        background: null, // Base64 or URL
        
        apiUrl: 'http://localhost:8000/api/v1/chat/completions',
        apiKey: '',
        modelName: 'gpt-3.5-turbo',
        temperature: 0.8,
        maxTokens: 2000,
        minOutput: 0,
        presencePenalty: 0,
        frequencyPenalty: 0,
        
        // Visuals
        fontSize: '16px',
        typingSpeed: 30
    },
    messages: [],
    savedCharacters: [], 
    categories: [], 
    checkpoints: [], // Array of snapshots
    quickCommands: [], // { id, name, content, scope }
    theme: 'light',
    
    // Game State
    gameTime: { hour: 8, minute: 0, day: 1 }, // 8:00 AM, Day 1
    weather: 'sunny', // sunny, rain, snow, night
    location: 'Unknown',
    soundEnabled: false,
    hudCollapsed: false,
    
    // Identity
    identity: 'pc' // 'pc' or 'mobile'
};

// Initialization
function init() {
    loadState();
    
    if (!state.categories.find(c => c.id === 'default')) {
        state.categories.unshift({ id: 'default', name: '默认分类 (Default)', sharedPrompt: '', eventConditions: '' });
    }
    
    updateCategorySelectOptions();
    updateCharSelectOptions(); 
    applyTheme(state.theme);
    inputs.themeSelect.value = state.theme;

    // Update HUD
    updateHUD();

    bindEvents();
    
    // Check for Server Sync
    checkServerStatus();

    inputs.userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}

function loadState() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) state.theme = savedTheme;

    const savedCategories = localStorage.getItem(CATEGORY_LIST_KEY);
    if (savedCategories) state.categories = JSON.parse(savedCategories);

    const savedChars = localStorage.getItem(CHAR_LIST_KEY);
    if (savedChars) state.savedCharacters = JSON.parse(savedChars);
    
    const savedCheckpoints = localStorage.getItem(CHECKPOINTS_KEY);
    if (savedCheckpoints) state.checkpoints = JSON.parse(savedCheckpoints);

    const savedCmds = localStorage.getItem(QUICK_CMDS_KEY);
    if (savedCmds) state.quickCommands = JSON.parse(savedCmds);

    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
        const loaded = JSON.parse(savedSettings);
        state.settings = { ...state.settings, ...loaded };
        applySettingsToInputs();
        applyVisualSettings(); // Apply font size etc immediately
    }

    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) state.messages = JSON.parse(savedHistory);
}

function applySettingsToInputs() {
    const s = state.settings;
    
    inputs.categorySelect.value = s.categoryId || 'default';
    inputs.aiInstructions.value = s.aiInstructions || '';
    if(inputs.languageSelect) inputs.languageSelect.value = s.language || 'zh';
    inputs.contextLimit.value = s.contextLimit || 0;
    labels.contextLimitValue.innerText = s.contextLimit == 0 ? 'All' : s.contextLimit;

    inputs.userName.value = s.userName || '';
    inputs.userDesc.value = s.userDesc || '';

    inputs.charName.value = s.charName || '';
    inputs.systemPrompt.value = s.systemPrompt || '';
    inputs.worldLore.value = s.worldLore || '';
    inputs.mission.value = s.mission || '';
    inputs.currentScenario.value = s.currentScenario || '';
    inputs.charEventConditions.value = s.charEventConditions || '';
    
    renderLorebookList();

    // Images
    if(inputs.avatarPreview) inputs.avatarPreview.src = s.avatar || 'assets/paper.png';
    if(inputs.bgPreviewStatus) inputs.bgPreviewStatus.innerText = s.background ? '已设置 (Set)' : '未设置 (None)';
    
    inputs.apiUrl.value = s.apiUrl;
    inputs.apiKey.value = s.apiKey;
    inputs.modelName.value = s.modelName;

    inputs.temperature.value = s.temperature;
    inputs.maxTokens.value = s.maxTokens;
    inputs.minOutput.value = s.minOutput || 0;
    inputs.presencePenalty.value = s.presencePenalty;
    inputs.frequencyPenalty.value = s.frequencyPenalty;

    if(inputs.fontSizeSelect) inputs.fontSizeSelect.value = s.fontSize || '16px';
    if(inputs.typingSpeedSelect) inputs.typingSpeedSelect.value = s.typingSpeed || 30;

    labels.tempValue.innerText = s.temperature;
    labels.presenceValue.innerText = s.presencePenalty;
    labels.frequencyValue.innerText = s.frequencyPenalty;

    updateCharSelectOptions(); 
    inputs.charSelect.value = s.id || '';
}

function updateSettingsFromInputs() {
    state.settings.categoryId = inputs.categorySelect.value;
    
    state.settings.aiInstructions = inputs.aiInstructions.value.trim();
    if(inputs.languageSelect) state.settings.language = inputs.languageSelect.value;
    state.settings.contextLimit = parseInt(inputs.contextLimit.value);

    state.settings.userName = inputs.userName.value.trim();
    state.settings.userDesc = inputs.userDesc.value.trim();

    state.settings.charName = inputs.charName.value.trim();
    state.settings.systemPrompt = inputs.systemPrompt.value.trim();
    state.settings.worldLore = inputs.worldLore.value.trim();
    state.settings.mission = inputs.mission.value.trim();
    state.settings.currentScenario = inputs.currentScenario.value.trim();
    state.settings.charEventConditions = inputs.charEventConditions.value.trim();
    
    state.settings.apiUrl = inputs.apiUrl.value.trim();
    state.settings.apiKey = inputs.apiKey.value.trim();
    state.settings.modelName = inputs.modelName.value.trim();

    state.settings.temperature = parseFloat(inputs.temperature.value);
    state.settings.maxTokens = parseInt(inputs.maxTokens.value);
    state.settings.minOutput = parseInt(inputs.minOutput.value);
    state.settings.presencePenalty = parseFloat(inputs.presencePenalty.value);
    state.settings.frequencyPenalty = parseFloat(inputs.frequencyPenalty.value);

    state.settings.fontSize = inputs.fontSizeSelect.value;
    state.settings.typingSpeed = parseInt(inputs.typingSpeedSelect.value);
}

function applyVisualSettings() {
    // Apply Font Size
    document.documentElement.style.setProperty('--font-size-base', state.settings.fontSize);
    
    // Apply HUD State (Not in settings object but in root state, handled separately usually, but let's check here)
    if (state.hudCollapsed) {
        hud.hudBar.classList.add('collapsed');
    } else {
        hud.hudBar.classList.remove('collapsed');
    }
}

function saveState(showToast = false) {
    updateSettingsFromInputs();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(state.messages));
    localStorage.setItem(CHECKPOINTS_KEY, JSON.stringify(state.checkpoints));
    localStorage.setItem(QUICK_CMDS_KEY, JSON.stringify(state.quickCommands));
    
    if (showToast) {
        showAutoSaveToast();
    }
    
    // Auto-Sync if enabled
    if (state.serverAvailable) {
        debouncedSync();
    }
}

let syncTimeout;
function debouncedSync() {
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
        syncToServer();
    }, 2000);
}

function showAutoSaveToast() {
    hud.toast.style.opacity = '1';
    setTimeout(() => {
        hud.toast.style.opacity = '0';
    }, 2000);
}

function saveCharacterList() {
    localStorage.setItem(CHAR_LIST_KEY, JSON.stringify(state.savedCharacters));
}

function saveCategoryList() {
    localStorage.setItem(CATEGORY_LIST_KEY, JSON.stringify(state.categories));
}

function bindEvents() {
    buttons.start.addEventListener('click', startChat);
    buttons.back.addEventListener('click', showSettings);
    buttons.clear.addEventListener('click', clearHistory);
    buttons.send.addEventListener('click', sendMessage);
    
    // Tools
    if(buttons.import) {
        buttons.import.addEventListener('click', () => buttons.importFile.click());
        buttons.importFile.addEventListener('change', importData);
    }
    if(buttons.export) buttons.export.addEventListener('click', exportData);
    if(buttons.syncModalBtn) buttons.syncModalBtn.addEventListener('click', openSyncPanel);
    if(buttons.stats) buttons.stats.addEventListener('click', showStats);
    if(buttons.randomEvent) buttons.randomEvent.addEventListener('click', triggerRandomEvent);
    
    // Sync Panel Events
    if(buttons.closeSyncBtn) buttons.closeSyncBtn.addEventListener('click', () => panels.sync.classList.add('hidden'));
    if(buttons.setIdentityPc) buttons.setIdentityPc.addEventListener('click', () => setIdentity('pc'));
    if(buttons.setIdentityMobile) buttons.setIdentityMobile.addEventListener('click', () => setIdentity('mobile'));
    if(buttons.cloudUploadBtn) buttons.cloudUploadBtn.addEventListener('click', syncUpload);
    if(buttons.cloudDownloadBtn) buttons.cloudDownloadBtn.addEventListener('click', syncDownload);

    // Event Selection Panel
    if(eventButtons.cancel) eventButtons.cancel.addEventListener('click', () => panels.eventSelection.classList.add('hidden'));
    if(eventButtons.regen) eventButtons.regen.addEventListener('click', triggerRandomEvent);

    // Quick Menu
    if (hud.toggleHudBtn) hud.toggleHudBtn.addEventListener('click', toggleHud);
    hud.quickMenuBtn.addEventListener('click', () => hud.quickMenu.classList.toggle('hidden'));
    buttons.toggleTime.addEventListener('click', advanceTime);
    buttons.toggleWeather.addEventListener('click', cycleWeather);
    buttons.toggleSound.addEventListener('click', toggleSound);
    buttons.summarize.addEventListener('click', () => {
        hud.quickMenu.classList.add('hidden');
        summarizeHistory();
    });
    buttons.randomEventQuick.addEventListener('click', () => {
        hud.quickMenu.classList.add('hidden');
        triggerRandomEvent();
    });
    
    // Undo / Regen
    buttons.undo.addEventListener('click', () => {
        hud.quickMenu.classList.add('hidden');
        undoLastTurn();
    });
    buttons.regen.addEventListener('click', () => {
        hud.quickMenu.classList.add('hidden');
        regenerateLastResponse();
    });

    // Checkpoints
    buttons.checkpoint.addEventListener('click', openCheckpointPanel);
    buttons.closeCheckpoint.addEventListener('click', () => panels.checkpoint.classList.add('hidden'));
    buttons.saveCheckpoint.addEventListener('click', createCheckpoint);

    // Quick Commands
    buttons.addCmd.addEventListener('click', addQuickCommand);
    inputs.contextLimit.addEventListener('input', (e) => {
        labels.contextLimitValue.innerText = e.target.value == 0 ? 'All' : e.target.value;
    });

    // Theme
    inputs.themeSelect.addEventListener('change', (e) => {
        applyTheme(e.target.value);
    });

    // Appearance
    inputs.fontSizeSelect.addEventListener('change', () => {
        updateSettingsFromInputs();
        applyVisualSettings();
        saveState();
    });
    inputs.typingSpeedSelect.addEventListener('change', () => {
        updateSettingsFromInputs();
        saveState();
    });

    // Category CRUD
    inputs.categorySelect.addEventListener('change', handleCategoryChange);
    buttons.addCategory.addEventListener('click', addNewCategory);
    buttons.editCategory.addEventListener('click', toggleCategorySettings);
    buttons.saveCategory.addEventListener('click', saveCategorySettings);
    buttons.deleteCategory.addEventListener('click', deleteCategory);

    // Character CRUD
    buttons.saveChar.addEventListener('click', saveCurrentCharacter);
    
    // Tavern Card Import
    if(buttons.importCard) {
        buttons.importCard.addEventListener('click', () => buttons.importCardInput.click());
        buttons.importCardInput.addEventListener('change', handleTavernImport);
    }
    
    // Lorebook
    if(buttons.addLore) buttons.addLore.addEventListener('click', addLoreEntry);
    buttons.deleteChar.addEventListener('click', deleteCurrentCharacter);
    inputs.charSelect.addEventListener('change', loadSelectedCharacter);
    
    // New Character Button
    const newCharBtn = document.createElement('button');
    newCharBtn.className = 'icon-btn-small';
    newCharBtn.innerText = '📄';
    newCharBtn.title = '重置表单 (New Character)';
    newCharBtn.onclick = resetCharacterForm;
    // Insert it before save button
    buttons.saveChar.parentNode.insertBefore(newCharBtn, buttons.saveChar);

    // Param Sliders
    inputs.temperature.addEventListener('input', (e) => labels.tempValue.innerText = e.target.value);
    inputs.presencePenalty.addEventListener('input', (e) => labels.presenceValue.innerText = e.target.value);
    inputs.frequencyPenalty.addEventListener('input', (e) => labels.frequencyValue.innerText = e.target.value);

    inputs.userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Image Uploads
    if(inputs.avatarInput) {
        inputs.avatarInput.addEventListener('change', (e) => handleImageUpload(e, 'avatar'));
    }
    if(inputs.bgInput) {
        inputs.bgInput.addEventListener('change', (e) => handleImageUpload(e, 'background'));
    }
}

function handleImageUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Limits
    const MAX_SIZE_MB = 2;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`图片过大，请使用小于 ${MAX_SIZE_MB}MB 的图片`);
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function() {
            // Compress / Resize
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            let width = img.width;
            let height = img.height;
            
            // Avatar needs smaller size
            const MAX_DIM = type === 'avatar' ? 256 : 1024; 
            
            if (width > height) {
                if (width > MAX_DIM) {
                    height *= MAX_DIM / width;
                    width = MAX_DIM;
                }
            } else {
                if (height > MAX_DIM) {
                    width *= MAX_DIM / height;
                    height = MAX_DIM;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Output
            const quality = type === 'avatar' ? 0.8 : 0.6;
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            
            // Update State
            if (type === 'avatar') {
                state.settings.avatar = dataUrl;
                if(inputs.avatarPreview) inputs.avatarPreview.src = dataUrl;
            } else {
                state.settings.background = dataUrl;
                if(inputs.bgPreviewStatus) inputs.bgPreviewStatus.innerText = '已设置 (Set)';
            }
            
            // Note: Not saving immediately to avoid spam, user must click Save Character
        };
    };
    reader.readAsDataURL(file);
}

function applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    state.theme = themeName;
    localStorage.setItem(THEME_KEY, themeName);
}

// --- Checkpoints (Time Machine) Logic ---

function openCheckpointPanel() {
    renderCheckpointList();
    panels.checkpoint.classList.remove('hidden');
}

function renderCheckpointList() {
    panels.checkpointList.innerHTML = '';
    if (state.checkpoints.length === 0) {
        panels.checkpointList.innerHTML = '<div style="text-align:center; color:var(--text-secondary); padding:10px;">暂无存档点</div>';
        return;
    }
    
    // Reverse order to show newest first
    [...state.checkpoints].reverse().forEach(cp => {
        const item = document.createElement('div');
        item.className = 'quick-item';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.textAlign = 'left';
        
        const date = new Date(cp.timestamp).toLocaleString();
        
        item.innerHTML = `
            <div>
                <div style="font-weight:600;">${cp.name}</div>
                <div style="font-size:12px; opacity:0.7;">${date} • ${cp.msgCount} msgs</div>
            </div>
            <div style="display:flex; gap:5px;">
                <button class="btn-small primary" onclick="window.loadCheckpoint('${cp.id}')">Load</button>
                <button class="btn-small danger" onclick="window.deleteCheckpoint('${cp.id}')">✕</button>
            </div>
        `;
        panels.checkpointList.appendChild(item);
    });
}

function createCheckpoint() {
    const name = inputs.checkpointName.value.trim() || `Auto-Checkpoint ${state.checkpoints.length + 1}`;
    const cp = {
        id: Date.now().toString(),
        name: name,
        timestamp: Date.now(),
        messages: JSON.parse(JSON.stringify(state.messages)),
        settings: JSON.parse(JSON.stringify(state.settings)),
        gameTime: JSON.parse(JSON.stringify(state.gameTime)),
        weather: state.weather,
        msgCount: state.messages.length
    };
    
    state.checkpoints.push(cp);
    saveState(true);
    inputs.checkpointName.value = '';
    renderCheckpointList();
}

// Expose to window for inline onclick
window.loadCheckpoint = function(id) {
    if(!confirm('确定要回退到这个节点吗？当前未保存的进度将丢失。')) return;
    
    const cp = state.checkpoints.find(c => c.id === id);
    if(cp) {
        state.messages = JSON.parse(JSON.stringify(cp.messages));
        state.settings = JSON.parse(JSON.stringify(cp.settings));
        state.gameTime = JSON.parse(JSON.stringify(cp.gameTime));
        state.weather = cp.weather;
        
        applySettingsToInputs();
        updateHUD();
        renderChat();
        saveState(true);
        panels.checkpoint.classList.add('hidden');
        alert(`已回溯至: ${cp.name}`);
    }
};

window.deleteCheckpoint = function(id) {
    if(!confirm('删除此存档点？')) return;
    state.checkpoints = state.checkpoints.filter(c => c.id !== id);
    saveState();
    renderCheckpointList();
};

// --- Undo & Regenerate Logic ---

function undoLastTurn() {
    if (state.messages.length === 0) return;
    
    if (confirm('确定要撤回上一轮对话吗？')) {
        // Remove last Assistant message if exists
        if (state.messages.length > 0 && state.messages[state.messages.length - 1].role === 'assistant') {
            state.messages.pop();
        }
        // Remove last User message if exists
        if (state.messages.length > 0 && state.messages[state.messages.length - 1].role === 'user') {
            state.messages.pop();
        }
        
        saveState(true);
        renderChat();
    }
}

function regenerateLastResponse() {
    if (state.messages.length === 0) return;
    
    // Check if last message is from AI
    const lastMsg = state.messages[state.messages.length - 1];
    if (lastMsg.role === 'assistant') {
        if (confirm('确定要重新生成 AI 的回复吗？')) {
            // Remove last AI message
            state.messages.pop();
            renderChat(); // update UI to remove bubble
            
            // Trigger API call again (using the logic from sendMessage, but skipping user input)
            // We need to re-construct the payload
            resendLastUserMessage();
        }
    } else {
        alert('上一条消息不是 AI 回复，无法重试。');
    }
}

async function resendLastUserMessage() {
    // Show Loading
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai loading';
    loadingDiv.innerHTML = '<div class="bubble">...</div>';
    ui.chatHistory.appendChild(loadingDiv);
    scrollToBottom();

    const fullSystemPrompt = buildSystemPrompt();
    const messagesPayload = [
        { role: 'system', content: fullSystemPrompt },
        ...state.messages // History (without the popped AI msg)
    ];

    try {
        const s = state.settings;
        const response = await fetch(s.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${s.apiKey}`
            },
            body: JSON.stringify({
                model: s.modelName,
                messages: messagesPayload,
                temperature: s.temperature,
                max_tokens: s.maxTokens,
                presence_penalty: s.presencePenalty,
                frequency_penalty: s.frequencyPenalty
            })
        });

        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        const aiContent = data.choices[0].message.content;

        ui.chatHistory.removeChild(loadingDiv);
        playMessageSound();
        addMessageBubble(aiContent, 'ai', true); 
        
    } catch (error) {
        ui.chatHistory.removeChild(loadingDiv);
        addSystemMessage(`重试失败: ${error.message}`);
    }
}

// --- Time & Weather Logic ---

function updateHUD() {
    // Format Time
    const h = state.gameTime.hour.toString().padStart(2, '0');
    const m = state.gameTime.minute.toString().padStart(2, '0');
    const period = state.gameTime.hour >= 6 && state.gameTime.hour < 18 ? 'Day' : 'Night';
    hud.time.innerText = `🕰️ ${h}:${m} (Day ${state.gameTime.day})`;
    
    // Format Weather
    let wIcon = '☀️';
    if (state.weather === 'rain') wIcon = '🌧️';
    if (state.weather === 'snow') wIcon = '❄️';
    if (state.weather === 'night') wIcon = '🌙'; // Special weather state for night override
    hud.weather.innerText = `${wIcon} ${state.weather.toUpperCase()}`;
    
    // Visual Effects
    hud.weatherLayer.className = 'weather-layer'; // Reset
    if (state.weather === 'rain') hud.weatherLayer.classList.add('rain');
    if (state.weather === 'snow') hud.weatherLayer.classList.add('snow');
    
    // Day/Night Cycle Visuals
    if (period === 'Night' || state.weather === 'night') {
        hud.weatherLayer.classList.add('night');
    }

    updateAmbientSound();
}

function updateAmbientSound() {
    // Stop all first
    audio.ambienceForest.pause();
    audio.ambienceRain.pause();

    if (!state.soundEnabled) return;

    // Logic for playing sound based on weather
    try {
        if (state.weather === 'rain') {
            audio.ambienceRain.volume = 0.5;
            audio.ambienceRain.play().catch(e => {});
        } else if (state.weather === 'sunny' || state.weather === 'snow' || state.weather === 'night') {
            // Default to forest ambience for now (maybe wind for snow later)
            audio.ambienceForest.volume = 0.3;
            audio.ambienceForest.play().catch(e => {});
        }
    } catch (e) {
        console.warn('Audio autoplay blocked or failed', e);
    }
}

function toggleHud() {
    state.hudCollapsed = !state.hudCollapsed;
    applyVisualSettings();
}

function advanceTime() {
    // Advance 4 hours
    state.gameTime.hour += 4;
    if (state.gameTime.hour >= 24) {
        state.gameTime.hour -= 24;
        state.gameTime.day += 1;
    }
    updateHUD();
    saveState(true);
}

function cycleWeather() {
    const weathers = ['sunny', 'rain', 'snow', 'night'];
    const currentIdx = weathers.indexOf(state.weather);
    const nextIdx = (currentIdx + 1) % weathers.length;
    state.weather = weathers[nextIdx];
    updateHUD();
    saveState(true);
}

function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    buttons.toggleSound.innerText = state.soundEnabled ? '🔊 音效: ON' : '🔇 音效: OFF';
}

function playMessageSound() {
    if (state.soundEnabled && audio.msgSound) {
        audio.msgSound.currentTime = 0;
        audio.msgSound.play().catch(e => console.log('Audio play failed', e));
    }
}

// --- Tools Logic ---

function exportData() {
    const data = {
        character: state.settings,
        history: state.messages,
        exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `rpg_export_${state.settings.charName || 'data'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.character && data.history) {
                if(!confirm('导入将覆盖当前未保存的修改，确定吗？')) return;
                
                state.settings = data.character;
                state.messages = data.history;
                
                // Compatibility check for saved chars list if present in export
                if (data.savedCharacters) state.savedCharacters = data.savedCharacters;
                if (data.categories) state.categories = data.categories;
                
                saveState();
                saveCharacterList();
                saveCategoryList();
                
                applySettingsToInputs();
                renderChat();
                alert('数据导入成功！');
            } else {
                alert('文件格式不正确 (Invalid Format)');
            }
        } catch (err) {
            alert('导入失败: ' + err.message);
        }
    };
    reader.readAsText(file);
    buttons.importFile.value = ''; // Reset
}

// --- Server Sync Logic (Dual Mode) ---
state.serverAvailable = false;

async function checkServerStatus() {
    try {
        const res = await fetch('/api/status');
        if (res.ok) {
            state.serverAvailable = true;
            document.getElementById('syncStatus').style.display = 'block';
            document.getElementById('syncState').innerText = 'Connected';
            document.getElementById('syncState').style.color = '#4caf50';
        }
    } catch (e) {
        console.log('Server sync not available (Local Mode)');
    }
}

// Sync Panel UI
function openSyncPanel() {
    if (!state.serverAvailable) {
        alert('未连接到同步服务器，无法使用云端功能。');
        return;
    }
    panels.sync.classList.remove('hidden');
    // Auto-detect mobile?
    if (window.innerWidth < 768 && state.identity === 'pc') {
        setIdentity('mobile');
    } else {
        setIdentity(state.identity);
    }
}

function setIdentity(id) {
    state.identity = id;
    if (id === 'pc') {
        buttons.setIdentityPc.classList.add('primary');
        buttons.setIdentityPc.style.background = ''; // reset to default css
        buttons.setIdentityPc.style.color = ''; 
        
        buttons.setIdentityMobile.classList.remove('primary');
        buttons.setIdentityMobile.style.background = 'transparent';
        buttons.setIdentityMobile.style.color = 'var(--text-color)';
        
        buttons.cloudUploadBtn.innerText = '📤 上传电脑数据 (PC -> Cloud)';
        buttons.cloudDownloadBtn.innerText = '📥 下载手机数据 (Mobile -> PC)';
    } else {
        buttons.setIdentityMobile.classList.add('primary');
        buttons.setIdentityMobile.style.background = '';
        buttons.setIdentityMobile.style.color = ''; 
        
        buttons.setIdentityPc.classList.remove('primary');
        buttons.setIdentityPc.style.background = 'transparent';
        buttons.setIdentityPc.style.color = 'var(--text-color)';
        
        buttons.cloudUploadBtn.innerText = '📤 上传手机数据 (Mobile -> Cloud)';
        buttons.cloudDownloadBtn.innerText = '📥 下载电脑数据 (PC -> Mobile)';
    }
}

async function syncUpload() {
    if (!state.serverAvailable) return;
    
    if (!confirm(`确定要将当前【${state.identity === 'pc' ? '电脑' : '手机'}】端的所有数据上传覆盖到云端吗？`)) return;

    const data = {
        settings: state.settings,
        messages: state.messages,
        savedCharacters: state.savedCharacters,
        categories: state.categories,
        checkpoints: state.checkpoints,
        quickCommands: state.quickCommands,
        theme: state.theme,
        gameTime: state.gameTime,
        weather: state.weather,
        timestamp: Date.now()
    };

    try {
        const btn = buttons.cloudUploadBtn;
        const originText = btn.innerText;
        btn.innerText = 'Uploading...';
        
        await fetch(`/api/data?source=${state.identity}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        btn.innerText = '✅ Uploaded';
        document.getElementById('syncState').innerText = 'Synced';
        document.getElementById('syncTime').innerText = new Date().toLocaleTimeString();
        
        setTimeout(() => btn.innerText = originText, 2000);
        
    } catch (e) {
        alert('Upload Failed: ' + e.message);
    }
}

async function syncDownload() {
    if (!state.serverAvailable) return;
    
    const targetSource = state.identity === 'pc' ? 'mobile' : 'pc';
    const targetName = state.identity === 'pc' ? '来自手机' : '来自电脑';
    
    if (!confirm(`确定要下载【${targetSource}】端的数据吗？\n\n这将会把对方的角色数据导入到「${targetName}」分类中。`)) return;

    try {
        const btn = buttons.cloudDownloadBtn;
        const originText = btn.innerText;
        btn.innerText = 'Downloading...';
        
        const res = await fetch(`/api/data?source=${targetSource}`);
        if (!res.ok) throw new Error('Network error');
        
        const data = await res.json();
        if (!data || !data.timestamp) {
            alert('云端暂无数据 (No Data)');
            btn.innerText = originText;
            return;
        }

        // --- Merge Logic ---
        
        // 1. Ensure Target Category Exists
        let targetCat = state.categories.find(c => c.name === targetName);
        if (!targetCat) {
            targetCat = { id: `sync_${targetSource}_${Date.now()}`, name: targetName, sharedPrompt: '' };
            state.categories.push(targetCat);
        }
        
        // 2. Import Characters
        let importCount = 0;
        if (data.savedCharacters && Array.isArray(data.savedCharacters)) {
            data.savedCharacters.forEach(remoteChar => {
                // Check if already exists (by ID) to avoid duplicates, or overwrite?
                // Strategy: Overwrite if ID matches, else add.
                // BUT we need to move it to the new category.
                
                // Clone char to avoid reference issues
                const newChar = JSON.parse(JSON.stringify(remoteChar));
                newChar.categoryId = targetCat.id; // FORCE category change
                
                // Optional: Add suffix to name to indicate sync? No, category is enough.
                
                const existingIdx = state.savedCharacters.findIndex(c => c.id === newChar.id);
                if (existingIdx >= 0) {
                    state.savedCharacters[existingIdx] = newChar;
                } else {
                    state.savedCharacters.push(newChar);
                }
                importCount++;
            });
        }
        
        // 3. Save & Refresh
        saveCharacterList();
        saveCategoryList();
        updateCategorySelectOptions();
        updateCharSelectOptions();
        
        btn.innerText = '✅ Done';
        alert(`同步完成！\n\n已导入 ${importCount} 个角色到「${targetName}」分类。\n\n提示：若需继续对方的对话进度，请手动选择角色。`);
        setTimeout(() => btn.innerText = originText, 2000);

    } catch (e) {
        alert('Download Failed: ' + e.message);
        console.error(e);
    }
}

// Replaces old forceSync / syncFromServer logic
function debouncedSync() {
    // Auto-sync is disabled in this new manual mode to prevent accidental overwrites
    // We only update status indicator
    if (state.serverAvailable) {
        // Maybe check last sync time?
    }
}

function showStats() {
    const msgCount = state.messages.length;
    const userMsgCount = state.messages.filter(m => m.role === 'user').length;
    const aiMsgCount = state.messages.filter(m => m.role === 'assistant').length;
    
    let totalChars = 0;
    state.messages.forEach(m => totalChars += m.content.length);
    const estTokens = Math.ceil(totalChars / 2);

    alert(`📊 数据统计 (Statistics)\n\n` +
          `总消息数: ${msgCount}\n` +
          `玩家发言: ${userMsgCount}\n` +
          `AI 回复: ${aiMsgCount}\n` +
          `总字符数: ${totalChars}\n` +
          `预估消耗 Token: ~${estTokens}`);
}

async function triggerRandomEvent() {
    if (!state.settings.apiKey) {
        alert('需要 API Key 才能生成随机事件');
        return;
    }
    
    // Close quick menu if open
    hud.quickMenu.classList.add('hidden');
    panels.eventSelection.classList.add('hidden'); // Hide previous if any

    // Build Prompt with Conditions
    let conditions = [];
    
    // 1. Category Conditions
    const cat = state.categories.find(c => c.id === state.settings.categoryId);
    if (cat && cat.eventConditions) {
        conditions.push(`[World/Category Rules]: ${cat.eventConditions}`);
    }
    
    // 2. Character Conditions
    if (state.settings.charEventConditions) {
        conditions.push(`[Character Fate/Tendency]: ${state.settings.charEventConditions}`);
    }
    
    const conditionText = conditions.length > 0 ? conditions.join('\n') : "No specific restrictions.";

    const eventPrompt = `【System Instruction: Random Event Generation】
Please generate 3 distinct random events/encounters based on the current story context.
You MUST follow these specific conditions:
${conditionText}

Format your response strictly as a JSON array of strings. Do not add any other text.
Example: ["You find a shiny coin.", "A stranger approaches you.", "It starts raining heavily."]`;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message system loading';
    loadingDiv.innerHTML = '<div class="bubble">🎲 正在构思随机事件 (Rolling)...</div>';
    ui.chatHistory.appendChild(loadingDiv);
    scrollToBottom();

    try {
        const s = state.settings;
        const tempMessages = [
            { role: 'system', content: buildSystemPrompt() },
            ...state.messages,
            { role: 'system', content: eventPrompt }
        ];

        const response = await fetch(s.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${s.apiKey}`
            },
            body: JSON.stringify({
                model: s.modelName,
                messages: tempMessages,
                temperature: 1.0 // High creativity
            })
        });

        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        let content = data.choices[0].message.content;
        
        ui.chatHistory.removeChild(loadingDiv);

        // Parse JSON
        let events = [];
        try {
            // Try to find JSON array in the text (in case model adds extra text)
            const jsonMatch = content.match(/\[.*\]/s);
            if (jsonMatch) {
                events = JSON.parse(jsonMatch[0]);
            } else {
                events = JSON.parse(content);
            }
        } catch (e) {
            // Fallback: split by newlines if JSON parsing fails
            events = content.split('\n').filter(line => line.trim().length > 5);
        }

        if (!Array.isArray(events) || events.length === 0) {
            throw new Error("Failed to parse events.");
        }

        // Show Selection Modal
        showEventSelection(events.slice(0, 3)); // Limit to 3

    } catch (e) {
        if(loadingDiv.parentNode) ui.chatHistory.removeChild(loadingDiv);
        alert('生成失败: ' + e.message);
    }
}

function showEventSelection(events) {
    panels.eventOptionsList.innerHTML = '';
    
    events.forEach((evtText, index) => {
        const btn = document.createElement('button');
        btn.className = 'quick-item';
        btn.style.textAlign = 'left';
        btn.style.whiteSpace = 'normal';
        btn.style.padding = '15px';
        btn.innerHTML = `<strong>Option ${index + 1}:</strong><br>${evtText}`;
        
        btn.onclick = () => confirmEvent(evtText);
        
        panels.eventOptionsList.appendChild(btn);
    });
    
    panels.eventSelection.classList.remove('hidden');
}

function confirmEvent(eventText) {
    panels.eventSelection.classList.add('hidden');
    
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message system';
    msgDiv.innerHTML = `<div class="bubble" style="background:#fff3cd; color:#856404; border:1px solid #ffeeba;"><b>🎲 随机事件</b><br>${eventText}</div>`;
    ui.chatHistory.appendChild(msgDiv);
    
    state.messages.push({ role: 'assistant', content: `[随机事件 / Random Event] ${eventText}` });
    saveState(true);
    scrollToBottom();
    playMessageSound();
}

// --- Category Logic ---

function updateCategorySelectOptions() {
    const currentVal = inputs.categorySelect.value;
    inputs.categorySelect.innerHTML = '';
    
    state.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.innerText = cat.name;
        inputs.categorySelect.appendChild(option);
    });

    if (state.categories.find(c => c.id === currentVal)) {
        inputs.categorySelect.value = currentVal;
    } else {
        inputs.categorySelect.value = 'default';
    }
}

function handleCategoryChange() {
    state.settings.categoryId = inputs.categorySelect.value;
    state.settings.id = null;
    
    inputs.categorySettingsPanel.style.display = 'none';
    
    updateCharSelectOptions();
    saveState();
}

function addNewCategory() {
    const name = prompt("请输入新分类名称：");
    if (name) {
        const newId = Date.now().toString();
        const newCat = { id: newId, name: name, sharedPrompt: '' };
        state.categories.push(newCat);
        saveCategoryList();
        updateCategorySelectOptions();
        
        inputs.categorySelect.value = newId;
        handleCategoryChange();
        
        toggleCategorySettings();
    }
}

function toggleCategorySettings() {
    const panel = inputs.categorySettingsPanel;
    if (panel.style.display === 'none') {
        const catId = inputs.categorySelect.value;
        const cat = state.categories.find(c => c.id === catId);
        if (cat) {
            inputs.categoryName.value = cat.name;
            inputs.categoryPrompt.value = cat.sharedPrompt || '';
            inputs.categoryEventConditions.value = cat.eventConditions || '';
            panel.style.display = 'block';
        }
    } else {
        panel.style.display = 'none';
    }
}

function saveCategorySettings() {
    const catId = inputs.categorySelect.value;
    const cat = state.categories.find(c => c.id === catId);
    if (cat) {
        cat.name = inputs.categoryName.value.trim();
        cat.sharedPrompt = inputs.categoryPrompt.value.trim();
        cat.eventConditions = inputs.categoryEventConditions.value.trim();
        
        saveCategoryList();
        updateCategorySelectOptions();
        alert('分类设定已保存');
    }
}

function deleteCategory() {
    const catId = inputs.categorySelect.value;
    if (catId === 'default') {
        alert('无法删除默认分类');
        return;
    }
    
    if (confirm('确定删除此分类吗？分类下的角色将被移动到默认分类。')) {
        state.savedCharacters.forEach(c => {
            if (c.categoryId === catId) {
                c.categoryId = 'default';
            }
        });
        saveCharacterList();

        state.categories = state.categories.filter(c => c.id !== catId);
        saveCategoryList();
        
        updateCategorySelectOptions();
        inputs.categorySelect.value = 'default';
        handleCategoryChange();
    }
}

// --- Character Logic ---

function updateCharSelectOptions() {
    const currentCatId = inputs.categorySelect.value;
    const currentVal = inputs.charSelect.value;
    
    inputs.charSelect.innerHTML = '<option value="">-- 新建/未保存 --</option>';
    
    const filteredChars = state.savedCharacters.filter(c => {
        const cCat = c.categoryId || 'default';
        return cCat === currentCatId;
    });

    filteredChars.forEach(char => {
        const option = document.createElement('option');
        option.value = char.id;
        option.innerText = char.charName || '未命名';
        inputs.charSelect.appendChild(option);
    });

    if (filteredChars.find(c => c.id === currentVal)) {
        inputs.charSelect.value = currentVal;
    } else {
        inputs.charSelect.value = "";
    }
}

function resetCharacterForm() {
    state.settings.id = null;
    inputs.charSelect.value = "";
    
    // Reset inputs to default or empty
    inputs.charName.value = "";
    inputs.systemPrompt.value = "";
    inputs.worldLore.value = "";
    inputs.mission.value = "";
    inputs.currentScenario.value = "";
    
    alert("已重置表单，请填写新角色信息并保存。");
}

function saveCurrentCharacter() {
    updateSettingsFromInputs();
    const s = state.settings;
    
    if (!s.charName) {
        alert('请先输入角色名称');
        return;
    }

    let charId = s.id;
    if (!charId) {
        charId = Date.now().toString(); 
        s.id = charId;
    }

    const charProfile = {
        id: charId,
        categoryId: s.categoryId || 'default', 
        
        charName: s.charName,
        systemPrompt: s.systemPrompt,
        worldLore: s.worldLore,
        mission: s.mission,
        currentScenario: s.currentScenario,
        
        aiInstructions: s.aiInstructions,
        language: s.language,
        userName: s.userName,
        userDesc: s.userDesc,

        apiUrl: s.apiUrl,
        apiKey: s.apiKey,
        modelName: s.modelName,
        temperature: s.temperature,
        maxTokens: s.maxTokens,
        presencePenalty: s.presencePenalty,
        frequencyPenalty: s.frequencyPenalty,
        fontSize: s.fontSize,
        typingSpeed: s.typingSpeed
    };

    const idx = state.savedCharacters.findIndex(c => c.id === charId);
    if (idx >= 0) {
        state.savedCharacters[idx] = charProfile;
    } else {
        state.savedCharacters.push(charProfile);
    }

    saveCharacterList();
    saveState(true); 
    updateCharSelectOptions();
    inputs.charSelect.value = charId;
    alert('角色已保存');
}

function deleteCurrentCharacter() {
    const charId = inputs.charSelect.value;
    if (!charId) return;

    if (confirm('确定要删除这个角色存档吗？')) {
        state.savedCharacters = state.savedCharacters.filter(c => c.id !== charId);
        saveCharacterList();
        
        state.settings.id = null;
        saveState();
        
        updateCharSelectOptions();
        inputs.charSelect.value = ""; 
    }
}

function loadSelectedCharacter() {
    const charId = inputs.charSelect.value;
    if (!charId) {
        state.settings.id = null;
        return;
    }

    const char = state.savedCharacters.find(c => c.id === charId);
    if (char) {
        state.settings = { ...state.settings, ...char };
        if (char.categoryId && char.categoryId !== inputs.categorySelect.value) {
            inputs.categorySelect.value = char.categoryId;
            handleCategoryChange(); 
            setTimeout(() => { inputs.charSelect.value = char.id; }, 0);
        }
        
        applySettingsToInputs();
        
        // Apply Background immediately
        if (state.settings.background) {
            views.chat.style.backgroundImage = `url('${state.settings.background}')`;
            views.chat.style.backgroundSize = 'cover';
            views.chat.style.backgroundPosition = 'center';
        } else {
            views.chat.style.backgroundImage = '';
        }
        
        // Show Avatar
        if (state.settings.avatar) {
            ui.chatAvatar.src = state.settings.avatar;
            ui.chatAvatar.classList.remove('hidden');
        } else {
            ui.chatAvatar.classList.add('hidden');
        }
        
        saveState();
    }
}

// Navigation
function showSettings() {
    views.chat.classList.remove('active');
    views.settings.classList.add('active');
}

function startChat() {
    updateSettingsFromInputs();

    if (!state.settings.apiKey) {
        alert('请输入 API Key');
        return;
    }

    if (!state.settings.systemPrompt && !state.settings.worldLore) {
        const cat = state.categories.find(c => c.id === state.settings.categoryId);
        if ((!cat || !cat.sharedPrompt) && !state.settings.systemPrompt) {
             alert('请至少输入角色设定、世界观或分类公共设定');
             return;
        }
    }

    saveState(true);
    
    // Apply Visuals
    if (state.settings.background) {
        views.chat.style.backgroundImage = `url('${state.settings.background}')`;
        views.chat.style.backgroundSize = 'cover';
        views.chat.style.backgroundPosition = 'center';
    } else {
        views.chat.style.backgroundImage = '';
    }
    
    if (state.settings.avatar) {
        ui.chatAvatar.src = state.settings.avatar;
        ui.chatAvatar.classList.remove('hidden');
    } else {
        ui.chatAvatar.classList.add('hidden');
    }

    ui.chatTitle.innerText = state.settings.charName || '未命名角色';
    renderChat();
    // renderQuickCmdBar(); // Render quick commands - Wait, this function is missing in source? 
    // It was in Read output? Let me check. 
    // Read output line 1232: renderQuickCmdBar(); 
    // But I don't see the function definition in Read output!
    // It might be missing. I should add it or comment it out if it doesn't exist.
    // I'll comment it out for now to be safe, or implement it. 
    // The quick commands feature was requested. I should implement it.
    renderQuickCmdBar();
    
    views.settings.classList.remove('active');
    views.chat.classList.add('active');
    
    scrollToBottom();
}

// Quick Commands Logic
function addQuickCommand() {
    const name = inputs.cmdName.value.trim();
    const content = inputs.cmdContent.value.trim();
    const scope = inputs.cmdScope.value;
    
    if (!name || !content) {
        alert('请输入指令名称和内容');
        return;
    }
    
    const cmd = {
        id: Date.now().toString(),
        name,
        content,
        scope
    };
    
    state.quickCommands.push(cmd);
    saveState();
    
    inputs.cmdName.value = '';
    inputs.cmdContent.value = '';
    renderCmdList();
}

function renderCmdList() {
    inputs.cmdList.innerHTML = '';
    state.quickCommands.forEach(cmd => {
        const div = document.createElement('div');
        div.className = 'quick-item';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.innerHTML = `
            <span>${cmd.name} (${cmd.scope === 'global' ? 'Global' : 'Category'})</span>
            <button class="btn-small danger" onclick="deleteQuickCmd('${cmd.id}')">✕</button>
        `;
        inputs.cmdList.appendChild(div);
    });
}

window.deleteQuickCmd = function(id) {
    if(confirm('删除此指令?')) {
        state.quickCommands = state.quickCommands.filter(c => c.id !== id);
        saveState();
        renderCmdList();
    }
};

function renderQuickCmdBar() {
    const bar = hud.quickCmdBar;
    bar.innerHTML = '';
    
    const cmds = state.quickCommands.filter(cmd => {
        if (cmd.scope === 'global') return true;
        return cmd.scope === 'category' && state.settings.categoryId === inputs.categorySelect.value; // Approximate check
    });
    
    if (cmds.length === 0) {
        bar.classList.add('hidden');
        return;
    }
    bar.classList.remove('hidden');
    
    cmds.forEach(cmd => {
        const pill = document.createElement('button');
        pill.className = 'cmd-pill';
        pill.innerText = cmd.name;
        pill.onclick = () => {
            inputs.userInput.value = cmd.content;
            inputs.userInput.focus();
        };
        bar.appendChild(pill);
    });
}

// Chat Logic
function renderChat() {
    ui.chatHistory.innerHTML = '';
    
    if (state.messages.length === 0) {
        addSystemMessage(`已连接到 ${state.settings.charName || '角色'}。开始对话吧！`);
    } else {
        state.messages.forEach((msg, index) => {
            if (msg.role === 'user') addMessageBubble(msg.content, 'user', false, index);
            else if (msg.role === 'assistant') {
                // If it was a streamed response saved previously, it might have metadata
                addMessageBubble(msg.content, 'ai', false, index, msg.timeTaken);
            }
        });
    }
}

function addMessageBubble(text, type, animate = false, index = -1, timeTaken = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    if (index === -1) index = state.messages.length; // Approximate
    msgDiv.setAttribute('data-index', index);
    
    if (state.messages[index] && state.messages[index].starred) {
        msgDiv.classList.add('starred');
    }

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    // Action Buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    actionsDiv.innerHTML = `
        <button class="action-btn" onclick="window.copyMessage(this)">📋</button>
        <button class="action-btn" onclick="window.starMessage(this)">⭐</button>
    `;

    msgDiv.appendChild(bubble);
    
    // Time Taken Display
    if (type === 'ai' && timeTaken) {
        const timeDiv = document.createElement('div');
        timeDiv.className = 'msg-info';
        timeDiv.innerText = `⏱️ ${timeTaken}s`;
        msgDiv.appendChild(timeDiv);
    }
    
    msgDiv.appendChild(actionsDiv); 
    ui.chatHistory.appendChild(msgDiv);
    
    if (animate && type === 'ai') {
        let i = 0;
        bubble.innerText = '';
        const speed = state.settings.typingSpeed || 30; 
        
        function typeChar() {
            if (i < text.length) {
                bubble.innerText += text.charAt(i);
                i++;
                if (i % 10 === 0) scrollToBottom(); 
                setTimeout(typeChar, speed);
            } else {
                const newMsg = { role: 'assistant', content: text, timeTaken: timeTaken };
                state.messages.push(newMsg);
                msgDiv.setAttribute('data-index', state.messages.length - 1);
                saveState(true);
            }
        }
        typeChar();
    } else {
        if (typeof text === 'string' && text.startsWith('<div')) {
            msgDiv.innerHTML = text; 
        } else {
            bubble.innerText = text; 
        }
    }
    
    return bubble; 
}

function addSystemMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message system';
    msgDiv.innerHTML = `<div class="bubble">${text}</div>`;
    ui.chatHistory.appendChild(msgDiv);
}

function scrollToBottom() {
    ui.chatHistory.scrollTop = ui.chatHistory.scrollHeight;
}

function clearHistory() {
    if (confirm('确定要清除对话历史吗？')) {
        state.messages = [];
        saveState();
        renderChat();
    }
}

function buildSystemPrompt() {
    const s = state.settings;
    let parts = [];

    // 0. Language Instruction
    if (s.language === 'en') parts.push('[Instruction: Please reply in English.]');
    else if (s.language === 'ja') parts.push('[Instruction: 日本語で返信してください。]');
    else parts.push('[Instruction: 请使用中文回复。]');

    // 1. AI Functional Instructions
    if (s.aiInstructions) {
        parts.push(`【AI 功能指令 / AI Instructions】\n${s.aiInstructions}`);
    } else {
        parts.push(`【AI 功能指令 / AI Instructions】\nYou are an immersive role-playing AI. Stay in character strictly.`);
    }

    // 2. Category Shared Prompt
    const cat = state.categories.find(c => c.id === (s.categoryId || 'default'));
    if (cat && cat.sharedPrompt) {
        parts.push(`【分类公共设定 / Shared Rules (${cat.name})】\n${cat.sharedPrompt}`);
    }

    // 3. World Setting (Inject Time & Weather!)
    const timeStr = `${state.gameTime.hour}:${state.gameTime.minute.toString().padStart(2, '0')}`;
    parts.push(`【世界观 / World Setting】\n${s.worldLore || ''}\n[Current Time: ${timeStr} (Day ${state.gameTime.day})]\n[Current Weather: ${state.weather}]`);

    // 4. Character Card
    if (s.systemPrompt) parts.push(`【角色设定 / Character Card】\nName: ${s.charName}\n${s.systemPrompt}`);

    // 5. User Persona
    if (s.userName || s.userDesc) {
        parts.push(`【玩家设定 / User Persona】\nName: ${s.userName || 'User'}\nDescription: ${s.userDesc || 'Unknown'}`);
    }

    // 6. Mission & Scenario
    if (s.mission) parts.push(`【当前任务 / Mission】\n${s.mission}`);
    if (s.currentScenario) parts.push(`【当前情景 / Current Scenario】\n${s.currentScenario}`);

    return parts.join('\n\n');
}

async function sendMessage() {
    const text = inputs.userInput.value.trim();
    if (!text) return;

    // 1. Add User Message
    addMessageBubble(text, 'user');
    inputs.userInput.value = '';
    inputs.userInput.style.height = 'auto'; 
    scrollToBottom();
    
    // Advance Time slightly per turn? (e.g. 5 mins)
    state.gameTime.minute += 5;
    if (state.gameTime.minute >= 60) {
        state.gameTime.minute = 0;
        state.gameTime.hour += 1;
        if (state.gameTime.hour >= 24) {
            state.gameTime.hour = 0;
            state.gameTime.day += 1;
        }
    }
    updateHUD();

    // 2. Prepare API Request
    const fullSystemPrompt = buildSystemPrompt();
    
    const messagesPayload = [
        { role: 'system', content: fullSystemPrompt },
        ...state.messages, 
        { role: 'user', content: text }
    ];

    state.messages.push({ role: 'user', content: text });
    saveState(true);

    // 3. Show Loading
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai loading';
    loadingDiv.innerHTML = '<div class="bubble">...</div>';
    ui.chatHistory.appendChild(loadingDiv);
    scrollToBottom();

    try {
        const s = state.settings;
        const response = await fetch(s.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${s.apiKey}`
            },
            body: JSON.stringify({
                model: s.modelName,
                messages: messagesPayload,
                temperature: s.temperature,
                max_tokens: s.maxTokens,
                presence_penalty: s.presencePenalty,
                frequency_penalty: s.frequencyPenalty,
                stream: true // Enable Streaming
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `API Error: ${response.status}`);
        }

        // 4. Remove Loading & Setup Stream
        ui.chatHistory.removeChild(loadingDiv);
        playMessageSound();
        
        // Create initial bubble
        const bubble = addMessageBubble('', 'ai', false); 
        let fullText = "";
        let startTime = Date.now();
        const msgIndex = state.messages.length; // Will be pushed after stream

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.trim() === '') continue;
                if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6);
                    if (jsonStr === '[DONE]') continue;
                    try {
                        const json = JSON.parse(jsonStr);
                        const content = json.choices[0].delta.content || "";
                        if (content) {
                            fullText += content;
                            bubble.innerText = fullText;
                            scrollToBottom();
                        }
                    } catch (e) { console.error("Stream parse error", e); }
                }
            }
        }

        // Finalize
        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(1);
        state.messages.push({ role: 'assistant', content: fullText, timeTaken: timeTaken });
        
        // Update data-index on the bubble's container
        bubble.closest('.message').setAttribute('data-index', msgIndex);
        
        // Add time info to the bubble
        const msgDiv = bubble.closest('.message');
        const timeDiv = document.createElement('div');
        timeDiv.className = 'msg-info';
        timeDiv.innerText = `⏱️ ${timeTaken}s`;
        // Insert before actions div if exists
        const actionsDiv = msgDiv.querySelector('.message-actions');
        if (actionsDiv) msgDiv.insertBefore(timeDiv, actionsDiv);
        else msgDiv.appendChild(timeDiv);

        saveState(true);

    } catch (error) {
        if(loadingDiv.parentNode) ui.chatHistory.removeChild(loadingDiv);
        addSystemMessage(`发送失败: ${error.message}`);
        console.error(error);
    }
    
    scrollToBottom();
}

// --- Touch Feedback ---
document.addEventListener('click', function(e) {
    createRipple(e.pageX, e.pageY);
});

document.addEventListener('touchstart', function(e) {
    // Use the first touch point
    if(e.touches.length > 0) {
        createRipple(e.touches[0].pageX, e.touches[0].pageY);
    }
}, {passive: true});

function createRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'touch-ripple';
    ripple.style.left = (x - 10) + 'px'; // Center 20px ripple
    ripple.style.top = (y - 10) + 'px';
    ripple.style.width = '20px';
    ripple.style.height = '20px';
    
    document.body.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// --- Message Actions (Global) ---

window.copyMessage = function(btn) {
    const bubble = btn.closest('.message').querySelector('.bubble');
    if (!bubble) return;
    
    const text = bubble.innerText;
    navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.innerText;
        btn.innerText = '✅';
        setTimeout(() => btn.innerText = originalText, 1500);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
};

window.starMessage = function(btn) {
    const msgDiv = btn.closest('.message');
    if (!msgDiv) return;
    
    const index = parseInt(msgDiv.getAttribute('data-index'));
    if (isNaN(index) || !state.messages[index]) return;
    
    const isStarred = !state.messages[index].starred;
    state.messages[index].starred = isStarred;
    
    if (isStarred) {
        msgDiv.classList.add('starred');
        btn.innerText = '⭐'; // Filled star visual if we had one, or just keep same
    } else {
        msgDiv.classList.remove('starred');
        btn.innerText = '⭐'; 
    }
    
    saveState();
};

// --- Lorebook Logic ---
function renderLorebookList() {
    inputs.loreList.innerHTML = '';
    const list = state.settings.lorebook || [];
    
    list.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'quick-item';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.padding = '5px 10px';
        
        div.innerHTML = `
            <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:80%;">
                <span style="font-weight:bold; color:var(--primary-color);">${item.key}</span>
                <span style="font-size:12px; opacity:0.7; margin-left:5px;">${item.content}</span>
            </div>
            <button class="btn-small danger" onclick="deleteLoreEntry(${index})" style="padding:2px 6px;">✕</button>
        `;
        inputs.loreList.appendChild(div);
    });
}

function addLoreEntry() {
    const key = inputs.loreKey.value.trim();
    const content = inputs.loreContent.value.trim();
    
    if (!key || !content) {
        alert('请输入关键词和内容');
        return;
    }
    
    if (!state.settings.lorebook) state.settings.lorebook = [];
    state.settings.lorebook.push({ key, content });
    
    inputs.loreKey.value = '';
    inputs.loreContent.value = '';
    
    renderLorebookList();
    saveState();
}

window.deleteLoreEntry = function(index) {
    if (!state.settings.lorebook) return;
    state.settings.lorebook.splice(index, 1);
    renderLorebookList();
    saveState();
};

function scanLorebook() {
    if (!state.settings.lorebook || state.settings.lorebook.length === 0) return '';
    
    // Get recent context (User input + last 2 messages)
    let context = inputs.userInput.value || '';
    const recentMsgs = state.messages.slice(-2);
    recentMsgs.forEach(m => context += '\n' + m.content);
    
    const hits = [];
    state.settings.lorebook.forEach(item => {
        // Simple keyword match (case insensitive)
        if (context.toLowerCase().includes(item.key.toLowerCase())) {
            hits.push(`${item.key}: ${item.content}`);
        }
    });
    
    return hits.join('\n');
}

// --- Tavern Card Import Logic (PNG) ---

function handleTavernImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const arrayBuffer = event.target.result;
        try {
            const charData = readTavernPNG(arrayBuffer);
            if (charData) {
                if(!confirm(`检测到角色卡：${charData.name || 'Unknown'}\n确定导入吗？这将覆盖当前编辑的内容。`)) return;
                
                applyTavernData(charData);
                
                // Also set the image as avatar
                const blob = new Blob([arrayBuffer], { type: 'image/png' });
                const urlReader = new FileReader();
                urlReader.onload = function(ue) {
                    state.settings.avatar = ue.target.result;
                    if(inputs.avatarPreview) inputs.avatarPreview.src = state.settings.avatar;
                    saveState();
                };
                urlReader.readAsDataURL(blob);
                
                alert('角色卡导入成功！');
            } else {
                alert('未能在图片中找到角色数据 (No Tavern Data found)');
            }
        } catch (err) {
            console.error(err);
            alert('读取失败: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
    buttons.importCardInput.value = '';
}

function applyTavernData(data) {
    // Map Tavern V2/V1 fields to our schema
    const s = state.settings;
    
    // Check if data is inside 'data' property (V2) or root
    const char = data.data || data; 
    
    s.charName = char.name || '';
    s.systemPrompt = char.description || '';
    if (char.personality) {
        s.systemPrompt += '\n\n[Personality]\n' + char.personality;
    }
    
    s.worldLore = char.scenario || '';
    s.currentScenario = char.first_mes || '';
    
    // Mes Examples
    if (char.mes_example) {
        s.systemPrompt += '\n\n[Dialogue Examples]\n' + char.mes_example;
    }
    
    // Lorebook (Character Book in Tavern)
    s.lorebook = [];
    if (char.character_book && char.character_book.entries) {
        char.character_book.entries.forEach(entry => {
            // Check if enabled
            if (entry.enabled === false) return;
            
            // Keys can be array or string
            let keys = entry.keys;
            if (Array.isArray(keys)) keys = keys.join(', ');
            
            s.lorebook.push({
                key: keys,
                content: entry.content
            });
        });
    }
    
    applySettingsToInputs();
    saveState();
}

function readTavernPNG(buffer) {
    const dataView = new DataView(buffer);
    
    // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (dataView.getUint32(0) !== 0x89504E47 || dataView.getUint32(4) !== 0x0D0A1A0A) {
        throw new Error("Not a valid PNG file");
    }
    
    let offset = 8;
    const decoder = new TextDecoder('utf-8');
    
    while (offset < buffer.byteLength) {
        const length = dataView.getUint32(offset);
        const type = decoder.decode(buffer.slice(offset + 4, offset + 8));
        
        if (type === 'tEXt') {
            const chunkData = new Uint8Array(buffer, offset + 8, length);
            // tEXt format: keyword + null + text
            let nullIndex = -1;
            for(let i=0; i<length; i++) {
                if(chunkData[i] === 0) {
                    nullIndex = i;
                    break;
                }
            }
            
            if (nullIndex > 0) {
                const keyword = decoder.decode(chunkData.slice(0, nullIndex));
                if (keyword === 'chara') {
                    const text = decoder.decode(chunkData.slice(nullIndex + 1));
                    const base64Content = text;
                    try {
                        const jsonStr = atob(base64Content);
                        return JSON.parse(jsonStr); // Tavern V2
                    } catch(e) {
                        console.log("Not V2 Base64, trying plain JSON or V1");
                        // Fallback logic could go here, but usually 'chara' is base64
                    }
                }
            }
        }
        
        offset += 12 + length; // Length(4) + Type(4) + Data(Length) + CRC(4)
    }
    return null;
}

// Start
init();
