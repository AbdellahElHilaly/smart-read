// Global variables
let textData = [];
let translationMap = {};
let isSpeaking = false;
let isReadingFullText = false;
let currentReadingIndex = 0;
let allWords = [];
let readingSpeed = 0.85; // Default reading speed

// DOM Elements - will be initialized when page loads
let textContent;
let topicSelect;
let readBtn;
let stopBtn;
let resetBtn;
let clearAllBtn;
let wordCount;
let chatInput;
let sendBtn;
let chatContainer;
let loadingIndicator;
let speedSlider;
let speedValue;
let progressContainer;
let progressFill;
let currentWordSpan;
let totalWordsSpan;

// Initialize DOM elements
function initializeDOMElements() {
    textContent = document.getElementById('textContent');
    topicSelect = document.getElementById('topicSelect');
    readBtn = document.getElementById('readBtn');
    stopBtn = document.getElementById('stopBtn');
    resetBtn = document.getElementById('resetBtn');
    clearAllBtn = document.getElementById('clearAllBtn');
    wordCount = document.getElementById('wordCount');
    chatInput = document.getElementById('chatInput');
    sendBtn = document.getElementById('sendBtn');
    chatContainer = document.getElementById('chatContainer');
    loadingIndicator = document.getElementById('loadingIndicator');
    speedSlider = document.getElementById('speedSlider');
    speedValue = document.getElementById('speedValue');
    progressContainer = document.getElementById('progressContainer');
    progressFill = document.getElementById('progressFill');
    currentWordSpan = document.getElementById('currentWord');
    totalWordsSpan = document.getElementById('totalWords');
    
    console.log('DOM Elements initialized');
    console.log('sendBtn:', sendBtn);
}

/**
 * Speak English word using Web Speech API
 */
function speakWord(word) {
    // Cancel any ongoing speech
    if (isSpeaking) {
        window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
        isSpeaking = true;
    };

    utterance.onend = () => {
        isSpeaking = false;
    };

    window.speechSynthesis.speak(utterance);
}

/**
 * Fetch data from JSON file
 */
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Failed to load data.json');
        }
        const data = await response.json();
        console.log('Data loaded successfully');
        populateTopics(data.topics);
    } catch (error) {
        console.error('Error loading data:', error);
        textContent.innerHTML = '<p style="color: #ff6b6b;">Error loading data. Please check the data.json file.</p>';
    }
}

/**
 * Populate topic dropdown
 */
function populateTopics(topics) {
    topics.forEach(topic => {
        const option = document.createElement('option');
        option.value = topic.id;
        option.textContent = topic.name;
        topicSelect.appendChild(option);
    });
}

/**
 * Handle topic selection
 */
function onTopicChange(event) {
    const selectedId = event.target.value;
    if (selectedId) {
        loadTopic(selectedId);
    } else {
        textContent.innerHTML = '<p style="color: #b0b0b0;">Select a topic to begin...</p>';
    }
}

/**
 * Load and render text for selected topic
 */
async function loadTopic(topicId) {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Failed to load data.json');
        }
        const data = await response.json();
        const topic = data.topics.find(t => t.id === topicId);
        
        if (topic) {
            textData = topic.words;
            console.log('Topic loaded:', topic.name, 'with', textData.length, 'words');
            initializeApp();
        }
    } catch (error) {
        console.error('Error loading topic:', error);
        textContent.innerHTML = '<p style="color: #ff6b6b;">Error loading topic.</p>';
    }
}

/**
 * Initialize the application
 */
function initializeApp() {
    // Create translation map for quick lookup
    createTranslationMap();
    
    // Render text with clickable spans
    renderText();
    
    // Update word count
    updateWordCount();
    
    // Attach event listeners
    attachEventListeners();
}

/**
 * Create a map for quick translation lookup
 */
