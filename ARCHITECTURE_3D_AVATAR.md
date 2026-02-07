# Architecture: 3D Avatar System for LST Translation

## Executive Summary

This document describes the architectural design for extending the LST (Langue des Signes Tunisienne) translation web application with a 3D animated avatar system. The design prioritizes modularity, extensibility, and research-oriented development while maintaining the existing MP4 video functionality.

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Text Input   │  │ Speech Input │  │ Rendering Mode     │   │
│  │              │  │ (Web Speech) │  │ [Video | Avatar]   │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER (JavaScript)                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Input Processing Module                                 │   │
│  │  - Text normalization                                    │   │
│  │  - Speech-to-text handling                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌────────────────────┬──────────────────────────────────┐     │
│  │                    │                                    │     │
│  ▼                    ▼                                    ▼     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐     │
│  │ Video Player │  │ Avatar       │  │ Hybrid Renderer  │     │
│  │ Module       │  │ Renderer     │  │ (Future)         │     │
│  │ (Existing)   │  │ (Three.js)   │  │                  │     │
│  └──────────────┘  └──────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                        HTTP/REST API
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER (Python/Flask)                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  API Layer                                               │   │
│  │  - /translate (text → sign sequence)                     │   │
│  │  - /animations (animation metadata)                      │   │
│  │  - /avatar/config (avatar configuration)                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  NLP & Sign Processing Module                            │   │
│  │  - Text normalization                                    │   │
│  │  - Word tokenization                                     │   │
│  │  - LST grammar rules (future)                            │   │
│  │  - Sign sequence optimization                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌────────────────────┬──────────────────────────────────┐     │
│  │                    │                                    │     │
│  ▼                    ▼                                    ▼     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐     │
│  │ Video DB     │  │ Animation DB │  │ Avatar Asset     │     │
│  │ Manager      │  │ Manager      │  │ Manager          │     │
│  │              │  │              │  │                  │     │
│  └──────────────┘  └──────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ASSET STORAGE LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐     │
│  │ MP4 Videos   │  │ FBX/BVH      │  │ Avatar Models    │     │
│  │ /videos/     │  │ Animations   │  │ GLTF/FBX         │     │
│  │              │  │ /animations/ │  │ /avatars/        │     │
│  └──────────────┘  └──────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Specifications

### 2.1 Backend Architecture

#### 2.1.1 Sign Processing Module

**Responsibility**: Convert text to ordered sign sequence

```python
class SignProcessor:
    """
    Handles linguistic processing and sign mapping
    
    Extensibility points:
    - LST-specific grammar rules
    - Sentence structure reordering
    - Contextual sign selection
    """
    
    def process_text(text: str) -> SignSequence:
        # 1. Normalize text (case, accents, punctuation)
        # 2. Tokenize into words
        # 3. Apply LST grammar transformations (future)
        # 4. Map words to signs
        # 5. Return ordered sequence
        pass
```

#### 2.1.2 Animation Database Manager

**Responsibility**: Map signs to animation files

```python
class AnimationDatabase:
    """
    Manages animation asset metadata
    
    Structure:
    {
        "word": {
            "animation_file": "path/to/file.fbx",
            "duration": 2.5,  # seconds
            "format": "fbx",
            "skeleton": "humanoid_standard",
            "tags": ["medical", "anatomy"],
            "transitions": {
                "in": "neutral_pose",
                "out": "neutral_pose"
            }
        }
    }
    """
    
    def get_animation_sequence(words: List[str]) -> AnimationSequence:
        # Return ordered list of animation metadata
        pass
    
    def validate_skeleton_compatibility(animation: str, avatar: str) -> bool:
        # Ensure animation and avatar share skeleton
        pass
```

#### 2.1.3 Avatar Configuration Manager

**Responsibility**: Manage avatar models and rendering settings

```python
class AvatarManager:
    """
    Handles avatar model metadata and configurations
    
    Supports:
    - Multiple avatar models (different styles, genders)
    - LOD (Level of Detail) configurations
    - Customization options
    """
    
    def get_avatar_config(avatar_id: str) -> AvatarConfig:
        # Return avatar metadata, skeleton info, material settings
        pass
```

### 2.2 Frontend Architecture

#### 2.2.1 Rendering Strategy Pattern

**Responsibility**: Abstract rendering method (Video vs 3D Avatar)

