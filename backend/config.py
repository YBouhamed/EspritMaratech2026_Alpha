"""
Backend Configuration for LST Avatar System

This module centralizes all configuration settings for:
- Asset paths
- Animation formats
- Avatar models
- Rendering settings
- API endpoints
"""

import os

# ===== Base Paths =====
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Video assets (existing system)
VIDEO_BASE_PATH = os.path.join(
    BASE_DIR,
    "DICTIONNAIRE MÉDICAL EN LANGUE DES SIGNES TUNISIENNE _AVST_",
    "DICTIONNAIRE MÉDICAL EN LANGUE DES SIGNES TUNISIENNE _AVST_"
)

# 3D Avatar assets (new system)
ASSETS_BASE_PATH = os.path.join(BASE_DIR, "assets")
AVATARS_PATH = os.path.join(ASSETS_BASE_PATH, "avatars")
ANIMATIONS_PATH = os.path.join(ASSETS_BASE_PATH, "animations")
CONFIG_PATH = os.path.join(ASSETS_BASE_PATH, "config")

# ===== Animation Settings =====
ANIMATION_CONFIG = {
    # Supported animation formats
    "supported_formats": ["fbx", "bvh", "gltf"],
    
    # Default format preference order
    "format_preference": ["fbx", "gltf", "bvh"],
    
    # Animation manifest file
    "manifest_file": os.path.join(ANIMATIONS_PATH, "animation_manifest.json"),
    
    # Default transition settings
    "transitions": {
        "default_duration": 0.3,  # seconds
        "blend_mode": "smooth",   # smooth, linear, ease_in_out
    },
    
    # Animation categories
    "categories": [
        "medical",
        "anatomy",
        "common",
        "gyneco",
        "hospital",
        "equipment",
        "communication"
    ],
    
    # Performance settings
    "optimization": {
        "enable_compression": True,
        "target_fps": 30,
        "max_bone_count": 100,
    }
}

# ===== Avatar Settings =====
AVATAR_CONFIG = {
    # Default avatar
    "default_avatar": "default_humanoid",
    
    # Avatar configuration file
    "config_file": os.path.join(CONFIG_PATH, "avatars.json"),
    
    # Skeleton standard
    "skeleton_standard": "humanoid_mixamo",  # or "humanoid_unreal", "custom"
    
    # Rendering quality presets
    "quality_presets": {
        "low": {
            "polygon_count": 10000,
            "texture_resolution": 512,
            "shadow_quality": "low"
        },
        "medium": {
            "polygon_count": 30000,
            "texture_resolution": 1024,
            "shadow_quality": "medium"
        },
        "high": {
            "polygon_count": 50000,
            "texture_resolution": 2048,
            "shadow_quality": "high"
        }
    },
    
    # Default quality
    "default_quality": "medium"
}

# ===== Rendering Modes =====
RENDERING_MODES = {
    "video": {
        "enabled": True,
        "description": "MP4 video playback (existing system)"
    },
    "avatar": {
        "enabled": True,
        "description": "3D avatar with FBX animations"
    },
    "hybrid": {
        "enabled": False,  # Future feature
        "description": "Avatar with video subtitles/overlay"
    }
}

# ===== API Settings =====
API_CONFIG = {
    "version": "1.0",
    "endpoints": {
        "translate": "/translate",                      # Existing
        "animation_sequence": "/api/animations/sequence",  # New
        "avatars_list": "/api/avatars",                 # New
        "animation_manifest": "/api/animations/manifest", # New
        "avatar_config": "/api/avatar/config",          # New
    },
    
    # Response settings
    "max_sequence_length": 50,  # Maximum number of signs per request
    "include_metadata": True,
    "include_transitions": True,
}

# ===== NLP & Sign Processing =====
NLP_CONFIG = {
    # Text normalization
    "normalization": {
        "lowercase": True,
        "remove_accents": True,
        "remove_punctuation": True,
        "preserve_numbers": False,  # Future: sign language numbers
    },
    
    # LST Grammar (future extensibility)
    "grammar": {
        "enable_word_reordering": False,  # Future: LST-specific syntax
        "enable_compound_signs": False,    # Future: multi-word signs
        "enable_classifiers": False,       # Future: contextual variations
    },
    
    # Tokenization
    "tokenization": {
        "split_on_whitespace": True,
        "handle_compound_words": False,  # Future
    }
}

# ===== Logging & Debug =====
DEBUG_CONFIG = {
    "enable_logging": True,
    "log_level": "INFO",  # DEBUG, INFO, WARNING, ERROR
    "log_file": os.path.join(BASE_DIR, "logs", "avatar_system.log"),
    
    # Performance monitoring
    "enable_performance_tracking": True,
    "track_animation_load_time": True,
    "track_rendering_fps": True,
}

# ===== Future Extensibility =====
EXPERIMENTAL_FEATURES = {
    # These are disabled by default - research/development features
    "ml_based_animation_generation": False,
    "video_to_animation_conversion": False,
    "facial_expression_synthesis": False,
    "hand_shape_refinement": False,
    "emotion_modulation": False,
    "ar_mode": False,
    "motion_capture_integration": False,
}
