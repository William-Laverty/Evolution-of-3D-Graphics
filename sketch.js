/**
 * Progressive 3D Skyscraper Visualization
 * A dynamic visualization demonstrating the evolution of 3D graphics techniques
 * from basic wireframes to physically based rendering (PBR).
 * 
 * @author William Laverty
 * @version 1.0
 */

// === Scene Objects and State ===
// Arrays to store the main scene elements
let buildings = [];     // Array of building objects with properties like position, size, etc.
let raindrops = [];    // Array of raindrop objects for weather effects
let trees = [];        // Array of tree objects with properties for position, size, and type
let roads = [];        // Array of road segments defining the city layout

// === Rendering and Animation State ===
let renderPhase = 0, phaseTimer = 0, buildingDrawProgress = 0;
let transitionProgress = 0, isSceneReady = false;
let treeDrawProgress = 0;      // Progress of tree wireframe animation (0-1)

// === UI State ===
let showIntro = true;         // Flag to show/hide intro screen
let introAlpha = 255;         // Opacity of intro screen (0-255)
let startButton;             // Reference to the start button element
let autoAdvance = true;      // Flag for automatic phase advancement
let userCameraControl = false; // Flag for user camera control mode

// === Camera and View Settings ===
let cameraDistance = 900;    // Distance of camera from scene center
let cameraHeight = -500;     // Height of camera above ground
let cameraAngle = 0;         // Rotation angle of camera around scene

// === Environmental Effects ===
let rainIntensity = 1.0;     // Intensity of rain effect (0-1)
let timeOfDay = 1.0;         // Time of day affecting lighting (0-1)
let globalRotation = 0;      // Global scene rotation angle
let lightningTimer = 0;      // Timer for lightning effect
let isLightning = false;     // Flag indicating active lightning
let bloomIntensity = 0;      // Intensity of bloom post-processing effect
let fogDensity = 0;         // Density of atmospheric fog effect

// === Textures and Materials ===
let hdrTexture = null;       // HDR environment map texture
let leafTexture = null;      // Texture for tree leaves
let mainFont;               // Main font for UI elements

// Material texture sets for different surfaces
let concreteTextures = { baseColor: null, normal: null, roughness: null, ao: null };
let groundTextures = { baseColor: null, normal: null, roughness: null, ao: null };
let roofTextures = { baseColor: null, normal: null, roughness: null, ao: null };

// === Constants ===
const TREE_COUNT = 50;                  // Number of trees in the scene
const PHASE_DURATION = 800;             // Duration of each rendering phase in frames
const TOTAL_PHASES = 5;                 // Total number of rendering phases
const RAINDROP_COUNT = 1200;            // Number of raindrops in the weather effect
const TRANSITION_DURATION = 180;         // Duration of phase transitions in frames
const BUILDING_DRAW_SPEED = 0.002;      // Speed of building wireframe animation
const LIGHTNING_CHANCE = 0.002;         // Probability of lightning per frame
const LIGHTNING_DURATION = 8;           // Duration of lightning effect in frames
const ROAD_WIDTH = 40;                  // Width of road segments in scene units

/**
 * Information about each rendering phase, including labels and descriptions
 * Used for UI display and documentation of the visualization progression
 */
const PHASE_INFO = {
  // Display labels for each phase
  labels: [
    "Phase 1: Vector Graphics",
    "Phase 2: Flat Shading with Texture",
    "Phase 3: Environmental Effects & Skybox",
    "Phase 4: Advanced Lighting & Materials",
    "Phase 5: Physically Based Rendering"
  ],
  // Detailed descriptions explaining each phase
  descriptions: [
    "Simple wireframe rendering uses only lines to define the basic structure of 3D models. Early computer graphics (1960s-70s) used this technique, drawing only the edges between vertices to represent objects in 3D space.",
    "Flat shading assigns a single color to each polygon face. Developed in the 1970s-80s, this technique gives objects solid appearance with minimal lighting. Textures add visual detail without changing geometry.",
    "Environmental effects add realism to virtual environments. This technique emerged in the 1990s, introducing skybox/environment mapping to create a sense of infinite space, along with weather conditions like rain and reflective surfaces for enhanced atmosphere.",
    "Advanced lighting models (Phong, Blinn-Phong) simulate how light interacts with different materials. This mid-1990s technique calculates ambient, diffuse and specular components separately for more realistic surface appearance.",
    "Physically Based Rendering (PBR) emerged in the 2010s as the gold standard for realistic graphics. It simulates physical properties of materials and light using real-world measurements for albedo, metalness, roughness and subsurface scattering."
  ]
};

/**
 * Rendering styles and parameters for each phase
 * Each phase is progressive of rendering techniques
 */
const PHASE_STYLES = {
  // Phase 1: Vector Graphics - Basic wireframe rendering
  0: {
    strokeColor: [0, 255, 100],        // Bright green wireframe color
    strokeWeight: 1.5,                 // Line thickness for wireframes
    fillColor: null,                   // No fill color in wireframe mode
    ambientLight: [10, 20, 30],        // Minimal ambient light
    glowEffect: true,                  // Enable glow effect on lines
    glowColor: [0, 255, 100, 50],      // Green glow color with alpha
    volumetricLight: true,             // Enable basic volumetric lighting
    volumetricIntensity: 0.2          // Low intensity volumetric effect
  },

  // Phase 2: Flat Shading - Basic solid rendering with simple lighting
  1: {
    strokeColor: [40, 40, 40],         // Dark edges
    strokeWeight: 0.5,                 // Thin edge lines
    fillColor: [100, 100, 100],        // Medium gray fill
    ambientLight: [40, 45, 55],        // Increased ambient light
    directionalLight: {                // Basic directional lighting
      color: [120, 140, 180],          // Cool blue-tinted light
      direction: [0.5, 1, -0.5]        // Light from upper-right
    },
    material: {                        // Simple material properties
      specular: [60, 70, 90],          // Low specular reflection
      shininess: 20,                   // Low shininess
      metallic: 0.1,                   // Low metallic quality
      roughness: 0.8                   // High surface roughness
    },
    fogEffect: true,                   // Enable atmospheric fog
    fogColor: [30, 40, 60],           // Dark blue fog color
    volumetricLight: true,             // Continue volumetric lighting
    volumetricIntensity: 0.3          // Slightly increased intensity
  },

  // Phase 3: Environmental Effects - Adding atmosphere and enhanced lighting
  2: {
    strokeColor: [30, 30, 30],         // Darker edges
    strokeWeight: 0.3,                 // Thinner edge lines
    fillColor: [80, 80, 80],           // Darker gray fill
    ambientLight: [35, 40, 50],        // Balanced ambient light
    directionalLight: {                // Enhanced directional light
      color: [140, 160, 190],          // Brighter blue-tinted light
      direction: [0.5, 1, -0.5]        // Same direction as phase 1
    },
    pointLights: {                     // Add point light sources
      color: [200, 210, 230],          // Bright cool light
      intensity: 0.8                   // Moderate intensity
    },
    material: {                        // Enhanced material properties
      specular: [100, 110, 130],       // Increased specular
      shininess: 40,                   // Higher shininess
      metallic: 0.3,                   // More metallic
      roughness: 0.6                   // Reduced roughness
    },
    bloomEffect: true,                 // Enable bloom post-processing
    bloomIntensity: 0.6,              // Moderate bloom
    volumetricLight: true,             // Enhanced volumetric lighting
    volumetricIntensity: 0.4          // Increased intensity
  },

  // Phase 4: Advanced Lighting - Complex lighting model with weather effects
  3: {
    strokeColor: [20, 20, 20],         // Very dark edges
    strokeWeight: 0.2,                 // Very thin edge lines
    fillColor: [80, 80, 80],           // Maintained fill color
    ambientLight: [30, 35, 45],        // Refined ambient light
    directionalLight: {                // Refined directional light
      color: [130, 150, 180],          // Adjusted light color
      direction: [0.5, 1, -0.5]        // Maintained direction
    },
    pointLights: {                     // Enhanced point lights
      color: [180, 190, 210],          // Brighter light color
      intensity: 0.9                   // Increased intensity
    },
    material: {                        // Advanced material system
      specular: [140, 160, 190],       // Higher specular values
      shininess: 60,                   // Increased shininess
      metallic: 0.4,                   // Enhanced metallic quality
      roughness: 0.5,                  // Balanced roughness
      reflectivity: 0.3                // Added reflectivity
    },
    rainEffect: true,                  // Enable rain particles
    fogEffect: true,                   // Enhanced fog effect
    fogColor: [20, 25, 35],           // Darker atmospheric fog
    volumetricLight: true,             // Advanced volumetric lighting
    volumetricIntensity: 0.6,         // Higher intensity
    bloomEffect: true,                 // Enhanced bloom effect
    bloomIntensity: 0.8,              // Increased bloom
    hdrBackground: true               // Enable HDR environment
  },

  // Phase 5: Physically Based Rendering - Most advanced rendering technique
  4: {
    strokeColor: null,                 // No visible edges
    strokeWeight: 0,                   // No stroke weight
    fillColor: [120, 120, 120],        // Lighter base color
    ambientLight: [35, 40, 50],        // Refined ambient light
    directionalLight: {                // Final directional light setup
      color: [160, 180, 210],          // Bright, natural light color
      direction: [0.5, 1, -0.5]        // Maintained direction
    },
    pointLights: {                     // Final point light setup
      color: [200, 210, 180],          // Warm-tinted lights
      intensity: 1.2                   // Maximum intensity
    },
    buildingLights: true,              // Enable building window lights
    buildingLightIntensity: 1.0,      // Full intensity building lights
    volumetricLight: true,             // Final volumetric lighting
    volumetricIntensity: 0.8,         // High intensity
    material: {                        // PBR material properties
      specular: [180, 190, 200],       // High specular values
      shininess: 80,                   // Maximum shininess
      metallic: 0.5,                   // Balanced metallic
      roughness: 0.4,                  // Lower roughness
      reflectivity: 0.5,              // High reflectivity
      subsurface: 0.2                  // Added subsurface scattering
    },
    bloomEffect: true,                 // Final bloom setup
    bloomIntensity: 1.0,              // Maximum bloom
    glowEffect: true,                  // Enable window glow
    glowColor: [200, 210, 180, 30],   // Warm glow color
    fogEffect: true,                   // Final atmospheric fog
    fogColor: [15, 20, 30]            // Deep atmospheric color
  }
};

/**
 * Preloads all necessary assets before the sketch starts
 * This includes fonts, textures, and environment maps
 * @function preload
 */