function createTranslationMap() {
    translationMap = {};
    textData.forEach(item => {
        translationMap[item.en.toLowerCase()] = item.ar;
    });
    console.log('Translation map created:', Object.keys(translationMap).length, 'entries');
}

/**
 * Extract text from data and create spans
 */
function renderText() {
    // Combine all English text into one paragraph
    const fullText = textData.map(item => item.en).join(' ');
    
    // Split into words and create spans
    const words = fullText.split(/\s+/).filter(word => word.length > 0);
    allWords = words; // Store for reading functionality
    
    // Create HTML with spans
    const spanElements = words.map((word, index) => {
        const cleanWord = word.replace(/[.,!?;:]/g, '');
        
        return `<span class="word" data-index="${index}" data-en="${cleanWord}" data-ar="${translationMap[cleanWord.toLowerCase()] || '???'}" data-original="${word}">${word}</span>`;
    }).join(' ');
    
    textContent.innerHTML = spanElements;
}

/**
 * Update word count display
 */
function updateWordCount() {
    const totalWords = textData.length;
    wordCount.textContent = totalWords;
}

/**
 * Attach event listeners to word spans
 */
function attachEventListeners() {
    const words = document.querySelectorAll('.word');
    
    words.forEach(word => {
        word.addEventListener('click', function(e) {
            e.stopPropagation();
            // Pass skipVoice=true if currently reading full text
            toggleTranslation(this, isReadingFullText);
        });
    });
}

/**
 * Toggle between English and Arabic translation
 */
function toggleTranslation(element, skipVoice = false) {
    const enText = element.getAttribute('data-en');
    const arText = element.getAttribute('data-ar');
    const originalText = element.getAttribute('data-original');
    const currentText = element.textContent.trim();
    
    // Remove punctuation for comparison
    const cleanCurrentText = currentText.replace(/[.,!?;:]/g, '');
    const isCurrentlyEnglish = cleanCurrentText.toLowerCase() === enText.toLowerCase();
    
    // Only speak if not skipped and not during reading
    if (!skipVoice && !isReadingFullText) {
        speakWord(enText);
    }
    
    if (isCurrentlyEnglish) {
        // Switch to Arabic - NO red background, just translation
        element.textContent = arText;
        // Don't add background color, just remove it
        element.style.backgroundColor = 'transparent';
        element.style.color = 'inherit';
    } else {
        // Switch back to English with original punctuation
        element.textContent = originalText;
        element.style.backgroundColor = 'transparent';
        element.style.color = 'inherit';
    }
    
    // Add animation
    element.style.animation = 'none';
    setTimeout(() => {
        element.style.animation = 'pulse 0.5s ease';
    }, 10);
}

/**
 * Reset all translations to English
 */
function resetAll() {
    const words = document.querySelectorAll('.word');
    words.forEach(word => {
        const originalText = word.getAttribute('data-original') || word.getAttribute('data-en');
        word.textContent = originalText;
        word.classList.remove('translated');
        word.classList.remove('reading');
    });
}

/**
 * Clear all translations (remove highlighting)
 */
function clearAllTranslations() {
    const words = document.querySelectorAll('.word');
    words.forEach(word => {
        if (word.classList.contains('translated')) {
            const originalText = word.getAttribute('data-original') || word.getAttribute('data-en');
            word.textContent = originalText;
            word.classList.remove('translated');
        }
    });
}

/**
 * Read entire text aloud naturally
 */
