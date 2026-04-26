import * as THREE from "three";

const loader = new THREE.TextureLoader();

/**
 * Creates a textured Mercury mesh.
 * @param {number} radius - The radius of the Mercury sphere
 * @returns {{ mercury: THREE.Mesh, animate: () => void }}
 */
export function createTexturedMercury(radius) {
    // Load mercury texture from /public/textures/mercury/
    const mercuryTexture = loader.load("/textures/mercury/mercury_daymap.jpg");

    // --- Mercury Mesh ---
    const mercuryGeometry = new THREE.SphereGeometry(radius, 64, 64);
    const mercuryMaterial = new THREE.MeshStandardMaterial({
        map:       mercuryTexture,
        metalness: 0.0,
        roughness: 0.9, // Mercury has a very rough, cratered surface
    });
    const mercury = new THREE.Mesh(mercuryGeometry, mercuryMaterial);

    // --- Animate function: call this inside your animation loop ---
    const animate = () => {
        mercury.rotation.y += 0.0001; // Mercury rotates very slowly
    };

    return { mercury, animate };
}

/**
 * Creates a textured Venus mesh with a separate atmosphere layer.
 * @param {number} radius - The radius of the Venus sphere
 * @returns {{ venus: THREE.Mesh, atmosphere: THREE.Mesh, animate: () => void }}
 */
export function createTexturedVenus(radius) {
  // Load venus textures from /public/textures/venus/
  const venusTexture      = loader.load("/textures/venus/venus_surface.jpg");
  const atmosphereTexture = loader.load("/textures/venus/venus_atmosphere.jpg");

  // --- Venus Mesh ---
  const venusGeometry = new THREE.SphereGeometry(radius, 64, 64);
  const venusMaterial = new THREE.MeshStandardMaterial({
    map:       venusTexture,
    metalness: 0.0,
    roughness: 0.8,
  });
  const venus = new THREE.Mesh(venusGeometry, venusMaterial);

  // --- Atmosphere Mesh (slightly larger radius to sit above surface) ---
  const atmosphereGeometry = new THREE.SphereGeometry(radius * 1.01, 64, 64);
  const atmosphereMaterial = new THREE.MeshStandardMaterial({
    map:         atmosphereTexture,
    transparent: true,
    opacity:     0.6,
    metalness:   0.0,
    roughness:   1.0,
    depthWrite:  false,
  });
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);

  // Attach atmosphere to venus so they move together orbitally
  venus.add(atmosphere);

  // --- Animate function: call this inside your animation loop ---
  const animate = () => {
    venus.rotation.y      -= 0.0002; // Venus rotates retrograde (backwards)
    atmosphere.rotation.y -= 0.0003; // Atmosphere drifts slightly faster
  };

  return { venus, atmosphere, animate };
}

/**
 * Creates a textured Mars mesh.
 * @param {number} radius - The radius of the Mars sphere
 * @returns {{ mars: THREE.Mesh, animate: () => void }}
 */
export function createTexturedMars(radius) {
  // Load mars texture from /public/textures/mars/
  const marsTexture = loader.load("/textures/mars/mars_surface.jpg");

  // --- Mars Mesh ---
  const marsGeometry = new THREE.SphereGeometry(radius, 64, 64);
  const marsMaterial = new THREE.MeshStandardMaterial({
    map:       marsTexture,
    metalness: 0.0,
    roughness: 0.8, // Mars has a dusty, rough surface
  });
  const mars = new THREE.Mesh(marsGeometry, marsMaterial);

  // --- Animate function: call this inside your animation loop ---
  const animate = () => {
    mars.rotation.y += 0.0004; // Mars rotates at a similar speed to Earth
  };

  return { mars, animate };
}

/**
 * Creates a textured Jupiter mesh.
 * @param {number} radius - The radius of the Jupiter sphere
 * @returns {{ jupiter: THREE.Mesh, animate: () => void }}
 */
export function createTexturedJupiter(radius) {
  // Load jupiter texture from /public/textures/jupiter/
  const jupiterTexture = loader.load("/textures/jupiter/jupiter_surface.jpg");

  // --- Jupiter Mesh ---
  const jupiterGeometry = new THREE.SphereGeometry(radius, 64, 64);
  const jupiterMaterial = new THREE.MeshStandardMaterial({
    map:       jupiterTexture,
    metalness: 0.0,
    roughness: 0.7, // Jupiter is a gas giant with a smooth appearance
  });
  const jupiter = new THREE.Mesh(jupiterGeometry, jupiterMaterial);

  // --- Animate function: call this inside your animation loop ---
  const animate = () => {
    jupiter.rotation.y += 0.0009; // Jupiter rotates very fast (10hr day)
  };

  return { jupiter, animate };
}