function preload() {
  try {
    // Load the main font for UI elements
    mainFont = loadFont('assets/fonts/Arial.ttf');
    
    // Load the environment map for skybox and reflections
    loadHDREnvironment();
    
    // Load the leaf texture for tree rendering
    leafTexture = loadImage('assets/textures/leaf.png', 
      () => console.log("Leaf texture loaded successfully"),
      () => console.error("Failed to load leaf texture")
    );
  } catch (e) {
    console.error("Error loading assets:", e);
  }
}

/**
 * Loads the environment map for the scene background and reflections
 * Using a JPG as loading a HDR took to long
 * @function loadHDREnvironment
 */
function loadHDREnvironment() {
  try {
    // Attempt to load the JPG environment map
    hdrTexture = loadImage('assets/textures/bg.jpg', 
      () => console.log("Environment map loaded successfully from JPG"), 
      () => {
        console.log("Could not load JPG");
      }
    );
  } catch (e) {
    console.error("Error attempting to load environment map:", e);
  }
}

/**
 * Sets up the sketch environment and initializes all necessary components
 * Called once after preload, before the first draw call
 * @function setup
 */
function setup() {
  // Create the WebGL canvas 
  createCanvas(windowWidth, windowHeight, WEBGL);
  textFont(mainFont || createFont('Arial', 16));
  createIntroScreen();
  
  // Generate procedural textures for different materials
  createProceduralConcreteTextures();
  createProceduralGroundTextures();
  createProceduralRoofTextures();
  
  // Generate scene geometry and elements
  generateCityscape();    // Create buildings
  generateRoads();       // Create road network
  createRaindrops();     // Initialize rain particles
  generateTrees();       // Create and position trees
  
  // Set up initial camera position and orientation
  camera(0, -500, 900,   // Camera position
         0, -100, 0,     // Look at point
         0, 1, 0);       // Up vector
}

/**
 * Creates a styled HTML element for the UI
 * @function createUIElement
 * @param {string} type - The HTML element type to create (e.g., 'div', 'p', 'button')
 * @param {Object} styles - CSS styles to apply to the element
 * @param {HTMLElement} parent - Optional parent element to append to
 * @returns {HTMLElement} The created and styled element
 */
const createUIElement = (type, styles = {}, parent = null) => {
  const elem = createElement(type);
  Object.entries(styles).forEach(([key, value]) => elem.style(key, value));
  if (parent) elem.parent(parent);
  return elem;
};

/**
 * Creates the intro screen UI with title, description, and start button
 * Includes animations and styling
 * @function createIntroScreen
 */
function createIntroScreen() {
  // Create main container with glass-morphism style
  const introContainer = createUIElement('div', {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    'text-align': 'center',
    'background-color': 'rgba(0, 0, 0, 0.85)',
    padding: '40px',
    'border-radius': '24px',
    color: 'white',
    'font-family': 'Arial, sans-serif',
    'backdrop-filter': 'blur(20px)',
    border: '1px solid rgba(0, 255, 98, 0.2)',
    'box-shadow': '0 0 40px rgba(0, 255, 98, 0.1), inset 0 0 20px rgba(0, 255, 98, 0.05)',
    'z-index': '1000',
    width: '80%',
    'max-width': '600px',
    opacity: '0',
    transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
  });
  introContainer.id('intro-screen');
  
  // Add fade-in animation with delay
  setTimeout(() => {
    introContainer.style('opacity', '1');
    introContainer.style('transform', 'translate(-50%, -50%) scale(1)');
  }, 100);

  // Create title section with container for positioning
  const titleContainer = createUIElement('div', {
    position: 'relative',
    'margin-bottom': '30px'
  }, introContainer);

  // Add glowing line above title
  createUIElement('div', {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '60px',
    height: '2px',
    'background-color': '#00ff62',
    'box-shadow': '0 0 10px rgba(0, 255, 98, 0.5)',
    'border-radius': '1px'
  }, titleContainer);

  // Create title with styled text
  createUIElement('h1', {
    'font-size': '36px',
    'margin-bottom': '10px',
    color: '#ffffff',
    'font-weight': '700',
    'text-transform': 'uppercase',
    'letter-spacing': '3px',
    'text-shadow': '0 0 20px rgba(0, 255, 98, 0.3)'
  }, titleContainer).html('Progressive 3D<br><span style="color: #00ff62">Visualization</span>');

  // Create container for description text
  const descriptionContainer = createUIElement('div', {
    'margin-bottom': '40px',
    padding: '0 20px'
  }, introContainer);

  // Add description text with styling
  createUIElement('p', {
    'font-size': '16px',
    'line-height': '1.8',
    color: 'rgba(255, 255, 255, 0.9)',
    'margin-bottom': '20px'
  }, descriptionContainer).html('Experience the evolution of 3D graphics through five distinct rendering phases, from simple wireframes to physically based rendering.');

  createUIElement('p', {
    'font-size': '14px',
    'line-height': '1.6',
    color: 'rgba(255, 255, 255, 0.7)',
    'font-style': 'italic'
  }, descriptionContainer).html('This interactive visualization demonstrates key developments in computer graphics technology from the 1960s to present day.');

  const buttonContainer = createUIElement('div', {
    display: 'flex',
    'flex-direction': 'column',
    'align-items': 'center',
    gap: '20px',
    'margin-top': '30px'
  }, introContainer);

  const startButton = createButton('Begin Journey');
  Object.entries({
    padding: '16px 40px',
    'font-size': '18px',
    'background-color': '#00ff62',
    'background-image': 'linear-gradient(45deg, #00ff62, #00e676)',
    color: '#000',
    border: 'none',
    'border-radius': '12px',
    cursor: 'pointer',
    'font-weight': '600',
    transition: 'all 0.3s ease',
    'box-shadow': '0 4px 15px rgba(0, 255, 98, 0.3)',
    'text-transform': 'uppercase',
    'letter-spacing': '1px'
  }).forEach(([key, value]) => startButton.style(key, value));

  startButton.mouseOver(() => {
    startButton.style('transform', 'translateY(-2px) scale(1.02)');
    startButton.style('box-shadow', '0 6px 20px rgba(0, 255, 98, 0.4)');
  });

  startButton.mouseOut(() => {
    startButton.style('transform', 'translateY(0) scale(1)');
    startButton.style('box-shadow', '0 4px 15px rgba(0, 255, 98, 0.3)');
  });

  startButton.mousePressed(() => {
    const intro = select('#intro-screen');
    intro.style('opacity', '0');
    intro.style('transform', 'translate(-50%, -50%) scale(0.95)');
    setTimeout(() => {
      intro.remove();
      showIntro = false;
      isSceneReady = true;
      createPhaseInfoOverlay();
      createControlPanel();
    }, 800);
  });
  startButton.parent(buttonContainer);
}

/**
 * Main draw loop called every frame
 * Handles scene updates, rendering, and phase transitions
 * @function draw
 */
function draw() {
  background(0);
  
  // Render intro animation if showIntro is true
  if (showIntro) {
    push();
    noFill();
    stroke(0, 255, 98, 20); 
    strokeWeight(1);
    const gridSize = 50;  
    const time = frameCount * 0.01;
    
    rotateX(PI * 0.2);
    translate(0, 100, 0);

    for (let x = -width; x < width; x += gridSize) {
      for (let z = -height; z < height; z += gridSize) {
        push();
        // Calculate distance from origin (0,0) to current point (x,z)
        // Pythagorean theorem: distance = √(x² + z²)
        const dist = sqrt(x * x + z * z);
        
        // Create wave effect using sine function:
        // - time: adds continuous motion
        // - dist * 0.01: makes wave frequency dependent on distance from center
        // - * 20: amplifies wave height
        const wave = sin(time + dist * 0.01) * 20;
        
        // Calculate transparency based on distance
        // map() linearly interpolates: dist 0->1000 maps to alpha 30->5
        const alpha = map(dist, 0, 1000, 30, 5);
        stroke(0, 255, 98, alpha);
        
        // Apply wave offset in Y direction
        translate(x, wave, z);
        
        // 10% chance to draw vertical line
        // Line length varies with wave height (-50 - wave)
        if (random() < 0.1) {
          line(0, 0, 0, 0, -50 - wave, 0);
        }
        
        // 5% chance to draw diagonal line
        if (random() < 0.05) {
          const nextX = x + gridSize;
          const nextZ = z + gridSize;
          const nextWave = sin(time + sqrt(nextX * nextX + nextZ * nextZ) * 0.01) * 20;
          line(0, 0, 0, gridSize, nextWave - wave, gridSize);
        }
        
        box(2);
        pop();
      }
    }
    pop();
    return;
  }
  
  if (!isSceneReady) return;
  
  try {
    updatePhase();
    updateCamera();
    updateLightning();
    
    // Apply HDR environment from phase 3
    const showHDR = (renderPhase === 3) || (renderPhase === 2 && nextPhase() === 3 && transitionProgress > 0.7) || (renderPhase === 4 && transitionProgress < 0.3);
    
    // Clear with background color first
    if (fogDensity > 0) {
      const fogColor = PHASE_STYLES[renderPhase].fogColor || [30, 40, 50];
      background(...fogColor, constrain(fogDensity, 0, 1) * 100);
    } else {
      background(0);
    }
    
    if (showHDR && hdrTexture) {
      applyHDRBackground();
    }
  
    applyRenderingStyle(transitionProgress);
    drawGround();
    
    // Draw roads in Phase 5
    if (renderPhase === 4 || (renderPhase === 3 && transitionProgress > 0.8)) {
      const roadVisibility = renderPhase === 4 ? 1.0 : 
        map(transitionProgress, 0.8, 1, 0, 1, true);
      drawRoads(roadVisibility);
    }
    
    buildings.forEach(drawBuilding);
    trees.forEach(drawTree);
    
    const shouldShowRain = renderPhase === 3 || 
      (renderPhase === 2 && nextPhase() === 3 && transitionProgress > 0.8) ||
      (renderPhase === 4 && transitionProgress < 0.2);
    
    const rainOpacity = renderPhase === 3 ? 1.0 :
      renderPhase === 2 ? map(transitionProgress, 0.8, 1, 0, 1, true) :
      renderPhase === 4 ? map(transitionProgress, 0, 0.2, 1, 0, true) : 0;
    
    if (shouldShowRain) {
      push();
      drawRain(rainOpacity);
      pop();
    }
    
    displayPhaseInfo();
  } catch (e) {
    console.error("Error in draw loop:", e);
  }
}

/**
 * Updates the current rendering phase and handles transitions
 * Controls phase timing, progression, and transition effects
 * @function updatePhase
 */
