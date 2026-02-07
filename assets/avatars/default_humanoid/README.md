# Avatar Model Placeholder

This directory should contain the 3D avatar model file.

## Required Files

1. **model.gltf** or **model.glb**
   - 3D humanoid avatar model
   - Compatible with Three.js GLTFLoader
   - Should include a rigged skeleton (Mixamo standard recommended)

2. **textures/** (optional folder)
   - skin.jpg - Skin texture
   - clothing.jpg - Clothing texture
   - Additional PBR textures (normal maps, roughness, etc.)

3. **thumbnail.jpg** (recommended)
   - Preview image of the avatar
   - Suggested size: 256x256 or 512x512

## Where to Get Avatar Models

### Free Resources:
- **Mixamo** (https://www.mixamo.com)
  - Free rigged characters
  - Download as FBX, convert to GLTF using Blender
  - Already compatible with standard animations

- **ReadyPlayerMe** (https://readyplayer.me)
  - Create custom avatars
  - Export as GLTF
  - Good for personalization

- **Sketchfab** (https://sketchfab.com)
  - Search for "humanoid rigged"
  - Check license (CC BY or free)
  - Download as GLTF

### Creating Your Own:
1. Model in Blender/Maya
2. Rig with Mixamo Auto-Rigger (online tool)
3. Export as GLTF 2.0
4. Ensure skeleton matches animation files

## Skeleton Requirements

The avatar skeleton MUST match the skeleton used in animation files.

Standard skeleton types:
- **humanoid_mixamo** - Mixamo skeleton (most common)
- **humanoid_unreal** - Unreal Engine skeleton
- **custom** - Custom skeleton (requires bone mapping)

## File Format Notes

- **GLTF (.gltf + .bin + textures)** - Best for web, separate files
- **GLB (.glb)** - GLTF binary, single file (recommended for deployment)
- **FBX (.fbx)** - Can be used but requires FBXLoader

## Conversion Tools

- **Blender** (free): Import FBX → Export GLTF
- **gltf-pipeline** (CLI tool): Optimize GLTF files
- **Online converters**: Various web-based FBX to GLTF converters

## Example Workflow

1. Download character from Mixamo
2. Open in Blender
3. File → Export → GLTF 2.0
4. Export settings:
   - Format: GLTF Separate or GLB
   - Include: Mesh, Armature
   - Remember +Y Up (Three.js convention)
5. Save to this directory
6. Update avatars.json configuration
