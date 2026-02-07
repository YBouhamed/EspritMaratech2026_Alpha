"""
Avatar Manager Module

Manages 3D avatar models, configurations, and rendering settings.

Responsibilities:
- Load and manage avatar model metadata
- Provide avatar configuration for frontend rendering
- Support multiple avatar models (different styles, genders)
- Handle skeleton definitions and bone mappings
- Future: Avatar customization, LOD management

Extensibility:
- Custom avatar models
- Avatar appearance customization
- Facial expression metadata
- LOD (Level of Detail) configurations
"""

import os
import json
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict


@dataclass
class AvatarModel:
    """
    Metadata for a 3D avatar model
    """
    id: str                     # Avatar identifier
    name: str                   # Display name
    model_file: str             # Path to model file (GLTF/FBX)
    skeleton: str               # Skeleton standard
    scale: float = 1.0          # Model scale
    
    # Textures and materials
    textures: Dict[str, str] = None  # {"skin": "path", "clothing": "path"}
    
    # Bone structure
    bone_mapping: Dict[str, str] = None  # Bone name mappings
    
    # Visual metadata
    thumbnail: str = None       # Preview image
    description: str = ""       # Avatar description
    
    # Default animations
    idle_animation: str = None
    transition_animation: str = None
    
    # Rendering settings
    quality_preset: str = "medium"  # low, medium, high
    
    # Future: customization options
    customizable: bool = False
    customization_options: Dict = None
    
    def __post_init__(self):
        if self.textures is None:
            self.textures = {}
        if self.bone_mapping is None:
            self.bone_mapping = {}
        if self.customization_options is None:
            self.customization_options = {}
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return asdict(self)


@dataclass
class RenderingConfig:
    """
    Rendering configuration for 3D scene
    """
    quality: str = "medium"     # low, medium, high
    
    # Camera settings
    camera_distance: float = 2.5
    camera_height: float = 1.5
    camera_fov: float = 50.0
    
    # Lighting
    ambient_light_intensity: float = 0.5
    directional_light_intensity: float = 0.8
    shadows_enabled: bool = True
    
    # Performance
    target_fps: int = 30
    enable_antialiasing: bool = True
    
    # Post-processing
    enable_outline: bool = False
    background_color: str = "#f0f0f0"
    
    def to_dict(self) -> Dict:
        return asdict(self)