function updatePhase() {
  if (!autoAdvance) return;
  phaseTimer++;
  
  // Check if current phase duration is complete
  if (phaseTimer >= PHASE_DURATION) {
    phaseTimer = 0;
    // Cycle phases on loop phase using modulo 
    renderPhase = (renderPhase + 1) % TOTAL_PHASES;
    
    if (renderPhase === 0) {
      buildingDrawProgress = 0;
      treeDrawProgress = 0;
    }
  }
  
  // Define transition timing boundaries
  // Exit transition starts at: PHASE_DURATION - TRANSITION_DURATION
  // Exit transition ends at: PHASE_DURATION
  // Entry transition ends at: TRANSITION_DURATION
  const transitionStart = PHASE_DURATION - TRANSITION_DURATION;
  const transitionEnd = PHASE_DURATION;
  const entryTransitionEnd = TRANSITION_DURATION;
  
  // Calculate transition progress using cubic easing:
  if (phaseTimer > transitionStart) {
    // Exit transition (current phase to next phase)
    // Maps phaseTimer from [transitionStart, transitionEnd] to [0, 1]
    // Uses easeInOutCubic for smooth acceleration and deceleration
    transitionProgress = easeInOutCubic(map(phaseTimer, transitionStart, transitionEnd, 0, 1, true));
  } else if (phaseTimer < entryTransitionEnd) {
    // Entry transition (previous phase to current phase)
    // Maps phaseTimer from [0, entryTransitionEnd] to [0, 1]
    // Inverted (1 - x) since itll transitioning in
    transitionProgress = 1 - easeInOutCubic(map(phaseTimer, 0, entryTransitionEnd, 0, 1, true));
  } else {
    transitionProgress = 0;
  }
  
  if (transitionProgress > 0.99) transitionProgress = 1;
  if (transitionProgress < 0.01) transitionProgress = 0;
  
  // Progressive drawing animation for Phase 1 (wireframe)
  if (renderPhase === 0 && buildingDrawProgress < 1) {
    // Asymptotic growth formula: progress += speed * (1 - progress)
    // Smooth deceleration effect
    buildingDrawProgress += BUILDING_DRAW_SPEED * (1 - buildingDrawProgress);
    if (buildingDrawProgress > 0.995) buildingDrawProgress = 1;
    
    // Tree animation starts when buildings are 30% complete
    // Asymptotic growth but 20% faster than buildings
    if (buildingDrawProgress > 0.3 && treeDrawProgress < 1) {
      treeDrawProgress += BUILDING_DRAW_SPEED * 1.2 * (1 - treeDrawProgress);
      if (treeDrawProgress > 0.995) treeDrawProgress = 1;
    }
  }
  
  if (renderPhase === TOTAL_PHASES - 1 && transitionProgress > 0.9 && nextPhase() === 0) {
    buildingDrawProgress = 0;
    treeDrawProgress = 0;
  }
  
  // Update camera rotation:
  // - When user controlled: no automatic rotation
  // - When automatic: rotate by 0.001 radians per frame
  globalRotation += (userCameraControl ? 0 : 0.001);
  updateVisualEffects();
}

/**
 * Applies the current rendering style with transition blending
 * @function applyRenderingStyle
 * @param {number} transitionAmount - Blend amount between current and next phase (0-1)
 */
function applyRenderingStyle(transitionAmount) {
  noLights();
  const currentStyle = PHASE_STYLES[renderPhase];
  const nextStyle = PHASE_STYLES[(renderPhase + 1) % TOTAL_PHASES];
  
  drawingContext.filter = 'none';
  
  if (isLightning && renderPhase >= 4) {
    // Calculate lighting intensity using sine wave:
    // - frameCount * 0.8: Controls flash frequency (lower = slower flashes)
    // - * 0.5: Reduces amplitude to range [-0.5, 0.5]
    // - + 0.5: Shifts wave to range [0, 1]
    // Smooth oscillation between 0 and 1
    const flashIntensity = sin(frameCount * 0.8) * 0.5 + 0.5;
    
    // Apply ambient light with flash intensity:
    // Base values [150, 150, 200] for RGB
    // Add intensity-scaled offsets [50, 50, 55]
    ambientLight(
      150 + flashIntensity * 50,  // Red: 150 + [0-50]
      150 + flashIntensity * 50,  // Green: 150 + [0-50]
      200 + flashIntensity * 55   // Blue: 200 + [0-55]
    );
    
    // Add directional point light for lightning strike
    // Uses intensity calculation but with higher base values
    pointLight(
      200 + flashIntensity * 55,  // Red: 200 + [0-55]
      200 + flashIntensity * 55,  // Green: 200 + [0-55]
      255,                        // Blue: Fixed at max brightness
      0, -1000, 0                 // Position: directly overhead
    );
  }
  
  if (bloomIntensity > 0) {
    const safeBloomIntensity = constrain(bloomIntensity, 0, 2);
    drawingContext.filter = `blur(${safeBloomIntensity * 2}px) brightness(${1 + safeBloomIntensity * 0.2})`;
  }
  
  if (renderPhase === 0 && transitionAmount < 0.01) {
    applyWireframeStyle();
  } else if (renderPhase === TOTAL_PHASES - 1 && transitionAmount > 0.99) {
    applyWireframeStyle();
  } else {
    applyPhaseStyle(renderPhase, (renderPhase + 1) % TOTAL_PHASES, transitionAmount);
  }
  
  drawingContext.filter = 'none';
}

/**
 * Renders a building with current phase's style
 * Handles progressive drawing, materials, and lighting
 * @function drawBuilding
 * @param {Object} building - Building object with position, size, and style properties
 */
function drawBuilding(building) {
  push();
  translate(building.x, building.y, building.z);
  
  if (renderPhase > 0) {
    const swayAmount = 0.001;
    rotateZ(sin(frameCount * 0.5 + building.x * 0.01 + building.z * 0.01) * swayAmount);
  }
  
  if (renderPhase === 0) {
    if (transitionProgress < 0.8) {
      noFill();
      stroke(0, 255, 0);
      strokeWeight(1);
    }
    
    const easedProgress = easeOutQuart(buildingDrawProgress);
    const buildingHeight = building.height * easedProgress;
    
    if (buildingDrawProgress < 1) {
      push();
      if (PHASE_STYLES[0].glowEffect) {
        push();
        stroke(0, 255, 0, 50);
        strokeWeight(3);
        box(building.width, buildingHeight, building.depth);
        pop();
      }
      
      box(building.width, buildingHeight, building.depth);
      
      if (buildingDrawProgress > 0.3) {
        const windowProgress = easeOutQuart(map(buildingDrawProgress, 0.3, 1, 0, 1, true));
        push();
        translate(0, -buildingHeight * 0.1, 0);
        scale(1.01);
        box(building.width, buildingHeight * 0.8 * windowProgress, building.depth);
        pop();
      }
      pop();
    } else {
      if (PHASE_STYLES[0].glowEffect) {
        push();
        stroke(0, 255, 0, 50);
        strokeWeight(3);
        box(building.width, building.height, building.depth);
        translate(0, -building.height * 0.1, 0);
        scale(1.01);
        box(building.width, building.height * 0.8, building.depth);
        pop();
      }
      
      box(building.width, building.height, building.depth);
      push();
      translate(0, -building.height * 0.1, 0);
      scale(1.01);
      box(building.width, building.height * 0.8, building.depth);
      pop();
    }
  } else if (nextPhase() === 0 && transitionProgress > 0.9) {
    noFill();
    stroke(0, 255, 0);
    strokeWeight(1);
    box(building.width, building.height, building.depth);
    push();
    translate(0, -building.height * 0.1, 0);
    scale(1.01);
    box(building.width, building.height * 0.8, building.depth);
    pop();
  } else if (renderPhase >= 4) {
    push();
    if (concreteTextures.baseColor?.width) {
      texture(concreteTextures.baseColor);
    } else {
      fill(100, 100, 100);
    }
    
    applyMaterial({
      specular: [80, 90, 100],
      shininess: 40,
      metallic: 0.2,
      roughness: concreteTextures.roughness?.width ? 
        map(brightness(concreteTextures.roughness.get(0, 0)), 0, 255, 0.9, 0.3) : 0.7,
      reflectivity: 0.1
    });
    box(building.width, building.height, building.depth);
    pop();
    
    push();
    translate(0, -building.height * 0.1, 0);
    const isLit = noise(building.x * 0.1, building.z * 0.1) > 0.7;
    applyMaterial({
      specular: isLit ? [140, 160, 190] : [100, 120, 150],
      shininess: 200,
      metallic: 0.1,
      roughness: 0.1,
      reflectivity: 0.8,
      subsurface: isLit ? 0.3 : 0.1
    });
    
    if (isLit) {
      emissiveMaterial(50, 60, 80);
      fill(60, 90, 120, 200);
    } else {
      fill(25, 35, 50, 220);
    }
    
    drawWindowGrid(building.width, building.height * 0.8, building.depth);
    scale(1.01);
    box(building.width, building.height * 0.8, building.depth);
    pop();
    
    push();
    translate(0, -building.height * 0.55, 0);
    if (roofTextures.baseColor?.width) {
      texture(roofTextures.baseColor);
    } else {
      fill(60, 50, 50);
    }
    
    applyMaterial({
      specular: [90, 95, 100],
      shininess: 60,
      metallic: 0.3,
      roughness: roofTextures.roughness?.width ?
        map(brightness(roofTextures.roughness.get(0, 0)), 0, 255, 0.8, 0.4) : 0.6,
      reflectivity: 0.2
    });
    box(building.width * 0.7, building.height * 0.1, building.depth * 0.7);
    pop();
  } else {
    box(building.width, building.height, building.depth);
    
    if (renderPhase >= 1) {
      const isLit = noise(building.x * 0.1, building.z * 0.1) > 0.7;
      push();
      translate(0, -building.height * 0.1, 0);
      noStroke();
      
      const isTransitionToPhase2 = (renderPhase === 1 && transitionProgress > 0);
      
      if (renderPhase === 1 && !isTransitionToPhase2) {
        fill(isLit ? [50, 65, 90] : [25, 30, 40]);
      } else if (renderPhase === 1 && isTransitionToPhase2) {
        if (transitionProgress > 0.7) {
          const blendAmount = map(transitionProgress, 0.7, 1, 0, 1, true);
          fill(
            ...(isLit ? 
              lerpArray([50, 65, 90], [50, 70, 100], blendAmount) :
              lerpArray([25, 30, 40], [30, 40, 60], blendAmount)),
            lerp(255, 200, blendAmount)
          );
        } else {
          fill(isLit ? [50, 65, 90] : [25, 30, 40]);
        }
        
        if (transitionProgress > 0.8) {
          drawWindowGridWithAlpha(building.width, building.height * 0.8, building.depth, map(transitionProgress, 0.8, 1, 0, 1, true));
        }
      } else if (renderPhase === 2) {
        fill(isLit ? [50, 70, 100, 200] : [30, 40, 60, 200]);
        drawWindowGrid(building.width, building.height * 0.8, building.depth);
      } else if (renderPhase >= 3) {
        if (isLit) {
          fill(55, 80, 110, 190);
          emissiveMaterial(35, 45, 65);
        } else {
          fill(30, 40, 60, 200);
        }
        specularMaterial(80, 100, 130, 100);
        shininess(100);
        drawWindowGrid(building.width, building.height * 0.8, building.depth);
      }
      
      scale(1.01);
      box(building.width, building.height * 0.8, building.depth);
      pop();
    }
  }
  
  pop();
}