function readText() {
    // Cancel any ongoing speech
    if (isSpeaking) {
        window.speechSynthesis.cancel();
    }

    isReadingFullText = true;
    currentReadingIndex = 0;
    readBtn.disabled = true;
    readBtn.style.opacity = '0.5';
    
    // Get all word elements
    const words = document.querySelectorAll('.word');
    
    if (words.length === 0) return;
    
    // Get full text
    const fullText = Array.from(words)
        .map(word => word.getAttribute('data-en'))
        .join(' ');
    
    // Create utterance for continuous reading
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'en-US';
    utterance.rate = readingSpeed;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Calculate word timing for highlighting
    const wordTimings = calculateWordTimings(words, utterance.rate);
    let highlightTimeoutId = null;
    let nextWordIndex = 0;

    utterance.onstart = () => {
        isSpeaking = true;
        nextWordIndex = 0;
        
        // Start highlighting words based on timing
        const highlightNextWord = () => {
            if (nextWordIndex < words.length && isReadingFullText && isSpeaking) {
                // Remove previous highlight
                if (nextWordIndex > 0) {
                    words[nextWordIndex - 1].classList.remove('reading');
                }
                
                // Add highlight to current word
                words[nextWordIndex].classList.add('reading');
                
                // Update progress
                if (currentWordSpan) {
                    currentWordSpan.textContent = nextWordIndex + 1;
                }
                if (progressFill) {
                    const percentage = ((nextWordIndex + 1) / words.length) * 100;
                    progressFill.style.width = percentage + '%';
                }
                
                nextWordIndex++;
                
                if (nextWordIndex < words.length) {
                    const delay = wordTimings[nextWordIndex] - wordTimings[nextWordIndex - 1];
                    highlightTimeoutId = setTimeout(highlightNextWord, delay);
                }
            }
        };
        
        // Highlight first word
        words[0].classList.add('reading');
        if (currentWordSpan) currentWordSpan.textContent = 1;
        if (progressFill) progressFill.style.width = '0%';
        nextWordIndex = 1;
        
        if (words.length > 1) {
            const delay = wordTimings[1] - wordTimings[0];
            highlightTimeoutId = setTimeout(highlightNextWord, delay);
        }
    };

    utterance.onend = () => {
        isSpeaking = false;
        isReadingFullText = false;
        currentReadingIndex = 0;
        readBtn.disabled = false;
        readBtn.style.opacity = '1';
        
        if (highlightTimeoutId) {
            clearTimeout(highlightTimeoutId);
        }
        
        // Remove highlight from last word
        document.querySelectorAll('.word').forEach(w => {
            w.classList.remove('reading');
        });
    };

    utterance.onerror = () => {
        isReadingFullText = false;
        isSpeaking = false;
        readBtn.disabled = false;
        readBtn.style.opacity = '1';
        if (highlightTimeoutId) {
            clearTimeout(highlightTimeoutId);
        }
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
    };

    window.speechSynthesis.speak(utterance);
}

/**
 * Calculate timing for each word based on length and speech rate
 */
function calculateWordTimings(words, speechRate) {
    const timings = [0];
    let currentTime = 0;
    
    // Average speaking rate: ~150 words per minute at 1x speed
    // At 0.85x speed: ~150 * 0.85 = 127.5 words per minute
    // That's about 471 ms per word on average
    // But we need to account for word length
    
    for (let i = 0; i < words.length - 1; i++) {
        const wordLength = words[i].getAttribute('data-en').length;
        // Estimate time based on word length
        // Short word (1-3 chars): ~250ms
        // Medium word (4-6 chars): ~350ms
        // Long word (7+ chars): ~500ms
        let wordTime;
        
        if (wordLength <= 3) {
            wordTime = 250;
        } else if (wordLength <= 6) {
            wordTime = 350;
        } else {
            wordTime = 400 + (wordLength - 7) * 30;
        }
        
        // Adjust for speech rate
        wordTime = wordTime / speechRate;
        currentTime += wordTime;
        timings.push(currentTime);
    }
    
    return timings;
}

/**
 * Stop reading
 */
function stopReading() {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    isReadingFullText = false;
    currentReadingIndex = 0;
    readBtn.disabled = false;
    readBtn.style.opacity = '1';
    
    // Remove highlight from all words
    document.querySelectorAll('.word').forEach(w => {
        w.classList.remove('reading');
    });
}

