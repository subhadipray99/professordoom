// DOM Elements
const landingScreen = document.getElementById('landingScreen');
const uploadScreen = document.getElementById('uploadScreen');
const loadingScreen = document.getElementById('loadingScreen');
const mainScreen = document.getElementById('mainScreen');
const enterBtn = document.getElementById('enterBtn');
const uploadBox = document.getElementById('uploadBox');
const resumeInput = document.getElementById('resumeInput');
const loadingText = document.getElementById('loadingText');
const loadingProgress = document.getElementById('loadingProgress');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const newResumeBtn = document.getElementById('newResumeBtn');
const sectionBtns = document.querySelectorAll('.section-btn');
const audioPlayer = document.getElementById('audioPlayer');
const audioControls = document.getElementById('audioControls');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');

// State
let resumeData = null;
let rawResumeText = null; // Store raw resume for context
let chatHistory = []; // Store chat history for context
let confessions = []; // Store user confessions
let analysisCache = {};
let currentPlayingBtn = null;

// Confession Booth Elements
const confessionBtn = document.getElementById('confessionBtn');
const confessionModal = document.getElementById('confessionModal');
const closeConfession = document.getElementById('closeConfession');
const confessionsList = document.getElementById('confessionsList');
const confessionInput = document.getElementById('confessionInput');
const addConfessionBtn = document.getElementById('addConfessionBtn');
const getAbsolutionBtn = document.getElementById('getAbsolutionBtn');
const confessionCount = document.getElementById('confessionCount');

// Loading messages
const loadingMessages = [
    "Creepy professor snatched your resume...",
    "He is smiling...",
    "Analyzing your resume...",
    "Analyzing YOU...",
    "Reading between the lines...",
    "Calculating your doom...",
    "Almost done with the autopsy..."
];

// Section prompts (kept short for concise responses)
const sectionPrompts = {
    'roast': `Roast this resume in 3-4 punchy sentences. Be brutal, funny, hit the main weaknesses only.`,
    'ai-replace': `AI Replacement Risk: Give a percentage (0-100%) and 2-3 sentences explaining why. Be direct.`,
    'futureproof': `Futureproof Score: Give a percentage (0-100%) and 2-3 sentences on their resilience. Brief.`,
    'improve': `List TOP 3 things to improve. One sentence each. Be specific and actionable.`,
    'jobs': `List 4-5 jobs they're qualified for. Job title + one line explanation each.`
};

// Upload handlers
uploadBox.addEventListener('click', () => resumeInput.click());

uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '#ff6666';
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.style.borderColor = '';
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') handleUpload(file);
    else alert('Please upload a PDF file');
});

resumeInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleUpload(e.target.files[0]);
});

// Handle file upload
async function handleUpload(file) {
    showScreen('loading');
    await animateLoading();

    const formData = new FormData();
    formData.append('resume', file);

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            resumeData = data;
            rawResumeText = data.resumeText; // Store raw resume
            chatHistory = [];
            analysisCache = {};
            showScreen('main');
            // Auto-click roast section
            document.querySelector('[data-section="roast"]').click();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
        showScreen('upload');
    }
}

// Animate loading screen
async function animateLoading() {
    for (let i = 0; i < loadingMessages.length; i++) {
        loadingText.textContent = loadingMessages[i];
        loadingProgress.style.width = ((i + 1) / loadingMessages.length * 100) + '%';
        await sleep(800);
    }
}

// Section button handlers
sectionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        sectionBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const section = btn.dataset.section;
        loadSection(section);
    });
});

// Load section content
async function loadSection(section) {
    if (analysisCache[section]) {
        displayMessage(section, analysisCache[section]);
        return;
    }

    addTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resumeText: resumeData.analysis,
                prompt: sectionPrompts[section]
            })
        });
        const data = await response.json();
        
        removeTypingIndicator();

        if (data.success) {
            analysisCache[section] = data.response;
            displayMessage(section, data.response);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        removeTypingIndicator();
        displayMessage(section, 'Error: ' + error.message);
    }
}

// Parse markdown to HTML
function parseMarkdown(text) {
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            breaks: true,
            gfm: true
        });
        return marked.parse(text);
    }
    // Fallback if marked not loaded
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

// Section titles mapping
const sectionTitles = {
    'roast': '🔥 The Roast',
    'ai-replace': '🤖 AI Replacement Risk',
    'futureproof': '🛡️ Futureproof Score',
    'improve': '📈 What to Improve',
    'jobs': '💼 Eligible Jobs',
    'custom': '💬 Professor Says'
};