/**
 * Creates a textured Saturn mesh with rings.
 * @param {number} radius - The radius of the Saturn sphere
 * @returns {{ saturn: THREE.Mesh, rings: THREE.Mesh, animate: () => void }}
 */
export function createTexturedSaturn(radius) {
  // Load saturn textures from /public/textures/saturn/
  const saturnTexture = loader.load("/textures/saturn/saturn_surface.jpg");
  const ringTexture   = loader.load("/textures/saturn/saturn_rings.png");

  // --- Saturn Mesh ---
  const saturnGeometry = new THREE.SphereGeometry(radius, 64, 64);
  const saturnMaterial = new THREE.MeshStandardMaterial({
    map:       saturnTexture,
    metalness: 0.0,
    roughness: 0.7, // Saturn is a gas giant, smooth appearance
  });
  const saturn = new THREE.Mesh(saturnGeometry, saturnMaterial);

  // --- Ring Mesh ---
  // RingGeometry(innerRadius, outerRadius, segments)
  const innerRadius = radius * 1.4;
  const outerRadius = radius * 2.4;
  const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 128);

  // Remap UVs so the texture wraps correctly around the ring
  const pos = ringGeometry.attributes.position;
  const uv  = ringGeometry.attributes.uv;
  const v3  = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v3.fromBufferAttribute(pos, i);
    const dist = v3.length();
    uv.setXY(
      i,
      (dist - innerRadius) / (outerRadius - innerRadius),
      0
    );
  }
  ringGeometry.attributes.uv.needsUpdate = true;

  const ringMaterial = new THREE.MeshStandardMaterial({
    map:         ringTexture,
    transparent: true,
    opacity:     0.9,
    side:        THREE.DoubleSide, // Visible from both above and below
    depthWrite:  false,
    metalness:   0.0,
    roughness:   1.0,
  });
  const rings = new THREE.Mesh(ringGeometry, ringMaterial);

  // Tilt the rings to match Saturn's real axial tilt (~26.7 degrees)
  rings.rotation.x = Math.PI / 2 - THREE.MathUtils.degToRad(26.7);


  // Do NOT attach rings to saturn — return separately
  const animate = () => {
    saturn.rotation.y += 0.0007;
    // Rings do not self-rotate
  };

  return { saturn, rings, animate };
}

/**
 * Creates a textured Neptune mesh.
 * @param {number} radius - The radius of the Neptune sphere
 * @returns {{ neptune: THREE.Mesh, animate: () => void }}
 */
export function createTexturedNeptune(radius) {
  // Load neptune texture from /public/textures/neptune/
  const neptuneTexture = loader.load("/textures/neptune/neptune_surface.jpg");

  // --- Neptune Mesh ---
  const neptuneGeometry = new THREE.SphereGeometry(radius, 64, 64);
  const neptuneMaterial = new THREE.MeshStandardMaterial({
    map:       neptuneTexture,
    metalness: 0.0,
    roughness: 0.7, // Neptune is a gas giant with a smooth appearance
  });
  const neptune = new THREE.Mesh(neptuneGeometry, neptuneMaterial);

  // --- Animate function: call this inside your animation loop ---
  const animate = () => {
    neptune.rotation.y += 0.0006; // Neptune rotates fast (~16hr day)
  };

  return { neptune, animate };
}

/**
 * Creates a textured Uranus mesh.
 * @param {number} radius - The radius of the Uranus sphere
 * @returns {{ uranus: THREE.Mesh, animate: () => void }}
 */
export function createTexturedUranus(radius) {
  // Load uranus texture from /public/textures/uranus/
  const uranusTexture = loader.load("/textures/uranus/uranus_surface.jpg");

  // --- Uranus Mesh ---
  const uranusGeometry = new THREE.SphereGeometry(radius, 64, 64);
  const uranusMaterial = new THREE.MeshStandardMaterial({
    map:       uranusTexture,
    metalness: 0.0,
    roughness: 0.7, // Uranus is an ice giant with a smooth appearance
  });
  const uranus = new THREE.Mesh(uranusGeometry, uranusMaterial);

  // --- Animate function: call this inside your animation loop ---
  const animate = () => {
    uranus.rotation.y -= 0.0005; // Uranus rotates retrograde (~17hr day)
  };

  return { uranus, animate };
}