// Event listeners moved to DOMContentLoaded below
// All event listeners are now properly initialized in DOMContentLoaded

// Add pulse animation
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
    }
`;
document.head.appendChild(style);

/**
 * Handle chat key press
 */
function handleChatKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
    }
}

/**
 * Send message to AI
 */
async function sendChatMessage() {
    console.log('🔴 sendChatMessage CALLED!');
    console.log('chatInput:', chatInput);
    console.log('chatContainer:', chatContainer);
    console.log('sendBtn:', sendBtn);
    
    if (!chatInput) {
        console.error('❌ chatInput is null!');
        alert('Error: Chat input not found');
        return;
    }
    
    const message = chatInput.value.trim();
    console.log('📝 Message input:', message);
    
    if (!message) {
        console.log('⚠️ Message is empty, returning');
        return;
    }

    // Add user message to chat
    console.log('✉️ Adding user message to chat');
    addChatMessage(message, 'user');
    chatInput.value = '';

    // Show loading
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    if (sendBtn) sendBtn.disabled = true;

    try {
        // Get current topic for context
        const topicId = topicSelect ? topicSelect.value : '';
        let context = '';
        if (topicId) {
            const words = document.querySelectorAll('.word');
            context = Array.from(words).map(w => w.getAttribute('data-en')).join(' ');
        }

        console.log('🚀 Calling queryGroqAI with message:', message);
        const aiResponse = await queryGroqAI(message, context);
        console.log('✅ AI Response received:', aiResponse);
        
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        
        // Process AI response and add to chat
        console.log('💬 Adding AI response to chat');
        await addAIResponseToChat(aiResponse);
        console.log('✅ AI response added successfully');
    } catch (error) {
        console.error('❌ AI Error:', error);
        addChatMessage('❌ خطأ: ' + error.message, 'ai');
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    } finally {
        if (sendBtn) sendBtn.disabled = false;
        if (chatInput) chatInput.focus();
    }
}

/**
 * Get or prompt for Groq API Key
 */
function getGroqApiKey() {
    console.log('🔑 getGroqApiKey called');
    
    // First check localStorage
    let apiKey = localStorage.getItem('groq_api_key');
    console.log('💾 localStorage check - API Key exists:', apiKey ? 'YES' : 'NO');
    
    if (apiKey) {
        console.log('📤 Using saved API Key from localStorage');
        return apiKey ? apiKey.trim() : null;
    }
    
    // If not found in localStorage, ask user to enter it one time only
    console.log('📝 Showing prompt dialog... (this will only appear once)');
    const message = `🔑 أدخل مفتاح Groq API الخاص بك\n\n📍 كيف تحصل على مفتاح:\n1. اذهب إلى https://console.groq.com/keys\n2. انسخ API Key\n3. الصقه هنا\n\n💡 سيتم حفظه محلياً - لن نطلبه منك مجدداً!\n\nأو اتركه فارغاً للوضع التجريبي (Demo Mode)`;
    apiKey = prompt(message);
    console.log('📬 Prompt result - API Key entered:', apiKey ? 'YES' : 'NO');
    
    if (apiKey && apiKey.trim()) {
        console.log('💾 Saving API Key to localStorage...');
        localStorage.setItem('groq_api_key', apiKey.trim());
        console.log('✅ API Key saved! Next time you won\'t be asked.');
    } else {
        console.log('⚠️ No API key entered - will use demo mode');
    }
    
    console.log('📤 Returning API Key:', apiKey ? `✅ (length: ${apiKey.length})` : '❌ null');
    return apiKey ? apiKey.trim() : null;
}

/**
 * Query Groq AI API
 */
