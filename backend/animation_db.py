"""
Animation Database Manager

Manages animation asset metadata and provides animation sequence generation.

Responsibilities:
- Load and index animation files (FBX, BVH, GLTF)
- Store animation metadata (duration, skeleton, transitions)
- Generate animation sequences for sign sequences
- Validate skeleton compatibility
- Manage animation manifest

Future Extensions:
- Animation caching and preloading
- Dynamic animation quality adjustment
- Animation blending metadata
- Facial expression and hand shape data
"""

import os
import json
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path


@dataclass
class AnimationMetadata:
    """
    Metadata for a single animation file
    """
    sign_id: str                # Sign identifier (e.g., "medecin")
    file_path: str              # Relative path to animation file
    format: str                 # Animation format: "fbx", "bvh", "gltf"
    duration: float             # Animation duration in seconds
    fps: int = 30               # Frames per second
    skeleton: str = "humanoid_mixamo"  # Skeleton standard
    tags: List[str] = None      # Categories: ["medical", "anatomy"]
    
    # Transition settings
    transition_in: float = 0.3   # Blend in duration (seconds)
    transition_out: float = 0.3  # Blend out duration (seconds)
    
    # Advanced metadata (future)
    bone_count: int = None
    hand_shape: str = None       # Future: hand shape classification
    movement_type: str = None    # Future: movement descriptor
    location: str = None         # Future: signing space location
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return asdict(self)


