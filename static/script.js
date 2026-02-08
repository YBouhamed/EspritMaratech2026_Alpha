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
const DEFAULT_VIDEO = 'nomove.mp4';  // Default video shown when idle
let videoQueue = [];           // Array of video paths to play
let currentVideoIndex = -1;    // Current video being played
let isPlaying = false;         // Whether a video is currently playing
let matchedWords = [];         // Words that were found
let missingWords = [];         // Words that were not found

// Save last played sequence for replay functionality
let lastVideoQueue = [];       // Last sequence of videos played
let lastMatchedWords = [];     // Last sequence of matched words

// Save original input words (as dictated/typed by user)
let originalInputWords = [];   // Original words before translation

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

// Custom video control buttons
const slowBtn = document.getElementById('slowBtn');
const replayBtn = document.getElementById('replayBtn');
const customStopBtn = document.getElementById('customStopBtn');
const normalSpeedBtn = document.getElementById('normalSpeedBtn');
const customVideoControls = document.getElementById('customVideoControls');

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

// Language to speech recognition locale mapping
const speechLangMap = {
    'tn': 'ar-TN',  // Tunisian dialect
    'fr': 'fr-FR',  // French
    'ar': 'ar-SA',  // Standard Arabic
    'en': 'en-US'   // English
};

