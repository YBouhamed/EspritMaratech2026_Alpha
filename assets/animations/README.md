# Animation Files Placeholder

This directory should contain FBX animation files for LST signs.

## File Naming Convention

**Important:** Animation filenames should match the normalized sign ID.

Examples:
- `medecin.fbx` - Sign for "médecin" (doctor)
- `infirmier.fbx` - Sign for "infirmier" (nurse)
- `coeur.fbx` - Sign for "cœur" (heart)

**Normalization rules:**
- Lowercase
- No accents (é → e, ô → o)
- No punctuation
- Spaces replaced with underscores (for compound signs)

## Required Animations

### Common animations (in `/common` folder):
- **idle.fbx** - Neutral standing/rest pose (looping)
- **transition.fbx** - Generic transition between signs (optional)

### Sign-specific animations:
Place in category folders:
- `/medical/` - Healthcare professionals, medical terms
- `/anatomy/` - Body parts, organs
- `/gyneco/`, `/hospital/`, etc. - Other categories

## Creating Animation Files

### Method 1: Motion Capture (Recommended)
1. Record an LST signer performing the sign
2. Use motion capture software (e.g., Rokoko, Xsens)
3. Export as FBX
4. Ensure skeleton matches avatar skeleton

### Method 2: Manual Animation (Blender/Maya)
1. Import avatar model
2. Manually keyframe the signing motion
3. Focus on:
   - Hand shapes
   - Hand positions (signing space)
   - Movement paths
   - Facial expressions (if avatar supports blend shapes)
4. Export as FBX

### Method 3: Mixamo Animations (For Testing Only)
- NOT ACCURATE for sign language!
- Can be used for prototyping/testing the system
- Download from Mixamo with same skeleton as avatar
- Use as placeholder until real LST animations are created

## Animation Requirements

- **Skeleton:** Must match avatar skeleton (e.g., humanoid_mixamo)
- **Format:** FBX 2019 or later
- **Frame Rate:** 30 FPS (or 60 FPS for high precision)
- **Duration:** Typically 1.5-3 seconds per sign
- **Quality:** Ensure smooth hand movements and accurate hand shapes

## Video-to-Animation Conversion (Future Research)

**Advanced approach (requires ML/CV):**
1. Record video of LST signer
2. Use pose estimation (MediaPipe, OpenPose)
3. Extract 2D/3D skeleton data
4. Retarget to avatar skeleton
5. Refine in Blender
6. Export as FBX

This is a research topic. For now, use manual animation or motion capture.

## Testing Animations

1. Import FBX into Blender
2. Check skeleton matches avatar
3. Play animation - verify hand positions are accurate
4. Export and test in Three.js avatar renderer

## Animation Metadata

Update `animation_manifest.json` when adding new animations:
- File path
- Duration (measure in Blender/Maya)
- Tags/categories
- Hand shape, movement type (for future search/filtering)

## Example Directory Structure

```
animations/
├── common/
│   ├── idle.fbx           # Required
│   └── transition.fbx     # Optional
├── medical/
│   ├── medecin.fbx
│   ├── infirmier.fbx
│   ├── chirurgien.fbx
│   └── ...
├── anatomy/
│   ├── coeur.fbx
│   ├── poumons.fbx
│   └── ...
└── animation_manifest.json
```

## Quality Checklist

- [ ] Skeleton matches avatar model
- [ ] Smooth, natural movements
- [ ] Accurate hand shapes for LST
- [ ] Correct signing space (in front of chest/head)
- [ ] Appropriate duration (not too fast/slow)
- [ ] Transitions smooth when chained
- [ ] Facial expression (if avatar supports it)
- [ ] File size reasonable (<1MB per animation)

## Resources

- **LST Reference:** Consult LST dictionaries and native signers
- **Blender Tutorial:** Character animation basics
- **Motion Capture:** Rokoko (affordable), Xsens (professional)
- **Pose Estimation:** MediaPipe Holistic, OpenPose