/**
 * Renders a tree with current phase's style
 * Handles trunk, canopy, and leaf textures
 * @function drawTree
 * @param {Object} tree - Tree object with position, size, and type properties
 */
function drawTree(tree) {
  const renderMode = renderPhase >= 4 ? "pbr" : "normal";
  
  push();
  translate(tree.x, 0, tree.z);
  
  // Add subtle sway based on wind noise
  const time = frameCount * 0.01;
  const windStrength = noise(tree.x * 0.01, tree.z * 0.01, time) * 0.05;
  const swayAmount = sin(time + tree.swayOffset) * windStrength * tree.height;
  
  rotateY(swayAmount);
  
  if (renderPhase === 0) {
    // Wireframe mode with progressive drawing effect
    noFill();
    stroke(0, 255, 100);
    strokeWeight(1.5);
    
    // Apply the wireframe animation progress
    const treeProgress = buildingDrawProgress > 0.3 ? treeDrawProgress : 0;
    const drawHeight = tree.height * treeProgress;
    const drawCanopy = treeProgress > 0.6;
    
    // Draw trunk with progress
    if (treeProgress > 0) {
      push();
      const actualTrunkHeight = min(drawHeight, tree.trunkHeight);
      translate(0, -actualTrunkHeight/2, 0);
      
      // Draw trunk wireframe
      box(tree.trunkWidth, actualTrunkHeight, tree.trunkWidth);
      pop();
      
      // Draw canopy with progress
      if (drawCanopy) {
        const canopyProgress = map(treeProgress, 0.6, 1, 0, 1, true);
        
        push();
        translate(0, -tree.trunkHeight - tree.canopySize/2, 0);
        
        // Pine tree - progressive cone drawing (now for all trees)
        const layers = 5;
        const layerHeight = tree.height * 0.7 / layers;
        const maxLayers = floor(layers * canopyProgress);
        
        for (let i = 0; i < maxLayers; i++) {
          push();
          const layerY = -i * layerHeight;
          translate(0, layerY, 0);
          const layerScale = map(i, 0, layers-1, 1, 0.4);
          const layerSize = tree.canopySize * layerScale;
          
          // Wireframe cone
          beginShape();
          for (let angle = 0; angle < TWO_PI; angle += PI/4) {
            const px = cos(angle) * layerSize/2;
            const pz = sin(angle) * layerSize/2;
            vertex(px, 0, pz);
            vertex(0, -layerHeight, 0);
          }
          endShape(CLOSE);
          pop();
        }
        pop();
      }
    }
  } else {
    // Rest of the existing tree rendering code for other phases
    // Trunk
    push();
    translate(0, -tree.trunkHeight/2, 0);
    
    if (renderPhase === 1) {
      noStroke();
      fill(110, 80, 40);
    } else if (renderPhase >= 2) {
      noStroke();
      fill(90, 60, 30);
      
      if (renderPhase >= 3) {
        specularMaterial(120, 90, 50);
        shininess(10);
      }
      
      if (renderPhase >= 4) {
        applyMaterial({
          specular: [120, 90, 50],
          shininess: 10,
          metallic: 0.0,
          roughness: 0.9,
          reflectivity: 0.1
        });
      }
    }
    
    box(tree.trunkWidth, tree.trunkHeight, tree.trunkWidth);
    pop();
    
    // Canopy
    push();
    translate(0, -tree.trunkHeight - tree.canopySize/2, 0);
    
    // Use pine tree cone style for all trees
    const layers = 6;
    const layerHeight = tree.height / (layers * 1.2);
    const baseSize = tree.canopySize;
    
    // Determine color based on original tree type
    const isOriginallyPine = tree.type === 'pine';
    
    // Start from bottom layer
    for (let i = 0; i < layers; i++) {
      push();
      // Position each layer from bottom to top
      const layerY = -(i * layerHeight);
      translate(0, layerY, 0);
      const layerScale = map(i, 0, layers-1, 1, 0.4); // Larger at bottom, smaller at top
      const layerSize = baseSize * layerScale;
      
      if (renderPhase === 0) {
        // Wireframe cone
        beginShape();
        for (let angle = 0; angle < TWO_PI; angle += PI/8) {
          const px = cos(angle) * layerSize/2;
          const pz = sin(angle) * layerSize/2;
          vertex(px, 0, pz);
          vertex(0, -layerHeight, 0); // Point upward
        }
        endShape(CLOSE);
      } else {
        // Solid cone with slight random variation
        const randOffset = random(-0.1, 0.1);
        
        // Apply texture in phases 2 and above if available
        if (renderPhase >= 2 && leafTexture) {
          // Use texture for canopy
          texture(leafTexture);
          // Tint the texture to maintain color variation
          if (isOriginallyPine) {
            tint(30, 80, 40);
          } else {
            tint(40, 120, 50);
          }
        } else if (renderPhase >= 4) {
          // PBR material settings
          if (leafTexture) {
            texture(leafTexture);
            if (isOriginallyPine) {
              tint(20 + random(-5, 5), 60 + random(-10, 10) + (layers - i) * 2, 30 + random(-5, 5));
            } else {
              tint(30 + random(-5, 5), 100 + random(-15, 15) + (layers - i) * 3, 40 + random(-8, 8));
            }
          } else {
            // Fallback for color
            if (isOriginallyPine) {
              const layerColor = color(
                20 + random(-5, 5),
                60 + random(-10, 10) + (layers - i) * 2, 
                30 + random(-5, 5)
              );
              fill(layerColor);
            } else {
              const layerColor = color(
                30 + random(-5, 5),
                100 + random(-15, 15) + (layers - i) * 3,
                40 + random(-8, 8)
              );
              fill(layerColor);
            }
          }
        } else if (renderPhase >= 1) {
          if (leafTexture) {
            texture(leafTexture);
            if (isOriginallyPine) {
              tint(30, 80, 40);
            } else {
              tint(40, 120, 50);
            }
          } else {
            if (isOriginallyPine) {
              fill(30, 80, 40);
            } else {
              fill(40, 120, 50);
            }
          }
        }
        
        // Cone for tree
        translate(0, -layerHeight/2, 0);
        const coneSize = layerSize * (1 + randOffset);
        const coneHeight = layerHeight * (1 - abs(randOffset));
        
        // Pine tree shape
        push();
        const droop = map(i, 0, layers-1, 0.1, 0.05); 
        rotateX(-droop); 
        if (leafTexture) {
          rotateY(i * PI/3 + tree.swayOffset);
        }
        cone(coneSize, coneHeight);
        pop();
        if (leafTexture && renderPhase >= 1) {
          noTint();
        }
      }
      pop();
    }
    pop();
  }
  pop();
}


function generateRoads() {
  const gridSize = 5;
  const spacing = 200;  // Same spacing as buildings
  const halfGrid = gridSize / 2;
  
  // Generate horizontal roads (along X axis)
  for (let z = -halfGrid; z <= halfGrid; z++) {
    roads.push({
      x1: -halfGrid * spacing - 200,
      z1: z * spacing,
      x2: halfGrid * spacing + 200,
      z2: z * spacing,
      width: ROAD_WIDTH,
      isIntersection: false,
      direction: 'horizontal'
    });
  }
  
  // Generate vertical roads (along Z axis)
  for (let x = -halfGrid; x <= halfGrid; x++) {
    roads.push({
      x1: x * spacing,
      z1: -halfGrid * spacing - 200,
      x2: x * spacing,
      z2: halfGrid * spacing + 200,
      width: ROAD_WIDTH,
      isIntersection: false,
      direction: 'vertical'
    });
  }
  
  // Mark intersections
  for (let i = 0; i < roads.length; i++) {
    const road1 = roads[i];
    if (road1.direction === 'horizontal') {
      for (let j = 0; j < roads.length; j++) {
        const road2 = roads[j];
        if (road2.direction === 'vertical') {
          // Check if roads intersect
          if (Math.abs(road1.z1 - road2.x1) < ROAD_WIDTH / 2) {
            roads.push({
              x1: road2.x1 - ROAD_WIDTH / 2,
              z1: road1.z1 - ROAD_WIDTH / 2,
              x2: road2.x1 + ROAD_WIDTH / 2,
              z2: road1.z1 + ROAD_WIDTH / 2,
              width: ROAD_WIDTH,
              isIntersection: true
            });
          }
        }
      }
    }
  }
}

/**
 * Renders the road network with current phase's style
 * @function drawRoads
 * @param {number} opacity - Opacity value for road rendering (0-1)
 */
