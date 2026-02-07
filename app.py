"""
Tunisian Sign Language (LST) Translation Web Application
Backend Flask server that translates text to LST videos + 3D Avatar

This application:
- Scans the video database on startup
- Receives text input from frontend
- Processes and matches words to video files
- Returns list of videos to play sequentially
- Serves 3D avatar model and animations via Three.js
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import string
import unicodedata
import json

app = Flask(__name__)

# Path to assets (3D models + animations)
ASSETS_BASE_PATH = os.path.join(os.path.dirname(__file__), 'assets')

# Path to the video database
VIDEO_BASE_PATH = r"c:\Users\bouha\Downloads\vids"

# Global dictionary to store video mappings
# Key: normalized word, Value: relative path to video file
video_database = {}


def normalize_text(text):
    """
    Normalize text by:
    - Converting to lowercase
    - Removing accents
    - Removing punctuation
    
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
    
    # Remove punctuation
    text = text.translate(str.maketrans('', '', string.punctuation))
    
    return text.strip()


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
# 3D AVATAR SYSTEM ENDPOINTS
# =============================================

@app.route('/avatar')
def avatar_page():
    """Serve the 3D avatar translation page"""
    return render_template('avatar.html')


@app.route('/assets/<path:filename>')
def serve_asset(filename):
    """Serve 3D assets (models, animations, configs)"""
    return send_from_directory(ASSETS_BASE_PATH, filename)


@app.route('/api/avatar/config')
def avatar_config():
    """
    Return avatar configuration for the Three.js renderer.
    Michelle is a realistic human female avatar with Mixamo skeleton.
    """
    config = {
        'name': 'Michelle - Human Avatar',
        'model_url': '/assets/avatars/default_humanoid/Michelle.glb',
        'scale': 1.0,  # Michelle is already in correct units
        'position': [0, 0, 0],
        'has_built_in_animations': False,  # Relies on pose tracking from videos
        'skeleton_type': 'mixamo',
        'supports_pose_tracking': True,
        'supports_hand_tracking': True,
        'supports_facial_expressions': False,
        'bone_prefix': 'mixamorig',  # Mixamo standard bone naming
        'animation_mapping': {}  # Pure pose tracking, no built-in animations needed
    }
    return jsonify(config)


@app.route('/api/avatar/translate', methods=['POST'])
def avatar_translate():
    """
    Translate text to a sequence of 3D avatar animations.
    Uses RobotExpressive's built-in animations as a demo.
    
    Returns:
        {
            "success": bool,
            "animations": [{"sign_id": "...", "animation_name": "...", "word": "..."}],
            "matched_words": [...],
            "missing_words": [...]
        }
    """
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'success': False, 'message': 'No text provided', 'animations': []}), 400
        
        text = data['text'].strip()
        if not text:
            return jsonify({'success': False, 'message': 'Empty text', 'animations': []}), 400
        
        # Normalize and split
        normalized = normalize_text(text)
        words = normalized.split()
        
        # Animation mapping from config
        animation_map = {
            'bonjour': 'Wave', 'salut': 'Wave', 'coucou': 'Wave',
            'oui': 'ThumbsUp', 'daccord': 'ThumbsUp', 'bien': 'ThumbsUp',
            'merci': 'ThumbsUp', 'bravo': 'ThumbsUp',
            'non': 'No', 'pas': 'No', 'jamais': 'No',
            'content': 'Happy Idle', 'heureux': 'Happy Idle', 'joie': 'Happy Idle',
            'triste': 'Sad Idle', 'malheureux': 'Sad Idle', 'mal': 'Sad Idle',
            'danser': 'Dance', 'danse': 'Dance', 'fete': 'Dance',
            'courir': 'Running', 'vite': 'Running', 'urgence': 'Running',
            'marcher': 'Walking', 'aller': 'Walking', 'venir': 'Walking',
            'sauter': 'Jump', 'saut': 'Jump',
            'mourir': 'Death', 'mort': 'Death',
            'frapper': 'Punch', 'battre': 'Punch',
        }
        
        # Also check video database words → map to closest animation
        medical_animation_map = {}
        for word in video_database.keys():
            # Map medical terms to gestures for demo purposes
            if word in ['medecin', 'docteur', 'infirmier', 'infirmiere', 'sage-femme']:
                medical_animation_map[word] = 'Wave'
            elif word in ['hopital', 'clinique', 'pharmacie', 'laboratoire']:
                medical_animation_map[word] = 'Walking'
            elif word in ['douleur', 'malade', 'fievre', 'fatigue']:
                medical_animation_map[word] = 'Sad Idle'
            elif word in ['guerison', 'sante', 'gueri']:
                medical_animation_map[word] = 'Happy Idle'
            else:
                medical_animation_map[word] = 'Idle'
        
        # Combine both maps
        full_map = {**medical_animation_map, **animation_map}
        
        animations = []
        matched = []
        missing = []
        
        for word in words:
            if word in full_map:
                animations.append({
                    'sign_id': word,
                    'animation_name': full_map[word],
                    'word': word,
                    'transition_in': 0.4
                })
                matched.append(word)
            elif word in video_database:
                # Word exists in video DB but not in animation map
                animations.append({
                    'sign_id': word,
                    'animation_name': 'Idle',
                    'word': word,
                    'transition_in': 0.4
                })
                matched.append(word)
            else:
                missing.append(word)
        
        print(f"[Avatar] Input: {text}")
        print(f"[Avatar] Matched: {matched}")
        print(f"[Avatar] Missing: {missing}")
        
        return jsonify({
            'success': len(animations) > 0,
            'message': f'{len(animations)} animation(s) trouvée(s)' if animations else 'Aucune animation trouvée',
            'animations': animations,
            'matched_words': matched,
            'missing_words': missing
        })
    
    except Exception as e:
        print(f"Error in /api/avatar/translate: {str(e)}")
        return jsonify({'success': False, 'message': str(e), 'animations': []}), 500


@app.route('/api/avatar/animations')
def list_avatar_animations():
    """List all available built-in animations for the robot model"""
    animations = [
        'Dance', 'Death', 'Happy Idle', 'Idle', 'Jump',
        'No', 'Punch', 'Running', 'Sad Idle', 'Standing',
        'ThumbsUp', 'Walking', 'Wave', 'Yes'
    ]
    return jsonify({'animations': animations})


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
