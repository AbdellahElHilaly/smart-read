// Global variables
let textData = [];
let translationMap = {};
let isSpeaking = false;
let isReadingFullText = false;
let currentReadingIndex = 0;
let allWords = [];

// DOM Elements
const textContent = document.getElementById('textContent');
const topicSelect = document.getElementById('topicSelect');
const readBtn = document.getElementById('readBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const wordCount = document.getElementById('wordCount');

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
        // Switch to Arabic
        element.textContent = arText;
        element.classList.add('translated');
    } else {
        // Switch back to English with original punctuation
        element.textContent = originalText;
        element.classList.remove('translated');
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
    utterance.rate = 0.85;
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
                nextWordIndex++;
                
                if (nextWordIndex < words.length) {
                    const delay = wordTimings[nextWordIndex] - wordTimings[nextWordIndex - 1];
                    highlightTimeoutId = setTimeout(highlightNextWord, delay);
                }
            }
        };
        
        // Highlight first word
        words[0].classList.add('reading');
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

// Event listeners for buttons
readBtn.addEventListener('click', readText);
stopBtn.addEventListener('click', stopReading);
resetBtn.addEventListener('click', resetAll);
clearAllBtn.addEventListener('click', clearAllTranslations);
topicSelect.addEventListener('change', onTopicChange);

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

// Load data when DOM is ready
document.addEventListener('DOMContentLoaded', loadData);