```javascript
/**
 * Abstract renderer interface
 * Allows switching between video and avatar rendering
 */
class IRenderer {
    async loadAssets(sequence) { throw new Error("Not implemented"); }
    async play() { throw new Error("Not implemented"); }
    pause() { throw new Error("Not implemented"); }
    stop() { throw new Error("Not implemented"); }
    skipTo(index) { throw new Error("Not implemented"); }
}

class VideoRenderer extends IRenderer {
    // Existing MP4 playback implementation
}

class AvatarRenderer extends IRenderer {
    // Three.js based 3D avatar implementation
}

class RenderingController {
    constructor(mode = 'video') {
        this.renderer = mode === 'avatar' 
            ? new AvatarRenderer() 
            : new VideoRenderer();
    }
    
    switchMode(mode) {
        this.renderer.stop();
        this.renderer = mode === 'avatar' 
            ? new AvatarRenderer() 
            : new VideoRenderer();
    }
}
```

#### 2.2.2 Three.js Avatar Renderer

**Responsibility**: Load and animate 3D avatar

```javascript
class AvatarRenderer extends IRenderer {
    /**
     * Three.js based avatar animation system
     * 
     * Features:
     * - GLTF/FBX avatar loading
     * - Animation blending and transitions
     * - Camera controls
     * - Lighting setup
     */
    
    constructor(containerElement) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(...);
        this.renderer = new THREE.WebGLRenderer(...);
        this.mixer = null;  // Animation mixer
        this.avatar = null;
        this.animations = [];
        this.currentAnimationIndex = 0;
    }
    
    async loadAvatar(avatarUrl) {
        // Load GLTF/FBX avatar model
        // Setup skeleton and materials
        // Add to scene
    }
    
    async loadAnimations(animationSequence) {
        // Load FBX/BVH animation files
        // Retarget to avatar skeleton
        // Prepare animation clips
    }
    
    play() {
        // Start animation sequence
        // Handle transitions between signs
        // Loop idle animation when idle
    }
    
    blendToAnimation(nextAnimation, duration = 0.3) {
        // Smooth transition between animations
        // Prevents jarring movements
    }
}
```

---

## 3. Data Flow Diagrams

### 3.1 Translation Request Flow (Avatar Mode)

```
User enters text: "médecin infirmier"
        │
        ▼
Frontend: Normalize and send to backend
        │
        ▼
POST /translate
{
    "text": "médecin infirmier",
    "render_mode": "avatar"
}
        │
        ▼
Backend: SignProcessor.process_text()
        │
        ├─ Normalize: "medecin infirmier"
        ├─ Tokenize: ["medecin", "infirmier"]
        └─ Map to signs
        │
        ▼
Backend: AnimationDatabase.get_animation_sequence()
        │
        └─ Return animation metadata
        │
        ▼
Response:
{
    "success": true,
    "signs": [
        {
            "word": "medecin",
            "animation": "/animations/medical/medecin.fbx",
            "duration": 2.5,
            "transitions": {...}
        },
        {
            "word": "infirmier",
            "animation": "/animations/medical/infirmier.fbx",
            "duration": 2.3,
            "transitions": {...}
        }
    ],
    "avatar_id": "default_humanoid"
}
        │
        ▼
Frontend: AvatarRenderer.loadAnimations()
        │
        ├─ Fetch animation files
        ├─ Load into Three.js
        └─ Setup animation queue
        │
        ▼
Frontend: AvatarRenderer.play()
        │
        ├─ Play "medecin" animation
        ├─ Blend transition
        ├─ Play "infirmier" animation
        └─ Return to idle pose
```

### 3.2 Animation Playback State Machine

```
┌──────────────┐
│    IDLE      │ ◄─────────────────┐
│  (rest pose) │                   │
└──────────────┘                   │
        │                          │
        │ play()                   │
        ▼                          │
┌──────────────┐                   │
│   LOADING    │                   │
│  (fetch anims)│                  │
└──────────────┘                   │
        │                          │
        ▼                          │
┌──────────────┐      ┌──────────────┐
│   PLAYING    │──────│ TRANSITIONING│
│  (animation) │      │  (blending)  │
└──────────────┘      └──────────────┘
        │                    │
        │ onFinished()       │
        ├────────────────────┘
        │
        │ hasNext? yes
        ├─────────┐
        │         │
        │         ▼
        │    [Next Animation]
        │         │
        │         └──────► TRANSITIONING
        │
        │ hasNext? no
        └─────────────────────► IDLE
```

---

## 4. Asset Management

### 4.1 Directory Structure

