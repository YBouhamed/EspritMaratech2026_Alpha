/**
 * LST Translation Application - Frontend Logic
 * 
 * This script handles:
 * - Text translation requests
 * - Speech-to-text using Web Speech API
 * - Sequential video playback
 * - UI updates and user feedback
 */

// ===== Global State =====
let videoQueue = [];           // Array of video paths to play
let currentVideoIndex = -1;    // Current video being played
let isPlaying = false;         // Whether a video is currently playing
let matchedWords = [];         // Words that were found
let missingWords = [];         // Words that were not found

// ===== DOM Elements =====
const textInput = document.getElementById('textInput');
const translateBtn = document.getElementById('translateBtn');
const micBtn = document.getElementById('micBtn');
const clearBtn = document.getElementById('clearBtn');
const videoPlayer = document.getElementById('videoPlayer');
const videoPlaceholder = document.getElementById('videoPlaceholder');
const statusMessage = document.getElementById('statusMessage');
const wordInfo = document.getElementById('wordInfo');
const queueContainer = document.getElementById('videoQueue');
const queueList = document.getElementById('queueList');
const playbackControls = document.getElementById('playbackControls');
const prevBtn = document.getElementById('prevBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const nextBtn = document.getElementById('nextBtn');
const stopBtn = document.getElementById('stopBtn');

// Input mode elements
const textModeBtn = document.getElementById('textModeBtn');
const voiceModeBtn = document.getElementById('voiceModeBtn');
const textInputMode = document.getElementById('textInputMode');
const voiceInputMode = document.getElementById('voiceInputMode');
const voiceAnimation = document.getElementById('voiceAnimation');
const voiceStatus = document.getElementById('voiceStatus');

// Current input mode ('text' or 'voice')
let currentInputMode = 'text';

// ===== Speech Recognition Setup =====
let recognition = null;
let isRecording = false;

// Check if browser supports speech recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // Configure recognition
    recognition.lang = 'ar-TN';  // Tunisian Arabic dialect
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    // Handle recognition result
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        
        // Update voice status
        voiceStatus.textContent = I18N.t('text_recognized') + ' : "' + transcript + '"';
        
        // Automatically translate the recognized word
        translateText(transcript);
        
        isRecording = false;
        micBtn.classList.remove('recording');
        voiceAnimation.classList.remove('recording');
        micBtn.querySelector('.mic-icon').textContent = '🎤';
        micBtn.querySelector('.mic-label').textContent = I18N.t('btn_start_recording');
    };
    
    // Handle recognition error
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        let errorMsg = I18N.t('mic_error');
        
        switch(event.error) {
            case 'no-speech':
                errorMsg = I18N.t('no_speech');
                break;
            case 'audio-capture':
                errorMsg = I18N.t('mic_not_accessible');
                break;
            case 'not-allowed':
                errorMsg = I18N.t('mic_denied');
                break;
        }
        
        voiceStatus.textContent = errorMsg;
        isRecording = false;
        micBtn.classList.remove('recording');
        voiceAnimation.classList.remove('recording');
        micBtn.querySelector('.mic-icon').textContent = '🎤';
        micBtn.querySelector('.mic-label').textContent = I18N.t('btn_start_recording');
    };
    
    // Handle recognition end
    recognition.onend = () => {
        isRecording = false;
        micBtn.classList.remove('recording');
        voiceAnimation.classList.remove('recording');
        micBtn.querySelector('.mic-icon').textContent = '🎤';
        micBtn.querySelector('.mic-label').textContent = I18N.t('btn_start_recording');
    };
} else {
    // Disable microphone button if not supported
    if (micBtn) {
        micBtn.disabled = true;
        micBtn.title = 'Speech recognition not supported';
    }
}

// ===== Event Listeners =====

// Input mode switching
if (textModeBtn) {
    textModeBtn.addEventListener('click', () => {
        currentInputMode = 'text';
        textModeBtn.classList.add('active');
        voiceModeBtn.classList.remove('active');
        textInputMode.classList.remove('hidden');
        voiceInputMode.classList.add('hidden');
        
        // Stop any ongoing recording
        if (isRecording && recognition) {
            recognition.stop();
        }
    });
}