function drawRoads(opacity = 1.0) {
  push();
  noStroke();
  
  // Road material (asphalt)
  fill(30, 30, 35, 255 * opacity);
  specularMaterial(60, 60, 65, 255 * opacity);
  shininess(20);
  applyMaterial({
    specular: [60, 60, 65],
    shininess: 20,
    metallic: 0.0,
    roughness: 0.8,
    reflectivity: 0.1
  });
  
  // Road segments
  for (let road of roads) {
    push();
    if (road.isIntersection) {
      translate((road.x1 + road.x2) / 2, 1, (road.z1 + road.z2) / 2);
      box(ROAD_WIDTH, 2, ROAD_WIDTH);
    } else if (road.direction === 'horizontal') {
      const length = road.x2 - road.x1;
      translate((road.x1 + road.x2) / 2, 1, road.z1);
      box(length, 2, road.width);
      push();
      translate(0, 0.1, 0);
      fill(255, 255, 255, 220 * opacity);
      specularMaterial(255, 255, 255, 150 * opacity);
      
      // Dashed line
      const dashCount = Math.floor(length / 30);
      const dashLength = 10;
      const dashGap = 20;
      
      for (let i = 0; i < dashCount; i++) {
        push();
        const xPos = -length/2 + i * (dashLength + dashGap) + dashLength/2;
        translate(xPos, 0.1, 0);
        box(dashLength, 0.5, 1);
        pop();
      }
      pop();
    } else if (road.direction === 'vertical') {
      const length = road.z2 - road.z1;
      translate(road.x1, 1, (road.z1 + road.z2) / 2);
      box(road.width, 2, length);
      push();
      translate(0, 0.1, 0);
      fill(255, 255, 255, 220 * opacity);
      specularMaterial(255, 255, 255, 150 * opacity);
      
      // Dashed line
      const dashCount = Math.floor(length / 30);
      const dashLength = 10;
      const dashGap = 20;
      
      for (let i = 0; i < dashCount; i++) {
        push();
        const zPos = -length/2 + i * (dashLength + dashGap) + dashLength/2;
        translate(0, 0.1, zPos);
        box(1, 0.5, dashLength);
        pop();
      }
      pop();
    }
    pop();
  }
  
  // Ambient occlusion for road edges (Not perfect)
  for (const building of buildings) {
    for (const road of roads) {
      if (!road.isIntersection) {
        if (road.direction === 'horizontal' && 
            Math.abs(road.z1 - building.z) < (building.depth/2 + road.width/2) &&
            building.x > road.x1 && building.x < road.x2) {
          push();
          translate(building.x, 1.05, road.z1);
          fill(0, 0, 0, 120 * opacity);
          box(building.width * 1.2, 0.2, road.width);
          pop();
        }
        else if (road.direction === 'vertical' && 
                Math.abs(road.x1 - building.x) < (building.width/2 + road.width/2) &&
                building.z > road.z1 && building.z < road.z2) {
          push();
          translate(road.x1, 1.05, building.z);
          fill(0, 0, 0, 120 * opacity);
          box(road.width, 0.2, building.depth * 1.2);
          pop();
        }
      }
    }
  }
  pop();
}

/**
 * Renders rain effects including particles and puddles
 * @function drawRain
 * @param {number} opacity - Opacity value for rain effects (0-1)
 */
function drawRain(opacity = 1.0) {
  const isPhase3 = renderPhase === 3;
  const rainColor = isPhase3 ? [220, 230, 255, 220 * opacity] : [150, 200, 255, 150 * opacity];
  
  if (bloomIntensity > 0) {
    push();
    stroke(...rainColor.slice(0, 3), rainColor[3] * 0.3);
    strokeWeight((isPhase3 ? 3 : 2) * bloomIntensity);
    drawRaindrops(opacity, true);
    pop();
  }
  
  stroke(...rainColor);
  strokeWeight(isPhase3 ? 1.5 : 1);
  drawRaindrops(opacity, false);
  
  if (renderPhase >= 3) {
    drawRainPuddles(isPhase3 ? rainIntensity : opacity * rainIntensity);
  }
}

/**
 * Renders individual raindrop particles
 * @function drawRaindrops
 * @param {number} opacity - Opacity value for raindrops (0-1)
 * @param {boolean} isGlow - Whether to render glow effect
 */
function drawRaindrops(opacity, isGlow) {
  const effectiveRaindrops = floor(raindrops.length * rainIntensity);
  const visibleDrops = isGlow ? Math.floor(effectiveRaindrops * 0.3) : Math.floor(effectiveRaindrops * (renderPhase === 3 ? 1 : 0.7));
  
  for (let i = 0; i < visibleDrops; i++) {
    const drop = raindrops[i];
    const dropSpeed = (renderPhase === 3 ? drop.speed * 1.5 : drop.speed) * rainIntensity;
    const windOffset = sin(frameCount * 0.01 + drop.y * 0.01) * 2;
    const dropLength = renderPhase === 3 ? drop.length * 1.5 : drop.length;
    
    strokeWeight(isGlow ? drop.thickness * 3 : drop.thickness * (renderPhase === 3 ? 2 : 1));
    line(
      drop.x + windOffset, drop.y, drop.z,
      drop.x + windOffset * 1.5, drop.y + dropLength, drop.z
    );
    
    drop.y += dropSpeed;
    drop.x += windOffset * 0.1;
    
    if (drop.y > 50) {
      drop.y = random(-1000, -50);
      drop.x = random(-1000, 1000);
      drop.z = random(-1000, 1000);
    }
  }
}

/**
 * Renders rain puddles on ground surfaces
 * @function drawRainPuddles
 * @param {number} opacity - Opacity value for puddles (0-1)
 */
function drawRainPuddles(opacity = 1.0) {
  push();
  noStroke();
  
  if (renderPhase >= 4) {
    specularMaterial(100, 150, 200, 255 * opacity);
    shininess(200);
  } else if (renderPhase === 3) {
    specularMaterial(90, 130, 180, 255 * opacity);
    shininess(150);
  } else if (renderPhase === 2) {
    fill(40, 70, 120, 150 * opacity);
  } else {
    fill(20, 40, 80, 100 * opacity);
  }
  
  const puddleDensity = (renderPhase === 2 || renderPhase === 3) ? 150 : 200;
  const time = frameCount * 0.01;
  
  for (let x = -700; x <= 700; x += puddleDensity) {
    for (let z = -700; z <= 700; z += puddleDensity) {
      push();
      const noiseVal = noise(x * 0.01, z * 0.01, time * 0.1);
      const yOffset = sin(time + noiseVal * TWO_PI) * 0.5;
      
      translate(
        x + random(-50, 50),
        5.5 + yOffset,
        z + random(-50, 50)
      );
      
      rotateX(HALF_PI);
      
      const baseSize = (renderPhase === 2 || renderPhase === 3) ? random(50, 120) : random(30, 100);
      const sizeVariation = sin(time + noiseVal * TWO_PI) * 5;
      const puddleSize = baseSize + sizeVariation;
      
      if (renderPhase >= 3) {
        const rippleIntensity = (1 + sin(time * 2 + noiseVal * TWO_PI)) * 0.5;
        const rippleSize = puddleSize * (1 + rippleIntensity * 0.1);
        
        push();
        noFill();
        stroke(255, 255, 255, 30 * opacity);
        strokeWeight(1);
        ellipse(0, 0, rippleSize, rippleSize * 0.7);
        pop();
      }
      
      ellipse(0, 0, puddleSize, puddleSize * 0.7);
      pop();
    }
  }
  pop();
}

/**
 * Renders the ground plane with textures and effects
 * @function drawGround
 */
function drawGround() {
  push();
  translate(0, 0, 0);
  
  if (renderPhase >= 4) {
    if (groundTextures.baseColor?.width) {
      texture(groundTextures.baseColor);
    } else {
      fill(20, 25, 30);
    }
    
    const groundMaterial = {
      specular: [70, 90, 120],
      shininess: 100,
      metallic: 0.1,
      roughness: 0.8,
      reflectivity: 0.1
    };
    
    if (groundTextures.roughness?.width) {
      groundMaterial.roughness = map(
        brightness(groundTextures.roughness.get(0, 0)),
        0, 255, 0.9, 0.5
      );
    }
    
    applyMaterial(groundMaterial);
  } else if (renderPhase > 0) {
    fill(20, 30, 40);
    
    if (renderPhase >= 2) {
      const simpleMaterial = {
        specular: [50, 70, 100],
        shininess: 50,
        roughness: 0.7
      };
      applyMaterial(simpleMaterial);
    }
  }
  
  box(1500, 10, 1500);
  pop();
}

/**
 * Renders a window grid for buildings
 * @function drawWindowGrid
 * @param {number} width - Width of the window grid
 * @param {number} height - Height of the window grid
 * @param {number} depth - Depth of window insets
 * @param {number} alpha - Opacity of windows (0-1)
 */
function drawWindowGrid(width, height, depth, alpha = 1) {
  const hFrames = 8, vFrames = 8, frameThickness = 1;
  push();
  
  fill(40, 40, 50, 255 * alpha);
  noStroke();
  specularMaterial(120, 120, 120, 255 * alpha);
  shininess(30 * alpha);
  
  for (let i = 1; i < vFrames; i++) {
    const yPos = -height/2 + height * (i/vFrames);
    push();
    translate(0, yPos, depth/2 + 0.5);
    box(width, frameThickness, 1);
    pop();
    push();
    translate(0, yPos, -depth/2 - 0.5);
    box(width, frameThickness, 1);
    pop();
  }
  
  for (let i = 1; i < hFrames; i++) {
    const xPos = -width/2 + width * (i/hFrames);
    push();
    translate(xPos, 0, depth/2 + 0.5);
    box(frameThickness, height, 1);
    pop();
    push();
    translate(xPos, 0, -depth/2 - 0.5);
    box(frameThickness, height, 1);
    pop();
  }
  
  if (alpha > 0.5) {
    for (let i = 1; i < vFrames; i++) {
      const yPos = -height/2 + height * (i/vFrames);
      push();
      translate(-width/2 - 0.5, yPos, 0);
      box(1, frameThickness, depth);
      pop();
      push();
      translate(width/2 + 0.5, yPos, 0);
      box(1, frameThickness, depth);
      pop();
    }
  }
  
  pop();
}

/**
 * Renders a window grid with alpha blending
 * Used for transitions and special effects
 * @function drawWindowGridWithAlpha
 * @param {number} width - Width of the window grid
 * @param {number} height - Height of the window grid
 * @param {number} depth - Depth of window insets
 * @param {number} alpha - Opacity of windows (0-1)
 */
function drawWindowGridWithAlpha(width, height, depth, alpha) {
  const hFrames = 8, vFrames = 8, frameThickness = 1;
  push();
  
  fill(40, 40, 50, 255 * alpha);
  noStroke();
  specularMaterial(120, 120, 120, 255 * alpha);
  shininess(30 * alpha);
  
  for (let i = 1; i < vFrames; i++) {
    const yPos = -height/2 + height * (i/vFrames);
    push();
    translate(0, yPos, depth/2 + 0.5);
    box(width, frameThickness, 1);
    pop();
    push();
    translate(0, yPos, -depth/2 - 0.5);
    box(width, frameThickness, 1);
    pop();
  }
  
  for (let i = 1; i < hFrames; i++) {
    const xPos = -width/2 + width * (i/hFrames);
    push();
    translate(xPos, 0, depth/2 + 0.5);
    box(frameThickness, height, 1);
    pop();
    push();
    translate(xPos, 0, -depth/2 - 0.5);
    box(frameThickness, height, 1);
    pop();
  }
  
  if (alpha > 0.5) {
    for (let i = 1; i < vFrames; i++) {
      const yPos = -height/2 + height * (i/vFrames);
      push();
      translate(-width/2 - 0.5, yPos, 0);
      box(1, frameThickness, depth);
      pop();
      push();
      translate(width/2 + 0.5, yPos, 0);
      box(1, frameThickness, depth);
      pop();
    }
  }
  
  pop();
}

