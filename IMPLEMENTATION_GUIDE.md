# 3D Avatar Implementation Guide

## Phase 1: Setup & Testing (Getting Started)

This guide walks through implementing the 3D avatar system step-by-step.

---

## Prerequisites

- Existing LST web application (video-based)
- Python 3.8+ with Flask
- Modern web browser (Chrome/Firefox/Edge)
- Basic knowledge of Three.js (helpful but not required)
- Blender (for avatar/animation work)

---

## Step 1: Verify Folder Structure

Your project should now have this structure:

```
hackathon/
├── app.py                      # Original Flask app
├── backend/                    # NEW: Backend modules
│   ├── __init__.py
│   ├── config.py
│   ├── sign_processor.py
│   ├── animation_db.py
│   └── avatar_manager.py
├── assets/                     # NEW: 3D assets
│   ├── avatars/
│   │   └── default_humanoid/
│   ├── animations/
│   │   ├── medical/
│   │   ├── anatomy/
│   │   ├── common/
│   │   └── animation_manifest.json
│   └── config/
│       └── avatars.json
├── static/
│   ├── script.js               # Original video renderer
│   ├── avatar-renderer.js      # NEW: Three.js avatar renderer
│   └── libs/                   # NEW: Three.js libraries (to add)
├── templates/
│   └── index.html
└── ARCHITECTURE_3D_AVATAR.md   # Architecture documentation
```

---

## Step 2: Install Three.js Libraries

Download and add to `static/libs/`:

1. **three.min.js** - Core Three.js library
   - https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js
   - Or: `npm install three` (if using build tools)

2. **GLTFLoader.js** - For loading avatar models
   - https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js

3. **FBXLoader.js** - For loading animations
   - https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/FBXLoader.js

4. **OrbitControls.js** - Camera controls (optional)
   - https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js

**Alternative:** Use CDN links in HTML (see Step 4)

---

## Step 3: Acquire Test Assets

### Option A: Use Mixamo (Recommended for Testing)

1. Go to https://www.mixamo.com (free, Adobe account required)

2. **Download Avatar:**
   - Browse characters (e.g., "X Bot", "Y Bot")
   - Click "Download"
   - Format: FBX for Unity (.fbx)
   - Pose: T-pose
   - Download

3. **Download Test Animations:**
   - Select your character
   - Browse animations (e.g., "Idle", "Waving")
   - Click each animation → Download
   - Format: FBX for Unity
   - Skin: Without Skin
   - Download multiple animations as placeholders

4. **Convert to Web Format:**
   - Open Blender
   - File → Import → FBX → Select avatar FBX
   - File → Export → GLTF 2.0
   - Save as: `assets/avatars/default_humanoid/model.gltf`
   - Repeat for animations, save to `assets/animations/common/`

### Option B: Use Ready Player Me

1. Go to https://readyplayer.me
2. Create custom avatar (free)
3. Download as GLB
4. Place in `assets/avatars/default_humanoid/model.glb`

---

## Step 4: Create Test HTML Page