if (voiceModeBtn) {
    voiceModeBtn.addEventListener('click', () => {
        currentInputMode = 'voice';
        voiceModeBtn.classList.add('active');
        textModeBtn.classList.remove('active');
        voiceInputMode.classList.remove('hidden');
        textInputMode.classList.add('hidden');
        
        // Reset voice status
        if (voiceStatus) {
            voiceStatus.textContent = I18N.t('voice_ready');
        }
    });
}

// Translate button click
translateBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (!text) {
        showStatus(I18N.t('enter_text'), 'warning');
        return;
    }
    translateText(text);
});

// Enter key in textarea
textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        translateBtn.click();
    }
});

// Microphone button click
micBtn.addEventListener('click', () => {
    if (!recognition) {
        voiceStatus.textContent = I18N.t('speech_not_supported');
        return;
    }
    
    if (isRecording) {
        recognition.stop();
    } else {
        try {
            recognition.start();
            isRecording = true;
            voiceAnimation.classList.add('recording');
            micBtn.classList.add('recording');
            micBtn.querySelector('.mic-icon').textContent = '🛑';
            micBtn.querySelector('.mic-label').textContent = I18N.t('btn_mic_stop');
            voiceStatus.textContent = I18N.t('speak_now');
        } catch (error) {
            console.error('Error starting recognition:', error);
            voiceStatus.textContent = I18N.t('mic_error');
        }
    }
});

// Clear button click
clearBtn.addEventListener('click', () => {
    textInput.value = '';
    stopPlayback();
    hideStatus();
    hideWordInfo();
    textInput.focus();
});

// Video player ended event - play next video automatically
videoPlayer.addEventListener('ended', () => {
    playNextVideo();
});

// Playback control buttons
prevBtn.addEventListener('click', playPreviousVideo);
nextBtn.addEventListener('click', playNextVideo);
stopBtn.addEventListener('click', stopPlayback);

playPauseBtn.addEventListener('click', () => {
    if (videoPlayer.paused) {
        videoPlayer.play();
        playPauseBtn.innerHTML = '<span>⏸</span> <span>' + I18N.t('btn_pause') + '</span>';
    } else {
        videoPlayer.pause();
        playPauseBtn.innerHTML = '<span>▶</span> <span>' + I18N.t('btn_play') + '</span>';
    }
});

videoPlayer.addEventListener('play', () => {
    playPauseBtn.innerHTML = '<span>⏸</span> <span>' + I18N.t('btn_pause') + '</span>';
});

videoPlayer.addEventListener('pause', () => {
    playPauseBtn.innerHTML = '<span>▶</span> <span>' + I18N.t('btn_play') + '</span>';
});

// ===== Translation Function =====

/**
 * Send text to backend for translation
 * @param {string} text - Text to translate
 */
async function translateText(text) {
    try {
        // Disable translate button during request
        translateBtn.disabled = true;
        translateBtn.innerHTML = '<span>⏳</span> <span>' + I18N.t('translating') + '</span>';
        
        showStatus(I18N.t('translating'), 'info');
        
        // Send POST request to backend
        const response = await fetch('/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store results
            videoQueue = data.videos;
            matchedWords = data.matched_words || [];
            missingWords = data.missing_words || [];
            
            // Show status
            showStatus(data.message, 'success');
            
            // Show word info
            showWordInfo();
            
            // Start playback
            if (videoQueue.length > 0) {
                currentVideoIndex = -1;
                updateQueueDisplay();
                playNextVideo();
            }
        } else {
            showStatus(data.message || I18N.t('no_sign'), 'warning');
            
            // Show missing words
            missingWords = data.missing_words || [];
            if (missingWords.length > 0) {
                showWordInfo();
            }
        }
        
    } catch (error) {
        console.error('Translation error:', error);
        showStatus(I18N.t('server_error'), 'error');
    } finally {
        // Re-enable translate button
        translateBtn.disabled = false;
        translateBtn.innerHTML = '<span>🔄</span> <span data-i18n="btn_translate">' + I18N.t('btn_translate') + '</span>';
    }
}