// Translation dictionary: Tunisian/Arabic to French
const translationDict = {
    // Multi-word expressions (check these first)
    'طبيب أسنان': 'dentiste',
    'دكتور أسنان': 'dentiste',
    'طبيب اسنان': 'dentiste',
    'دكتور اسنان': 'dentiste',
    'كرت هوية': 'carte d identité',
    'بطاقة هوية': 'carte d identité',
    'بطاقة الهوية': 'carte d identité',
    'كرت الهوية': 'carte d identité',
    'سال راديولوجي': 'salle de radiologie',
    'قاعة أشعة': 'salle de radiologie',
    'صالة أشعة': 'salle de radiologie',
    'سالة راديو': 'salle de radiologie',
    'كيفاش راك': 'ça va',
    'كيف حالك': 'ça va',
    'لاباس': 'ça va',
    'بخير': 'ça va',
    
    // Single words - Tunisian dialect
    'طبيب': 'docteur',
    'دكتور': 'docteur',
    'سبيطار': 'hopital',
    'ممرض': 'infirmier',
    'دوا': 'medicament',
    'يوجعني': 'douleur',
    'راسي': 'tete',
    'قلبي': 'coeur',
    'خشمي': 'nez',
    'عيني': 'oeil',
    'فمي': 'bouche',
    'يدي': 'main',
    'رجلي': 'pied',
    'دنتيست': 'dentiste',
    'أسنان': 'dentiste',
    'اسنان': 'dentiste',
    'سن': 'dentiste',
    'صيدلية': 'pharmacie',
    'لابوراتوار': 'laboratoire',
    'مختبر': 'laboratoire',
    'راديولوجي': 'salle de radiologie',
    'أشعة': 'salle de radiologie',
    'اشعة': 'salle de radiologie',
    'راديو': 'salle de radiologie',
    'حرقة': 'fièvre',
    'سخانة': 'fièvre',
    'حمى': 'fièvre',
    'حساسية': 'allergie',
    'وجه': 'visage',
    'وش': 'visage',
    'حواجب': 'sourcils',
    'نمشي': 'aller',
    'يمشي': 'aller',
    'نروح': 'aller',
    'يروح': 'aller',
    'انروح': 'aller',
    'نعمل': 'faire',
    'يعمل': 'faire',
    'نحب': 'vouloir',
    'يحب': 'vouloir',
    'نبغي': 'vouloir',
    
    // Greetings - Tunisian/Arabic
    'مرحبا': 'bonjour',
    'مرحبى': 'bonjour',
    'أهلا': 'bonjour',
    'اهلا': 'bonjour',
    'سلام': 'bonjour',
    'السلام': 'bonjour',
    'صباح الخير': 'bonjour',
    'صباح': 'bonjour',
    'مساء الخير': 'bonjour',
    'مساء': 'bonjour',
    'يا هلا': 'bonjour',
    'ياهلا': 'bonjour',
    'هلا': 'bonjour',
    'أهلين': 'bonjour',
    'اهلين': 'bonjour',
    'تشرفنا': 'bonjour',
    'مرحبتين': 'bonjour',
    
    // Arabic standard
    'مستشفى': 'hopital',
    'دواء': 'medicament',
    'ألم': 'douleur',
    'رأس': 'tete',
    'قلب': 'coeur',
    'أنف': 'nez',
    'عين': 'oeil',
    'فم': 'bouche',
    'يد': 'main',
    'قدم': 'pied',
    'حاجبان': 'sourcils',
    'حاجب': 'sourcils',
    'الحاجبان': 'sourcils',
    'أذهب': 'aller',
    'ذهب': 'aller',
    'يذهب': 'aller',
    'نذهب': 'aller',
    'تذهب': 'aller',
    'يذهبون': 'aller',
    'أفعل': 'faire',
    'فعل': 'faire',
    'يفعل': 'faire',
    'نفعل': 'faire',
    'تفعل': 'faire',
    'يفعلون': 'faire',
    'أريد': 'vouloir',
    'أراد': 'vouloir',
    'يريد': 'vouloir',
    'نريد': 'vouloir',
    'تريد': 'vouloir',
    'يريدون': 'vouloir',
    'كيف حالك': 'ça va',
    'هل أنت بخير': 'ça va',
    
    // English to French translations
    // Greetings
    'hello': 'bonjour',
    'hi': 'bonjour',
    'hey': 'bonjour',
    'greetings': 'bonjour',
    'good morning': 'bonjour',
    'good afternoon': 'bonjour',
    'good evening': 'bonjour',
    'good day': 'bonjour',
    'morning': 'bonjour',
    'afternoon': 'bonjour',
    'evening': 'bonjour',
    'welcome': 'bonjour',
    'hiya': 'bonjour',
    'howdy': 'bonjour',
    'hi there': 'bonjour',
    'hello there': 'bonjour',
    
    // Medical terms
    'doctor': 'docteur',
    'dentist': 'dentiste',
    'hospital': 'hopital',
    'nurse': 'infirmier',
    'medication': 'medicament',
    'medicine': 'medicament',
    'drug': 'medicament',
    'pain': 'douleur',
    'head': 'tete',
    'heart': 'coeur',
    'nose': 'nez',
    'eye': 'oeil',
    'eyes': 'yeux',
    'mouth': 'bouche',
    'hand': 'main',
    'hands': 'mains',
    'foot': 'pied',
    'feet': 'pieds',
    'leg': 'jambe',
    'arm': 'bras',
    'pharmacy': 'pharmacie',
    'laboratory': 'laboratoire',
    'lab': 'laboratoire',
    'radiology': 'salle de radiologie',
    'x-ray': 'salle de radiologie',
    'fever': 'fièvre',
    'allergy': 'allergie',
    'allergies': 'allergie',
    'face': 'visage',
    'eyebrows': 'sourcils',
    'eyebrow': 'sourcils',
    'go': 'aller',
    'going': 'aller',
    'goes': 'aller',
    'went': 'aller',
    'gone': 'aller',
    'do': 'faire',
    'doing': 'faire',
    'does': 'faire',
    'did': 'faire',
    'done': 'faire',
    'make': 'faire',
    'making': 'faire',
    'makes': 'faire',
    'made': 'faire',
    'want': 'vouloir',
    'wanting': 'vouloir',
    'wants': 'vouloir',
    'wanted': 'vouloir',
    'how are you': 'ça va',
    'are you okay': 'ça va',
    'are you ok': 'ça va',
    'identity card': 'carte d identité',
    'id card': 'carte d identité',
    'brain': 'cerveau',
    'uterus': 'utérus',
    'stomach': 'estomac',
    'chest': 'poitrine',
    'back': 'dos',
    'neck': 'cou',
    'shoulder': 'épaule',
    'vaccine': 'vaccin',
    'vaccination': 'vaccin',
    'injection': 'piqûre',
    'shot': 'piqûre',
    'blood': 'sang',
    'pressure': 'tension',
    'temperature': 'température',
    'appointment': 'rendez-vous',
    'emergency': 'urgence',
    'ambulance': 'ambulance',
    'surgery': 'chirurgie',
    'operation': 'opération'
};