```
hackathon/
│
├── app.py                          # Main Flask application
├── requirements.txt
├── README.md
├── ARCHITECTURE_3D_AVATAR.md       # This document
│
├── backend/
│   ├── __init__.py
│   ├── sign_processor.py           # NLP and sign mapping
│   ├── animation_db.py             # Animation database manager
│   ├── avatar_manager.py           # Avatar configuration
│   └── config.py                   # Configuration settings
│
├── templates/
│   ├── index.html                  # Main interface (video mode)
│   └── avatar.html                 # Avatar mode interface (NEW)
│
├── static/
│   ├── style.css
│   ├── script.js                   # Video renderer
│   ├── avatar-renderer.js          # Three.js avatar renderer (NEW)
│   ├── rendering-controller.js     # Rendering abstraction (NEW)
│   └── libs/
│       ├── three.min.js            # Three.js library
│       ├── GLTFLoader.js           # GLTF loader
│       ├── FBXLoader.js            # FBX loader
│       └── OrbitControls.js        # Camera controls
│
├── assets/
│   ├── avatars/
│   │   ├── default_humanoid/
│   │   │   ├── model.gltf          # Avatar 3D model
│   │   │   ├── textures/           # Avatar textures
│   │   │   └── skeleton.json       # Skeleton definition
│   │   │
│   │   ├── female_avatar/          # Alternative avatar
│   │   └── male_avatar/            # Alternative avatar
│   │
│   ├── animations/
│   │   ├── medical/
│   │   │   ├── medecin.fbx
│   │   │   ├── infirmier.fbx
│   │   │   ├── chirurgien.fbx
│   │   │   └── ...
│   │   │
│   │   ├── anatomy/
│   │   │   ├── coeur.fbx
│   │   │   ├── poumons.fbx
│   │   │   └── ...
│   │   │
│   │   ├── common/
│   │   │   ├── idle.fbx            # Rest pose animation
│   │   │   ├── transition.fbx      # Generic transition
│   │   │   └── greeting.fbx        # Start/end sequence
│   │   │
│   │   └── animation_manifest.json # Metadata for all animations
│   │
│   └── config/
│       ├── avatars.json            # Avatar configurations
│       └── skeleton_mappings.json  # Bone retargeting rules
│
└── DICTIONNAIRE MÉDICAL EN LANGUE DES SIGNES TUNISIENNE _AVST_/
    └── ...                         # Existing video files
```

### 4.2 Animation Manifest Example

```json
{
  "version": "1.0",
  "skeleton_standard": "humanoid_mixamo",
  "animations": {
    "medecin": {
      "file": "medical/medecin.fbx",
      "format": "fbx",
      "duration": 2.5,
      "fps": 30,
      "bone_count": 65,
      "tags": ["medical", "professional"],
      "transitions": {
        "in": "neutral",
        "out": "neutral"
      },
      "metadata": {
        "hand_shape": "pointing",
        "movement": "circular",
        "location": "chest"
      }
    },
    "idle": {
      "file": "common/idle.fbx",
      "format": "fbx",
      "duration": 3.0,
      "loop": true,
      "tags": ["common"],
      "metadata": {
        "description": "Neutral standing pose with slight breathing"
      }
    }
  }
}
```

### 4.3 Avatar Configuration Example

```json
{
  "avatars": {
    "default_humanoid": {
      "model": "avatars/default_humanoid/model.gltf",
      "skeleton": "humanoid_mixamo",
      "scale": 1.0,
      "materials": {
        "skin": "avatars/default_humanoid/textures/skin.jpg",
        "clothing": "avatars/default_humanoid/textures/clothing.jpg"
      },
      "bones": {
        "root": "Hips",
        "spine": ["Spine", "Spine1", "Spine2"],
        "left_arm": ["LeftShoulder", "LeftArm", "LeftForeArm", "LeftHand"],
        "right_arm": ["RightShoulder", "RightArm", "RightForeArm", "RightHand"],
        "left_hand_fingers": [...],
        "right_hand_fingers": [...]
      },
      "default_animations": {
        "idle": "common/idle.fbx",
        "transition": "common/transition.fbx"
      }
    }
  }
}
```

---

## 5. API Specifications

### 5.1 New Backend Endpoints

#### `/api/animations/sequence` (POST)

Request animation sequence for given text.

**Request:**
```json
{
  "text": "médecin infirmier",
  "avatar_id": "default_humanoid",
  "include_transitions": true
}
```

**Response:**
```json
{
  "success": true,
  "avatar": {
    "id": "default_humanoid",
    "model_url": "/assets/avatars/default_humanoid/model.gltf",
    "skeleton": "humanoid_mixamo"
  },
  "sequence": [
    {
      "word": "medecin",
      "animation_url": "/assets/animations/medical/medecin.fbx",
      "duration": 2.5,
      "transition_in": 0.3,
      "transition_out": 0.3
    },
    {
      "word": "infirmier",
      "animation_url": "/assets/animations/medical/infirmier.fbx",
      "duration": 2.3,
      "transition_in": 0.3,
      "transition_out": 0.3
    }
  ],
  "total_duration": 5.4,
  "missing_words": [],
  "matched_words": ["medecin", "infirmier"]
}
```