// ===== Video Playback Functions =====

/**
 * Play the next video in the queue
 */
function playNextVideo() {
    if (currentVideoIndex < videoQueue.length - 1) {
        currentVideoIndex++;
        loadAndPlayVideo(videoQueue[currentVideoIndex]);
        updateQueueDisplay();
        updatePlaybackControls();
    } else {
        // Reached end of queue
        showStatus(I18N.t('end_translation'), 'success');
        stopPlayback();
    }
}

/**
 * Play the previous video in the queue
 */
function playPreviousVideo() {
    if (currentVideoIndex > 0) {
        currentVideoIndex--;
        loadAndPlayVideo(videoQueue[currentVideoIndex]);
        updateQueueDisplay();
        updatePlaybackControls();
    }
}

/**
 * Load and play a specific video
 * @param {string} videoPath - Relative path to video file
 */
function loadAndPlayVideo(videoPath) {
    // Construct full URL
    const videoUrl = `/videos/${videoPath}`;
    
    // Update video source
    videoPlayer.src = videoUrl;
    
    // Show video player, hide placeholder
    videoPlayer.classList.remove('hidden');
    videoPlaceholder.classList.add('hidden');
    
    // Show controls
    playbackControls.classList.remove('hidden');
    
    // Play video
    videoPlayer.load();
    videoPlayer.play().catch(error => {
        console.error('Error playing video:', error);
        showStatus(I18N.t('video_error'), 'error');
    });
    
    isPlaying = true;
}

/**
 * Stop playback and reset
 */
function stopPlayback() {
    videoPlayer.pause();
    videoPlayer.src = '';
    videoPlayer.classList.add('hidden');
    videoPlaceholder.classList.remove('hidden');
    playbackControls.classList.add('hidden');
    queueContainer.classList.add('hidden');
    
    currentVideoIndex = -1;
    videoQueue = [];
    matchedWords = [];
    missingWords = [];
    isPlaying = false;
    
    hideWordInfo();
}

// ===== UI Update Functions =====

/**
 * Update the video queue display
 */
function updateQueueDisplay() {
    if (videoQueue.length === 0) {
        queueContainer.classList.add('hidden');
        return;
    }
    
    queueContainer.classList.remove('hidden');
    queueList.innerHTML = '';
    
    matchedWords.forEach((word, index) => {
        const item = document.createElement('div');
        item.className = 'queue-item';
        item.textContent = word;
        
        if (index === currentVideoIndex) {
            item.classList.add('current');
        } else if (index < currentVideoIndex) {
            item.classList.add('played');
        }
        
        queueList.appendChild(item);
    });
}

/**
 * Update playback control button states
 */
function updatePlaybackControls() {
    prevBtn.disabled = currentVideoIndex <= 0;
    nextBtn.disabled = currentVideoIndex >= videoQueue.length - 1;
}

/**
 * Show status message
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 */
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.classList.remove('hidden');
}

/**
 * Hide status message
 */
function hideStatus() {
    statusMessage.classList.add('hidden');
}

/**
 * Show word matching information
 */
function showWordInfo() {
    if (matchedWords.length === 0 && missingWords.length === 0) {
        hideWordInfo();
        return;
    }
    
    let html = '';
    
    if (matchedWords.length > 0) {
        html += '<p><strong>✅ ' + I18N.t('words_found') + ' (' + matchedWords.length + ') :</strong> ' + matchedWords.join(', ') + '</p>';
    }
    
    if (missingWords.length > 0) {
        html += '<p><strong>❌ ' + I18N.t('words_missing') + ' (' + missingWords.length + ') :</strong> ' + missingWords.join(', ') + '</p>';
    }
    
    wordInfo.innerHTML = html;
    wordInfo.classList.remove('hidden');
}

/**
 * Hide word information
 */
function hideWordInfo() {
    wordInfo.classList.add('hidden');
}

// ===== Initialization =====

console.log('LST Translation App loaded successfully');
console.log('Speech recognition available:', recognition !== null);

// Focus text input on page load
textInput.focus();