async function queryGroqAI(userMessage, context) {
    console.log('🤖 queryGroqAI called');
    const apiKey = getGroqApiKey();
    console.log('🔑 API Key retrieved:', apiKey ? '✅ Yes (length: ' + apiKey.length + ')' : '❌ No');
    
    if (!apiKey) {
        // If no API key, use demo mode
        console.log('📊 Using demo response (no API key)');
        return generateDemoResponse(userMessage, context);
    }
    
    try {
        console.log('🌐 Sending request to Groq API...');
        console.log('📍 URL: https://api.groq.com/openai/v1/chat/completions');
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{
                    role: 'system',
                    content: `You are an English teacher helping students learn English. ${context ? `Current text context: ${context}` : 'General English learning'}. Keep your answers brief, clear, and educational. Use simple English. Maximum 200 words.`,
                }, {
                    role: 'user',
                    content: userMessage
                }],
                max_tokens: 300,
                temperature: 0.7
            })
        });

        console.log('📥 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            console.error('❌ API Response not OK:', response.status, response.statusText);
            const errorData = await response.json();
            console.error('📌 Error details:', errorData);
            
            // Clear invalid API key if it's a 401
            if (response.status === 401) {
                console.warn('⚠️ Invalid API key - clearing from storage');
                localStorage.removeItem('groq_api_key');
                addChatMessage('❌ خطأ: مفتاح API غير صحيح. جرب مرة أخرى.', 'ai');
            }
            return generateDemoResponse(userMessage, context);
        }
        
        const data = await response.json();
        console.log('✅ Response data received:', data);
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            console.log('🎉 Returning AI response');
            return data.choices[0].message.content;
        } else if (data.error) {
            console.error('❌ Groq API Error:', data.error);
            // If API fails, try demo mode
            return generateDemoResponse(userMessage, context);
        } else {
            console.log('⚠️ Unexpected response format, using demo');
            return generateDemoResponse(userMessage, context);
        }
    } catch (error) {
        console.error('❌ Groq API Fetch Error:', error);
        console.error('📌 Error type:', error.message);
        // Fallback to demo response if API fails
        return generateDemoResponse(userMessage, context);
    }
}

/**
 * Generate demo AI response (when API key not configured)
 */
function generateDemoResponse(userMessage, context) {
    const responses = {
        'what': 'This is a great question! The context here relates to learning English effectively. You can click on any word to see its meaning and pronunciation.',
        'how': 'Great question! You can use this app by selecting a topic, reading the text, and clicking words to see translations. Use the Read button to hear natural pronunciation.',
        'meaning': 'The meaning depends on context. Try clicking the word to see its translation, and read the surrounding words to understand the full context.',
        'pronounce': 'This word is pronounced in a specific way. Click the word to hear the pronunciation from the text above!',
        'translate': 'Great! Click any word in the text above to see its Arabic translation instantly.',
        'learn': 'Excellent approach! Reading, listening, and practicing are the best ways to learn English. Use all features of this app to improve!',
        'help': 'I am here to help! Ask me questions about English, vocabulary, grammar, or anything related to the text. Click any word for translation and pronunciation.',
    };

    let response = 'This is a great question! To best help you, I recommend: 1) Read the entire text first 2) Click on difficult words 3) Use the Read button to hear pronunciation 4) Practice speaking the words aloud.';
    
    for (const [key, value] of Object.entries(responses)) {
        if (userMessage.toLowerCase().includes(key)) {
            response = value;
            break;
        }
    }

    return response;
}

/**
 * Add message to chat display
 */
function addChatMessage(text, sender) {
    if (!chatContainer) {
        console.error('chatContainer not initialized!');
        return;
    }
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.textContent = text;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    console.log(`Message added (${sender}):`, text);
}

/**
 * Translate a word using Google Translate API or return from local dictionary
 */