Create `templates/avatar_test.html`:

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>LST Avatar Test</title>
    <style>
        body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: #1a1a1a;
            color: white;
        }
        #avatar-container {
            width: 100vw;
            height: 70vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        #controls {
            padding: 20px;
            text-align: center;
        }
        button {
            padding: 10px 20px;
            margin: 5px;
            font-size: 16px;
            border: none;
            border-radius: 5px;
            background: #667eea;
            color: white;
            cursor: pointer;
        }
        button:hover {
            background: #764ba2;
        }
        #status {
            margin-top: 20px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div id="avatar-container"></div>
    
    <div id="controls">
        <h2>LST 3D Avatar Test</h2>
        <button id="loadAvatar">Load Avatar</button>
        <button id="playSequence">Play Test Sequence</button>
        <button id="stopBtn">Stop</button>
        <div id="status">Ready</div>
    </div>

    <!-- Three.js Libraries -->
    <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/FBXLoader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js"></script>
    
    <!-- Avatar Renderer -->
    <script src="{{ url_for('static', filename='avatar-renderer.js') }}"></script>
    
    <!-- Test Script -->
    <script>
        const container = document.getElementById('avatar-container');
        const statusEl = document.getElementById('status');
        
        // Initialize renderer
        const renderer = new AvatarRenderer(container, {
            cameraDistance: 3,
            cameraHeight: 1.5,
            enableControls: true
        });
        
        // Status callbacks
        renderer.onLoadProgress = (item, progress) => {
            statusEl.textContent = `Loading ${item}... ${Math.round(progress * 100)}%`;
        };
        
        renderer.onSequenceComplete = () => {
            statusEl.textContent = 'Sequence complete';
        };
        
        // Initialize on page load
        renderer.initialize().then(() => {
            statusEl.textContent = 'Renderer initialized. Click "Load Avatar" to start.';
        });
        
        // Load avatar
        document.getElementById('loadAvatar').addEventListener('click', async () => {
            try {
                statusEl.textContent = 'Loading avatar...';
                
                // Fetch avatar config from backend
                const response = await fetch('/api/avatar/config');
                const avatarConfig = await response.json();
                
                await renderer.loadAvatar(avatarConfig);
                
                statusEl.textContent = 'Avatar loaded! Ready to play animations.';
            } catch (error) {
                statusEl.textContent = `Error: ${error.message}`;
                console.error(error);
            }
        });
        
        // Play test sequence
        document.getElementById('playSequence').addEventListener('click', async () => {
            try {
                statusEl.textContent = 'Fetching animation sequence...';
                
                // Request animation sequence from backend
                const response = await fetch('/api/animations/sequence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: 'médecin infirmier',
                        avatar_id: 'default_humanoid'
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    statusEl.textContent = `Playing ${data.sequence.length} signs...`;
                    await renderer.playAnimationSequence(data.sequence);
                } else {
                    statusEl.textContent = `Error: ${data.message}`;
                }
            } catch (error) {
                statusEl.textContent = `Error: ${error.message}`;
                console.error(error);
            }
        });
        
        // Stop button
        document.getElementById('stopBtn').addEventListener('click', () => {
            renderer.stop();
            statusEl.textContent = 'Stopped';
        });
    </script>
</body>
</html>
```

---

## Step 5: Add Backend API Endpoints

Add to `app.py` (before `if __name__ == '__main__':`):

```python
# Import new modules
from backend.sign_processor import SignProcessor, create_sign_database_from_files
from backend.animation_db import AnimationDatabase
from backend.avatar_manager import AvatarManager
import json

# Initialize avatar system components
animation_db = None
avatar_manager = None
sign_processor = None

def initialize_avatar_system():
    """Initialize 3D avatar system components"""
    global animation_db, avatar_manager, sign_processor
    
    # Initialize animation database
    animation_db = AnimationDatabase(
        animations_base_path="assets/animations",
        manifest_path="assets/animations/animation_manifest.json"
    )
    
    # Try to load from manifest first, fallback to filesystem scan
    if not animation_db.load_from_manifest():
        animation_db.load_from_filesystem()
    
    # Initialize avatar manager
    avatar_manager = AvatarManager(
        avatars_base_path="assets/avatars",
        config_path="assets/config/avatars.json"
    )
    avatar_manager.load_avatars_from_config()
    
    # Initialize sign processor with animation database
    sign_database = {sign_id: sign_id for sign_id in animation_db.animations.keys()}
    sign_processor = SignProcessor(sign_database)
    
    print(f"Avatar system initialized: {len(animation_db.animations)} animations, {len(avatar_manager.avatars)} avatars")