#### `/api/avatars` (GET)

List available avatars.

**Response:**
```json
{
  "avatars": [
    {
      "id": "default_humanoid",
      "name": "Default Avatar",
      "model_url": "/assets/avatars/default_humanoid/model.gltf",
      "thumbnail": "/assets/avatars/default_humanoid/thumbnail.jpg",
      "skeleton": "humanoid_mixamo"
    }
  ]
}
```

#### `/api/animations/manifest` (GET)

Get animation metadata catalog.

**Response:**
```json
{
  "version": "1.0",
  "total_animations": 157,
  "categories": ["medical", "anatomy", "common"],
  "animations": { /* full manifest */ }
}
```

---

## 6. Implementation Phases

### Phase 1: Foundation (Current Deliverable)
- ✅ Architecture documentation
- ✅ Backend structure with animation API endpoints
- ✅ Asset folder organization
- ✅ Configuration system
- ✅ Three.js renderer pseudocode/implementation

### Phase 2: Basic Animation Pipeline
- [ ] Convert 10-20 representative MP4 videos to FBX animations
- [ ] Acquire or create basic humanoid avatar (GLTF)
- [ ] Implement animation retargeting
- [ ] Test single sign playback

### Phase 3: Sequence & Transitions
- [ ] Implement animation blending
- [ ] Smooth transitions between signs
- [ ] Idle pose handling
- [ ] Full sequence playback

### Phase 4: Enhancement
- [ ] Multiple avatar models
- [ ] Camera controls and viewing angles
- [ ] Performance optimization (LOD, culling)
- [ ] Facial expressions (blend shapes)

### Phase 5: Advanced Features (Research)
- [ ] LST-specific grammar rules in sign processor
- [ ] Contextual sign selection
- [ ] Procedural animation blending
- [ ] Hand shape precision (MediaPipe integration)
- [ ] Emotion and intensity modulation

---

## 7. Technical Considerations

### 7.1 Animation Format Decisions

| Format | Pros | Cons | Recommended Use |
|--------|------|------|-----------------|
| **FBX** | Industry standard, full skeleton + mesh support, Blender/Maya compatible | Large file size, requires loader library | Primary format for complex animations |
| **BVH** | Lightweight, skeleton-only, motion capture standard | No mesh data, old format | Motion capture retargeting, research |
| **GLTF** | Web-optimized, fast loading, PBR materials | Complex to author | Avatar models, simple animations |
| **JSON/Custom** | Lightweight, easy parsing | Requires custom implementation | Future optimization |

**Recommendation:** Use FBX as primary animation format, GLTF for avatar models.

### 7.2 Performance Optimization

1. **Asset Loading:**
   - Progressive loading (avatar first, then animations)
   - Preload common animations (idle, transitions)
   - Lazy load sign-specific animations

2. **Rendering:**
   - LOD (Level of Detail) for distant/small views
   - Texture atlasing
   - Shader optimization

3. **Animation:**
   - Animation compression
   - Keyframe reduction
   - Bone masking (animate only necessary bones)

### 7.3 Cross-Platform Compatibility

| Platform | Renderer | Notes |
|----------|----------|-------|
| **Web (Desktop)** | Three.js | Primary target, full features |
| **Web (Mobile)** | Three.js (WebGL) | Reduced quality, simplified shaders |
| **iOS/Android App** | Unity/Unreal | Native performance, AR support |
| **VR/AR** | WebXR / Unity | Future consideration |

---

## 8. Extensibility Points

### 8.1 NLP & Linguistic Processing

**Current:** Simple word tokenization and mapping

**Future Extensions:**
- **LST Grammar Rules:** Adjust word order according to LST syntax
- **Compound Signs:** Multi-word signs (e.g., "salle d'attente" → single sign)
- **Classifiers:** Context-dependent sign variations
- **Spatial Grammar:** Virtual space signing for pronouns/locations

```python
class LSTGrammarEngine:
    """
    Future: LST-specific linguistic transformations
    """
    
    def apply_word_order_rules(self, words: List[str]) -> List[str]:
        # Example: French "Je vais à l'hôpital"
        # → LST word order: "hôpital je aller"
        pass
    
    def detect_compound_signs(self, words: List[str]) -> List[CompoundSign]:
        # Identify multi-word phrases that map to single signs
        pass
    
    def apply_classifiers(self, context: Context, sign: Sign) -> Sign:
        # Modify sign based on context (size, shape, movement)
        pass
```