// Display message in chat
function displayMessage(section, content, isUser = false, isElaborate = false) {
    const rawContent = content;
    const htmlContent = isUser ? content : parseMarkdown(content);

    if (isUser) {
        chatMessages.innerHTML += `<div class="message user">${htmlContent}</div>`;
    } else {
        const title = sectionTitles[section] || '🎃 Professor Doom';
        const msgId = 'msg-' + Date.now();
        const elaborateBtn = !isElaborate ? 
            `<button class="elaborate-btn" onclick="elaborateMsg('${msgId}', '${section}')">📖 Elaborate</button>` : '';
        
        chatMessages.innerHTML += `
            <div class="message professor" id="${msgId}" data-raw="${encodeURIComponent(rawContent)}" data-section="${section}">
                <div class="message-header">
                    <span class="message-title">${title}</span>
                    <div class="message-actions">
                        ${elaborateBtn}
                        <button class="play-btn" onclick="playAudioFromMsg('${msgId}')">▶️ Play</button>
                    </div>
                </div>
                <div class="message-content">${htmlContent}</div>
            </div>
        `;
    }
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Elaborate on a message
async function elaborateMsg(msgId, section) {
    const msgEl = document.getElementById(msgId);
    const rawText = decodeURIComponent(msgEl.dataset.raw);
    const btn = msgEl.querySelector('.elaborate-btn');
    
    btn.textContent = '⏳ Loading...';
    btn.disabled = true;

    addTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resumeText: resumeData.analysis,
                prompt: `Elaborate in detail on this topic. Give a comprehensive, thorough explanation with examples and specifics. Previous brief answer was: "${rawText}". Now expand on this significantly.`,
                elaborate: true
            })
        });
        const data = await response.json();
        
        removeTypingIndicator();

        if (data.success) {
            // Remove elaborate button from original message
            btn.remove();
            // Add new elaborate message
            displayMessage(section, data.response, false, true);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        removeTypingIndicator();
        btn.textContent = '📖 Elaborate';
        btn.disabled = false;
        alert('Error: ' + error.message);
    }
}

// Play audio from message element
function playAudioFromMsg(msgId) {
    const msgEl = document.getElementById(msgId);
    const rawText = decodeURIComponent(msgEl.dataset.raw);
    const btn = msgEl.querySelector('.play-btn');
    playAudio(btn, rawText);
}

// Play audio for a section
async function playAudio(btn, text) {
    if (currentPlayingBtn) {
        currentPlayingBtn.textContent = '▶️ Play';
        currentPlayingBtn.disabled = false;
    }

    btn.textContent = '⏳ Loading...';
    btn.disabled = true;
    currentPlayingBtn = btn;

    try {
        const response = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (response.ok) {
            const blob = await response.blob();
            audioPlayer.src = URL.createObjectURL(blob);
            audioPlayer.play();
            
            btn.textContent = '🔊 Playing...';
            audioControls.style.display = 'flex';
            pauseBtn.textContent = '⏸️ Pause';

            audioPlayer.onended = () => {
                btn.textContent = '▶️ Play';
                btn.disabled = false;
                audioControls.style.display = 'none';
                currentPlayingBtn = null;
            };
        } else {
            throw new Error('Failed to generate audio');
        }
    } catch (error) {
        btn.textContent = '▶️ Play';
        btn.disabled = false;
        currentPlayingBtn = null;
        alert('Audio error: ' + error.message);
    }
}

// Audio controls
pauseBtn.addEventListener('click', () => {
    if (audioPlayer.paused) {
        audioPlayer.play();
        pauseBtn.textContent = '⏸️ Pause';
    } else {
        audioPlayer.pause();
        pauseBtn.textContent = '▶️ Resume';
    }
});

stopBtn.addEventListener('click', () => {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    audioControls.style.display = 'none';
    if (currentPlayingBtn) {
        currentPlayingBtn.textContent = '▶️ Play';
        currentPlayingBtn.disabled = false;
        currentPlayingBtn = null;
    }
});

// Custom chat
sendBtn.addEventListener('click', sendCustomMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendCustomMessage();
});