/**
 * Creates a textured Pluto mesh.
 * @param {number} radius - The radius of the Pluto sphere
 * @returns {{ pluto: THREE.Mesh, animate: () => void }}
 */
export function createTexturedPluto(radius) {
  // Load pluto texture from /public/textures/pluto/
  const plutoTexture = loader.load("/textures/pluto/pluto_surface.jpg");

  // --- Pluto Mesh ---
  const plutoGeometry = new THREE.SphereGeometry(radius, 64, 64);
  const plutoMaterial = new THREE.MeshStandardMaterial({
    map:       plutoTexture,
    metalness: 0.0,
    roughness: 0.9, // Pluto has a rough, icy surface
  });
  const pluto = new THREE.Mesh(plutoGeometry, plutoMaterial);

  // --- Animate function: call this inside your animation loop ---
  const animate = () => {
    pluto.rotation.y -= 0.0001; // Pluto rotates very slowly and retrograde (~6.4 Earth days)
  };

  return { pluto, animate };
}

/**
 * Creates a textured space background (skybox).
 * @param {THREE.Scene} scene - The Three.js scene to apply the background to
 */
export function createSpaceBackground(scene) {
  const spaceTexture = loader.load("/textures/space/8k_milky_way.jpg");
  spaceTexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = spaceTexture;
}

/**
 * Creates a textured Sun mesh using MeshStandardMaterial.
 * @param {number} radius - The radius of the Sun sphere
 * @returns {{ sun: THREE.Mesh, animate: () => void }}
 */
export function createTexturedSun(radius) {
  // Load sun texture from /public/textures/space/
  const sunTexture = loader.load("/textures/space/sun.jpg");

  // --- Sun Mesh ---
  const sunGeometry = new THREE.SphereGeometry(radius, 64, 64);
  const sunMaterial = new THREE.MeshStandardMaterial({
    map:          sunTexture,
    emissiveMap:  sunTexture,       // Makes the sun glow regardless of lighting
    emissive:     new THREE.Color(0xffe066),
    emissiveIntensity: 0.8,
    metalness:    0.0,
    roughness:    1.0,
  });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);

  // --- Animate function: call this inside your animation loop ---
  const animate = () => {
    sun.rotation.y += 0.0002; // Sun rotates slowly
  };

  return { sun, animate };
}

/**
 * Creates a textured Earth mesh with a separate animated cloud layer.
 * @param {number} radius - The radius of the Earth sphere
 * @returns {{ earth: THREE.Mesh, clouds: THREE.Mesh, animate: () => void }}
 */
export function createTexturedEarth(radius) {
    // Load earth textures from /public/textures/earth/
    const earthTexture  = loader.load("/textures/earth/earth_day.jpg");
    const nightTexture  = loader.load("/textures/earth/earth_night.jpg");
    const normalMap     = loader.load("/textures/earth/earth_normal.tif");
    const specularMap   = loader.load("/textures/earth/earth_specular.tif");
    const cloudTexture  = loader.load("/textures/earth/earth_clouds.jpg");

    // --- Earth Mesh ---
    const earthGeometry = new THREE.SphereGeometry(radius, 64, 64);
    const earthMaterial = new THREE.MeshStandardMaterial({
        map:          earthTexture,
        normalMap:    normalMap,
        metalnessMap: specularMap,
        metalness:    0.05,
        roughness:    0.6,
        emissiveMap:  nightTexture,       // Night lights on the dark side
        emissive:     new THREE.Color(0xffaa55),
        emissiveIntensity: 0.15,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);

    // --- Cloud Mesh (slightly larger radius to sit above surface) ---
    const cloudGeometry = new THREE.SphereGeometry(radius * 1.01, 64, 64);
    const cloudMaterial = new THREE.MeshStandardMaterial({
        map:         cloudTexture,
        transparent: true,
        opacity:     0.8,
        metalness:   0.0,
        roughness:   1.0,
        depthWrite:  false,
    });
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);

    // Attach clouds to earth so they move together orbitally
    earth.add(clouds);

    // --- Animate function: call this inside your animation loop ---
    const animate = () => {
        earth.rotation.y  += 0.0005;  // Earth self-rotation speed
        clouds.rotation.y += 0.0007;  // Clouds rotate slightly faster than Earth
        clouds.rotation.x += 0.0001;  // Subtle cloud drift on x-axis
    };

    return { earth, clouds, animate };
}