/**
 * Initializes the 3D scene and all components
 * Sets up camera, lighting, and generates scene elements
 * @function initializeScene
 */
function initializeScene() {
  createPhaseInfoOverlay();
  checkAndCreateProceduralTextures();
  generateCityscape();
  generateRoads();
  createRaindrops();
  generateTrees();
  
  camera(0, -500, 900, 0, -100, 0, 0, 1, 0);
  isSceneReady = true;
}

/**
 * Creates the phase information overlay UI
 * Displays current rendering phase details and progress
 * @function createPhaseInfoOverlay
 */
function createPhaseInfoOverlay() {
  const container = createUIElement('div', {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80%',
    'background-color': 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '15px',
    'border-radius': '10px',
    'font-family': 'Arial, sans-serif',
    'z-index': '1000'
  });
  container.id('phase-info');
  
  createUIElement('h2', {
    margin: '0 0 10px 0',
    'font-size': '22px'
  }, container).id('phase-title');
  
  createUIElement('p', {
    margin: '0 0 15px 0',
    'font-size': '14px',
    'line-height': '1.4'
  }, container).id('phase-description');
  
  const progressContainer = createUIElement('div', {
    display: 'flex',
    'justify-content': 'space-between',
    'align-items': 'center'
  }, container);
  
  const progressBarContainer = createUIElement('div', {
    width: '80%',
    height: '10px',
    border: '1px solid white',
    'border-radius': '5px'
  }, progressContainer);
  
  createUIElement('div', {
    width: '0%',
    height: '100%',
    'background-color': '#00FF00',
    'border-radius': '4px'
  }, progressBarContainer).id('progress-bar');
  
  createUIElement('div', {
    'margin-left': '10px',
    'font-size': '14px'
  }, progressContainer).id('phase-counter');
  
  createControlPanel();
}

function createControlPanel() {
  const controlContainer = createUIElement('div', {
    position: 'absolute',
    top: '20px',
    right: '20px',
    'z-index': '2000'
  });
  controlContainer.id('control-container');

  const showButton = createUIElement('button', {
    'background-color': 'rgba(15, 20, 25, 0.85)',
    'border-radius': '12px',
    padding: '12px 20px',
    color: 'white',
    'font-family': 'Arial, sans-serif',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    'font-size': '14px',
    'font-weight': '600',
    transition: 'background-color 0.2s ease',
    'backdrop-filter': 'blur(10px)',
    display: 'block'
  }, controlContainer);
  showButton.html('Show Controls');
  showButton.id('show-button');
  showButton.mouseOver(() => showButton.style('background-color', 'rgba(25, 30, 35, 0.85)'));
  showButton.mouseOut(() => showButton.style('background-color', 'rgba(15, 20, 25, 0.85)'));
  
  const controlPanel = createUIElement('div', {
    'background-color': 'rgba(15, 20, 25, 0.85)',
    'border-radius': '12px',
    padding: '20px',
    color: 'white',
    'font-family': 'Arial, sans-serif',
    width: '280px',
    'backdrop-filter': 'blur(10px)',
    'box-shadow': '0 4px 15px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'none'
  }, controlContainer);
  controlPanel.id('control-panel');
  
  const hideButton = createButton('✕');
  Object.entries({
    position: 'absolute',
    right: '10px',
    top: '10px',
    'background-color': 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    cursor: 'pointer',
    'font-size': '18px',
    padding: '5px',
    'line-height': '1',
    transition: 'color 0.2s ease'
  }).forEach(([key, value]) => hideButton.style(key, value));
  hideButton.mouseOver(() => hideButton.style('color', 'white'));
  hideButton.mouseOut(() => hideButton.style('color', 'rgba(255, 255, 255, 0.7)'));
  hideButton.parent(controlPanel);
  
  createUIElement('h3', {
    'margin-top': '0',
    'margin-bottom': '20px',
    'text-align': 'center',
    'font-size': '18px',
    'font-weight': '600',
    color: 'rgba(255, 255, 255, 0.95)',
    'padding-right': '20px'
  }, controlPanel).html('Visualization Controls');
  
  createPhaseControls(controlPanel);
  createDivider(controlPanel);
  createCameraControls(controlPanel);
  createDivider(controlPanel);
  createEnvironmentalControls(controlPanel);
  
  createUIElement('div', {
    'margin-top': '20px',
    'font-size': '13px',
    'text-align': 'center',
    'line-height': '1.4',
    color: 'rgba(255, 255, 255, 0.7)',
    padding: '10px',
    'border-radius': '8px',
    'background-color': 'rgba(255, 255, 255, 0.1)'
  }, controlPanel).html('🖱️ Drag mouse to rotate view<br>⚙️ Use mouse wheel to zoom');
  
  showButton.mousePressed(() => {
    controlPanel.style('display', 'block');
    showButton.style('display', 'none');
  });
  
  hideButton.mousePressed(() => {
    controlPanel.style('display', 'none');
    showButton.style('display', 'block');
  });
}

function createDivider(parent) {
  createUIElement('div', {
    width: '100%',
    height: '1px',
    'background-color': 'rgba(255, 255, 255, 0.1)',
    margin: '15px 0'
  }, parent);
}

function createPhaseControls(parent) {
  const phaseNav = createUIElement('div', { 'margin-bottom': '20px' }, parent);
  
  createUIElement('div', {
    'margin-bottom': '10px',
    'font-size': '14px',
    'font-weight': '600',
    color: 'rgba(255, 255, 255, 0.9)'
  }, phaseNav).html('Rendering Phase');
  
  const buttonContainer = createUIElement('div', {
    display: 'flex',
    'justify-content': 'space-between',
    gap: '10px',
    'margin-bottom': '12px'
  }, phaseNav);
  
  const buttonStyle = {
    'background-color': 'rgba(255, 255, 255, 0.15)',
    color: 'white',
    border: 'none',
    'border-radius': '8px',
    padding: '8px 15px',
    cursor: 'pointer',
    'font-size': '14px',
    flex: '1',
    transition: 'background-color 0.2s ease',
    'font-weight': '600'
  };
  
  const prevButton = createButton('◀ Previous');
  Object.entries(buttonStyle).forEach(([key, value]) => prevButton.style(key, value));
  prevButton.mouseOver(() => prevButton.style('background-color', 'rgba(255, 255, 255, 0.25)'));
  prevButton.mouseOut(() => prevButton.style('background-color', 'rgba(255, 255, 255, 0.15)'));
  prevButton.mousePressed(() => changePhase(-1));
  prevButton.parent(buttonContainer);
  
  const nextButton = createButton('Next ▶');
  Object.entries(buttonStyle).forEach(([key, value]) => nextButton.style(key, value));
  nextButton.mouseOver(() => nextButton.style('background-color', 'rgba(255, 255, 255, 0.25)'));
  nextButton.mouseOut(() => nextButton.style('background-color', 'rgba(255, 255, 255, 0.15)'));
  nextButton.mousePressed(() => changePhase(1));
  nextButton.parent(buttonContainer);
  
  createUIElement('div', {
    'text-align': 'center',
    'font-size': '14px',
    color: 'rgba(255, 255, 255, 0.9)',
    padding: '8px',
    'background-color': 'rgba(255, 255, 255, 0.1)',
    'border-radius': '8px',
    'margin-bottom': '12px'
  }, phaseNav).id('phase-nav-counter');
}

function createCameraControls(parent) {
  const cameraControls = createUIElement('div', { 'margin-bottom': '20px' }, parent);
  
  createUIElement('div', {
    'margin-bottom': '12px',
    'font-size': '14px',
    'font-weight': '600',
    color: 'rgba(255, 255, 255, 0.9)'
  }, cameraControls).html('Camera Controls');
  
  const toggleContainer = createUIElement('div', {
    display: 'flex',
    'justify-content': 'space-between',
    'align-items': 'center',
    'margin-bottom': '15px',
    padding: '8px 12px',
    'background-color': 'rgba(255, 255, 255, 0.1)',
    'border-radius': '8px'
  }, cameraControls);
  
  createUIElement('div', {
    'font-size': '14px',
    color: 'rgba(255, 255, 255, 0.9)'
  }, toggleContainer).html('Manual Camera');
  
  const cameraToggle = createCheckbox('', userCameraControl);
  cameraToggle.style('margin', '0');
  cameraToggle.changed(() => userCameraControl = cameraToggle.checked());
  
  const toggleElt = cameraToggle.elt;
  toggleElt.style.display = 'flex';
  toggleElt.style.alignItems = 'center';
  const checkboxInput = toggleElt.querySelector('input');
  checkboxInput.style.width = '16px';
  checkboxInput.style.height = '16px';
  checkboxInput.style.cursor = 'pointer';
  
  cameraToggle.parent(toggleContainer);
  
  createSliderControl(cameraControls, 'Camera Distance', 400, 1500, cameraDistance, val => cameraDistance = val);
  createSliderControl(cameraControls, 'Camera Height', -800, -200, cameraHeight, val => cameraHeight = val);
}

function createEnvironmentalControls(parent) {
  const envControls = createUIElement('div', {}, parent);
  
  createUIElement('div', {
    'margin-bottom': '12px',
    'font-size': '14px',
    'font-weight': '600',
    color: 'rgba(255, 255, 255, 0.9)'
  }, envControls).html('Environmental Controls');
  
  createSliderControl(envControls, 'Rain Intensity', 0, 2, rainIntensity, val => rainIntensity = val, 0.1);
  createSliderControl(envControls, 'Lighting Intensity', 0.5, 1.5, timeOfDay, val => timeOfDay = val, 0.1);
}