async function sendCustomMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    displayMessage('custom', message, true);
    chatInput.value = '';
    
    // Add to chat history
    chatHistory.push({ role: 'user', content: message });
    
    addTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resumeText: rawResumeText || resumeData.analysis,
                prompt: message,
                history: chatHistory.slice(-6),
                confessions: confessions.map(c => c.text) // Include confessions for context
            })
        });
        const data = await response.json();
        
        removeTypingIndicator();

        if (data.success) {
            chatHistory.push({ role: 'assistant', content: data.response });
            displayMessage('custom', data.response);
            trackManualChat(); // Track for Summary Room unlock
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        removeTypingIndicator();
        displayMessage('custom', 'Error: ' + error.message);
    }
}

// Typing indicator
function addTypingIndicator() {
    chatMessages.innerHTML += `
        <div class="message professor typing" id="typingIndicator">
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    document.getElementById('typingIndicator')?.remove();
}

// New resume button
newResumeBtn.addEventListener('click', () => {
    resumeData = null;
    rawResumeText = null;
    chatHistory = [];
    confessions = [];
    manualChatCount = 0;
    analysisCache = {};
    chatMessages.innerHTML = '';
    resumeInput.value = '';
    updateConfessionCount();
    resetSummaryLock();
    showScreen('upload');
});

// Reset summary lock
function resetSummaryLock() {
    summaryBtn.classList.add('locked');
    summaryBtn.classList.remove('unlocked');
    summaryLock.style.display = 'inline';
    unlockProgress.style.display = 'inline';
    unlockProgress.textContent = '0/3';
}

// Screen management
function showScreen(screen) {
    landingScreen.style.display = screen === 'landing' ? 'flex' : 'none';
    uploadScreen.style.display = screen === 'upload' ? 'block' : 'none';
    loadingScreen.style.display = screen === 'loading' ? 'block' : 'none';
    mainScreen.style.display = screen === 'main' ? 'block' : 'none';
}

// Landing page enter button
enterBtn.addEventListener('click', () => {
    showScreen('upload');
});

// Typing animation for landing page
const typingPhrases = [
    "Your resume's worst nightmare...",
    "Brutally honest career advice...",
    "No sugarcoating, just truth...",
    "Prepare to face your doom...",
    "AI-powered roasting awaits..."
];

let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typingText = document.getElementById('typingText');

function typeEffect() {
    if (!typingText) return;
    
    const currentPhrase = typingPhrases[phraseIndex];
    
    if (isDeleting) {
        typingText.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typingText.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
    }
    
    let typeSpeed = isDeleting ? 30 : 80;
    
    if (!isDeleting && charIndex === currentPhrase.length) {
        typeSpeed = 2000; // Pause at end
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % typingPhrases.length;
        typeSpeed = 500;
    }
    
    setTimeout(typeEffect, typeSpeed);
}

// Start typing animation
typeEffect();

// Utility
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== CONFESSION BOOTH ====================

// Open confession modal
confessionBtn.addEventListener('click', () => {
    confessionModal.style.display = 'flex';
    renderConfessions();
});

// Close confession modal
closeConfession.addEventListener('click', () => {
    confessionModal.style.display = 'none';
});

// Close on overlay click
confessionModal.addEventListener('click', (e) => {
    if (e.target === confessionModal) {
        confessionModal.style.display = 'none';
    }
});

// Add confession
addConfessionBtn.addEventListener('click', addConfession);
confessionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) addConfession();
});

function addConfession() {
    const text = confessionInput.value.trim();
    if (!text) return;
    
    confessions.push({
        id: Date.now(),
        text: text,
        timestamp: new Date().toLocaleTimeString()
    });
    
    confessionInput.value = '';
    renderConfessions();
    updateConfessionCount();
}

// Remove confession
function removeConfession(id) {
    confessions = confessions.filter(c => c.id !== id);
    renderConfessions();
    updateConfessionCount();
}

// Render confessions list
function renderConfessions() {
    if (confessions.length === 0) {
        confessionsList.innerHTML = `
            <div class="empty-confessions">
                <div class="icon">🕯️</div>
                <p>No confessions yet. Unburden your soul...</p>
            </div>
        `;
        return;
    }
    
    confessionsList.innerHTML = confessions.map(c => `
        <div class="confession-item" data-id="${c.id}">
            <span class="icon">🙏</span>
            <span class="text">${c.text}</span>
            <button class="remove-btn" onclick="removeConfession(${c.id})">✕</button>
        </div>
    `).join('');
}

// Update confession count badge
function updateConfessionCount() {
    if (confessions.length > 0) {
        confessionCount.textContent = confessions.length;
        confessionCount.style.display = 'inline';
    } else {
        confessionCount.style.display = 'none';
    }
}

// Get absolution - send confessions for advice
getAbsolutionBtn.addEventListener('click', async () => {
    if (confessions.length === 0) {
        alert('You must confess something first!');
        return;
    }
    
    getAbsolutionBtn.disabled = true;
    getAbsolutionBtn.textContent = '⏳ Seeking absolution...';
    
    const confessionTexts = confessions.map(c => c.text).join('\n- ');
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resumeText: rawResumeText || resumeData.analysis,
                prompt: `The user has confessed these resume exaggerations/lies:\n- ${confessionTexts}\n\nFor EACH confession, provide:\n1. How serious this sin is (mild/moderate/grave)\n2. Specific steps to ACTUALLY achieve this claim legitimately\n3. How to reword it honestly in the meantime\n\nBe dramatic but genuinely helpful. Give them a path to redemption.`,
                confessions: confessions.map(c => c.text),
                elaborate: true
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Close modal and show response in chat
            confessionModal.style.display = 'none';
            displayMessage('confession', data.response);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        getAbsolutionBtn.disabled = false;
        getAbsolutionBtn.textContent = '⚡ Get Absolution & Advice';
    }
});

// Add confession section title
sectionTitles['confession'] = '🕯️ Absolution';

// ==================== SUMMARY ROOM ====================

// Summary Room Elements
const summaryBtn = document.getElementById('summaryBtn');
const summaryModal = document.getElementById('summaryModal');
const closeSummary = document.getElementById('closeSummary');
const summaryContent = document.getElementById('summaryContent');
const summaryLock = document.getElementById('summaryLock');
const unlockProgress = document.getElementById('unlockProgress');

// Summary state
let manualChatCount = 0;
let summaryData = {
    gender: null,
    language: null,
    summaryText: null,
    audioBlob: null
};

// Track manual chats for unlocking
function trackManualChat() {
    manualChatCount++;
    updateSummaryLock();
}

// Update summary lock status
function updateSummaryLock() {
    const progress = Math.min(manualChatCount, 3);
    unlockProgress.textContent = `${progress}/3`;
    
    if (manualChatCount >= 3) {
        summaryBtn.classList.remove('locked');
        summaryBtn.classList.add('unlocked');
        summaryLock.style.display = 'none';
        unlockProgress.style.display = 'none';
    }
}

// Open summary modal
summaryBtn.addEventListener('click', () => {
    if (summaryBtn.classList.contains('locked')) {
        alert(`Send ${3 - manualChatCount} more messages to unlock the Summary Room!`);
        return;
    }
    summaryModal.style.display = 'flex';
    startSummaryFlow();
});

// Close summary modal
closeSummary.addEventListener('click', () => {
    summaryModal.style.display = 'none';
});

summaryModal.addEventListener('click', (e) => {
    if (e.target === summaryModal) {
        summaryModal.style.display = 'none';
    }
});

// Summary flow steps
function startSummaryFlow() {
    summaryData = { gender: null, language: null, summaryText: null, audioBlob: null };
    showGenderStep();
}

function showGenderStep() {
    summaryContent.innerHTML = `
        <div class="summary-step">
            <p class="step-question">Hey lazy one... before I introduce you to the world, tell me - are you a...</p>
            <div class="step-options">
                <button class="option-btn" onclick="selectGender('male')">👨 Male</button>
                <button class="option-btn" onclick="selectGender('female')">👩 Female</button>
                <button class="option-btn" onclick="selectGender('other')">🧑 Other</button>
            </div>
        </div>
    `;
}

function selectGender(gender) {
    summaryData.gender = gender;
    
    // Highlight selected
    document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
    
    setTimeout(showLanguageStep, 500);
}

function showLanguageStep() {
    summaryContent.innerHTML = `
        <div class="summary-step">
            <p class="step-question">Good. Now, in which tongue shall I speak of your... talents?</p>
            <div class="step-options">
                <button class="option-btn" onclick="selectLanguage('english')">🇬🇧 English</button>
                <button class="option-btn" onclick="selectLanguage('hindi')">🇮🇳 Hindi</button>
                <button class="option-btn" onclick="selectLanguage('bengali')">🇧🇩 Bengali</button>
                <button class="option-btn" onclick="selectLanguage('french')">🇫🇷 French</button>
                <button class="option-btn" onclick="selectLanguage('spanish')">🇪🇸 Spanish</button>
            </div>
        </div>
    `;
}

function selectLanguage(language) {
    summaryData.language = language;
    
    document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
    
    setTimeout(showMicStep, 500);
}

function showMicStep() {
    summaryContent.innerHTML = `
        <div class="summary-step">
            <p class="step-question">Alright... give me the mic. I'll help you survive in this cruel world.</p>
            <button class="give-mic-btn" onclick="generateSummary()">🎙️ Give the Mic to Professor Doom</button>
        </div>
    `;
}

async function generateSummary() {
    const btn = document.querySelector('.give-mic-btn');
    btn.disabled = true;
    btn.textContent = '🎙️ Professor is speaking...';
    
    summaryContent.innerHTML = `
        <div class="summary-loading">
            <div class="spinner"></div>
            <p>Professor Doom is crafting your introduction...</p>
        </div>
    `;
    
    const genderPronoun = summaryData.gender === 'male' ? 'he/him/his' : 
                          summaryData.gender === 'female' ? 'she/her/her' : 'they/them/their';
    
    const languageMap = {
        'english': 'English',
        'hindi': 'Hindi (Hinglish is fine)',
        'bengali': 'Bengali',
        'french': 'French',
        'spanish': 'Spanish'
    };
    
    const chatContext = chatHistory.slice(-10).map(h => `${h.role}: ${h.content}`).join('\n');
    const confessionContext = confessions.length > 0 ? 
        'Confessions: ' + confessions.map(c => c.text).join(', ') : '';
    
    try {
        const response = await fetch('/api/summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resumeText: rawResumeText || resumeData.analysis,
                gender: genderPronoun,
                language: languageMap[summaryData.language],
                chatContext,
                confessionContext
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            summaryData.summaryText = data.summary;
            showSummaryResult();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        summaryContent.innerHTML = `
            <div class="summary-step">
                <p class="step-question">Something went wrong: ${error.message}</p>
                <button class="give-mic-btn" onclick="generateSummary()">🔄 Try Again</button>
            </div>
        `;
    }
}

function showSummaryResult() {
    summaryContent.innerHTML = `
        <div class="summary-result">
            <div class="summary-text">${parseMarkdown(summaryData.summaryText)}</div>
            <div class="summary-actions">
                <button class="summary-action-btn play-summary-btn" onclick="playSummaryAudio()">
                    ▶️ Play Audio
                </button>
                <button class="summary-action-btn download-btn" onclick="downloadSummaryAudio()" id="downloadBtn" disabled>
                    ⬇️ Download Audio
                </button>
                <button class="summary-action-btn regenerate-btn" onclick="generateSummary()">
                    🔄 Regenerate
                </button>
            </div>
        </div>
    `;
}

async function playSummaryAudio() {
    const playBtn = document.querySelector('.play-summary-btn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    playBtn.disabled = true;
    playBtn.innerHTML = '⏳ Generating...';
    
    try {
        const response = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: summaryData.summaryText })
        });
        
        if (response.ok) {
            const blob = await response.blob();
            summaryData.audioBlob = blob;
            
            const audioUrl = URL.createObjectURL(blob);
            audioPlayer.src = audioUrl;
            audioPlayer.play();
            
            playBtn.innerHTML = '🔊 Playing...';
            downloadBtn.disabled = false;
            
            audioPlayer.onended = () => {
                playBtn.innerHTML = '▶️ Play Again';
                playBtn.disabled = false;
            };
        } else {
            throw new Error('Failed to generate audio');
        }
    } catch (error) {
        playBtn.innerHTML = '▶️ Play Audio';
        playBtn.disabled = false;
        alert('Audio error: ' + error.message);
    }
}

function downloadSummaryAudio() {
    if (!summaryData.audioBlob) {
        alert('Please play the audio first!');
        return;
    }
    
    const url = URL.createObjectURL(summaryData.audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'professor_doom_introduction.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Add summary section title
sectionTitles['summary'] = '🎙️ Summary';


// ==================== LEARNING CRYPT ====================

const resourcesBtn = document.getElementById('resourcesBtn');
const resourcesModal = document.getElementById('resourcesModal');
const closeResources = document.getElementById('closeResources');
const resourcesContent = document.getElementById('resourcesContent');
const resourcesList = document.getElementById('resourcesList');
const skillsTags = document.getElementById('skillsTags');
const searchResourcesBtn = document.getElementById('searchResourcesBtn');

let selectedSkills = [];
let extractedSkills = [];

// Open resources modal
resourcesBtn.addEventListener('click', () => {
    resourcesModal.style.display = 'flex';
    extractSkillsFromResume();
});

// Close resources modal
closeResources.addEventListener('click', () => {
    resourcesModal.style.display = 'none';
    resetResourcesModal();
});

resourcesModal.addEventListener('click', (e) => {
    if (e.target === resourcesModal) {
        resourcesModal.style.display = 'none';
        resetResourcesModal();
    }
});

// Extract skills from resume analysis
function extractSkillsFromResume() {
    const analysis = resumeData?.analysis || '';
    const resumeText = rawResumeText || '';
    
    // Common skill keywords to look for
    const skillPatterns = [
        /javascript/gi, /python/gi, /java\b/gi, /react/gi, /node\.?js/gi,
        /html/gi, /css/gi, /sql/gi, /mongodb/gi, /aws/gi, /docker/gi,
        /kubernetes/gi, /git/gi, /typescript/gi, /angular/gi, /vue/gi,
        /machine learning/gi, /data analysis/gi, /excel/gi, /powerpoint/gi,
        /communication/gi, /leadership/gi, /project management/gi,
        /agile/gi, /scrum/gi, /devops/gi, /ci\/cd/gi, /linux/gi,
        /photoshop/gi, /figma/gi, /ui\/ux/gi, /design/gi,
        /marketing/gi, /seo/gi, /content writing/gi, /sales/gi,
        /c\+\+/gi, /c#/gi, /ruby/gi, /php/gi, /swift/gi, /kotlin/gi,
        /tensorflow/gi, /pytorch/gi, /nlp/gi, /deep learning/gi,
        /blockchain/gi, /solidity/gi, /web3/gi, /cloud/gi
    ];
    
    const foundSkills = new Set();
    const combinedText = analysis + ' ' + resumeText;
    
    skillPatterns.forEach(pattern => {
        const matches = combinedText.match(pattern);
        if (matches) {
            foundSkills.add(matches[0].toLowerCase());
        }
    });
    
    extractedSkills = Array.from(foundSkills).slice(0, 15);
    
    // Add some default improvement areas if few skills found
    if (extractedSkills.length < 5) {
        const defaults = ['communication', 'leadership', 'problem solving', 'time management'];
        defaults.forEach(s => {
            if (!extractedSkills.includes(s)) extractedSkills.push(s);
        });
    }
    
    renderSkillTags();
}

// Render skill tags
function renderSkillTags() {
    if (extractedSkills.length === 0) {
        skillsTags.innerHTML = '<p style="color: var(--text-dim);">No skills detected. Try uploading a resume first.</p>';
        return;
    }
    
    skillsTags.innerHTML = extractedSkills.map(skill => `
        <button class="skill-tag" onclick="toggleSkill('${skill}')">${skill}</button>
    `).join('');
}

// Toggle skill selection
function toggleSkill(skill) {
    const btn = event.target;
    
    if (selectedSkills.includes(skill)) {
        selectedSkills = selectedSkills.filter(s => s !== skill);
        btn.classList.remove('selected');
    } else {
        if (selectedSkills.length < 5) {
            selectedSkills.push(skill);
            btn.classList.add('selected');
        } else {
            alert('Maximum 5 skills can be selected');
        }
    }
}

// Search for resources
searchResourcesBtn.addEventListener('click', searchResources);

async function searchResources() {
    if (selectedSkills.length === 0) {
        alert('Please select at least one skill to improve');
        return;
    }
    
    searchResourcesBtn.disabled = true;
    searchResourcesBtn.textContent = '🔮 Summoning ancient knowledge...';
    
    resourcesContent.style.display = 'none';
    resourcesList.style.display = 'block';
    resourcesList.innerHTML = `
        <div class="resources-loading">
            <div class="spinner"></div>
            <p>Searching the crypts for learning scrolls...</p>
        </div>
    `;
    
    try {
        const response = await fetch('/api/resources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skills: selectedSkills })
        });
        
        const data = await response.json();
        
        if (data.success && data.resources.length > 0) {
            renderResources(data.resources);
        } else {
            resourcesList.innerHTML = `
                <div class="no-resources">
                    <p>📚 No scrolls found in the crypt...</p>
                    <p>Try selecting different skills.</p>
                    <button class="back-to-skills" onclick="backToSkills()">← Back to Skills</button>
                </div>
            `;
        }
    } catch (error) {
        resourcesList.innerHTML = `
            <div class="no-resources">
                <p>⚠️ The crypt is sealed: ${error.message}</p>
                <button class="back-to-skills" onclick="backToSkills()">← Try Again</button>
            </div>
        `;
    } finally {
        searchResourcesBtn.disabled = false;
        searchResourcesBtn.textContent = '🔮 Summon Resources';
    }
}

// Render resources
function renderResources(resources) {
    resourcesList.innerHTML = `
        <div class="resources-grid">
            ${resources.map(r => `
                <div class="resource-card">
                    <h4>${truncateText(r.title, 60)}</h4>
                    <p>${truncateText(r.snippet, 150)}</p>
                    <a href="${r.url}" target="_blank" rel="noopener">🔗 Open Scroll</a>
                </div>
            `).join('')}
        </div>
        <button class="back-to-skills" onclick="backToSkills()">← Search More Skills</button>
    `;
}

// Truncate text helper
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Back to skills selection
function backToSkills() {
    resourcesList.style.display = 'none';
    resourcesContent.style.display = 'block';
    selectedSkills = [];
    renderSkillTags();
}

// Reset modal
function resetResourcesModal() {
    resourcesList.style.display = 'none';
    resourcesContent.style.display = 'block';
    selectedSkills = [];
}


// ==================== SKILL TRENDS CHAMBER ====================

const trendsBtn = document.getElementById('trendsBtn');
const trendsModal = document.getElementById('trendsModal');
const closeTrends = document.getElementById('closeTrends');
const trendsContent = document.getElementById('trendsContent');
const trendsList = document.getElementById('trendsList');
const industryOptions = document.getElementById('industryOptions');
const customIndustry = document.getElementById('customIndustry');
const searchTrendsBtn = document.getElementById('searchTrendsBtn');

let selectedIndustry = '';

// Open trends modal
trendsBtn.addEventListener('click', () => {
    trendsModal.style.display = 'flex';
    resetTrendsModal();
});

// Close trends modal
closeTrends.addEventListener('click', () => {
    trendsModal.style.display = 'none';
});

trendsModal.addEventListener('click', (e) => {
    if (e.target === trendsModal) {
        trendsModal.style.display = 'none';
    }
});

// Industry button selection
industryOptions.addEventListener('click', (e) => {
    if (e.target.classList.contains('industry-btn')) {
        document.querySelectorAll('.industry-btn').forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');
        selectedIndustry = e.target.dataset.industry;
        customIndustry.value = '';
    }
});

// Custom industry input
customIndustry.addEventListener('input', () => {
    if (customIndustry.value.trim()) {
        document.querySelectorAll('.industry-btn').forEach(btn => btn.classList.remove('selected'));
        selectedIndustry = customIndustry.value.trim();
    }
});

// Search trends
searchTrendsBtn.addEventListener('click', searchTrends);

async function searchTrends() {
    const industry = customIndustry.value.trim() || selectedIndustry;
    
    if (!industry) {
        alert('Please select or enter an industry');
        return;
    }
    
    searchTrendsBtn.disabled = true;
    searchTrendsBtn.textContent = '🔮 Gazing into the future...';
    
    trendsContent.style.display = 'none';
    trendsList.style.display = 'block';
    trendsList.innerHTML = `
        <div class="trends-loading">
            <div class="spinner"></div>
            <p>Consulting the spirits of industry trends...</p>
        </div>
    `;
    
    try {
        const response = await fetch('/api/trends', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ industry })
        });
        
        const data = await response.json();
        
        if (data.success && data.trends.length > 0) {
            renderTrends(data.trends, industry);
        } else {
            trendsList.innerHTML = `
                <div class="no-resources">
                    <p>🔮 The crystal ball is cloudy...</p>
                    <p>No trends found for this industry.</p>
                    <button class="back-to-industries" onclick="backToIndustries()">← Try Another Industry</button>
                </div>
            `;
        }
    } catch (error) {
        trendsList.innerHTML = `
            <div class="no-resources">
                <p>⚠️ The spirits are silent: ${error.message}</p>
                <button class="back-to-industries" onclick="backToIndustries()">← Try Again</button>
            </div>
        `;
    } finally {
        searchTrendsBtn.disabled = false;
        searchTrendsBtn.textContent = '🔮 Reveal Trends';
    }
}

// Render trends
function renderTrends(trends, industry) {
    trendsList.innerHTML = `
        <div class="trends-header-info">
            <p style="color: #ff8c00; margin-bottom: 15px; text-align: center;">
                🔥 Trending skills in <strong>${industry}</strong>
            </p>
        </div>
        <div class="trends-grid">
            ${trends.map(t => `
                <div class="trend-card">
                    <h4>${truncateText(t.title, 60)}</h4>
                    <p>${truncateText(t.snippet, 180)}</p>
                    <a href="${t.url}" target="_blank" rel="noopener">🔗 Read More</a>
                </div>
            `).join('')}
        </div>
        <button class="back-to-industries" onclick="backToIndustries()">← Explore Another Industry</button>
    `;
}

// Back to industry selection
function backToIndustries() {
    trendsList.style.display = 'none';
    trendsContent.style.display = 'block';
    resetTrendsModal();
}

// Reset modal
function resetTrendsModal() {
    trendsList.style.display = 'none';
    trendsContent.style.display = 'block';
    selectedIndustry = '';
    customIndustry.value = '';
    document.querySelectorAll('.industry-btn').forEach(btn => btn.classList.remove('selected'));
}


// ==================== COSTUME CONTEST UI ENHANCEMENTS ====================

// Create floating particles
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    const particleEmojis = ['💀', '👻', '🦇', '🕷️', '⚰️', '🕯️', '🎃', '🩸'];
    
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('span');
        particle.className = 'particle';
        particle.textContent = particleEmojis[Math.floor(Math.random() * particleEmojis.length)];
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        container.appendChild(particle);
    }
}

// Lightning flash effect on roast
function triggerLightning() {
    document.body.classList.add('lightning-flash');
    setTimeout(() => document.body.classList.remove('lightning-flash'), 100);
}

// Shake effect for dramatic moments
function triggerShake(element) {
    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 500);
}

// Add heartbeat to loading
function addHeartbeat(element) {
    element.classList.add('heartbeat');
}

// Random spooky sound effect (visual feedback)
function spookyFeedback() {
    const messages = ['💀', '👻', '🎃', '⚰️'];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    
    const feedback = document.createElement('div');
    feedback.textContent = msg;
    feedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 5em;
        opacity: 0.8;
        pointer-events: none;
        z-index: 9999;
        animation: feedbackPop 0.5s ease-out forwards;
    `;
    document.body.appendChild(feedback);
    
    setTimeout(() => feedback.remove(), 500);
}