@dataclass
class AnimationSequenceItem:
    """
    Represents one animation in a playback sequence
    """
    sign_id: str
    animation_url: str           # URL to fetch animation (for frontend)
    duration: float
    transition_in: float
    transition_out: float
    format: str
    metadata: Dict = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class AnimationDatabase:
    """
    Manages the animation asset database
    
    Features:
    - Load animations from filesystem
    - Load/save animation manifest (JSON)
    - Map sign IDs to animations
    - Generate playback sequences
    - Validate skeleton compatibility
    """
    
    def __init__(self, animations_base_path: str, manifest_path: str = None):
        """
        Initialize animation database
        
        Args:
            animations_base_path: Root directory for animation files
            manifest_path: Path to animation_manifest.json (optional)
        """
        self.animations_base_path = animations_base_path
        self.manifest_path = manifest_path
        
        # Main database: sign_id → AnimationMetadata
        self.animations: Dict[str, AnimationMetadata] = {}
        
        # Skeleton compatibility registry
        self.skeleton_registry = {}
        
        # Statistics
        self.stats = {
            "total_animations": 0,
            "by_format": {},
            "by_category": {},
            "total_duration": 0.0
        }
    
    def load_from_filesystem(self, scan_directory: str = None) -> int:
        """
        Scan filesystem and auto-discover animation files
        
        Looks for .fbx, .bvh, .gltf files in the animations directory.
        Creates metadata based on filename and file properties.
        
        Args:
            scan_directory: Directory to scan (default: self.animations_base_path)
        
        Returns:
            Number of animations loaded
        """
        if scan_directory is None:
            scan_directory = self.animations_base_path
        
        if not os.path.exists(scan_directory):
            print(f"Warning: Animation directory not found: {scan_directory}")
            return 0
        
        count = 0
        supported_formats = ['.fbx', '.bvh', '.gltf']
        
        # Walk through all subdirectories
        for root, dirs, files in os.walk(scan_directory):
            for filename in files:
                ext = os.path.splitext(filename)[1].lower()
                
                if ext in supported_formats:
                    # Extract sign ID from filename
                    sign_id = self._normalize_sign_id(os.path.splitext(filename)[0])
                    
                    # Get relative path
                    file_path = os.path.relpath(
                        os.path.join(root, filename),
                        self.animations_base_path
                    )
                    
                    # Determine category from directory structure
                    category = os.path.basename(root)
                    
                    # Create metadata (default values)
                    metadata = AnimationMetadata(
                        sign_id=sign_id,
                        file_path=file_path,
                        format=ext[1:],  # Remove dot
                        duration=2.5,    # Default duration (unknown until loaded)
                        tags=[category] if category else []
                    )
                    
                    # Store in database
                    if sign_id not in self.animations:
                        self.animations[sign_id] = metadata
                        count += 1
                        self._update_stats(metadata)
        
        print(f"Loaded {count} animations from filesystem")
        return count
    
    def load_from_manifest(self, manifest_path: str = None) -> int:
        """
        Load animation metadata from JSON manifest file
        
        Manifest format:
        {
            "version": "1.0",
            "skeleton_standard": "humanoid_mixamo",
            "animations": {
                "medecin": {
                    "file": "medical/medecin.fbx",
                    "duration": 2.5,
                    ...
                }
            }
        }
        
        Args:
            manifest_path: Path to manifest JSON file
        
        Returns:
            Number of animations loaded
        """
        if manifest_path is None:
            manifest_path = self.manifest_path
        
        if not manifest_path or not os.path.exists(manifest_path):
            print(f"Warning: Manifest file not found: {manifest_path}")
            return 0
        
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
            
            animations_data = manifest.get('animations', {})
            count = 0
            
            for sign_id, anim_data in animations_data.items():
                metadata = AnimationMetadata(
                    sign_id=sign_id,
                    file_path=anim_data.get('file', ''),
                    format=anim_data.get('format', 'fbx'),
                    duration=anim_data.get('duration', 2.5),
                    fps=anim_data.get('fps', 30),
                    skeleton=anim_data.get('skeleton', manifest.get('skeleton_standard', 'humanoid_mixamo')),
                    tags=anim_data.get('tags', []),
                    transition_in=anim_data.get('transitions', {}).get('in', 0.3),
                    transition_out=anim_data.get('transitions', {}).get('out', 0.3),
                    bone_count=anim_data.get('bone_count'),
                    hand_shape=anim_data.get('metadata', {}).get('hand_shape'),
                    movement_type=anim_data.get('metadata', {}).get('movement'),
                    location=anim_data.get('metadata', {}).get('location')
                )
                
                self.animations[sign_id] = metadata
                count += 1
                self._update_stats(metadata)
            
            print(f"Loaded {count} animations from manifest")
            return count
            
        except Exception as e:
            print(f"Error loading manifest: {e}")
            return 0
    
    def save_manifest(self, output_path: str = None) -> bool:
        """
        Save current animation database to JSON manifest
        
        Args:
            output_path: Output file path (default: self.manifest_path)
        
        Returns:
            True if successful
        """
        if output_path is None:
            output_path = self.manifest_path
        
        if not output_path:
            print("Error: No manifest path specified")
            return False
        
        manifest = {
            "version": "1.0",
            "skeleton_standard": "humanoid_mixamo",
            "total_animations": len(self.animations),
            "animations": {}
        }
        
        for sign_id, metadata in self.animations.items():
            manifest["animations"][sign_id] = {
                "file": metadata.file_path,
                "format": metadata.format,
                "duration": metadata.duration,
                "fps": metadata.fps,
                "skeleton": metadata.skeleton,
                "tags": metadata.tags,
                "transitions": {
                    "in": metadata.transition_in,
                    "out": metadata.transition_out
                },
                "bone_count": metadata.bone_count,
                "metadata": {
                    "hand_shape": metadata.hand_shape,
                    "movement": metadata.movement_type,
                    "location": metadata.location
                }
            }
        
        try:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(manifest, f, indent=2, ensure_ascii=False)
            print(f"Manifest saved to {output_path}")
            return True
        except Exception as e:
            print(f"Error saving manifest: {e}")
            return False
    
    def get_animation(self, sign_id: str) -> Optional[AnimationMetadata]:
        """
        Get animation metadata for a sign
        
        Args:
            sign_id: Sign identifier
        
        Returns:
            AnimationMetadata or None if not found
        """
        return self.animations.get(sign_id)
    
    def get_animation_sequence(
        self, 
        sign_ids: List[str],
        base_url: str = "/assets/animations"
    ) -> Tuple[List[AnimationSequenceItem], List[str]]:
        """
        Generate animation sequence for playback
        
        Args:
            sign_ids: Ordered list of sign identifiers
            base_url: Base URL for animation files (for frontend)
        
        Returns:
            Tuple of (sequence_items, missing_signs)
        """
        sequence = []
        missing = []
        
        for sign_id in sign_ids:
            metadata = self.get_animation(sign_id)
            
            if metadata:
                item = AnimationSequenceItem(
                    sign_id=sign_id,
                    animation_url=f"{base_url}/{metadata.file_path}",
                    duration=metadata.duration,
                    transition_in=metadata.transition_in,
                    transition_out=metadata.transition_out,
                    format=metadata.format,
                    metadata={
                        "hand_shape": metadata.hand_shape,
                        "movement": metadata.movement_type,
                        "location": metadata.location,
                        "tags": metadata.tags
                    }
                )
                sequence.append(item)
            else:
                missing.append(sign_id)
        
        return sequence, missing
    
    def validate_skeleton_compatibility(
        self, 
        animation_sign_id: str, 
        avatar_skeleton: str
    ) -> bool:
        """
        Check if animation is compatible with avatar skeleton
        
        Args:
            animation_sign_id: Sign ID of animation
            avatar_skeleton: Skeleton identifier of avatar
        
        Returns:
            True if compatible
        """
        metadata = self.get_animation(animation_sign_id)
        
        if not metadata:
            return False
        
        # Same skeleton standard → compatible
        if metadata.skeleton == avatar_skeleton:
            return True
        
        # Future: check skeleton compatibility registry
        # Some skeletons can be retargeted
        
        return False
    
    def get_categories(self) -> List[str]:
        """Get list of all animation categories"""
        categories = set()
        for metadata in self.animations.values():
            categories.update(metadata.tags)
        return sorted(list(categories))
    
    def get_statistics(self) -> Dict:
        """Get database statistics"""
        return self.stats.copy()
    
    def _normalize_sign_id(self, filename: str) -> str:
        """
        Normalize filename to sign ID
        Same normalization as sign_processor
        """
        import unicodedata
        import string
        
        # Lowercase
        sign_id = filename.lower()
        
        # Remove accents
        sign_id = unicodedata.normalize('NFD', sign_id)
        sign_id = ''.join(
            char for char in sign_id 
            if unicodedata.category(char) != 'Mn'
        )
        
        # Remove punctuation except underscores (for compound signs)
        sign_id = sign_id.translate(
            str.maketrans('', '', string.punctuation.replace('_', ''))
        )
        
        # Normalize whitespace
        sign_id = '_'.join(sign_id.split())
        
        return sign_id
    
    def _update_stats(self, metadata: AnimationMetadata):
        """Update statistics when adding animation"""
        self.stats["total_animations"] += 1
        
        # By format
        fmt = metadata.format
        self.stats["by_format"][fmt] = self.stats["by_format"].get(fmt, 0) + 1
        
        # By category
        for tag in metadata.tags:
            self.stats["by_category"][tag] = self.stats["by_category"].get(tag, 0) + 1
        
        # Total duration
        self.stats["total_duration"] += metadata.duration