function createSliderControl(parent, label, min, max, defaultValue, onChange, step = 1) {
  const container = createUIElement('div', {
    'margin-bottom': '15px',
    padding: '8px 12px',
    'background-color': 'rgba(255, 255, 255, 0.1)',
    'border-radius': '8px'
  }, parent);
  
  const labelContainer = createUIElement('div', {
    display: 'flex',
    'justify-content': 'space-between',
    'align-items': 'center',
    'margin-bottom': '8px'
  }, container);
  
  createUIElement('div', {
    'font-size': '14px',
    color: 'rgba(255, 255, 255, 0.9)'
  }, labelContainer).html(label);
  
  const valueDisplay = createUIElement('div', {
    'font-size': '12px',
    color: 'rgba(255, 255, 255, 0.7)',
    'font-family': 'monospace'
  }, labelContainer);
  
  const slider = createSlider(min, max, defaultValue, step);
  Object.entries({
    width: '100%',
    'margin-top': '5px',
    cursor: 'pointer',
    '-webkit-appearance': 'none',
    height: '6px',
    'border-radius': '3px',
    'background-color': 'rgba(255, 255, 255, 0.2)'
  }).forEach(([key, value]) => slider.style(key, value));
  
  slider.style('::-webkit-slider-thumb', `{
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    transition: background .15s ease-in-out;
  }`);
  
  slider.style('::-moz-range-thumb', `{
    width: 16px;
    height: 16px;
    border: 0;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    transition: background .15s ease-in-out;
  }`);
  
  const updateValue = () => {
    const value = slider.value();
    valueDisplay.html(value.toFixed(step < 1 ? 1 : 0));
    onChange(value);
  };
  
  slider.input(updateValue);
  slider.changed(updateValue);
  
  valueDisplay.html(defaultValue.toFixed(step < 1 ? 1 : 0));
  
  slider.parent(container);
  return slider;
}

function changePhase(direction) {
  renderPhase = (renderPhase + direction + TOTAL_PHASES) % TOTAL_PHASES;
  resetPhase();
}

function resetPhase() {
  phaseTimer = 0;
  transitionProgress = 0;
  if (renderPhase === 0) buildingDrawProgress = 0;
}

function checkAndCreateProceduralTextures() {
  if (!concreteTextures.baseColor?.width) createProceduralConcreteTextures();
  if (!groundTextures.baseColor?.width) createProceduralGroundTextures();
  if (!roofTextures.baseColor?.width) createProceduralRoofTextures();
}

function createProceduralTexture(size, bgColor, noiseParams) {
  const { count, shade, alpha } = noiseParams;
  const tex = createGraphics(size, size);
  tex.background(bgColor);
  tex.noStroke();
  
  for (let i = 0; i < count; i++) {
    tex.fill(...shade, alpha);
    tex.ellipse(random(size), random(size), 2, 2);
  }
  
  return tex;
}

/**
 * Creates procedural textures for concrete building surfaces
 * Generates baseColor, normal, roughness, and ambient occlusion maps
 * @function createProceduralConcreteTextures
 * @returns {Object} Texture maps for concrete materials
 */
function createProceduralConcreteTextures() {
  concreteTextures.baseColor = createProceduralTexture(200, 120, {
    count: 5000,
    shade: [random(80, 150)],
    alpha: 100
  });
  
  concreteTextures.normal = createProceduralTexture(200, [128, 128, 255], {
    count: 2000,
    shade: [random(120, 140), random(120, 140), random(240, 255)],
    alpha: 100
  });
  
  concreteTextures.roughness = createProceduralTexture(200, 200, {
    count: 3000,
    shade: [random(180, 240)],
    alpha: 150
  });
}

/**
 * Creates procedural textures for ground surfaces
 * Uses Perlin noise to generate natural-looking terrain patterns
 * @function createProceduralGroundTextures
 * @returns {Object} Texture maps for ground materials
 */
function createProceduralGroundTextures() {
  const baseColor = createGraphics(400, 400);
  baseColor.background(30, 30, 35);
  baseColor.noStroke();
  
  for (let i = 0; i < 10000; i++) {
    const shade = random(20, 60);
    baseColor.fill(shade, shade, shade + random(-5, 5), 150);
    baseColor.ellipse(random(400), random(400), random(1, 3), random(1, 3));
  }
  
  baseColor.fill(220, 220, 0);
  for (let i = 0; i < 400; i += 100) {
    for (let j = 50; j < 350; j += 30) {
      baseColor.rect(i, j, 20, 5);
    }
  }
  
  groundTextures.baseColor = baseColor;
  
  groundTextures.normal = createProceduralTexture(400, [128, 128, 255], {
    count: 8000,
    shade: [random(120, 135), random(120, 135), random(240, 255)],
    alpha: 100
  });
  
  groundTextures.roughness = createProceduralTexture(400, 180, {
    count: 6000,
    shade: [random(160, 220)],
    alpha: 120
  });
}

/**
 * Creates procedural textures for building roofs
 * Generates patterns for different roofing materials and wear
 * @function createProceduralRoofTextures
 * @returns {Object} Texture maps for roof materials
 */
function createProceduralRoofTextures() {
  const createPatternedTexture = (size, bgColor, patternColor) => {
    const tex = createGraphics(size, size);
    tex.background(bgColor);
    tex.noStroke();
    tex.fill(patternColor);
    
    for (let i = 0; i < size; i += 20) {
      for (let j = 0; j < size; j += 20) {
        if ((i + j) % 40 === 0) {
          tex.rect(i, j, 10, 10);
        }
      }
    }
    
    return tex;
  };
  
  roofTextures.baseColor = createPatternedTexture(200, [50, 40, 40], [70, 60, 60]);
  roofTextures.normal = createPatternedTexture(200, [128, 128, 255], [128, 128, 220]);
  roofTextures.roughness = createPatternedTexture(200, 180, 140);
}

/**
 * Generates the cityscape layout with buildings
 * Creates buildings of varying sizes with proper spacing
 * @function generateCityscape
 */
function generateCityscape() {
  const gridSize = 5, spacing = 200; 
  
  for (let x = -gridSize/2; x < gridSize/2; x++) {
    for (let z = -gridSize/2; z < gridSize/2; z++) {
      if (random() < 0.3) continue; // Increased chance of empty spots
      
      const height = random(100, 400);
      buildings.push({
        x: x * spacing + random(-20, 20),
        y: -height/2,
        z: z * spacing + random(-20, 20),
        width: random(40, 80),
        height: height,
        depth: random(40, 80)
      });
    }
  }
}

/**
 * Creates raindrop particles for weather effects
 * Initializes position, velocity, and lifetime properties
 * @function createRaindrops
 */
function createRaindrops() {
  for (let i = 0; i < RAINDROP_COUNT; i++) {
    raindrops.push({
      x: random(-1000, 1000),
      y: random(-1000, 0),
      z: random(-1000, 1000),
      length: random(10, 30),
      speed: random(15, 25),
      thickness: random(0.5, 2)
    });
  }
}

function updateVisualEffects() {
  const time = frameCount * 0.005;
  const currentStyle = PHASE_STYLES[renderPhase];
  
  bloomIntensity = lerp(bloomIntensity, currentStyle.bloomEffect ? (currentStyle.bloomIntensity || 1.0) : 0, 0.03);
  fogDensity = lerp(fogDensity, currentStyle.fogEffect ? 1 : 0, 0.03);
  
  if (renderPhase >= 3) {
    if (isLightning) {
      if (--lightningTimer <= 0) isLightning = false;
    } else if (random() < LIGHTNING_CHANCE * 0.7 * (renderPhase === 4 ? 1.2 : 1)) {
      isLightning = true;
      lightningTimer = LIGHTNING_DURATION;
    }
  }
  
  if (currentStyle.volumetricLight) {
    const intensity = (currentStyle.volumetricIntensity || 1.0) * 0.8;
    const baseColor = [50, 60, 80];
    const volumetricColor = baseColor.map(v => v * intensity * timeOfDay * (1 + sin(time) * 0.05));
    pointLight(...volumetricColor, sin(time * 0.3) * 200, -800 + sin(time * 0.2) * 50, cos(time * 0.3) * 200);
  }
}

function updateCamera() {
  const baseX = sin(userCameraControl ? cameraAngle : globalRotation) * cameraDistance;
  const baseZ = cos(userCameraControl ? cameraAngle : globalRotation) * cameraDistance;
  const wobbleAmount = 50 * (1 - userCameraControl);
  
  camera(
    baseX + sin(frameCount * 0.02) * wobbleAmount,
    cameraHeight + cos(frameCount * 0.015) * wobbleAmount,
    baseZ + sin(frameCount * 0.01) * wobbleAmount,
    0, -100 + sin(frameCount * 0.01) * 20, 0,
    0, 1, 0
  );
}

function updateLightning() {
  if (renderPhase < 4) {
    isLightning = false;
    lightningTimer = 0;
    return;
  }
  
  if (isLightning) {
    if (--lightningTimer <= 0) isLightning = false;
  } else if (random() < LIGHTNING_CHANCE) {
    isLightning = true;
    lightningTimer = LIGHTNING_DURATION;
  }
}

/**
 * Displays current phase information and progress
 * Shows phase number, description, and transition status
 * Updates the phase info overlay with current state
 * @function displayPhaseInfo
 */
