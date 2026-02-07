/**
 * Three.js Avatar Renderer
 * 
 * Renders a 3D humanoid avatar and plays skeletal animations for LST signs.
 * 
 * Features:
 * - GLTF/FBX model loading
 * - FBX animation playback
 * - Smooth transitions between animations
 * - Idle pose handling
 * - Camera controls
 * - Progressive loading
 * 
 * Dependencies:
 * - Three.js (core library)
 * - GLTFLoader (for avatar models)
 * - FBXLoader (for animations)
 * - OrbitControls (optional, for camera control)
 * 
 * Usage:
 *   const renderer = new AvatarRenderer(document.getElementById('avatar-container'));
 *   await renderer.initialize();
 *   await renderer.loadAvatar(avatarConfig);
 *   await renderer.playAnimationSequence(animationSequence);
 */

class AvatarRenderer {
    /**
     * Initialize the avatar renderer
     * 
     * @param {HTMLElement} containerElement - DOM element to render into
     * @param {Object} options - Rendering options
     */
    constructor(containerElement, options = {}) {
        this.container = containerElement;
        this.options = {
            cameraDistance: options.cameraDistance || 2.5,
            cameraHeight: options.cameraHeight || 1.5,
            cameraFOV: options.cameraFOV || 50,
            enableControls: options.enableControls !== undefined ? options.enableControls : true,
            enableShadows: options.enableShadows !== undefined ? options.enableShadows : true,
            backgroundColor: options.backgroundColor || 0xf0f0f0,
            ...options
        };
        
        // Three.js core objects
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // Avatar and animation
        this.avatar = null;                     // The 3D avatar model
        this.mixer = null;                      // Animation mixer
        this.currentAction = null;              // Currently playing animation
        this.idleAction = null;                 // Idle animation
        this.animations = new Map();            // Loaded animations: sign_id → AnimationClip
        
        // Playback state
        this.animationSequence = [];            // Queue of animations to play
        this.currentAnimationIndex = -1;        // Current position in queue
        this.isPlaying = false;
        this.isPaused = false;
        
        // Animation loop
        this.clock = null;
        this.animationFrameId = null;
        
        // Loading state
        this.isInitialized = false;
        this.isAvatarLoaded = false;
        
        // Callbacks
        this.onAnimationComplete = null;        // Called when one animation finishes
        this.onSequenceComplete = null;         // Called when entire sequence finishes
        this.onLoadProgress = null;             // Called during loading
        this.onError = null;                    // Called on errors
    }
    
    /**
     * Initialize Three.js scene, camera, renderer
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('AvatarRenderer already initialized');
            return;
        }
        
        console.log('Initializing AvatarRenderer...');
        
        // Check if Three.js is loaded
        if (typeof THREE === 'undefined') {
            throw new Error('Three.js library not loaded');
        }
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.options.backgroundColor);
        
        // Create camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(
            this.options.cameraFOV,
            aspect,
            0.1,
            1000
        );
        this.camera.position.set(0, this.options.cameraHeight, this.options.cameraDistance);
        this.camera.lookAt(0, 1, 0);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        if (this.options.enableShadows) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        this.container.appendChild(this.renderer.domElement);
        
        // Add lights
        this._setupLights();
        
        // Add orbit controls (optional)
        if (this.options.enableControls && typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.target.set(0, 1, 0);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxDistance = 5;
            this.controls.minDistance = 1;
        }
        
        // Clock for animation timing
        this.clock = new THREE.Clock();
        
        // Handle window resize
        window.addEventListener('resize', () => this._onWindowResize());
        
        // Start render loop
        this._startRenderLoop();
        
        this.isInitialized = true;
        console.log('AvatarRenderer initialized successfully');
    }
    
    /**
     * Setup scene lighting
     * @private
     */
    _setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light (main light source)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(2, 3, 2);
        directionalLight.castShadow = this.options.enableShadows;
        
        if (this.options.enableShadows) {
            directionalLight.shadow.mapSize.width = 1024;
            directionalLight.shadow.mapSize.height = 1024;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 10;
        }
        
        this.scene.add(directionalLight);
        