if __name__ == "__main__":
    # Example usage for testing
    
    print("=== Animation Database Test ===\n")
    
    # Create temporary database
    db = AnimationDatabase(
        animations_base_path="assets/animations",
        manifest_path="assets/animations/animation_manifest.json"
    )
    
    # Add some sample animations manually
    sample_animations = [
        AnimationMetadata(
            sign_id="medecin",
            file_path="medical/medecin.fbx",
            format="fbx",
            duration=2.5,
            tags=["medical", "professional"]
        ),
        AnimationMetadata(
            sign_id="infirmier",
            file_path="medical/infirmier.fbx",
            format="fbx",
            duration=2.3,
            tags=["medical", "professional"]
        ),
        AnimationMetadata(
            sign_id="coeur",
            file_path="anatomy/coeur.fbx",
            format="fbx",
            duration=2.0,
            tags=["anatomy", "organ"]
        ),
    ]
    
    for anim in sample_animations:
        db.animations[anim.sign_id] = anim
        db._update_stats(anim)
    
    # Test sequence generation
    sign_ids = ["medecin", "infirmier", "chirurgien"]  # chirurgien missing
    sequence, missing = db.get_animation_sequence(sign_ids)
    
    print("Sign sequence:", sign_ids)
    print(f"Found: {len(sequence)} animations")
    print(f"Missing: {missing}")
    print()
    
    for item in sequence:
        print(f"  {item.sign_id}: {item.animation_url} ({item.duration}s)")
    
    print()
    print(f"Statistics: {db.get_statistics()}")
    print(f"Categories: {db.get_categories()}")