function displayPhaseInfo() {
  select('#phase-title').html(PHASE_INFO.labels[renderPhase]);
  select('#phase-description').html(PHASE_INFO.descriptions[renderPhase]);
  select('#progress-bar').style('width', map(phaseTimer, 0, PHASE_DURATION, 0, 100) + '%');
  select('#phase-counter').html(`${renderPhase + 1}/${TOTAL_PHASES}`);
  select('#phase-nav-counter').html(`Phase ${renderPhase + 1} of ${TOTAL_PHASES}`);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Helper functions
const lerpArray = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const easeOutQuart = t => 1 - Math.pow(1 - t, 4);
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const nextPhase = () => (renderPhase + 1) % TOTAL_PHASES;

// Event handlers
function mouseDragged() {
  if (userCameraControl) cameraAngle -= movedX * 0.01;
  return false;
}

function mouseWheel(event) {
  if (userCameraControl) {
    cameraDistance = constrain(cameraDistance + event.delta, 400, 1500);
    const zoomSlider = select('#control-panel').elt.querySelector('input[type="range"]');
    if (zoomSlider) zoomSlider.value = cameraDistance;
  }
  return false;
}

/**
 * Generates trees around the cityscape
 * Places trees with proper spacing and avoids buildings
 * @function generateTrees
 */
function generateTrees() {
  const buildingBuffer = 60; // Minimum distance from buildings
  const edgeBuffer = 600;    // Distance from edge of scene
  
  for (let i = 0; i < TREE_COUNT; i++) {
    let x, z;
    let validPosition = false;
    let attempts = 0;
    
    // Try to find a valid position away from buildings
    while (!validPosition && attempts < 50) {
      x = random(-edgeBuffer, edgeBuffer);
      z = random(-edgeBuffer, edgeBuffer);
      validPosition = true;
      
      // Check distance from all buildings
      for (let building of buildings) {
        const dx = x - building.x;
        const dz = z - building.z;
        const distance = sqrt(dx * dx + dz * dz);
        if (distance < building.width/2 + buildingBuffer) {
          validPosition = false;
          break;
        }
      }
      attempts++;
    }
    
    if (validPosition) {
      trees.push({
        x: x,
        z: z,
        height: random(40, 80),
        trunkHeight: random(10, 20),
        trunkWidth: random(4, 8),
        canopySize: random(20, 35),
        swayOffset: random(TWO_PI),
        type: random() > 0.7 ? 'pine' : 'deciduous'
      });
    }
  }
}

// Not actually HDR but similar processes
function applyHDRBackground() {
  if (!hdrTexture) return;
  
  // Opacity based on phase/transition
  let opacity = 1.0;
  if (renderPhase === 2) {
    opacity = map(transitionProgress, 0.7, 1, 0, 1, true);
  } else if (renderPhase === 4) {
    opacity = map(transitionProgress, 0, 0.3, 1, 0, true);
  }
  if (opacity <= 0) return;
  push();
  noLights();
  noStroke();
  
  // Enviroment Texture
  texture(hdrTexture);
  tint(255, 255 * opacity);
  _renderer.GL.disable(_renderer.GL.DEPTH_TEST);
  
  // Sphere to show environment map
  scale(-1, 1, 1);
  sphere(3000, 32, 32);
  _renderer.GL.enable(_renderer.GL.DEPTH_TEST);
  noTint();
  pop();
}

/**
 * Applies the wireframe style for Phase 0
 * Sets green stroke color and removes fill for vector graphics look
 * @function applyWireframeStyle
 */
function applyWireframeStyle() {
  // Didnt have time to get working
}

/**
 * Applies rendering style for a specific phase with optional transition blending
 * @function applyPhaseStyle
 * @param {number} phase - Current rendering phase
 * @param {number} nextPhase - Next rendering phase for transitions
 * @param {number} blendAmount - Transition blend amount (0-1)
 */
function applyPhaseStyle(phase, nextPhase, blendAmount) {
  applyStyle(PHASE_STYLES[phase]);
  
  if (blendAmount > 0) {
    const currentStyle = PHASE_STYLES[phase];
    const nextStyle = PHASE_STYLES[nextPhase];
    const easedBlend = easeOutQuart(blendAmount);
    
    if (phase === 0 || nextPhase === 0) {
      handleWireframeTransition(currentStyle, nextStyle, easedBlend);
    } else if (phase === 1) {
      handlePhase1to2Transition(currentStyle, nextStyle, easedBlend);
    } else {
      blendStyles(currentStyle, nextStyle, easedBlend);
    }
  }
}

/**
 * Applies a specific rendering style configuration
 * Handles fill, stroke, lighting, and material properties
 * @function applyStyle
 * @param {Object} style - Style configuration object
 */
function applyStyle(style) {
  if (style.strokeColor) {
    stroke(...style.strokeColor);
    strokeWeight(style.strokeWeight);
  } else {
    noStroke();
  }
  
  if (style.fillColor) {
    fill(...style.fillColor);
  } else {
    noFill();
  }
  
  const [ar, ag, ab] = style.ambientLight.map(v => v * timeOfDay);
  ambientLight(ar, ag, ab);
  
  if (style.directionalLight) {
    const [dr, dg, db] = style.directionalLight.color.map(v => v * timeOfDay);
    const [dx, dy, dz] = style.directionalLight.direction;
    directionalLight(dr, dg, db, dx, dy, dz);
  }
  
  if (style.pointLights) {
    applyPointLights(style.pointLights, 1.0);
  }
  
  if (style.material) {
    applyMaterial(style.material);
  }
  
  if (style.buildingLights) {
    applyBuildingLights(1.0);
  }
  
  if (style.volumetricLight) {
    pointLight(80 * timeOfDay, 100 * timeOfDay, 150 * timeOfDay, 0, -800, 0);
  }
}

/**
 * Applies material properties to objects
 * Controls specular highlights, shininess, metallic, roughness, and reflectivity
 * @function applyMaterial
 * @param {Object} material - Material properties object
 * @param {number} intensity - Material effect intensity (0-1)
 */
function applyMaterial(material, intensity = 1.0) {
  // Didnt have time to get working
}

/**
 * Blends between two rendering styles for smooth transitions
 * Interpolates colors, lighting, and material properties
 * @function blendStyles
 * @param {Object} currentStyle - Current phase style
 * @param {Object} nextStyle - Next phase style
 * @param {number} blendAmount - Blend amount (0-1)
 */
function blendStyles(currentStyle, nextStyle, blendAmount) {
  // Didnt have time to get working
}

/**
 * Handles transition from wireframe to solid rendering
 * Special case for Phase 0 to Phase 1 transition
 * @function handleWireframeTransition
 * @param {Object} currentStyle - Wireframe style
 * @param {Object} nextStyle - Target solid style
 * @param {number} blendAmount - Transition progress (0-1)
 */
function handleWireframeTransition(currentStyle, nextStyle, blendAmount) {
  if (blendAmount < 0.95) {
    applyWireframeStyle();
  } else {
    blendStyles(currentStyle, nextStyle, map(blendAmount, 0.95, 1, 0, 1, true));
  }
}

/**
 * Handles transition from basic solid to textured rendering
 * Special case for Phase 1 to Phase 2 transition
 * @function handlePhase1to2Transition
 * @param {Object} currentStyle - Basic solid style
 * @param {Object} nextStyle - Textured style
 * @param {number} blendAmount - Transition progress (0-1)
 */
function handlePhase1to2Transition(currentStyle, nextStyle, blendAmount) {
  const adjustedBlend = map(blendAmount, 0.4, 1, 0, 1, true);
  const easedBlend = easeOutQuart(adjustedBlend);
  
  fill(...currentStyle.fillColor);
  
  if (blendAmount > 0.8) {
    const colorBlend = map(blendAmount, 0.8, 1, 0, 1, true);
    fill(...lerpArray(currentStyle.fillColor, nextStyle.fillColor, colorBlend));
  }
  
  blendStyles(currentStyle, nextStyle, easedBlend);
}

/**
 * Applies point lights throughout the scene
 * Creates dynamic lighting effects with noise-based variation
 * @function applyPointLights
 * @param {Object} style - Light configuration
 * @param {number} intensity - Light intensity (0-1)
 */
function applyPointLights(style, intensity) {
  const time = frameCount * 0.005;
  const baseIntensity = style.intensity || 1.0;
  
  for (let x = -400; x <= 400; x += 200) {
    for (let z = -400; z <= 400; z += 200) {
      const positionFactor = noise(x * 0.01, z * 0.01, time) * 0.2 + 0.8;
      const heightFactor = noise(x * 0.015, z * 0.015, time + 1000) * 100 - 50;
      const adjustedIntensity = constrain(intensity * positionFactor * baseIntensity * 0.8, 0, 1);
      
      if (adjustedIntensity > 0.05) {
        const color = style.color.map(v => v * adjustedIntensity * timeOfDay);
        pointLight(...color, x, -100 + heightFactor, z);
        
        if (random() < 0.05) {
          const flickerIntensity = random(0.8, 1.2);
          pointLight(
            ...color.map(v => v * flickerIntensity),
            x + random(-5, 5),
            -100 + heightFactor + random(-5, 5),
            z + random(-5, 5)
          );
        }
      }
    }
  }
}

/**
 * Applies dynamic lighting to buildings
 * Creates window glow and ambient lighting effects
 * @function applyBuildingLights
 * @param {number} intensity - Light intensity (0-1)
 */
function applyBuildingLights(intensity) {
  const time = frameCount * 0.005;
  const baseIntensity = PHASE_STYLES[renderPhase].buildingLightIntensity || 1.0;
  
  buildings.forEach(building => {
    const buildingNoise = noise(building.x * 0.03, building.z * 0.03, time);
    if (buildingNoise > 0.5) {
      const heightFactor = noise(building.x * 0.02, building.z * 0.02, time + 500);
      const adjustedIntensity = constrain(intensity * baseIntensity * (0.6 + buildingNoise * 0.4) * 0.8, 0, 1);
      
      if (adjustedIntensity > 0.05) {
        const mainLight = [
          180 * adjustedIntensity * timeOfDay,
          190 * adjustedIntensity * timeOfDay,
          200 * adjustedIntensity * timeOfDay
        ];
        
        for (let h = 0.2; h <= 0.8; h += 0.3) {
          const yPos = building.y - building.height * (h + heightFactor * 0.05);
          pointLight(...mainLight, building.x, yPos, building.z);
          
          if (random() < 0.2) {
            const accentColor = [
              random(160, 200) * adjustedIntensity * 0.4 * timeOfDay,
              random(170, 190) * adjustedIntensity * 0.4 * timeOfDay,
              random(180, 200) * adjustedIntensity * 0.4 * timeOfDay
            ];
            pointLight(
              ...accentColor,
              building.x + random(-10, 10),
              yPos + random(-5, 5),
              building.z + random(-10, 10)
            );
          }
        }
      }
    }
  });
  
  if (intensity > 0.3) {
    buildings.forEach(building => {
      if (noise(building.x * 0.08, building.z * 0.08, time) > 0.7) {
        const reflectionIntensity = intensity * 0.2 * timeOfDay;
        pointLight(
          140 * reflectionIntensity,
          150 * reflectionIntensity,
          170 * reflectionIntensity,
          building.x,
          10,
          building.z
        );
      }
    });
  }
}

/**
 * Blends between two materials for transitions
 * Interpolates all material properties smoothly
 * @function blendMaterials
 * @param {Object} current - Current material properties
 * @param {Object} next - Target material properties
 * @param {number} blendAmount - Blend amount (0-1)
 */
function blendMaterials(current, next, blendAmount) {
  if (!current && !next) return;
  
  const safeBlend = constrain(blendAmount, 0, 1);
  
  if (current && next) {
    applyMaterial({
      specular: lerpArray(current.specular, next.specular, safeBlend),
      shininess: lerp(current.shininess, next.shininess, safeBlend),
      metallic: lerp(current.metallic || 0, next.metallic || 0, safeBlend),
      roughness: lerp(current.roughness || 0.5, next.roughness || 0.5, safeBlend),
      reflectivity: lerp(current.reflectivity || 0, next.reflectivity || 0, safeBlend),
      subsurface: lerp(current.subsurface || 0, next.subsurface || 0, safeBlend)
    });
  } else {
    applyMaterial(current || next, current ? (1 - safeBlend) : safeBlend);
  }
}

