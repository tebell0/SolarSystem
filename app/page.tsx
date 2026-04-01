"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import celestial_bodies from "../lib/celestialData";
import { scaleDistanceAU, scaleRadius } from "../lib/scale";
import { useState } from "react";

type PlanetData = {
  color?: string;
  AU?: number;
  radius_km?: number;
  // Add other relevant properties as needed
};

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);
  // variable to control play/pause state of the animation
  const isRunningRef = useRef(true);
  const [isRunning, setIsRunning] = useState(true);
  // variable to control speed multiplier for the animation
  const speedMultiplierRef = useRef(1);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const toggleRunning = () => {
    const next = !isRunningRef.current;
    isRunningRef.current = next;
    setIsRunning(next);
  };

  const setSpeed = (multiplier: number) => {
    speedMultiplierRef.current = multiplier;
    setSpeedMultiplier(multiplier);
  };

  useEffect(() => {
    const mountNode = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 20, 40);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (mountNode) {
      mountNode.appendChild(renderer.domElement);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Create the sun mesh at the origin, larger than all planets
    // You can change sunRadius below without affecting orbit scale
    const sunRadius = 25; // Change this value as desired
    const sunGeometry = new THREE.SphereGeometry(sunRadius, 64, 64);
    const sunMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color1: { value: new THREE.Color(0xffe066) }, // yellow
        color2: { value: new THREE.Color(0xff9900) }, // orange
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          vec3 color = mix(color1, color2, vNormal.y * 0.5 + 0.5);
          gl_FragColor = vec4(color + intensity * 0.4, 1.0);
        }
      `,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, 0, 0);
    scene.add(sun);

    // Subtle glow using a sprite
    const glowTexture = new THREE.TextureLoader().load("/globe.svg");
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffe066,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.set(sunRadius * 3, sunRadius * 3, 1);
    sun.add(glow);

    // Point light at the sun's position
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(0, 0, 0);
    scene.add(light);

    function getOrbitSpeed(planetName: string) {
      // Get orbital period in days from celestial_bodies
      const planetData = (celestial_bodies as Record<string, PlanetData & { orbital_period_days?: number }>)[planetName];
      const orbitalPeriod = planetData?.orbital_period_days;
      // If no period, fallback to a reasonable default
      if (!orbitalPeriod || isNaN(orbitalPeriod)) return 0.001;
      // Base speed is for 1 Earth year (365.25 days)
      const baseSpeed = 0.2;
      return baseSpeed / orbitalPeriod;
    }

    // Create pivots at the sun's position for Mercury, Venus, Earth, and Mars
    const mercuryPivot = new THREE.Object3D();
    mercuryPivot.position.set(0, 0, 0);
    mercuryPivot.userData = { orbitRadius: 0, orbitSpeed: 0 }; // Initialize userData for Mercury
    scene.add(mercuryPivot);
    const venusPivot = new THREE.Object3D();
    venusPivot.position.set(0, 0, 0);
    venusPivot.userData = { orbitRadius: 0, orbitSpeed: 0 }; // Initialize userData for Venus
    scene.add(venusPivot);
    const earthPivot = new THREE.Object3D();
    earthPivot.position.set(0, 0, 0);
    earthPivot.userData = { orbitRadius: 0, orbitSpeed: 0 }; // Initialize userData for Earth
    scene.add(earthPivot);
    const marsPivot = new THREE.Object3D();
    marsPivot.position.set(0, 0, 0);
    marsPivot.userData = { orbitRadius: 0, orbitSpeed: 0 }; // Initialize userData for Mars
    scene.add(marsPivot);
    const jupiterPivot = new THREE.Object3D();
    jupiterPivot.position.set(0, 0, 0);
    jupiterPivot.userData = { orbitRadius: 0, orbitSpeed: 0 }; // Initialize userData for Jupiter
    scene.add(jupiterPivot);
    const saturnPivot = new THREE.Object3D();
    saturnPivot.position.set(0, 0, 0);
    saturnPivot.userData = { orbitRadius: 0, orbitSpeed: 0 }; // Initialize userData for Saturn
    scene.add(saturnPivot);
    const uranusPivot = new THREE.Object3D();
    uranusPivot.position.set(0, 0, 0);
    uranusPivot.userData = { orbitRadius: 0, orbitSpeed: 0 }; // Initialize userData for Uranus
    scene.add(uranusPivot);
    const neptunePivot = new THREE.Object3D();
    neptunePivot.position.set(0, 0, 0);
    neptunePivot.userData = { orbitRadius: 0, orbitSpeed: 0 }; // Initialize userData for Neptune
    scene.add(neptunePivot);
    const plutoPivot = new THREE.Object3D();
    plutoPivot.position.set(0, 0, 0);
    plutoPivot.userData = { orbitRadius: 0, orbitSpeed: 0 }; // Initialize userData for Pluto
    scene.add(plutoPivot);

    // Planetary Array
    const planets: {
      name: string;
      pivot: THREE.Object3D;
      mesh: THREE.Mesh;
      orbitSpeed: number;
    }[] = [];
    


    // Render each planet at a unique angle around its orbit ring
    const planetNames = [
      "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"
    ];
    planetNames.forEach((name, idx) => {
      const planetData = (celestial_bodies as Record<string, PlanetData>)[name];
      if (!planetData) return;
      // Use scaleRadius for planet size
      const radiusKm = planetData.radius_km ?? 6371; // Default to Earth's radius if missing
      const radius = scaleRadius(radiusKm);
      const geometry = new THREE.SphereGeometry(radius, 48, 48);
      const material = new THREE.MeshStandardMaterial({ color: planetData.color || 0xffffff });
      const planet = new THREE.Mesh(geometry, material);
      // Use AU for orbit radius
      const orbitAU = planetData.AU ?? 1; // Default to 1 AU if missing
      const orbitRadius = scaleDistanceAU(orbitAU);
      // Place planet at a different angle on its ring, with even more dramatic y-level variation
      const angle = (idx / planetNames.length) * Math.PI * 2; // Evenly distributed
      const yVariation = Math.sin(idx * 3) * 40 + Math.cos(idx * 2) * 25; // Much larger y offset
      const orbitSpeed = getOrbitSpeed(name);
      if (name === "Mercury") {
        // Mercury: attach to pivot, move from center, and rotate pivot
        const mercuryAngle = angle;
        const mercuryY = yVariation;
        const mercuryTiltAxis = new THREE.Vector3(-Math.sin(mercuryAngle), 0, Math.cos(mercuryAngle)).normalize();
        const mercuryTiltAngle = Math.atan2(mercuryY, orbitRadius);
        const mercuryPos = new THREE.Vector3(orbitRadius, 10, 0); // Move up by 10 units (use -10 for down)
        mercuryPos.applyAxisAngle(mercuryTiltAxis, mercuryTiltAngle);
        planet.position.copy(mercuryPos);
        mercuryPivot.add(planet);
        mercuryPivot.setRotationFromAxisAngle(mercuryTiltAxis, mercuryTiltAngle);
        mercuryPivot.userData = { orbitRadius, orbitSpeed };
        planets.push({ name, pivot: mercuryPivot, mesh: planet, orbitSpeed });
      } else if (name === "Venus") {
        // Venus: attach to pivot, move from center, and rotate pivot
        const venusAngle = angle;
        const venusY = yVariation;
        const venusTiltAxis = new THREE.Vector3(-Math.sin(venusAngle), 0, Math.cos(venusAngle)).normalize();
        const venusTiltAngle = Math.atan2(venusY, orbitRadius);
        const venusPos = new THREE.Vector3(orbitRadius, 0, 0);
        venusPos.applyAxisAngle(venusTiltAxis, venusTiltAngle);
        planet.position.copy(venusPos);
        venusPivot.add(planet);
        venusPivot.setRotationFromAxisAngle(venusTiltAxis, venusTiltAngle);
        venusPivot.userData = { orbitRadius, orbitSpeed };
        planets.push({ name, pivot: venusPivot, mesh: planet, orbitSpeed });
      } else if (name === "Earth") {
        // Earth: attach to pivot, move from center, and rotate pivot
        const earthAngle = angle;
        const earthY = yVariation;
        const earthTiltAxis = new THREE.Vector3(-Math.sin(earthAngle), 0, Math.cos(earthAngle)).normalize();
        const earthTiltAngle = Math.atan2(earthY, orbitRadius);
        const earthPos = new THREE.Vector3(orbitRadius, 0, 0);
        earthPos.applyAxisAngle(earthTiltAxis, earthTiltAngle);
        planet.position.copy(earthPos);
        earthPivot.add(planet);
        earthPivot.setRotationFromAxisAngle(earthTiltAxis, earthTiltAngle);
        earthPivot.userData = { orbitRadius, orbitSpeed };
        planets.push({ name, pivot: earthPivot, mesh: planet, orbitSpeed });
      } else if (name === "Mars") {
        // Mars: attach to pivot, move from center, and rotate pivot
        const marsAngle = angle;
        const marsY = yVariation;
        const marsTiltAxis = new THREE.Vector3(-Math.sin(marsAngle), 0, Math.cos(marsAngle)).normalize();
        const marsTiltAngle = Math.atan2(marsY, orbitRadius);
        const marsPos = new THREE.Vector3(orbitRadius, 0, 0);
        marsPos.applyAxisAngle(marsTiltAxis, marsTiltAngle);
        planet.position.copy(marsPos);
        marsPivot.add(planet);
        marsPivot.setRotationFromAxisAngle(marsTiltAxis, marsTiltAngle);
        marsPivot.userData = { orbitRadius, orbitSpeed };
        planets.push({ name, pivot: marsPivot, mesh: planet, orbitSpeed });
      } else if (name === "Jupiter") {
      // Jupiter: attach to pivot, move from center, and rotate pivot
      const jupiterAngle = angle;
      const jupiterY = yVariation;
      const jupiterTiltAxis = new THREE.Vector3(-Math.sin(jupiterAngle), 0, Math.cos(jupiterAngle)).normalize();
      const jupiterTiltAngle = Math.atan2(jupiterY, orbitRadius);
      const jupiterPos = new THREE.Vector3(orbitRadius, 0, 0);
      jupiterPos.applyAxisAngle(jupiterTiltAxis, jupiterTiltAngle);
      planet.position.copy(jupiterPos);
      jupiterPivot.add(planet);
      jupiterPivot.setRotationFromAxisAngle(jupiterTiltAxis, jupiterTiltAngle);
      jupiterPivot.userData = { orbitRadius, orbitSpeed };
      planets.push({ name, pivot: jupiterPivot, mesh: planet, orbitSpeed });
    } else if (name === "Saturn") {
      // Saturn: attach to pivot, move from center, and rotate pivot
      const saturnAngle = angle;
      const saturnY = yVariation;
      const saturnTiltAxis = new THREE.Vector3(-Math.sin(saturnAngle), 0, Math.cos(saturnAngle)).normalize();
      const saturnTiltAngle = Math.atan2(saturnY, orbitRadius);
      const saturnPos = new THREE.Vector3(orbitRadius, 0, 0);
      saturnPos.applyAxisAngle(saturnTiltAxis, saturnTiltAngle);
      planet.position.copy(saturnPos);
      saturnPivot.add(planet);
      saturnPivot.setRotationFromAxisAngle(saturnTiltAxis, saturnTiltAngle);
      saturnPivot.userData = { orbitRadius, orbitSpeed };
      planets.push({ name, pivot: saturnPivot, mesh: planet, orbitSpeed });
    } else if (name === "Uranus") {
      // Uranus: attach to pivot, move from center, and rotate pivot
      const uranusAngle = angle;
      const uranusY = yVariation;
      const uranusTiltAxis = new THREE.Vector3(-Math.sin(uranusAngle), 0, Math.cos(uranusAngle)).normalize();
      const uranusTiltAngle = Math.atan2(uranusY, orbitRadius);
      const uranusPos = new THREE.Vector3(orbitRadius, 0, 0);
      uranusPos.applyAxisAngle(uranusTiltAxis, uranusTiltAngle);
      planet.position.copy(uranusPos);
      uranusPivot.add(planet);
      uranusPivot.setRotationFromAxisAngle(uranusTiltAxis, uranusTiltAngle);
      uranusPivot.userData = { orbitRadius, orbitSpeed };
      planets.push({ name, pivot: uranusPivot, mesh: planet, orbitSpeed });
    } else if (name === "Neptune") {
      // Neptune: attach to pivot, move from center, and rotate pivot
      const neptuneAngle = angle;
      const neptuneY = yVariation;
      const neptuneTiltAxis = new THREE.Vector3(-Math.sin(neptuneAngle), 0, Math.cos(neptuneAngle)).normalize();
      const neptuneTiltAngle = Math.atan2(neptuneY, orbitRadius);
      const neptunePos = new THREE.Vector3(orbitRadius, 0, 0);
      neptunePos.applyAxisAngle(neptuneTiltAxis, neptuneTiltAngle);
      planet.position.copy(neptunePos);
      neptunePivot.add(planet);
      neptunePivot.setRotationFromAxisAngle(neptuneTiltAxis, neptuneTiltAngle);
      neptunePivot.userData = { orbitRadius, orbitSpeed };
      planets.push({ name, pivot: neptunePivot, mesh: planet, orbitSpeed });
    } else if (name === "Pluto") {
      // Pluto: attach to pivot, move from center, and rotate pivot
      const plutoAngle = angle;
      const plutoY = yVariation;
      const plutoTiltAxis = new THREE.Vector3(-Math.sin(plutoAngle), 0, Math.cos(plutoAngle)).normalize();
      const plutoTiltAngle = Math.atan2(plutoY, orbitRadius);
      const plutoPos = new THREE.Vector3(orbitRadius, 0, 0);
      plutoPos.applyAxisAngle(plutoTiltAxis, plutoTiltAngle);
      planet.position.copy(plutoPos);
      plutoPivot.add(planet);
      plutoPivot.setRotationFromAxisAngle(plutoTiltAxis, plutoTiltAngle);
      plutoPivot.userData = { orbitRadius, orbitSpeed };
      planets.push({ name, pivot: plutoPivot, mesh: planet, orbitSpeed });
    } else {
      planet.position.set(
        Math.cos(angle) * orbitRadius,
        yVariation,
        Math.sin(angle) * orbitRadius
      );
      scene.add(planet);
      // Add orbit ring tilted to meet the planet's y-level
      const orbitSegments = 128;
      const orbitGeometry = new THREE.BufferGeometry();
      const orbitVertices = [];
      // Calculate tilt angle so the ring passes through the planet's y-level at its angle
      // The tilt axis is perpendicular to the planet's position vector in the xz-plane
      const tiltAxis = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).normalize();
      const tiltAngle = Math.atan2(yVariation, orbitRadius);
      for (let i = 0; i <= orbitSegments; i++) {
        const theta = (i / orbitSegments) * Math.PI * 2;
        // Start with a flat ring in xz-plane
        const x = Math.cos(theta) * orbitRadius;
        const y = 0;
        const z = Math.sin(theta) * orbitRadius;
        // Rotate the point around the tilt axis by tiltAngle
        const v = new THREE.Vector3(x, y, z);
        v.applyAxisAngle(tiltAxis, tiltAngle);
        orbitVertices.push(v.x, v.y, v.z);
      }
      orbitGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(orbitVertices, 3)
      );
      const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x8888ff });
      const orbitRing = new THREE.Line(orbitGeometry, orbitMaterial);
        scene.add(orbitRing);
      }
    });
  
      // Ambient light
      const ambient = new THREE.AmbientLight(0xffffff, 0.2);
      scene.add(ambient);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();

      // Always animate planets if isRunningRef.current is true
      if (isRunningRef.current) {
        planets.forEach(({ pivot, orbitSpeed, name }) => {
          const scaledSpeed = orbitSpeed * speedMultiplierRef.current;
          if (name === "Uranus") {
            pivot.rotateOnAxis(new THREE.Vector3(0, 1 , 0), -Math.abs(scaledSpeed)); // Rotate in opposite direction for Uranus
          } else {
            pivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), scaledSpeed);
          }
        });
      }
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (mountNode) {
        mountNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Define available speed multipliers
  const speedOptions = [0.25, 0.5, 1, 2, 4, 8];

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* Controls - top right */}
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 10, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Pause/Play button */}
        <button
          onClick={toggleRunning}
          onMouseEnter={e => {
            (e.target as HTMLButtonElement).style.background = "#fff";
            (e.target as HTMLButtonElement).style.color = "#000";
          }}
          onMouseLeave={e => {
            (e.target as HTMLButtonElement).style.background = "#000";
            (e.target as HTMLButtonElement).style.color = "#fff";
          }}
          style={{
            background: "#000",
            color: "#fff",
            border: "1px solid #fff",
            borderRadius: 8,
            padding: "10px 22px",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: 1,
            transition: "background 0.2s, color 0.2s",
          }}
        >
          {isRunning ? "Pause" : "Play"}
        </button>

        {/* Speed multiplier dropdown */}
        <select
          value={speedMultiplier}
          onChange={e => setSpeed(Number(e.target.value))}
          style={{
            background: "#000",
            color: "#fff",
            border: "1px solid #fff",
            borderRadius: 8,
            padding: "10px 22px",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: 1,
          }}
        >
          {speedOptions.map(multiplier => (
            <option key={multiplier} value={multiplier}>
              {multiplier}x
            </option>
          ))}
        </select>
      </div>

      {/* Three.js mount node */}
      <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />
    </div>
  );
}