// Add CSS for feedback animation
const feedbackStyle = document.createElement('style');
feedbackStyle.textContent = `
    @keyframes feedbackPop {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
    }
`;
document.head.appendChild(feedbackStyle);

// Initialize particles on load
createParticles();

// Add spooky hover sounds (visual only)
document.querySelectorAll('.section-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateX(5px)';
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
    });
});

// Trigger lightning on roast section click
document.querySelector('[data-section="roast"]')?.addEventListener('click', () => {
    setTimeout(triggerLightning, 100);
});

// Add glow effect to landing title
document.querySelector('.title-line.doom')?.classList.add('glow-text');

// Easter egg: Konami code reveals secret message
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join(',') === konamiSequence.join(',')) {
        alert('🎃 Professor Doom whispers: "You found my secret... but your resume still needs work!" 💀');
        spookyFeedback();
    }
});

console.log('%c🎃 Professor Doom is watching your console... 💀', 
    'color: #ff4444; font-size: 20px; font-weight: bold; text-shadow: 2px 2px #000;');
console.log('%cBuilt for Kiroween Hackathon 2024', 
    'color: #8a2be2; font-size: 14px;');


// ==================== VIDEO BACKGROUND CONTROLS ====================

const bgVideo = document.getElementById('bgVideo');
const muteBtn = document.getElementById('muteBtn');
const pauseVideoBtn = document.getElementById('pauseVideoBtn');

// Mute/Unmute toggle (starts unmuted)
muteBtn?.addEventListener('click', () => {
    if (bgVideo.muted) {
        bgVideo.muted = false;
        muteBtn.textContent = '🔊';
        muteBtn.title = 'Mute';
    } else {
        bgVideo.muted = true;
        muteBtn.textContent = '🔇';
        muteBtn.title = 'Unmute';
    }
});

// Play/Pause toggle
pauseVideoBtn?.addEventListener('click', () => {
    if (bgVideo.paused) {
        bgVideo.play();
        pauseVideoBtn.textContent = '⏸️';
        pauseVideoBtn.title = 'Pause';
    } else {
        bgVideo.pause();
        pauseVideoBtn.textContent = '▶️';
        pauseVideoBtn.title = 'Play';
    }
});

// Ensure video plays on mobile (some browsers block autoplay)
document.addEventListener('click', () => {
    if (bgVideo && bgVideo.paused) {
        bgVideo.play().catch(() => {});
    }
}, { once: true });