class AvatarManager:
    """
    Manages avatar models and configurations
    
    Features:
    - Load avatar definitions from JSON
    - Provide avatar metadata to frontend
    - Manage rendering configurations
    - Support multiple avatar models
    """
    
    def __init__(self, avatars_base_path: str, config_path: str = None):
        """
        Initialize avatar manager
        
        Args:
            avatars_base_path: Root directory for avatar assets
            config_path: Path to avatars.json configuration file
        """
        self.avatars_base_path = avatars_base_path
        self.config_path = config_path
        
        # Avatar registry: id → AvatarModel
        self.avatars: Dict[str, AvatarModel] = {}
        
        # Default avatar ID
        self.default_avatar_id = "default_humanoid"
        
        # Rendering presets
        self.rendering_presets = {
            "low": RenderingConfig(
                quality="low",
                shadows_enabled=False,
                enable_antialiasing=False,
                target_fps=30
            ),
            "medium": RenderingConfig(
                quality="medium",
                shadows_enabled=True,
                enable_antialiasing=True,
                target_fps=30
            ),
            "high": RenderingConfig(
                quality="high",
                shadows_enabled=True,
                enable_antialiasing=True,
                target_fps=60
            )
        }
    
    def load_avatars_from_config(self, config_path: str = None) -> int:
        """
        Load avatar definitions from JSON configuration file
        
        Config format:
        {
            "avatars": {
                "default_humanoid": {
                    "name": "Default Avatar",
                    "model": "avatars/default_humanoid/model.gltf",
                    "skeleton": "humanoid_mixamo",
                    ...
                }
            }
        }
        
        Args:
            config_path: Path to avatars.json file
        
        Returns:
            Number of avatars loaded
        """
        if config_path is None:
            config_path = self.config_path
        
        if not config_path or not os.path.exists(config_path):
            print(f"Warning: Avatar config file not found: {config_path}")
            return 0
        
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            avatars_data = config.get('avatars', {})
            count = 0
            
            for avatar_id, avatar_data in avatars_data.items():
                avatar = AvatarModel(
                    id=avatar_id,
                    name=avatar_data.get('name', avatar_id),
                    model_file=avatar_data.get('model', ''),
                    skeleton=avatar_data.get('skeleton', 'humanoid_mixamo'),
                    scale=avatar_data.get('scale', 1.0),
                    textures=avatar_data.get('materials', {}),
                    bone_mapping=avatar_data.get('bones', {}),
                    thumbnail=avatar_data.get('thumbnail'),
                    description=avatar_data.get('description', ''),
                    idle_animation=avatar_data.get('default_animations', {}).get('idle'),
                    transition_animation=avatar_data.get('default_animations', {}).get('transition'),
                    quality_preset=avatar_data.get('quality_preset', 'medium'),
                    customizable=avatar_data.get('customizable', False),
                    customization_options=avatar_data.get('customization', {})
                )
                
                self.avatars[avatar_id] = avatar
                count += 1
            
            # Set default avatar if specified in config
            if 'default_avatar' in config:
                self.default_avatar_id = config['default_avatar']
            
            print(f"Loaded {count} avatars from config")
            return count
            
        except Exception as e:
            print(f"Error loading avatar config: {e}")
            return 0
    
    def save_avatars_config(self, output_path: str = None) -> bool:
        """
        Save avatar definitions to JSON configuration file
        
        Args:
            output_path: Output file path
        
        Returns:
            True if successful
        """
        if output_path is None:
            output_path = self.config_path
        
        if not output_path:
            print("Error: No config path specified")
            return False
        
        config = {
            "default_avatar": self.default_avatar_id,
            "avatars": {}
        }
        
        for avatar_id, avatar in self.avatars.items():
            config["avatars"][avatar_id] = {
                "name": avatar.name,
                "model": avatar.model_file,
                "skeleton": avatar.skeleton,
                "scale": avatar.scale,
                "materials": avatar.textures,
                "bones": avatar.bone_mapping,
                "thumbnail": avatar.thumbnail,
                "description": avatar.description,
                "default_animations": {
                    "idle": avatar.idle_animation,
                    "transition": avatar.transition_animation
                },
                "quality_preset": avatar.quality_preset,
                "customizable": avatar.customizable,
                "customization": avatar.customization_options
            }
        
        try:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            print(f"Avatar config saved to {output_path}")
            return True
        except Exception as e:
            print(f"Error saving avatar config: {e}")
            return False
    
    def get_avatar(self, avatar_id: str = None) -> Optional[AvatarModel]:
        """
        Get avatar model by ID
        
        Args:
            avatar_id: Avatar identifier (default: default avatar)
        
        Returns:
            AvatarModel or None if not found
        """
        if avatar_id is None:
            avatar_id = self.default_avatar_id
        
        return self.avatars.get(avatar_id)
    
    def get_avatar_config(
        self, 
        avatar_id: str = None,
        base_url: str = "/assets"
    ) -> Optional[Dict]:
        """
        Get avatar configuration for frontend rendering
        
        Args:
            avatar_id: Avatar identifier
            base_url: Base URL for asset paths
        
        Returns:
            Dictionary with avatar config, or None if not found
        """
        avatar = self.get_avatar(avatar_id)
        
        if not avatar:
            return None
        
        return {
            "id": avatar.id,
            "name": avatar.name,
            "model_url": f"{base_url}/{avatar.model_file}",
            "skeleton": avatar.skeleton,
            "scale": avatar.scale,
            "textures": {
                key: f"{base_url}/{path}" 
                for key, path in avatar.textures.items()
            } if avatar.textures else {},
            "thumbnail_url": f"{base_url}/{avatar.thumbnail}" if avatar.thumbnail else None,
            "description": avatar.description,
            "default_animations": {
                "idle": avatar.idle_animation,
                "transition": avatar.transition_animation
            },
            "rendering": self.get_rendering_config(avatar.quality_preset).to_dict()
        }
    
    def list_avatars(self, base_url: str = "/assets") -> List[Dict]:
        """
        List all available avatars
        
        Args:
            base_url: Base URL for asset paths
        
        Returns:
            List of avatar metadata dictionaries
        """
        avatars_list = []
        
        for avatar_id, avatar in self.avatars.items():
            avatars_list.append({
                "id": avatar.id,
                "name": avatar.name,
                "skeleton": avatar.skeleton,
                "thumbnail_url": f"{base_url}/{avatar.thumbnail}" if avatar.thumbnail else None,
                "description": avatar.description
            })
        
        return avatars_list
    
    def get_rendering_config(self, preset: str = "medium") -> RenderingConfig:
        """
        Get rendering configuration for a quality preset
        
        Args:
            preset: Quality preset name (low, medium, high)
        
        Returns:
            RenderingConfig object
        """
        return self.rendering_presets.get(preset, self.rendering_presets["medium"])
    
    def register_avatar(self, avatar: AvatarModel):
        """
        Register a new avatar model
        
        Args:
            avatar: AvatarModel instance
        """
        self.avatars[avatar.id] = avatar
        print(f"Registered avatar: {avatar.id}")
    
    def set_default_avatar(self, avatar_id: str):
        """
        Set the default avatar
        
        Args:
            avatar_id: Avatar identifier
        """
        if avatar_id in self.avatars:
            self.default_avatar_id = avatar_id
            print(f"Default avatar set to: {avatar_id}")
        else:
            print(f"Error: Avatar not found: {avatar_id}")


if __name__ == "__main__":
    # Example usage for testing
    
    print("=== Avatar Manager Test ===\n")
    
    # Create manager
    manager = AvatarManager(
        avatars_base_path="assets/avatars",
        config_path="assets/config/avatars.json"
    )
    
    # Create sample avatar
    sample_avatar = AvatarModel(
        id="default_humanoid",
        name="Default Avatar",
        model_file="avatars/default_humanoid/model.gltf",
        skeleton="humanoid_mixamo",
        scale=1.0,
        textures={
            "skin": "avatars/default_humanoid/textures/skin.jpg",
            "clothing": "avatars/default_humanoid/textures/clothing.jpg"
        },
        thumbnail="avatars/default_humanoid/thumbnail.jpg",
        description="Standard humanoid avatar for LST signing",
        idle_animation="common/idle.fbx",
        transition_animation="common/transition.fbx",
        quality_preset="medium"
    )
    
    manager.register_avatar(sample_avatar)
    
    # Test avatar retrieval
    config = manager.get_avatar_config("default_humanoid")
    print("Avatar config:")
    print(json.dumps(config, indent=2))
    
    print("\nAvatar list:")
    for avatar in manager.list_avatars():
        print(f"  - {avatar['name']} ({avatar['id']})")
    
    print("\nRendering presets:")
    for preset_name in ["low", "medium", "high"]:
        preset = manager.get_rendering_config(preset_name)
        print(f"  {preset_name}: {preset.target_fps} FPS, shadows={preset.shadows_enabled}")