// export textured Moon function for use in Earth block
export function createTexturedMoon(radius) {
    const moonTexture = loader.load("/textures/moon/moon.jpg");
    const moonGeometry = new THREE.SphereGeometry(radius, 64, 64);
    const moonMaterial = new THREE.MeshStandardMaterial({
        map:       moonTexture,
        metalness: 0.0,
        roughness: 0.9,
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);

    return moon;
} 

/**
 * Creates a rock/asteroid texture using a canvas-generated procedural texture.
 * Falls back gracefully if no image file is present.
 * @returns {THREE.Texture}
 */
function createRockTexture() {
  const canvas = document.createElement("canvas");
  canvas.width  = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  // Base dark grey
  ctx.fillStyle = "#5a5a5a";
  ctx.fillRect(0, 0, 128, 128);

  // Scatter noise patches to simulate rocky surface
  for (let i = 0; i < 200; i++) {
    const x    = Math.random() * 128;
    const y    = Math.random() * 128;
    const r    = Math.random() * 6 + 1;
    const grey = Math.floor(Math.random() * 80 + 40);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${grey},${grey},${grey})`;
    ctx.fill();
  }

  // Darken edges (craters)
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const r = Math.random() * 10 + 4;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0,   "rgba(20,20,20,0.8)");
    gradient.addColorStop(0.6, "rgba(60,60,60,0.3)");
    gradient.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates an asteroid belt between Mars and Jupiter using InstancedMesh.
 * @param {THREE.Scene} scene
 * @param {{ innerRadius: number, outerRadius: number, count: number }} options
 * @returns {{ mesh: THREE.InstancedMesh, animate: () => void }}
 */
export function createAsteroidBelt(scene, {
  innerRadius = 90,
  outerRadius  = 130,
  count        = 4000,
} = {}) {
  const rockTexture = createRockTexture();

  // Use a low-poly icosahedron for each asteroid — cheap and rock-like
  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const material = new THREE.MeshStandardMaterial({
    map:       rockTexture,
    metalness: 0.0,
    roughness: 1.0,
    color:     new THREE.Color(0x888880),
  });

  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const dummy    = new THREE.Object3D();
  const rotSpeeds = [];
  const rotAxes = [];
  const orbitSpeeds = [];
  const orbitAngles = [];
  const orbitRadii = [];
  const yOffsets = [];

  for (let i = 0; i < count; i++) {
    // Random position in ring band
    const angle  = Math.random() * Math.PI * 2;
    const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
    const y      = (Math.random() - 0.5) * 4; // slight vertical scatter

    orbitAngles.push(angle);
    orbitRadii.push(radius);
    yOffsets.push(y);

    // Random size — most small, few bigger
    const scale = Math.random() * 0.55 + 0.1;
    dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    dummy.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);

    // Each asteroid tumbles at a slightly different speed/axis
    rotSpeeds.push((Math.random() - 0.5) * 0.02);
    rotAxes.push(
      new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize()
    );

    // Orbit speed: further rocks orbit slower (Kepler-ish)
    orbitSpeeds.push(0.0003 + (Math.random() * 0.0002));
  }

  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow    = false;
  mesh.receiveShadow = false;
  scene.add(mesh);

  // Store current rotations per instance
  const instanceRotations = Array.from({ length: count }, () => ({
    x: Math.random() * Math.PI,
    y: Math.random() * Math.PI,
    z: Math.random() * Math.PI,
  }));

  const animate = (speedMultiplier = 1) => {
    for (let i = 0; i < count; i++) {
      orbitAngles[i] += orbitSpeeds[i] * speedMultiplier;

      const r = orbitRadii[i];
      dummy.position.set(
        Math.cos(orbitAngles[i]) * r,
        yOffsets[i],
        Math.sin(orbitAngles[i]) * r
      );

      // Tumble rotation
      instanceRotations[i].x += rotAxes[i].x * rotSpeeds[i];
      instanceRotations[i].y += rotAxes[i].y * rotSpeeds[i];
      instanceRotations[i].z += rotAxes[i].z * rotSpeeds[i];

      dummy.rotation.set(
        instanceRotations[i].x,
        instanceRotations[i].y,
        instanceRotations[i].z
      );

      const scale = Math.random() * 0 + (0.1 + (r - innerRadius) / (outerRadius - innerRadius) * 0.5);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  return { mesh, animate };
}