// French verb conjugation mapping - maps conjugated forms to base form (infinitive)
const verbConjugations = {
    // Aller (to go)
    'va': 'aller',
    'vas': 'aller',
    'vais': 'aller',
    'allons': 'aller',
    'allez': 'aller',
    'vont': 'aller',
    'allait': 'aller',
    'allais': 'aller',
    'allions': 'aller',
    'alliez': 'aller',
    'allaient': 'aller',
    'irai': 'aller',
    'iras': 'aller',
    'ira': 'aller',
    'irons': 'aller',
    'irez': 'aller',
    'iront': 'aller',
    'allé': 'aller',
    'allée': 'aller',
    'allés': 'aller',
    'allées': 'aller',
    'aille': 'aller',
    'ailles': 'aller',
    'aillent': 'aller',
    
    // Faire (to do/make)
    'fais': 'faire',
    'fait': 'faire',
    'faisons': 'faire',
    'faites': 'faire',
    'font': 'faire',
    'faisait': 'faire',
    'faisais': 'faire',
    'faisions': 'faire',
    'faisiez': 'faire',
    'faisaient': 'faire',
    'ferai': 'faire',
    'feras': 'faire',
    'fera': 'faire',
    'ferons': 'faire',
    'ferez': 'faire',
    'feront': 'faire',
    'fasse': 'faire',
    'fasses': 'faire',
    'fassent': 'faire',
    
    // Vouloir (to want)
    'veux': 'vouloir',
    'veut': 'vouloir',
    'voulons': 'vouloir',
    'voulez': 'vouloir',
    'veulent': 'vouloir',
    'voulait': 'vouloir',
    'voulais': 'vouloir',
    'voulions': 'vouloir',
    'vouliez': 'vouloir',
    'voulaient': 'vouloir',
    'voudrai': 'vouloir',
    'voudras': 'vouloir',
    'voudra': 'vouloir',
    'voudrons': 'vouloir',
    'voudrez': 'vouloir',
    'voudront': 'vouloir',
    'veuille': 'vouloir',
    'veuilles': 'vouloir',
    'veuillent': 'vouloir',
    'voulu': 'vouloir'
};

// Plural to singular mapping
const pluralToSingular = {
    'fièvres': 'fièvre',
    'fievres': 'fièvre',
    'allergies': 'allergie',
    'dentistes': 'dentiste',
    'laboratoires': 'laboratoire',
    'visages': 'visage',
    'docteurs': 'docteur',
    'médecins': 'médecin',
    'infirmiers': 'infirmier',
    'infirmières': 'infirmier',
    'hopitaux': 'hopital',
    'hôpitaux': 'hopital',
    'pharmacies': 'pharmacie',
    'radios': 'radio',
    'cerveaux': 'cerveau',
    'yeux': 'oeil',
    'mains': 'main',
    'pieds': 'pied',
    'bras': 'bras',
    'jambes': 'jambe',
    'chevaux': 'cheval'
};

// French synonyms mapping - maps synonyms to standard word
const frenchSynonyms = {
    // Greetings (map to bonjour)
    'salut': 'bonjour',
    'coucou': 'bonjour',
    'bonsoir': 'bonjour',
    'bonne journée': 'bonjour',
    'bonne soirée': 'bonjour',
    'bon matin': 'bonjour',
    'bienvenue': 'bonjour',
    'bjr': 'bonjour',
    'slt': 'bonjour',
    'cc': 'bonjour',
    'hello': 'bonjour',
    'hi': 'bonjour',
    'hey': 'bonjour'
};

// English stop words to ignore during translation
const englishStopWords = new Set([
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves',
    'you', 'your', 'yours', 'yourself', 'yourselves',
    'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
    'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
    'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
    'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'having',
    'do', 'does', 'did', 'doing',
    'a', 'an', 'the',
    'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while',
    'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under',
    'again', 'further', 'then', 'once'
]);

// Reverse translation: French to other languages (for display in queue)
const frenchToLanguages = {
    // French word: { tn: 'tunisian', ar: 'arabic', en: 'english' }
    'bonjour': { tn: 'مرحبا', ar: 'مرحبا', en: 'hello' },
    'aller': { tn: 'نمشي', ar: 'أذهب', en: 'go' },
    'faire': { tn: 'نعمل', ar: 'أفعل', en: 'do' },
    'vouloir': { tn: 'نحب', ar: 'أريد', en: 'want' },
    'ça va': { tn: 'لاباس', ar: 'بخير', en: 'fine' },
    'docteur': { tn: 'طبيب', ar: 'طبيب', en: 'doctor' },
    'dentiste': { tn: 'دنتيست', ar: 'طبيب أسنان', en: 'dentist' },
    'hopital': { tn: 'سبيطار', ar: 'مستشفى', en: 'hospital' },
    'infirmier': { tn: 'ممرض', ar: 'ممرض', en: 'nurse' },
    'medicament': { tn: 'دوا', ar: 'دواء', en: 'medicine' },
    'pharmacie': { tn: 'صيدلية', ar: 'صيدلية', en: 'pharmacy' },
    'laboratoire': { tn: 'لابوراتوار', ar: 'مختبر', en: 'laboratory' },
    'fièvre': { tn: 'حرقة', ar: 'حمى', en: 'fever' },
    'allergie': { tn: 'حساسية', ar: 'حساسية', en: 'allergy' },
    'visage': { tn: 'وجه', ar: 'وجه', en: 'face' },
    'tete': { tn: 'راسي', ar: 'رأس', en: 'head' },
    'coeur': { tn: 'قلبي', ar: 'قلب', en: 'heart' },
    'oeil': { tn: 'عيني', ar: 'عين', en: 'eye' },
    'bouche': { tn: 'فمي', ar: 'فم', en: 'mouth' },
    'nez': { tn: 'خشمي', ar: 'أنف', en: 'nose' },
    'main': { tn: 'يدي', ar: 'يد', en: 'hand' },
    'pied': { tn: 'رجلي', ar: 'قدم', en: 'foot' },
    'sourcils': { tn: 'حواجب', ar: 'حاجبان', en: 'eyebrows' },
    'douleur': { tn: 'يوجعني', ar: 'ألم', en: 'pain' },
    'salle de radiologie': { tn: 'راديولوجي', ar: 'قاعة أشعة', en: 'radiology' },
    'carte d identité': { tn: 'كرت هوية', ar: 'بطاقة هوية', en: 'id card' }
};