@app.route('/api/animations/sequence', methods=['POST'])
def get_animation_sequence():
    """
    Get animation sequence for given text
    
    POST /api/animations/sequence
    {
        "text": "médecin infirmier",
        "avatar_id": "default_humanoid"
    }
    """
    try:
        data = request.get_json()
        text = data.get('text', '')
        avatar_id = data.get('avatar_id', 'default_humanoid')
        
        if not text:
            return jsonify({
                'success': False,
                'message': 'No text provided'
            }), 400
        
        # Process text to sign sequence
        sign_sequence = sign_processor.process_text(text)
        
        # Get animation sequence
        animations, missing = animation_db.get_animation_sequence(
            sign_sequence.get_sign_ids(),
            base_url="/assets/animations"
        )
        
        # Get avatar config
        avatar_config = avatar_manager.get_avatar_config(avatar_id, base_url="/assets")
        
        # Convert animations to dict format
        animation_list = [
            {
                'sign_id': anim.sign_id,
                'animation_url': anim.animation_url,
                'duration': anim.duration,
                'transition_in': anim.transition_in,
                'transition_out': anim.transition_out,
                'format': anim.format
            }
            for anim in animations
        ]
        
        return jsonify({
            'success': True,
            'avatar': avatar_config,
            'sequence': animation_list,
            'total_duration': sum(a.duration for a in animations),
            'matched_words': [s.word for s in sign_sequence.matched_signs],
            'missing_words': sign_sequence.missing_words,
            'message': f'{len(animations)} signe(s) trouvé(s)'
        })
        
    except Exception as e:
        print(f"Error in /api/animations/sequence: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/api/avatars')
def get_avatars():
    """List available avatars"""
    avatars = avatar_manager.list_avatars(base_url="/assets")
    return jsonify({
        'avatars': avatars
    })


@app.route('/api/avatar/config')
def get_avatar_config():
    """Get avatar configuration"""
    avatar_id = request.args.get('avatar_id', avatar_manager.default_avatar_id)
    config = avatar_manager.get_avatar_config(avatar_id, base_url="/assets")
    
    if config:
        return jsonify(config)
    else:
        return jsonify({
            'error': 'Avatar not found'
        }), 404


@app.route('/api/animations/manifest')
def get_animation_manifest():
    """Get animation manifest"""
    return jsonify({
        'version': '1.0',
        'total_animations': len(animation_db.animations),
        'categories': animation_db.get_categories(),
        'statistics': animation_db.get_statistics()
    })


@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve asset files (avatars, animations)"""
    return send_from_directory('assets', filename)


@app.route('/avatar-test')
def avatar_test():
    """Render avatar test page"""
    return render_template('avatar_test.html')
```

In the `if __name__ == '__main__':` section, add before `app.run()`:

```python
if __name__ == '__main__':
    # Load video database (existing)
    load_video_database()
    
    # Initialize avatar system (NEW)
    initialize_avatar_system()
    
    # ...rest of existing code...
    app.run(debug=True, host='0.0.0.0', port=5000)
```

---

## Step 6: Test the System

1. **Add `send_from_directory` import** (if not already):
   ```python
   from flask import Flask, render_template, request, jsonify, send_from_directory
   ```

2. **Start the server:**
   ```bash
   python app.py
   ```

3. **Open test page:**
   ```
   http://127.0.0.1:5000/avatar-test
   ```

4. **Test sequence:**
   - Click "Load Avatar"
   - Wait for avatar to load
   - Click "Play Test Sequence"
   - Avatar should perform animations

---

## Step 7: Troubleshooting

### Avatar doesn't load
- Check browser console for errors
- Verify model file exists in `assets/avatars/default_humanoid/`
- Ensure GLTF file is valid (test in Blender or online GLTF viewer)

### Animations don't play
- Check `animation_manifest.json` paths are correct
- Verify FBX files exist
- Ensure skeleton names match between avatar and animations

### Library errors
- Verify Three.js libraries are loaded (check browser console)
- Use CDN links if local files aren't working
- Check Three.js version compatibility

### Performance issues
- Reduce model polygon count
- Use lower quality textures
- Disable shadows in renderer options

---

## Step 8: Integration with Main Application

Once testing works, integrate into main application:

1. Add mode selector to `templates/index.html`:
   ```html
   <select id="renderMode">
       <option value="video">Video Mode</option>
       <option value="avatar">3D Avatar Mode</option>
   </select>
   ```

2. Modify JavaScript to switch between video and avatar renderer

3. Use same backend API for both modes

---

## Next Steps

1. **Create Real LST Animations:**
   - Work with LST signers
   - Use motion capture or manual animation
   - Replace placeholder animations

2. **Enhance Avatar:**
   - Add facial expressions (blend shapes)
   - Improve hand details
   - Add clothing customization

3. **Optimize Performance:**
   - Compress animations
   - Implement LOD (Level of Detail)
   - Lazy load animations

4. **Add Features:**
   - Multiple avatar selection
   - Playback speed control
   - Recording/exporting translations

---

## Resources

- **Three.js Documentation:** https://threejs.org/docs/
- **Blender (free):** https://www.blender.org/
- **Mixamo:** https://www.mixamo.com/
- **GLTF Validator:** https://github.khronos.org/glTF-Validator/
- **Animation Basics:** Search "Three.js animation tutorial"

---

## Support & Community

For issues or questions:
1. Check `ARCHITECTURE_3D_AVATAR.md` for system design
2. Review asset README files in `assets/` folders
3. Consult Three.js documentation
4. Test with simpler models/animations first

---

**Good luck with your LST 3D avatar implementation! 🤟**