        // Fill light (softer, from opposite side)
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-2, 2, -2);
        this.scene.add(fillLight);
    }
    
    /**
     * Load a 3D avatar model
     * 
     * @param {Object} avatarConfig - Avatar configuration from backend
     * @param {String} avatarConfig.model_url - URL to GLTF model
     * @param {Number} avatarConfig.scale - Model scale
     */
    async loadAvatar(avatarConfig) {
        console.log('Loading avatar:', avatarConfig.name);
        
        if (!this.isInitialized) {
            throw new Error('Renderer not initialized. Call initialize() first.');
        }
        
        // Remove existing avatar if present
        if (this.avatar) {
            this.scene.remove(this.avatar);
            this.avatar = null;
            this.mixer = null;
        }
        
        try {
            // FUTURE: Support both GLTF and FBX avatar models
            // For now, assuming GLTF
            
            const gltf = await this._loadGLTF(avatarConfig.model_url);
            
            this.avatar = gltf.scene;
            this.avatar.scale.set(
                avatarConfig.scale || 1,
                avatarConfig.scale || 1,
                avatarConfig.scale || 1
            );
            
            // Enable shadows
            if (this.options.enableShadows) {
                this.avatar.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
            }
            
            // Add to scene
            this.scene.add(this.avatar);
            
            // Create animation mixer
            this.mixer = new THREE.AnimationMixer(this.avatar);
            
            // Stop mixer when animation ends (for sequence playback)
            this.mixer.addEventListener('finished', (e) => {
                this._onAnimationFinished(e);
            });
            
            // Load idle animation if specified
            if (avatarConfig.default_animations && avatarConfig.default_animations.idle) {
                await this.loadAnimation('idle', avatarConfig.default_animations.idle);
                this._playIdleAnimation();
            }
            
            this.isAvatarLoaded = true;
            console.log('Avatar loaded successfully');
            
        } catch (error) {
            console.error('Error loading avatar:', error);
            if (this.onError) {
                this.onError(error);
            }
            throw error;
        }
    }
    
    /**
     * Load a single animation file
     * 
     * @param {String} signId - Sign identifier
     * @param {String} animationUrl - URL to FBX animation file
     * @returns {Promise<THREE.AnimationClip>}
     */
    async loadAnimation(signId, animationUrl) {
        console.log(`Loading animation: ${signId} from ${animationUrl}`);
        
        try {
            // FUTURE: Support multiple formats (FBX, BVH, GLTF)
            // For now, assuming FBX
            
            const fbx = await this._loadFBX(animationUrl);
            
            if (fbx.animations && fbx.animations.length > 0) {
                const clip = fbx.animations[0];  // Use first animation in file
                this.animations.set(signId, clip);
                console.log(`Animation ${signId} loaded: ${clip.duration.toFixed(2)}s`);
                return clip;
            } else {
                throw new Error(`No animations found in ${animationUrl}`);
            }
            
        } catch (error) {
            console.error(`Error loading animation ${signId}:`, error);
            throw error;
        }
    }
    
    /**
     * Load multiple animations for a sequence
     * 
     * @param {Array} animationSequence - Array of animation metadata from backend
     */
    async loadAnimationSequence(animationSequence) {
        console.log(`Loading ${animationSequence.length} animations...`);
        
        const loadPromises = animationSequence.map(async (item) => {
            // Skip if already loaded
            if (this.animations.has(item.sign_id)) {
                return;
            }
            
            await this.loadAnimation(item.sign_id, item.animation_url);
            
            // Report progress
            if (this.onLoadProgress) {
                this.onLoadProgress(item.sign_id);
            }
        });
        
        await Promise.all(loadPromises);
        console.log('All animations loaded');
    }
    
    /**
     * Play animation sequence
     * 
     * @param {Array} animationSequence - Array of animation metadata
     */
    async playAnimationSequence(animationSequence) {
        if (!this.isAvatarLoaded) {
            throw new Error('Avatar not loaded');
        }
        
        console.log(`Playing sequence of ${animationSequence.length} signs`);
        
        // Load all animations first
        await this.loadAnimationSequence(animationSequence);
        
        // Store sequence
        this.animationSequence = animationSequence;
        this.currentAnimationIndex = -1;
        this.isPlaying = true;
        this.isPaused = false;
        
        // Start playback
        this.playNext();
    }
    
    /**
     * Play next animation in sequence
     */
    playNext() {
        if (!this.isPlaying || this.currentAnimationIndex >= this.animationSequence.length - 1) {
            // Sequence complete
            this._onSequenceFinished();
            return;
        }
        
        this.currentAnimationIndex++;
        const item = this.animationSequence[this.currentAnimationIndex];
        
        console.log(`Playing sign ${this.currentAnimationIndex + 1}/${this.animationSequence.length}: ${item.sign_id}`);
        
        this._playAnimation(item.sign_id, item.transition_in || 0.3);
    }
    
    /**
     * Play previous animation in sequence
     */
    playPrevious() {
        if (this.currentAnimationIndex <= 0) {
            return;
        }
        
        this.currentAnimationIndex--;
        const item = this.animationSequence[this.currentAnimationIndex];
        
        console.log(`Playing sign ${this.currentAnimationIndex + 1}/${this.animationSequence.length}: ${item.sign_id}`);
        
        this._playAnimation(item.sign_id, item.transition_in || 0.3);
    }
    
    /**
     * Pause/resume playback
     */
    togglePause() {
        if (this.isPaused) {
            this.mixer.timeScale = 1;
            this.isPaused = false;
        } else {
            this.mixer.timeScale = 0;
            this.isPaused = true;
        }
    }
    
    /**
     * Stop playback and return to idle
     */
    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentAnimationIndex = -1;
        this.animationSequence = [];
        
        if (this.currentAction) {
            this.currentAction.stop();
        }
        
        this._playIdleAnimation();
    }
    
    /**
     * Play a specific animation with smooth transition
     * @private
     */
    _playAnimation(signId, transitionDuration = 0.3) {
        const clip = this.animations.get(signId);
        
        if (!clip) {
            console.error(`Animation not found: ${signId}`);
            this.playNext();  // Skip to next
            return;
        }
        
        if (!this.mixer) {
            console.error('Animation mixer not initialized');
            return;
        }
        
        // Create action from clip
        const action = this.mixer.clipAction(clip);
        action.reset();
        action.setLoop(THREE.LoopOnce, 1);  // Play once
        action.clampWhenFinished = true;     // Hold last frame
        
        // Crossfade from current animation
        if (this.currentAction) {
            action.crossFadeFrom(this.currentAction, transitionDuration, true);
        }
        
        // Play
        action.play();
        this.currentAction = action;
    }
    
    /**
     * Play idle animation (loop)
     * @private
     */
    _playIdleAnimation() {
        const idleClip = this.animations.get('idle');
        
        if (!idleClip || !this.mixer) {
            return;
        }
        
        if (this.idleAction) {
            this.idleAction.play();
        } else {
            this.idleAction = this.mixer.clipAction(idleClip);
            this.idleAction.setLoop(THREE.LoopRepeat);
            this.idleAction.play();
        }
        
        this.currentAction = this.idleAction;
    }
    
    /**
     * Handle animation finished event
     * @private
     */
    _onAnimationFinished(event) {
        console.log('Animation finished');
        
        if (this.onAnimationComplete) {
            this.onAnimationComplete(this.currentAnimationIndex);
        }
        
        // Auto-play next animation in sequence
        if (this.isPlaying && !this.isPaused) {
            setTimeout(() => {
                this.playNext();
            }, 100);  // Small delay between signs
        }
    }
    
    /**
     * Handle sequence completion
     * @private
     */
    _onSequenceFinished() {
        console.log('Sequence playback complete');
        this.isPlaying = false;
        
        if (this.onSequenceComplete) {
            this.onSequenceComplete();
        }
        
        // Return to idle pose
        this._playIdleAnimation();
    }
    
    /**
     * Start the render loop
     * @private
     */
    _startRenderLoop() {
        const animate = () => {
            this.animationFrameId = requestAnimationFrame(animate);
            
            const delta = this.clock.getDelta();
            
            // Update animation mixer
            if (this.mixer) {
                this.mixer.update(delta);
            }
            
            // Update controls
            if (this.controls) {
                this.controls.update();
            }
            
            // Render
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }
    
    /**
     * Handle window resize
     * @private
     */
    _onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    /**
     * Load GLTF model
     * @private
     */
    _loadGLTF(url) {
        return new Promise((resolve, reject) => {
            if (typeof THREE.GLTFLoader === 'undefined') {
                reject(new Error('GLTFLoader not loaded'));
                return;
            }
            
            const loader = new THREE.GLTFLoader();
            loader.load(
                url,
                (gltf) => resolve(gltf),
                (progress) => {
                    if (this.onLoadProgress) {
                        this.onLoadProgress('avatar', progress.loaded / progress.total);
                    }
                },
                (error) => reject(error)
            );
        });
    }
    
    /**
     * Load FBX file
     * @private
     */
    _loadFBX(url) {
        return new Promise((resolve, reject) => {
            if (typeof THREE.FBXLoader === 'undefined') {
                reject(new Error('FBXLoader not loaded'));
                return;
            }
            
            const loader = new THREE.FBXLoader();
            loader.load(
                url,
                (fbx) => resolve(fbx),
                (progress) => {
                    if (this.onLoadProgress) {
                        this.onLoadProgress('animation', progress.loaded / progress.total);
                    }
                },
                (error) => reject(error)
            );
        });
    }
    
    /**
     * Dispose of resources and cleanup
     */
    dispose() {
        console.log('Disposing AvatarRenderer...');
        
        // Stop animation loop
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Dispose of renderer
        if (this.renderer) {
            this.container.removeChild(this.renderer.domElement);
            this.renderer.dispose();
        }
        
        // Clear scene
        if (this.scene) {
            this.scene.clear();
        }
        
        this.isInitialized = false;
        this.isAvatarLoaded = false;
    }
}

// Export for module systems (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvatarRenderer;
}