/**
 * Translate French word to current UI language for display
 * @param {string} frenchWord - French word to translate
 * @returns {string} - Translated word in current language
 */
function translateFromFrench(frenchWord) {
    const currentLang = I18N.currentLang;
    
    // If French mode, return as-is
    if (currentLang === 'fr') {
        return frenchWord;
    }
    
    // Try to find translation
    const normalized = frenchWord.toLowerCase().trim();
    if (frenchToLanguages[normalized] && frenchToLanguages[normalized][currentLang]) {
        return frenchToLanguages[normalized][currentLang];
    }
    
    // If no translation found, return original
    return frenchWord;
}

// Accent normalization - removes accents for flexible matching
function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Remove punctuation from text
function removePunctuation(str) {
    // Remove all common punctuation marks: . , ! ? ; : - ' " ( ) [ ] { } / \ etc.
    return str.replace(/[.,!?;:\-'"()\[\]{}/\\|<>@#$%^&*+=~`]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Normalize French word to its base form (lemmatization)
 * Handles: verb conjugations, plurals, accents, synonyms
 */
function normalizeFrenchWord(word) {
    const lower = word.toLowerCase().trim();
    
    // Remove accents for flexible matching
    const noAccent = removeAccents(lower);
    
    // Check French synonyms first (e.g., salut → bonjour)
    if (frenchSynonyms[lower]) {
        return frenchSynonyms[lower];
    }
    
    // Check verb conjugations (exact match)
    if (verbConjugations[lower]) {
        return verbConjugations[lower];
    }
    
    // Check plural to singular (with accents)
    if (pluralToSingular[lower]) {
        return pluralToSingular[lower];
    }
    
    // Check with accent removed
    if (pluralToSingular[noAccent]) {
        return pluralToSingular[noAccent];
    }
    
    // Check common plural patterns
    // -aux → -al (chevaux → cheval, but already in dict)
    if (lower.endsWith('aux') && lower.length > 4) {
        const singular = lower.slice(0, -3) + 'al';
        return singular;
    }
    
    // -s plural (most common)
    if (lower.endsWith('s') && lower.length > 2) {
        const singular = lower.slice(0, -1);
        // Don't remove 's' from words that end in 'ss' or are very short
        if (!singular.endsWith('s') && singular.length > 1) {
            return singular;
        }
    }
    
    // -x plural (yeux is special case, already handled)
    if (lower.endsWith('x') && lower.length > 2) {
        const singular = lower.slice(0, -1);
        if (singular.length > 1) {
            return singular;
        }
    }
    
    // Return with accent removed for flexible matching
    return noAccent;
}

/**
 * Translate text from Tunisian/Arabic/English to French
 */
function translateToFrench(text) {
    const currentLang = I18N.currentLang;
    
    // Remove punctuation first, then normalize
    const withoutPunctuation = removePunctuation(text);
    const normalized = withoutPunctuation.trim().toLowerCase();
    
    // If already in French, normalize each word for lemmatization
    if (currentLang === 'fr') {
        const words = normalized.split(/\s+/);
        const normalizedWords = words.map(w => normalizeFrenchWord(w));
        return normalizedWords.join(' ');
    }
    
    // For English: Filter stop words, translate, then normalize
    if (currentLang === 'en') {
        // Check for exact multi-word matches first
        if (translationDict[normalized]) {
            return normalizeFrenchWord(translationDict[normalized]);
        }
        
        const words = normalized.split(/\s+/);
        let result = [];
        let i = 0;
        
        while (i < words.length) {
            let found = false;
            
            // Try matching 3-word phrases first, then 2-word, then 1-word
            for (let len = Math.min(3, words.length - i); len > 0; len--) {
                const phrase = words.slice(i, i + len).join(' ');
                if (translationDict[phrase]) {
                    result.push(normalizeFrenchWord(translationDict[phrase]));
                    i += len;
                    found = true;
                    break;
                }
            }
            
            // If no match found, check if it's a stop word (ignore it)
            if (!found) {
                const word = words[i];
                if (!englishStopWords.has(word)) {
                    // Not a stop word and no translation found - keep it
                    result.push(word);
                }
                // If it's a stop word, just skip it (don't add to result)
                i++;
            }
        }
        
        return result.join(' ');
    }
    
    // For Arabic/Tunisian: First translate to French, then normalize
    
    // Check for exact multi-word matches
    if (translationDict[normalized]) {
        return normalizeFrenchWord(translationDict[normalized]);
    }
    
    // Try to find longest matching phrase first
    const words = normalized.split(/\s+/);
    let result = [];
    let i = 0;
    
    while (i < words.length) {
        let found = false;
        
        // Try matching 3-word phrases first, then 2-word, then 1-word
        for (let len = Math.min(3, words.length - i); len > 0; len--) {
            const phrase = words.slice(i, i + len).join(' ');
            if (translationDict[phrase]) {
                result.push(normalizeFrenchWord(translationDict[phrase]));
                i += len;
                found = true;
                break;
            }
        }
        
        // If no match found, keep the original word
        if (!found) {
            result.push(words[i]);
            i++;
        }
    }
    
    return result.join(' ');
}

// Check if browser supports speech recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // Configure based on current language
    function updateRecognitionLanguage() {
        const currentLang = I18N.currentLang || 'tn';
        recognition.lang = speechLangMap[currentLang] || 'ar-TN';
        console.log('Speech recognition language set to:', recognition.lang);
    }
    
    // Configure recognition
    updateRecognitionLanguage();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    // Handle recognition result
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        
        // Extract original words (without punctuation and stop words)
        const cleanOriginal = removePunctuation(transcript.trim().toLowerCase());
        const origWords = cleanOriginal.split(/\s+/).filter(w => w.length > 0);
        
        // Filter stop words for English
        if (I18N.currentLang === 'en') {
            originalInputWords = origWords.filter(w => !englishStopWords.has(w));
        } else {
            originalInputWords = origWords;
        }
        
        // Auto-translate from current language to French for search (transparent to user)
        const frenchText = translateToFrench(transcript);
        console.log('Recognized:', transcript);
        console.log('Original words:', originalInputWords);
        console.log('Translated to French for search:', frenchText);
        
        // Update voice status with original text
        voiceStatus.textContent = I18N.t('text_recognized') + ' : "' + transcript + '"';
        
        // Automatically translate using French version for search
        translateText(frenchText);
        
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
    
    // Extract original words (without punctuation and stop words)
    const cleanOriginal = removePunctuation(text.trim().toLowerCase());
    const origWords = cleanOriginal.split(/\s+/).filter(w => w.length > 0);
    
    // Filter stop words for English
    if (I18N.currentLang === 'en') {
        originalInputWords = origWords.filter(w => !englishStopWords.has(w));
    } else {
        originalInputWords = origWords;
    }
    
    // Translate to French before sending to server (transparent for user)
    const frenchText = translateToFrench(text);
    console.log('Original text:', text);
    console.log('Original words:', originalInputWords);
    console.log('Searching with French:', frenchText);
    translateText(frenchText);
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

// Video player ended event - play next video automatically with minimal delay
videoPlayer.addEventListener('ended', () => {
    // Use requestAnimationFrame for smoother transition
    requestAnimationFrame(() => {
        playNextVideo();
    });
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

// Custom video control buttons
slowBtn.addEventListener('click', () => {
    // Slow down video (0.5x speed)
    videoPlayer.playbackRate = 0.5;
    slowBtn.classList.add('active');
    normalSpeedBtn.classList.remove('active');
});

replayBtn.addEventListener('click', () => {
    // If currently playing a sequence, restart current video
    if (videoQueue.length > 0 && currentVideoIndex >= 0) {
        videoPlayer.currentTime = 0;
        videoPlayer.play();
    }
    // If sequence finished (back to default video), replay the entire last sequence
    else if (lastVideoQueue.length > 0) {
        replayLastSequence();
    }
});

customStopBtn.addEventListener('click', () => {
    // Stop playback and return to default video
    stopPlayback();
});

normalSpeedBtn.addEventListener('click', () => {
    // Return to normal speed (1x)
    videoPlayer.playbackRate = 1.0;
    normalSpeedBtn.classList.add('active');
    slowBtn.classList.remove('active');
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
            
            // Save this sequence as the last played sequence (for replay)
            lastVideoQueue = [...videoQueue];
            lastMatchedWords = [...matchedWords];
            
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
    videoPlayer.loop = false;  // Disable loop for translation videos
    videoPlayer.playbackRate = 1.0;  // Reset to normal speed
    
    // Reset speed button states
    normalSpeedBtn.classList.add('active');
    slowBtn.classList.remove('active');
    
    // Show video player, hide placeholder
    videoPlayer.classList.remove('hidden');
    videoPlaceholder.classList.add('hidden');
    
    // Show controls
    playbackControls.classList.remove('hidden');
    if (customVideoControls) {
        customVideoControls.classList.remove('hidden');
    }
    
    // Play video with preload for smooth transition
    videoPlayer.preload = 'auto';
    videoPlayer.load();
    videoPlayer.play().catch(error => {
        console.error('Error playing video:', error);
        showStatus(I18N.t('video_error'), 'error');
    });
    
    isPlaying = true;
    
    // Preload next video for seamless transition
    preloadNextVideo();
}

/**
 * Replay the last complete sequence (word or phrase)
 */
function replayLastSequence() {
    if (lastVideoQueue.length === 0) {
        showStatus(I18N.t('no_sign'), 'warning');
        return;
    }
    
    // Restore the last sequence
    videoQueue = [...lastVideoQueue];
    matchedWords = [...lastMatchedWords];
    
    // Show status with original word if available
    const wordCount = matchedWords.length;
    let displayWord = '';
    if (wordCount === 1) {
        displayWord = originalInputWords[0] || translateFromFrench(matchedWords[0]);
    }
    const message = wordCount === 1 
        ? `🔄 ${I18N.t('replay') || 'Replay'}: "${displayWord}"`
        : `🔄 ${I18N.t('replay') || 'Replay'}: ${wordCount} ${I18N.t('signs_found') || 'signes'}`;
    showStatus(message, 'info');
    
    // Show word info
    showWordInfo();
    
    // Start playback from beginning
    currentVideoIndex = -1;
    updateQueueDisplay();
    playNextVideo();
}

/**
 * Stop playback and reset
 */
function stopPlayback() {
    // Don't clear lastVideoQueue and lastMatchedWords - keep for replay
    playbackControls.classList.add('hidden');
    queueContainer.classList.add('hidden');
    // Keep custom controls visible for default video interaction
    
    currentVideoIndex = -1;
    videoQueue = [];
    matchedWords = [];
    missingWords = [];
    isPlaying = false;
    
    hideWordInfo();
    
    // Load default video instead of empty screen
    loadDefaultVideo();
}

/**
 * Load and loop the default idle video
 */
function loadDefaultVideo() {
    const videoUrl = `/videos/${DEFAULT_VIDEO}`;
    videoPlayer.src = videoUrl;
    videoPlayer.loop = true;  // Loop the default video
    videoPlayer.playbackRate = 1.0;  // Reset to normal speed
    videoPlayer.classList.remove('hidden');
    videoPlaceholder.classList.add('hidden');
    
    // Show custom controls even for default video
    if (customVideoControls) {
        customVideoControls.classList.remove('hidden');
    }
    
    // Reset speed button states
    if (normalSpeedBtn) normalSpeedBtn.classList.add('active');
    if (slowBtn) slowBtn.classList.remove('active');
    
    videoPlayer.load();
    videoPlayer.play().catch(error => {
        console.error('Error playing default video:', error);
        // If default video fails, show placeholder
        videoPlayer.classList.add('hidden');
        videoPlaceholder.classList.remove('hidden');
    });
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
        item.classList.add('queue-item');
        
        // Display original word if available, otherwise translate from French
        const displayWord = originalInputWords[index] || translateFromFrench(word);
        item.textContent = displayWord;
        
        // Add data attribute for index
        item.dataset.index = index;
        
        // Make clickable
        item.style.cursor = 'pointer';
        item.title = I18N.t('click_to_play') || 'Cliquez pour rejouer ce mot';
        
        // Add click event to jump to this word
        item.addEventListener('click', () => {
            jumpToWord(index);
        });
        
        if (index === currentVideoIndex) {
            item.classList.add('current');
        } else if (index < currentVideoIndex) {
            item.classList.add('played');
        }
        
        queueList.appendChild(item);
    });
}

/**
 * Jump to a specific word in the queue
 * @param {number} index - Index of word to jump to
 */
function jumpToWord(index) {
    if (index < 0 || index >= videoQueue.length) {
        return;
    }
    
    currentVideoIndex = index;
    loadAndPlayVideo(videoQueue[currentVideoIndex]);
    updateQueueDisplay();
    updatePlaybackControls();
    
    // Preload next video for smooth transition
    preloadNextVideo();
}

/**
 * Preload the next video in queue for smooth transitions
 */
function preloadNextVideo() {
    if (currentVideoIndex < videoQueue.length - 1) {
        const nextVideoPath = videoQueue[currentVideoIndex + 1];
        const nextVideoUrl = `/videos/${nextVideoPath}`;
        
        // Create a hidden video element to preload
        const preloadVideo = document.createElement('video');
        preloadVideo.src = nextVideoUrl;
        preloadVideo.preload = 'auto';
        preloadVideo.load();
    }
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
        // Use original words if available, otherwise translate from French
        const displayWords = originalInputWords.length === matchedWords.length 
            ? originalInputWords 
            : matchedWords.map(w => translateFromFrench(w));
        html += '<p><strong>✅ ' + I18N.t('words_found') + ' (' + matchedWords.length + ') :</strong> ' + displayWords.join(', ') + '</p>';
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

// ===== Colorblind Mode Toggle =====

const colorblindToggle = document.getElementById('colorblindToggle');

if (colorblindToggle) {
    let colorblindMode = localStorage.getItem('colorblind-mode') === 'true';

    // Apply saved preference on load
    const indicator = document.getElementById('colorblindIndicator');
    if (colorblindMode) {
        document.body.classList.add('colorblind-mode');
        colorblindToggle.classList.add('active');
        if (indicator) indicator.classList.remove('hidden');
        console.log('Colorblind mode applied from storage');
    }

    colorblindToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        colorblindMode = !colorblindMode;
        
        if (colorblindMode) {
            document.body.classList.add('colorblind-mode');
            colorblindToggle.classList.add('active');
            if (indicator) indicator.classList.remove('hidden');
            localStorage.setItem('colorblind-mode', 'true');
            console.log('Colorblind mode ACTIVATED - body class added');
        } else {
            document.body.classList.remove('colorblind-mode');
            colorblindToggle.classList.remove('active');
            if (indicator) indicator.classList.add('hidden');
            localStorage.setItem('colorblind-mode', 'false');
            console.log('Colorblind mode DEACTIVATED - body class removed');
        }
        
        // Force reflow
        document.body.offsetHeight;
    });
    
    console.log('Colorblind toggle initialized. Current state:', colorblindMode);
} else {
    console.error('Colorblind toggle button not found!');
}

// Update speech recognition language when language changes
if (typeof I18N !== 'undefined') {
    const originalSetLanguage = I18N.setLanguage;
    I18N.setLanguage = function(lang) {
        originalSetLanguage.call(this, lang);
        if (recognition) {
            const newLang = speechLangMap[lang] || 'ar-TN';
            recognition.lang = newLang;
            console.log('Speech recognition updated to:', newLang, 'for language:', lang);
        }
        
        // Update logo position based on language (handled by CSS order property)
        // RTL languages (ar, tn): logo on right (order: 10)
        // LTR languages (fr, en): logo on left (order: -1)
        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer) {
            if (lang === 'ar' || lang === 'tn') {
                logoContainer.style.order = '10';
            } else {
                logoContainer.style.order = '-1';
            }
        }
    };
}

// ===== Keyboard Shortcuts & Accessibility =====

const keyboardGuide = document.getElementById('keyboardGuide');
const keyboardGuideOverlay = document.getElementById('keyboardGuideOverlay');
const keyboardHelpBtn = document.getElementById('keyboardHelpBtn');
const guideCloseBtn = document.getElementById('guideCloseBtn');

// Instructions Guide Elements
const instructionsGuide = document.getElementById('instructionsGuide');
const instructionsGuideOverlay = document.getElementById('instructionsGuideOverlay');
const instructionsHelpBtn = document.getElementById('instructionsHelpBtn');
const instructionsCloseBtn = document.getElementById('instructionsCloseBtn');

// Toggle keyboard guide
function toggleKeyboardGuide() {
    const isActive = keyboardGuide.classList.contains('active');
    if (isActive) {
        keyboardGuide.classList.remove('active');
        keyboardGuideOverlay.classList.remove('active');
    } else {
        keyboardGuide.classList.add('active');
        keyboardGuideOverlay.classList.add('active');
        // Focus close button for accessibility
        guideCloseBtn.focus();
    }
}

// Toggle instructions guide
function toggleInstructionsGuide() {
    const isActive = instructionsGuide.classList.contains('active');
    if (isActive) {
        instructionsGuide.classList.remove('active');
        instructionsGuideOverlay.classList.remove('active');
    } else {
        instructionsGuide.classList.add('active');
        instructionsGuideOverlay.classList.add('active');
        // Focus close button for accessibility
        instructionsCloseBtn.focus();
    }
}

// Close guide
if (keyboardHelpBtn) {
    keyboardHelpBtn.addEventListener('click', toggleKeyboardGuide);
}

if (guideCloseBtn) {
    guideCloseBtn.addEventListener('click', toggleKeyboardGuide);
}

if (keyboardGuideOverlay) {
    keyboardGuideOverlay.addEventListener('click', toggleKeyboardGuide);
}

// Instructions guide events
if (instructionsHelpBtn) {
    instructionsHelpBtn.addEventListener('click', toggleInstructionsGuide);
}

if (instructionsCloseBtn) {
    instructionsCloseBtn.addEventListener('click', toggleInstructionsGuide);
}

if (instructionsGuideOverlay) {
    instructionsGuideOverlay.addEventListener('click', toggleInstructionsGuide);
}

// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts when typing in input/textarea
    const isInputFocused = document.activeElement.tagName === 'INPUT' || 
                          document.activeElement.tagName === 'TEXTAREA';
    
    // Help guide (?)
    if (e.key === '?' && !isInputFocused) {
        e.preventDefault();
        toggleKeyboardGuide();
        return;
    }
    
    // Escape - Close modals
    if (e.key === 'Escape') {
        if (keyboardGuide.classList.contains('active')) {
            toggleKeyboardGuide();
        }
        if (instructionsGuide.classList.contains('active')) {
            toggleInstructionsGuide();
        }
        return;
    }
    
    // Ctrl+Enter - Translate
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (translateBtn) translateBtn.click();
        return;
    }
    
    // Ctrl+M - Microphone toggle
    if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        if (micBtn) micBtn.click();
        return;
    }
    
    // Ctrl+K - Clear text
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        if (textInput) {
            textInput.value = '';
            textInput.focus();
        }
        return;
    }
    
    // Video controls (when not typing)
    if (!isInputFocused) {
        // Space - Play/Pause
        if (e.key === ' ' && videoPlayer && !videoPlayer.classList.contains('hidden')) {
            e.preventDefault();
            if (videoPlayer.paused) {
                videoPlayer.play();
            } else {
                videoPlayer.pause();
            }
            return;
        }
        
        // S - Slow
        if (e.key === 's' || e.key === 'S') {
            e.preventDefault();
            if (slowBtn) slowBtn.click();
            return;
        }
        
        // R - Replay
        if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            if (replayBtn) replayBtn.click();
            return;
        }
        
        // T - Stop
        if (e.key === 't' || e.key === 'T') {
            e.preventDefault();
            if (customStopBtn) customStopBtn.click();
            return;
        }
        
        // N - Normal speed
        if (e.key === 'n' || e.key === 'N') {
            e.preventDefault();
            if (normalSpeedBtn) normalSpeedBtn.click();
            return;
        }
        
        // C - Colorblind mode
        if (e.key === 'c' || e.key === 'C') {
            e.preventDefault();
            if (colorblindToggle) colorblindToggle.click();
            return;
        }
    }
    
    // Language switching (Ctrl + Arrow Left/Right)
    if (e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const langButtons = document.querySelectorAll('.lang-btn');
        const activeLang = document.querySelector('.lang-btn.active');
        let currentIndex = Array.from(langButtons).indexOf(activeLang);
        
        if (e.key === 'ArrowRight') {
            currentIndex = (currentIndex + 1) % langButtons.length;
        } else {
            currentIndex = (currentIndex - 1 + langButtons.length) % langButtons.length;
        }
        
        langButtons[currentIndex].click();
        return;
    }
    
    // Brightness control (Ctrl + Arrow Up/Down)
    if (e.ctrlKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const brightnessSlider = document.getElementById('brightnessSlider');
        if (brightnessSlider) {
            let value = parseInt(brightnessSlider.value);
            if (e.key === 'ArrowUp') {
                value = Math.min(130, value + 5);
            } else {
                value = Math.max(50, value - 5);
            }
            brightnessSlider.value = value;
            brightnessSlider.dispatchEvent(new Event('input'));
        }
        return;
    }
    
    // Text size (Ctrl + Plus/Minus)
    if (e.ctrlKey && (e.key === '+' || e.key === '=' || e.key === '-')) {
        e.preventDefault();
        if (e.key === '+' || e.key === '=') {
            changeTextSize(1);
        } else {
            changeTextSize(-1);
        }
        return;
    }
});

// ===== Initialization =====

console.log('LST Translation App loaded successfully');
console.log('Speech recognition available:', recognition !== null);

// Load default video on page load
loadDefaultVideo();

// Focus text input on page load
textInput.focus();