### 8.2 Animation Generation (Research Track)

**Current:** Pre-recorded animations only

**Future Research Possibilities:**
- **Motion Capture:** Record real LST signers, convert to FBX
- **Procedural Generation:** Parameterize sign components (hand shape, location, movement)
- **ML-Based Synthesis:** Train models to generate novel signs
- **Video-to-Animation:** Convert existing MP4s to skeleton animations (requires CV/ML)

```python
class AnimationGenerator:
    """
    Research component: Generate animations programmatically
    """
    
    def synthesize_from_parameters(self, params: SignParameters) -> Animation:
        # Generate animation from linguistic parameters
        # hand_shape, location, movement, orientation
        pass
    
    def retarget_from_video(self, video_path: str) -> Animation:
        # Use MediaPipe/OpenPose to extract pose
        # Convert pose sequence to skeleton animation
        # (Advanced research topic)
        pass
```

### 8.3 Multi-Modal Output

**Current:** Single rendering mode (video OR avatar)

**Future:**
- **Hybrid Mode:** Avatar + video subtitles
- **Picture-in-Picture:** Small avatar avatar overlaid on main content
- **AR Mode:** Project avatar in real space (WebXR)
- **Holographic:** Future display technologies

### 8.4 Personalization & Accessibility

- **Avatar Customization:** User selects appearance, clothing, skin tone
- **Speed Control:** Adjust playback speed for learning
- **Region Variants:** Different LST dialects/regional variations
- **Emphasis & Emotion:** Modulate animation intensity and facial expressions

---

## 9. Research & Academic Angles

### 9.1 Research Questions

1. **Linguistic Fidelity:**
   - How accurately can 3D avatars represent LST compared to human signers?
   - What animation frame rate is sufficient for comprehension?

2. **User Experience:**
   - Do users prefer video or 3D avatar?
   - Impact on learning and retention

3. **Technical Performance:**
   - Animation compression vs. quality trade-offs
   - Real-time generation feasibility

4. **Accessibility Impact:**
   - Does this tool improve medical communication for deaf patients?
   - Can it be deployed in clinical settings?

### 9.2 Evaluation Metrics

- **Comprehension Rate:** % of signs correctly understood by LST users
- **Rendering Performance:** FPS, load time, memory usage
- **Animation Quality:** Smoothness, realism, accuracy
- **User Satisfaction:** Survey-based feedback from deaf community

### 9.3 Academic Contributions

- **Dataset:** LST medical sign animation database (if published)
- **Framework:** Reusable sign language avatar architecture
- **Evaluation:** Benchmarking 3D avatars vs. video for sign languages
- **Accessibility:** Real-world deployment and impact study

---

## 10. Conclusion

This architecture provides a **modular, extensible foundation** for transitioning the LST medical dictionary from video-based to avatar-based sign language translation. Key design principles enforced:

✅ **Separation of Concerns:** NLP, animation management, and rendering are independent  
✅ **Dual Rendering:** Support both video (proven) and avatar (research)  
✅ **Asset Pipeline:** Clear structure for managing animations and avatars  
✅ **Extensibility:** Designed for future enhancements (grammar, ML, AR)  
✅ **Performance:** Optimized for web delivery  
✅ **Research-Oriented:** Architected for academic exploration  

The system is **ready for hackathon development** and **positioned for research publication**.

---

## Appendix A: Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend Framework** | Flask (Python) | REST API, existing codebase |
| **3D Rendering** | Three.js | Web-based 3D avatar rendering |
| **Animation Format** | FBX, BVH | Industry-standard skeletal animation |
| **Model Format** | GLTF 2.0 | Web-optimized 3D avatar models |
| **Alternative Renderer** | Babylon.js | Alternative to Three.js |
| **High-Fidelity Option** | Unreal Engine (Pixel Streaming) | Photorealistic rendering (future) |
| **Motion Capture (Future)** | MediaPipe, OpenPose | Video → skeleton extraction |
| **Animation Authoring** | Blender, Maya, MotionBuilder | Create/edit FBX animations |

---

## Appendix B: Learning Resources

- **Three.js:** https://threejs.org/docs/
- **FBX Format:** Autodesk FBX SDK documentation
- **GLTF Specification:** https://www.khronos.org/gltf/
- **Sign Language Linguistics:** Research papers on LST grammar
- **Motion Capture:** MediaPipe Holistic documentation

---

**Document Version:** 1.0  
**Last Updated:** February 7, 2026  
**Author:** LST Avatar Team  
**Status:** Architecture Design Complete
