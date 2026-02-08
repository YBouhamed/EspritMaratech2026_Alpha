"""
Tunisian Sign Language (LST) Translation Web Application
Backend Flask server that translates text/voice to LST videos

This application:
- Scans the video database on startup
- Receives text input from frontend
- Processes and matches words to video files
- Returns list of videos to play sequentially
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import string
import unicodedata
import json

app = Flask(__name__)

# Path to the video database
VIDEO_BASE_PATH = r"c:\Users\bouha\Downloads\vidss"

# Global dictionary to store video mappings
# Key: normalized word, Value: relative path to video file
video_database = {}

# French verb conjugation mapping - maps conjugated forms to base form (infinitive)
VERB_CONJUGATIONS = {
    # Aller (to go)
    'va': 'aller', 'vas': 'aller', 'vais': 'aller', 'allons': 'aller',
    'allez': 'aller', 'vont': 'aller', 'allait': 'aller', 'allais': 'aller',
    'allions': 'aller', 'alliez': 'aller', 'allaient': 'aller',
    'irai': 'aller', 'iras': 'aller', 'ira': 'aller', 'irons': 'aller',
    'irez': 'aller', 'iront': 'aller', 'allé': 'aller', 'allée': 'aller',
    'allés': 'aller', 'allées': 'aller', 'aille': 'aller', 'ailles': 'aller',
    'aillent': 'aller',
    
    # Faire (to do/make)
    'fais': 'faire', 'fait': 'faire', 'faisons': 'faire', 'faites': 'faire',
    'font': 'faire', 'faisait': 'faire', 'faisais': 'faire', 'faisions': 'faire',
    'faisiez': 'faire', 'faisaient': 'faire', 'ferai': 'faire', 'feras': 'faire',
    'fera': 'faire', 'ferons': 'faire', 'ferez': 'faire', 'feront': 'faire',
    'fasse': 'faire', 'fasses': 'faire', 'fassent': 'faire',
    
    # Vouloir (to want)
    'veux': 'vouloir', 'veut': 'vouloir', 'voulons': 'vouloir', 'voulez': 'vouloir',
    'veulent': 'vouloir', 'voulait': 'vouloir', 'voulais': 'vouloir', 'voulions': 'vouloir',
    'vouliez': 'vouloir', 'voulaient': 'vouloir', 'voudrai': 'vouloir', 'voudras': 'vouloir',
    'voudra': 'vouloir', 'voudrons': 'vouloir', 'voudrez': 'vouloir', 'voudront': 'vouloir',
    'veuille': 'vouloir', 'veuilles': 'vouloir', 'veuillent': 'vouloir', 'voulu': 'vouloir'
}

# Plural to singular mapping
PLURAL_TO_SINGULAR = {
    'fièvres': 'fièvre', 'fievres': 'fièvre', 'allergies': 'allergie',
    'dentistes': 'dentiste', 'laboratoires': 'laboratoire', 'visages': 'visage',
    'docteurs': 'docteur', 'médecins': 'médecin', 'infirmiers': 'infirmier',
    'infirmières': 'infirmier', 'hopitaux': 'hopital', 'hôpitaux': 'hopital',
    'pharmacies': 'pharmacie', 'radios': 'radio', 'cerveaux': 'cerveau',
    'yeux': 'oeil', 'mains': 'main', 'pieds': 'pied', 'bras': 'bras',
    'jambes': 'jambe', 'chevaux': 'cheval'
}

# French synonyms mapping - maps synonyms to standard word
FRENCH_SYNONYMS = {
    # Greetings (map to bonjour)
    'salut': 'bonjour', 'coucou': 'bonjour', 'bonsoir': 'bonjour',
    'bonne journée': 'bonjour', 'bonne soirée': 'bonjour', 'bon matin': 'bonjour',
    'bienvenue': 'bonjour', 'bjr': 'bonjour', 'slt': 'bonjour', 'cc': 'bonjour',
    'hello': 'bonjour', 'hi': 'bonjour', 'hey': 'bonjour'
}


def lemmatize_word(word):
    """
    Reduce a word to its base form (lemmatization).
    Handles: synonyms, verb conjugations, plurals, and common patterns.
    
    Args:
        word (str): Word to lemmatize (already lowercase and normalized)
    
    Returns:
        str: Base form of the word
    """
    # Check French synonyms first (e.g., salut → bonjour)
    if word in FRENCH_SYNONYMS:
        return FRENCH_SYNONYMS[word]
    
    # Check verb conjugations (exact match)
    if word in VERB_CONJUGATIONS:
        return VERB_CONJUGATIONS[word]
    
    # Check plural to singular (exact match)
    if word in PLURAL_TO_SINGULAR:
        return PLURAL_TO_SINGULAR[word]
    
    # Check common plural patterns
    # -aux → -al (chevaux → cheval, hôpitaux → hopital)
    if word.endswith('aux') and len(word) > 4:
        return word[:-3] + 'al'
    
    # -s plural (most common) - but avoid removing 's' from words that naturally end in 's'
    if word.endswith('s') and len(word) > 2:
        singular = word[:-1]
        # Don't remove 's' from words that end in 'ss' or single letter + s
        if not singular.endswith('s') and len(singular) > 1:
            return singular
    
    # -x plural (e.g., yeux, but some are special cases already handled)
    if word.endswith('x') and len(word) > 2:
        singular = word[:-1]
        if len(singular) > 1:
            return singular
    
    # Return as-is if no transformation found
    return word


def normalize_text(text):
    """
    Normalize text by:
    - Converting to lowercase
    - Removing accents
    - Removing punctuation
    - Lemmatizing each word
    
    Args:
        text (str): Input text to normalize
    
    Returns:
        str: Normalized text
    """
    # Convert to lowercase
    text = text.lower()
    
    # Remove accents - normalize to NFD (decomposed form) and filter out combining characters
    text = ''.join(
        char for char in unicodedata.normalize('NFD', text)
        if unicodedata.category(char) != 'Mn'
    )
    
    # Remove punctuation - replace with spaces to preserve word boundaries
    text = text.translate(str.maketrans(string.punctuation, ' ' * len(string.punctuation)))
    
    # Split into words and lemmatize each one
    words = text.split()
    lemmatized_words = [lemmatize_word(word) for word in words if word]
    
    return ' '.join(lemmatized_words)


def load_video_database():
    """
    Scan the video directory structure and build an index of all available videos.
    Maps normalized word names to their file paths.
    
    The function:
    1. Walks through all subdirectories
    2. Finds all .mp4 files
    3. Normalizes the filename (without extension) as the key
    4. Stores the relative path as the value
    """
    print("Loading video database...")
    
    if not os.path.exists(VIDEO_BASE_PATH):
        print(f"WARNING: Video directory not found: {VIDEO_BASE_PATH}")
        return
    
    video_count = 0
    
    # Walk through all subdirectories
    for root, dirs, files in os.walk(VIDEO_BASE_PATH):
        for filename in files:
            # Only process MP4 files
            if filename.lower().endswith('.mp4'):
                # Get the word from filename (remove .mp4 extension)
                word = os.path.splitext(filename)[0]
                
                # Normalize the word for matching
                normalized_word = normalize_text(word)
                
                # Store the relative path from VIDEO_BASE_PATH
                relative_path = os.path.relpath(
                    os.path.join(root, filename),
                    VIDEO_BASE_PATH
                )
                
                # Store in database (handle duplicates by keeping first occurrence)
                if normalized_word not in video_database:
                    video_database[normalized_word] = relative_path
                    video_count += 1
                else:
                    print(f"Duplicate word found: {normalized_word} - keeping first occurrence")
    
    print(f"Loaded {video_count} videos into database")
    print(f"Sample entries: {list(video_database.items())[:5]}")


def text_to_videos(text):
    """
    Convert input text to a list of video paths.
    
    Process:
    1. Normalize and clean the text
    2. Split into individual words
    3. Match each word to a video in the database
    4. Return ordered list of video paths
    
    Args:
        text (str): Input text to translate
    
    Returns:
        list: List of video file paths (relative to VIDEO_BASE_PATH)
    """
    # Normalize the entire text
    normalized_text = normalize_text(text)
    
    # Split into words
    words = normalized_text.split()
    
    # Find matching videos
    video_list = []
    matched_words = []
    missing_words = []
    
    for word in words:
        if word in video_database:
            video_list.append(video_database[word])
            matched_words.append(word)
        else:
            missing_words.append(word)
    
    print(f"Input: {text}")
    print(f"Matched: {matched_words}")
    print(f"Missing: {missing_words}")
    
    return video_list, matched_words, missing_words


@app.route('/')
def index():
    """Serve the main HTML page"""
    return render_template('index.html')


@app.route('/test')
def test_page():
    """Serve the test page"""
    return render_template('test.html')


@app.route('/logo.mp4')
def serve_logo():
    """Serve the logo video file"""
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), 'logo.mp4')


@app.route('/videos/<path:filename>')
def serve_video(filename):
    """
    Serve video files from the video database
    
    Args:
        filename (str): Relative path to the video file
    
    Returns:
        Video file response
    """
    return send_from_directory(VIDEO_BASE_PATH, filename)


@app.route('/translate', methods=['POST'])
def translate():
    """
    API endpoint to translate text to video sequence
    
    Expects JSON:
        {
            "text": "phrase à traduire"
        }
    
    Returns JSON:
        {
            "success": true/false,
            "videos": [list of video paths],
            "matched_words": [list of matched words],
            "missing_words": [list of words not found],
            "message": "status message"
        }
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'message': 'No text provided',
                'videos': [],
                'matched_words': [],
                'missing_words': []
            }), 400
        
        text = data['text'].strip()
        
        if not text:
            return jsonify({
                'success': False,
                'message': 'Empty text provided',
                'videos': [],
                'matched_words': [],
                'missing_words': []
            }), 400
        
        # Convert text to video list
        videos, matched, missing = text_to_videos(text)
        
        if not videos:
            return jsonify({
                'success': False,
                'message': 'Aucun signe trouvé pour ce texte',
                'videos': [],
                'matched_words': matched,
                'missing_words': missing
            })
        
        return jsonify({
            'success': True,
            'message': f'{len(videos)} signe(s) trouvé(s)',
            'videos': videos,
            'matched_words': matched,
            'missing_words': missing
        })
    
    except Exception as e:
        print(f"Error in /translate: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Erreur serveur: {str(e)}',
            'videos': [],
            'matched_words': [],
            'missing_words': []
        }), 500


@app.route('/api/stats')
def stats():
    """
    API endpoint to get database statistics
    
    Returns:
        JSON with database stats
    """
    return jsonify({
        'total_videos': len(video_database),
        'sample_words': list(video_database.keys())[:20]
    })


# =============================================
# CAMERA/SIGNS TO TEXT MODE
# =============================================

@app.route('/avatarr')
def avatarr_page():
    """Serve the signs-to-text translation page"""
    return render_template('avatarr.html')


if __name__ == '__main__':
    # Load the video database before starting the server
    load_video_database()
    
    # Run the Flask development server
    print("\n" + "="*50)
    print("LST Translation Server Starting...")
    print("="*50)
    print(f"Video database: {len(video_database)} signs loaded")
    print("Server running at: http://127.0.0.1:5000")
    print("Press CTRL+C to stop")
    print("="*50 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