async function translateWord(englishWord) {
    // First check our local dictionary
    if (translationMap[englishWord.toLowerCase()]) {
        return translationMap[englishWord.toLowerCase()];
    }
    
    // Try Google Translate API (free, no key needed for basic usage)
    try {
        console.log('🌐 Translating via Google Translate:', englishWord);
        const encodedWord = encodeURIComponent(englishWord);
        const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodedWord}&langpair=en|ar`,
            { mode: 'cors' }
        );
        const data = await response.json();
        
        if (data.responseStatus === 200 && data.responseData.translatedText) {
            console.log('✅ Translation found:', data.responseData.translatedText);
            return data.responseData.translatedText;
        }
    } catch (error) {
        console.warn('⚠️ Translation service unavailable:', error.message);
    }
    
    // Fallback: return word in parentheses
    return `(${englishWord})`;
}

/**
 * Add AI response with interactive text
 */
async function addAIResponseToChat(aiText) {
    if (!chatContainer) {
        console.error('chatContainer not initialized!');
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message ai';
    
    // Process text into words with spans
    const words = aiText.split(/\s+/);
    
    // Create spans for each word (make them clickable like main text)
    const spans = await Promise.all(words.map(async (word) => {
        const cleanWord = word.replace(/[.,!?;:]/g, '');
        
        // Get translation from dictionary or translator
        const arTranslation = await translateWord(cleanWord);
        
        return `<span class="word" style="display: inline; padding: 1px 2px; margin: 0 1px; cursor: pointer; border-bottom: 1px dotted #666;" data-en="${cleanWord}" data-ar="${arTranslation}" data-original="${word}" data-chat="true">${word}</span>`;
    }));
    
    messageDiv.innerHTML = spans.join(' ');
    chatContainer.appendChild(messageDiv);
    
    // Add click listeners to AI response words
    const aiWords = messageDiv.querySelectorAll('.word');
    aiWords.forEach(word => {
        word.addEventListener('click', function(e) {
            e.stopPropagation();
            handleAIWordClick(this);
        });
    });

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

/**
 * Handle click on AI response words
 */
function handleAIWordClick(element) {
    const enText = element.getAttribute('data-en');
    const arText = element.getAttribute('data-ar');
    const originalText = element.getAttribute('data-original');
    const currentText = element.textContent.trim();
    
    const cleanCurrentText = currentText.replace(/[.,!?;:]/g, '');
    const isCurrentlyEnglish = cleanCurrentText.toLowerCase() === enText.toLowerCase();
    
    if (isCurrentlyEnglish) {
        // Speak word and show translation - NO red background
        speakWord(enText);
        element.textContent = arText;
        element.style.color = 'inherit';
        element.style.backgroundColor = 'transparent';
    } else {
        // Show original
        element.textContent = originalText;
        element.style.color = 'inherit';
        element.style.backgroundColor = 'transparent';
    }
}

// Load data when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOMContentLoaded event fired');
    initializeDOMElements();
    loadData();
    
    console.log('📡 Attaching event listeners...');
    
    // Attach event listeners AFTER DOM is initialized
    if (topicSelect) {
        topicSelect.addEventListener('change', onTopicChange);
        console.log('✅ topicSelect listener attached');
    }
    if (readBtn) {
        readBtn.addEventListener('click', () => readText());
        console.log('✅ readBtn listener attached');
    }
    if (stopBtn) {
        stopBtn.addEventListener('click', stopReading);
        console.log('✅ stopBtn listener attached');
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', resetAll);
        console.log('✅ resetBtn listener attached');
    }
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllTranslations);
        console.log('✅ clearAllBtn listener attached');
    }
    if (sendBtn) {
        console.log('🔴 sendBtn FOUND - attaching click listener');
        sendBtn.addEventListener('click', sendChatMessage);
        console.log('✅ sendBtn click listener attached!');
    } else {
        console.error('❌ sendBtn NOT FOUND!');
    }
    if (chatInput) {
        console.log('✅ chatInput listener attached');
        chatInput.addEventListener('keypress', handleChatKeyPress);
    } else {
        console.error('❌ chatInput NOT FOUND!');
    }
    
    console.log('🎉 All event listeners attached successfully!');
});







