"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import celestial_bodies from "../lib/celestialData";
import { scaleDistanceAU, scaleRadius } from "../lib/scale";
import { useState } from "react";
import {
  createTexturedMercury,
  createTexturedVenus,
  createTexturedEarth,
  createTexturedMars,
  createTexturedJupiter,
  createTexturedSaturn,
  createTexturedNeptune,
  createTexturedUranus,
  createTexturedPluto,
  createSpaceBackground,
  createTexturedSun,
  createTexturedMoon,
  createAsteroidBelt
} from "@/lib/textures";


type PlanetData = {
  color?: string;
  AU?: number;
  radius_km?: number;
  type?: string;
  atmosphere_composition?: string[];
  axis_rotation_period_hours?: number;
  orbital_period_days?: number;
  Nickname?: string;
  description?: string;
  spectral_type?: string;
  dominant_element1?: string;
  dominant_element2?: string;
  diameter_km?: number;
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

  const [showOrbits, setShowOrbits] = useState(true);
  const planetsRef = useRef<{ name: string; pivot: THREE.Object3D; mesh: THREE.Mesh; orbitSpeed: number; }[]>([]);

  const toggleOrbits = () => {
    const next = !showOrbits;
    setShowOrbits(next);
    planetsRef.current.forEach(({ pivot }) => {
      pivot.children.forEach(child => {
        if (child instanceof THREE.Line) {
          child.visible = next;
        }
      });
    });
  };


  const toggleRunning = () => {
    const next = !isRunningRef.current;
    isRunningRef.current = next;
    setIsRunning(next);
  };

  const setSpeed = (multiplier: number) => {
    speedMultiplierRef.current = multiplier;
    setSpeedMultiplier(multiplier);
  };

  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const hoveredPlanetRef = useRef<string | null>(null);
  const selectedPlanetRef = useRef<string | null>(null);

  // --- NEW refs for glow, zoom, and tooltip tracking ---
  const cameraTargetPosRef = useRef<THREE.Vector3 | null>(null);
  const cameraTargetLookRef = useRef<THREE.Vector3 | null>(null);
  const isZoomingRef = useRef(false);
  const selectedMeshRef = useRef<THREE.Mesh | null>(null);
  const leftTooltipRef = useRef<HTMLDivElement>(null);
  const rightTooltipRef = useRef<HTMLDivElement>(null);
  const isPausedForZoomRef = useRef(false);

  const [hasEntered, setHasEntered] = useState(false);
  const cameraIntroRef = useRef(false);

  const handleEnter = () => {
    setHasEntered(true);
    cameraIntroRef.current = true;
  };


  useEffect(() => {
    const mountNode = mountRef.current;
    const scene = new THREE.Scene();
    
    // Space background
    createSpaceBackground(scene);

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

        // --- Texture animate functions ---
    const textureAnimators: (() => void)[] = [];

        // Sun - replace ShaderMaterial with textured sun
    const sunRadius = 25;
    const { sun, animate: animateSun } = createTexturedSun(sunRadius);
    sun.position.set(0, 0, 0);
    scene.add(sun);
    textureAnimators.push(animateSun);

    // Point light at the sun's position
    const light = new THREE.PointLight(0xffffff, 100, 0, 1.2);
    light.position.set(0, 0, 0);
    scene.add(light);

    // --- ADD: Directional lights from multiple angles to illuminate all planets ---
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight1.position.set(1, 1, 1).normalize();
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight2.position.set(-1, 0.5, -1).normalize();
    scene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight3.position.set(0, -1, 0).normalize();
    scene.add(dirLight3);

    // Increase ambient slightly so dark sides aren't completely black
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

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

    // Create pivots at the sun's position for all planets
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

    // Moon pivot and speed (set when Earth block runs)
    let moonPivot = new THREE.Object3D();
    const moonOrbitSpeed = 0.01;

        // Create textured meshes
    const { mercury, animate: animateMercury } = createTexturedMercury(scaleRadius(celestial_bodies["Mercury"].radius_km));
    textureAnimators.push(animateMercury);

    const { venus, animate: animateVenus } = createTexturedVenus(scaleRadius(celestial_bodies["Venus"].radius_km));
    textureAnimators.push(animateVenus);

    const { earth, animate: animateEarth } = createTexturedEarth(scaleRadius(celestial_bodies["Earth"].radius_km));
    textureAnimators.push(animateEarth);

    const { mars, animate: animateMars } = createTexturedMars(scaleRadius(celestial_bodies["Mars"].radius_km));
    textureAnimators.push(animateMars);

    const { jupiter, animate: animateJupiter } = createTexturedJupiter(scaleRadius(celestial_bodies["Jupiter"].radius_km));
    textureAnimators.push(animateJupiter);

    const { saturn, animate: animateSaturn } = createTexturedSaturn(scaleRadius(celestial_bodies["Saturn"].radius_km));
    textureAnimators.push(animateSaturn);

    const { uranus, animate: animateUranus } = createTexturedUranus(scaleRadius(celestial_bodies["Uranus"].radius_km));
    textureAnimators.push(animateUranus);

    const { neptune, animate: animateNeptune } = createTexturedNeptune(scaleRadius(celestial_bodies["Neptune"].radius_km));
    textureAnimators.push(animateNeptune);

    const { pluto, animate: animatePluto } = createTexturedPluto(scaleRadius(celestial_bodies["Pluto"].radius_km));
    textureAnimators.push(animatePluto);

    const moon = createTexturedMoon(scaleRadius(1737));
    const animateMoon = () => {};
    textureAnimators.push(animateMoon);

    // Map textured meshes to planet names for use in forEach
    const texturedMeshes: Record<string, THREE.Mesh> = {
      Mercury: mercury,
      Venus: venus,
      Earth: earth,
      Mars: mars,
      Jupiter: jupiter,
      Saturn: saturn,
      Uranus: uranus,
      Neptune: neptune,
      Pluto: pluto,
      Moon: moon
    };
    
    // Render each planet at a unique angle around its orbit ring
    const planetNames = [
      "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"
    ];

    const orbitStartPercent: Record<string, number> = {
      Mercury: 0,
      Venus:   10,
      Earth:   75,
      Mars:    40,
      Jupiter: 0,
      Saturn:  50,   
      Uranus:  25,   
      Neptune: 75,   // 3/4 of the way around
      Pluto:   60,
    };

    planetNames.forEach((name, idx) => {
      const planetData = (celestial_bodies as Record<string, PlanetData>)[name];
      if (!planetData) return;

      // Use the textured mesh instead of a plain mesh
      const planet = texturedMeshes[name];

      const orbitAU = planetData.AU ?? 1;
      const orbitRadius = scaleDistanceAU(orbitAU);
      const percent = orbitStartPercent[name] ?? (idx / planetNames.length) * 100;
      const angle = (percent / 100) * Math.PI * 2;
      const yVariation = Math.sin(idx * 3) * 40 + Math.cos(idx * 2) * 25;
      const orbitSpeed = getOrbitSpeed(name);

      
      
      if (name === "Mercury") {
        // Mercury: attach to pivot, move from center, and rotate pivot
        const mercuryAngle = angle;
        const mercuryY = yVariation;
        const mercuryTiltAxis = new THREE.Vector3(-Math.sin(mercuryAngle), 0, Math.cos(mercuryAngle)).normalize();
        const mercuryTiltAngle = Math.atan2(mercuryY, orbitRadius);

        const mercuryPos = new THREE.Vector3(
          Math.cos(angle) * orbitRadius,
          0,
          Math.sin(angle) * orbitRadius
        );
        mercuryPos.applyAxisAngle(mercuryTiltAxis, mercuryTiltAngle);
        planet.position.copy(mercuryPos);
        mercuryPivot.add(planet);
        mercuryPivot.userData = { orbitRadius, orbitSpeed };
        planets.push({ name, pivot: mercuryPivot, mesh: planet, orbitSpeed });

        const orbitGeometry = new THREE.BufferGeometry();
        const orbitVertices: number[] = [];
        for (let i = 0; i <= 128; i++) {
          const theta = (i / 128) * Math.PI * 2;
          const v = new THREE.Vector3(Math.cos(theta) * orbitRadius, 0, Math.sin(theta) * orbitRadius);
          v.applyAxisAngle(mercuryTiltAxis, mercuryTiltAngle);
          orbitVertices.push(v.x, v.y, v.z);
        }
        orbitGeometry.setAttribute("position", new THREE.Float32BufferAttribute(orbitVertices, 3));
        const orbitRing = new THREE.Line(orbitGeometry, new THREE.LineBasicMaterial({ color: 0x8888ff }));
        mercuryPivot.add(orbitRing); // attach to pivot not scene!
      } else if (name === "Venus") {
        // Venus: attach to pivot, move from center, and rotate pivot
        const venusAngle = angle;
        const venusY = yVariation;
        const venusTiltAxis = new THREE.Vector3(-Math.sin(venusAngle), 0, Math.cos(venusAngle)).normalize();
        const venusTiltAngle = Math.atan2(venusY, orbitRadius);

        const venusPos = new THREE.Vector3(
          Math.cos(venusAngle) * orbitRadius,
          0,
          Math.sin(venusAngle) * orbitRadius
        );

        venusPos.applyAxisAngle(venusTiltAxis, venusTiltAngle);
        planet.position.copy(venusPos);
        venusPivot.add(planet);
        venusPivot.setRotationFromAxisAngle(venusTiltAxis, venusTiltAngle);
        venusPivot.userData = { orbitRadius, orbitSpeed };
        planets.push({ name, pivot: venusPivot, mesh: planet, orbitSpeed });

        const orbitGeometry = new THREE.BufferGeometry();
        const orbitVertices: number[] = [];
        for (let i = 0; i <= 128; i++) {
          const theta = (i / 128) * Math.PI * 2;
          const v = new THREE.Vector3(Math.cos(theta) * orbitRadius, 0, Math.sin(theta) * orbitRadius);
          v.applyAxisAngle(venusTiltAxis, venusTiltAngle);
          orbitVertices.push(v.x, v.y, v.z);
        }
        orbitGeometry.setAttribute("position", new THREE.Float32BufferAttribute(orbitVertices, 3));
        const orbitRing = new THREE.Line(orbitGeometry, new THREE.LineBasicMaterial({ color: 0x8888ff }));
        venusPivot.add(orbitRing); // attach to pivot not scene!
      } else if (name === "Earth") {
        // Earth: attach to pivot, move from center, and rotate pivot
        const earthAngle = angle;
        const earthY = yVariation;
        const earthTiltAxis = new THREE.Vector3(-Math.sin(earthAngle), 0, Math.cos(earthAngle)).normalize();
        const earthTiltAngle = Math.atan2(earthY, orbitRadius);

        const earthPos = new THREE.Vector3(
          Math.cos(earthAngle) * orbitRadius,
          0,
          Math.sin(earthAngle) * orbitRadius
        );

        earthPos.applyAxisAngle(earthTiltAxis, earthTiltAngle);
        planet.position.copy(earthPos);
        earthPivot.add(planet);
        earthPivot.setRotationFromAxisAngle(earthTiltAxis, earthTiltAngle);
        earthPivot.userData = { orbitRadius, orbitSpeed };
        planets.push({ name, pivot: earthPivot, mesh: planet, orbitSpeed });

        // --- Moon ---
        moonPivot = new THREE.Object3D();
        planet.add(moonPivot); // planet = earth mesh here
        
        const moonOrbitRadius = scaleRadius(celestial_bodies["Earth"].radius_km) * 2;
        moon.position.set(moonOrbitRadius, 0, 0);
        moonPivot.add(moon);

        const orbitGeometry = new THREE.BufferGeometry();
        const orbitVertices: number[] = [];
        for (let i = 0; i <= 128; i++) {
          const theta = (i / 128) * Math.PI * 2;
          const v = new THREE.Vector3(Math.cos(theta) * orbitRadius, 0, Math.sin(theta) * orbitRadius);
          v.applyAxisAngle(earthTiltAxis, earthTiltAngle);
          orbitVertices.push(v.x, v.y, v.z);
        }
        orbitGeometry.setAttribute("position", new THREE.Float32BufferAttribute(orbitVertices, 3));
        const orbitRing = new THREE.Line(orbitGeometry, new THREE.LineBasicMaterial({ color: 0x8888ff }));
        earthPivot.add(orbitRing); // attach to pivot not scene!

      } else if (name === "Mars") {
        // Mars: attach to pivot, move from center, and rotate pivot
        const marsAngle = angle;
        const marsY = yVariation;
        const marsTiltAxis = new THREE.Vector3(-Math.sin(marsAngle), 0, Math.cos(marsAngle)).normalize();
        const marsTiltAngle = Math.atan2(marsY, orbitRadius);

        const marsPos = new THREE.Vector3(
          Math.cos(marsAngle) * orbitRadius,
          0,
          Math.sin(marsAngle) * orbitRadius
        );

        marsPos.applyAxisAngle(marsTiltAxis, marsTiltAngle);
        planet.position.copy(marsPos);
        marsPivot.add(planet);
        marsPivot.setRotationFromAxisAngle(marsTiltAxis, marsTiltAngle);
        marsPivot.userData = { orbitRadius, orbitSpeed };
        planets.push({ name, pivot: marsPivot, mesh: planet, orbitSpeed });

        const orbitGeometry = new THREE.BufferGeometry();
        const orbitVertices: number[] = [];
        for (let i = 0; i <= 128; i++) {
          const theta = (i / 128) * Math.PI * 2;
          const v = new THREE.Vector3(Math.cos(theta) * orbitRadius, 0, Math.sin(theta) * orbitRadius);
          v.applyAxisAngle(marsTiltAxis, marsTiltAngle);
          orbitVertices.push(v.x, v.y, v.z);
        }
        orbitGeometry.setAttribute("position", new THREE.Float32BufferAttribute(orbitVertices, 3));
        const orbitRing = new THREE.Line(orbitGeometry, new THREE.LineBasicMaterial({ color: 0x8888ff }));
        marsPivot.add(orbitRing); // attach to pivot not scene!
      } else if (name === "Jupiter") {
      // Jupiter: attach to pivot, move from center, and rotate pivot
      const jupiterAngle = angle;
      const jupiterY = yVariation;
      const jupiterTiltAxis = new THREE.Vector3(-Math.sin(jupiterAngle), 0, Math.cos(jupiterAngle)).normalize();
      const jupiterTiltAngle = Math.atan2(jupiterY, orbitRadius);

      const jupiterPos = new THREE.Vector3(
        Math.cos(jupiterAngle) * orbitRadius,
        0,
        Math.sin(jupiterAngle) * orbitRadius
      );

      jupiterPos.applyAxisAngle(jupiterTiltAxis, jupiterTiltAngle);
      planet.position.copy(jupiterPos);
      jupiterPivot.add(planet);
      jupiterPivot.setRotationFromAxisAngle(jupiterTiltAxis, jupiterTiltAngle);
      jupiterPivot.userData = { orbitRadius, orbitSpeed };
      planets.push({ name, pivot: jupiterPivot, mesh: planet, orbitSpeed });

      const orbitGeometry = new THREE.BufferGeometry();
      const orbitVertices: number[] = [];
      for (let i = 0; i <= 128; i++) {
        const theta = (i / 128) * Math.PI * 2;
        const v = new THREE.Vector3(Math.cos(theta) * orbitRadius, 0, Math.sin(theta) * orbitRadius);
        v.applyAxisAngle(jupiterTiltAxis, jupiterTiltAngle);
        orbitVertices.push(v.x, v.y, v.z);
      }
      orbitGeometry.setAttribute("position", new THREE.Float32BufferAttribute(orbitVertices, 3));
      const orbitRing = new THREE.Line(orbitGeometry, new THREE.LineBasicMaterial({ color: 0x8888ff }));
      jupiterPivot.add(orbitRing); // attach to pivot not scene!
    } else if (name === "Saturn") {
      // Saturn: attach to pivot, move from center, and rotate pivot
      const saturnAngle = angle;
      const saturnY = yVariation;
      const saturnTiltAxis = new THREE.Vector3(-Math.sin(saturnAngle), 0, Math.cos(saturnAngle)).normalize();
      const saturnTiltAngle = Math.atan2(saturnY, orbitRadius);

      const saturnPos = new THREE.Vector3(
        Math.cos(saturnAngle) * orbitRadius,
        0,
        Math.sin(saturnAngle) * orbitRadius
      );
      saturnPos.applyAxisAngle(saturnTiltAxis, saturnTiltAngle);
      planet.position.copy(saturnPos);
      saturnPivot.add(planet);

      const { rings } = createTexturedSaturn(scaleRadius(celestial_bodies["Saturn"].radius_km));
      rings.position.copy(saturnPos); // match saturn's position within the pivot
      saturnPivot.add(rings);

      saturnPivot.setRotationFromAxisAngle(saturnTiltAxis, saturnTiltAngle);
      saturnPivot.userData = { orbitRadius, orbitSpeed };
      planets.push({ name, pivot: saturnPivot, mesh: planet, orbitSpeed });
      const orbitGeometry = new THREE.BufferGeometry();
      const orbitVertices: number[] = [];
      for (let i = 0; i <= 128; i++) {
        const theta = (i / 128) * Math.PI * 2;
        const v = new THREE.Vector3(Math.cos(theta) * orbitRadius, 0, Math.sin(theta) * orbitRadius);
        v.applyAxisAngle(saturnTiltAxis, saturnTiltAngle);
        orbitVertices.push(v.x, v.y, v.z);
      }
      orbitGeometry.setAttribute("position", new THREE.Float32BufferAttribute(orbitVertices, 3));
      const orbitRing = new THREE.Line(orbitGeometry, new THREE.LineBasicMaterial({ color: 0x8888ff }));
      saturnPivot.add(orbitRing); // attach to pivot not scene!
    } else if (name === "Uranus") {
      // Uranus: attach to pivot, move from center, and rotate pivot
      const uranusAngle = angle;
      const uranusY = yVariation;
      const uranusTiltAxis = new THREE.Vector3(-Math.sin(uranusAngle), 0, Math.cos(uranusAngle)).normalize();
      const uranusTiltAngle = Math.atan2(uranusY, orbitRadius);

      const uranusPos = new THREE.Vector3(
        Math.cos(uranusAngle) * orbitRadius,
        0,
        Math.sin(uranusAngle) * orbitRadius
      );

      uranusPos.applyAxisAngle(uranusTiltAxis, uranusTiltAngle);
      planet.position.copy(uranusPos);
      uranusPivot.add(planet);
      uranusPivot.setRotationFromAxisAngle(uranusTiltAxis, uranusTiltAngle);
      uranusPivot.userData = { orbitRadius, orbitSpeed };
      planets.push({ name, pivot: uranusPivot, mesh: planet, orbitSpeed });

        const orbitGeometry = new THREE.BufferGeometry();
        const orbitVertices: number[] = [];
        for (let i = 0; i <= 128; i++) {
          const theta = (i / 128) * Math.PI * 2;
          const v = new THREE.Vector3(Math.cos(theta) * orbitRadius, 0, Math.sin(theta) * orbitRadius);
          v.applyAxisAngle(uranusTiltAxis, uranusTiltAngle);
          orbitVertices.push(v.x, v.y, v.z);
        }
        orbitGeometry.setAttribute("position", new THREE.Float32BufferAttribute(orbitVertices, 3));
        const orbitRing = new THREE.Line(orbitGeometry, new THREE.LineBasicMaterial({ color: 0x8888ff }));
        uranusPivot.add(orbitRing); // attach to pivot not scene!
    } else if (name === "Neptune") {
      // Neptune: attach to pivot, move from center, and rotate pivot
      const neptuneAngle = angle;
      const neptuneY = yVariation;
      const neptuneTiltAxis = new THREE.Vector3(-Math.sin(neptuneAngle), 0, Math.cos(neptuneAngle)).normalize();
      const neptuneTiltAngle = Math.atan2(neptuneY, orbitRadius);

      const neptunePos = new THREE.Vector3(
        Math.cos(neptuneAngle) * orbitRadius,
        0,
        Math.sin(neptuneAngle) * orbitRadius
      );
      neptunePos.applyAxisAngle(neptuneTiltAxis, neptuneTiltAngle);
      planet.position.copy(neptunePos);
      neptunePivot.add(planet);
      neptunePivot.setRotationFromAxisAngle(neptuneTiltAxis, neptuneTiltAngle);
      neptunePivot.userData = { orbitRadius, orbitSpeed };
      planets.push({ name, pivot: neptunePivot, mesh: planet, orbitSpeed });

      const orbitGeometry = new THREE.BufferGeometry();
      const orbitVertices: number[] = [];
      for (let i = 0; i <= 128; i++) {
        const theta = (i / 128) * Math.PI * 2;
        const v = new THREE.Vector3(Math.cos(theta) * orbitRadius, 0, Math.sin(theta) * orbitRadius);
        v.applyAxisAngle(neptuneTiltAxis, neptuneTiltAngle);
        orbitVertices.push(v.x, v.y, v.z);
      }
      orbitGeometry.setAttribute("position", new THREE.Float32BufferAttribute(orbitVertices, 3));
      const orbitRing = new THREE.Line(orbitGeometry, new THREE.LineBasicMaterial({ color: 0x8888ff }));
      neptunePivot.add(orbitRing); // attach to pivot not scene!
    } else if (name === "Pluto") {
      // Pluto: attach to pivot, move from center, and rotate pivot
      const plutoAngle = angle;
      const plutoY = yVariation;
      const plutoTiltAxis = new THREE.Vector3(-Math.sin(plutoAngle), 0, Math.cos(plutoAngle)).normalize();
      const plutoTiltAngle = Math.atan2(plutoY, orbitRadius);

      const plutoPos = new THREE.Vector3(
        Math.cos(plutoAngle) * orbitRadius,
        0,
        Math.sin(plutoAngle) * orbitRadius
      );

      plutoPos.applyAxisAngle(plutoTiltAxis, plutoTiltAngle);
      planet.position.copy(plutoPos);
      plutoPivot.add(planet);
      plutoPivot.setRotationFromAxisAngle(plutoTiltAxis, plutoTiltAngle);
      plutoPivot.userData = { orbitRadius, orbitSpeed };
      planets.push({ name, pivot: plutoPivot, mesh: planet, orbitSpeed });

        const orbitGeometry = new THREE.BufferGeometry();
        const orbitVertices: number[] = [];
        for (let i = 0; i <= 128; i++) {
          const theta = (i / 128) * Math.PI * 2;
          const v = new THREE.Vector3(Math.cos(theta) * orbitRadius, 0, Math.sin(theta) * orbitRadius);
          v.applyAxisAngle(plutoTiltAxis, plutoTiltAngle);
          orbitVertices.push(v.x, v.y, v.z);
        }
        orbitGeometry.setAttribute("position", new THREE.Float32BufferAttribute(orbitVertices, 3));
        const orbitRing = new THREE.Line(orbitGeometry, new THREE.LineBasicMaterial({ color: 0x8888ff }));
        plutoPivot.add(orbitRing); // attach to pivot not scene!
    } else {
      planet.position.set(
          Math.cos(angle) * orbitRadius,
          yVariation,
          Math.sin(angle) * orbitRadius
        );
        scene.add(planet);
        const orbitSegments = 128;
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitVertices = [];
        const tiltAxis = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).normalize();
        const tiltAngle = Math.atan2(yVariation, orbitRadius);
        for (let i = 0; i <= orbitSegments; i++) {
          const theta = (i / orbitSegments) * Math.PI * 2;
          const x = Math.cos(theta) * orbitRadius;
          const y = 0;
          const z = Math.sin(theta) * orbitRadius;
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

    planetsRef.current = planets;
    const marsOrbitRadius    = scaleDistanceAU(1.52);
    const jupiterOrbitRadius = scaleDistanceAU(5.20);

    const { animate: animateAsteroids } = createAsteroidBelt(scene, {
      innerRadius: marsOrbitRadius    + (jupiterOrbitRadius - marsOrbitRadius) * 0.15,
      outerRadius: jupiterOrbitRadius - (jupiterOrbitRadius - marsOrbitRadius) * 0.15,
      count: 4000,
    });

    // --- Raycaster setup ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Collect all planet meshes for raycasting
    const planetMeshList: { name: string; mesh: THREE.Mesh }[] = [
      { name: "Mercury", mesh: mercury },
      { name: "Venus",   mesh: venus },
      { name: "Earth",   mesh: earth },
      { name: "Mars",    mesh: mars },
      { name: "Jupiter", mesh: jupiter },
      { name: "Saturn",  mesh: saturn },
      { name: "Uranus",  mesh: uranus },
      { name: "Neptune", mesh: neptune },
      { name: "Pluto",   mesh: pluto },
      { name: "Sun",     mesh: sun },
      { name: "Moon",    mesh: moon },
    ];

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = planetMeshList.map(p => p.mesh);
      const intersects = raycaster.intersectObjects(meshes, false);


      if (intersects.length > 0) {
        const hit = planetMeshList.find(p => p.mesh === intersects[0].object);
        if (hit) {

          if (hoveredPlanetRef.current !== hit.name) {
            hoveredPlanetRef.current = hit.name;
            setHoveredPlanet(hit.name);
            document.body.style.cursor = "pointer";
          }
        }
      } else {
        if (hoveredPlanetRef.current !== null) {
          hoveredPlanetRef.current = null;
          setHoveredPlanet(null);
          document.body.style.cursor = "default";
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = planetMeshList.map(p => p.mesh);
      const intersects = raycaster.intersectObjects(meshes, false);

      const deselect = () => {
        isPausedForZoomRef.current = false;
        isZoomingRef.current = false;
        selectedMeshRef.current = null;
        selectedPlanetRef.current = null;
        cameraTargetPosRef.current = null;
        cameraTargetLookRef.current = null;
        setSelectedPlanet(null);
        if (leftTooltipRef.current)  leftTooltipRef.current.style.opacity = "0";
        if (rightTooltipRef.current) rightTooltipRef.current.style.opacity = "0";
      };

      if (intersects.length > 0) {
        const hit = planetMeshList.find(p => p.mesh === intersects[0].object);
        if (hit) {
          const isToggleOff = selectedPlanetRef.current === hit.name;

          if (isToggleOff) {
            deselect();
          } else {
            selectedPlanetRef.current = hit.name;
            setSelectedPlanet(hit.name);
            isPausedForZoomRef.current = true;

            const worldPos = new THREE.Vector3();
            hit.mesh.getWorldPosition(worldPos);

            const radius = (hit.mesh.geometry as THREE.SphereGeometry).parameters?.radius ?? 5;
            const offset = radius * 6;
            const dir = new THREE.Vector3()
              .subVectors(camera.position, worldPos)
              .normalize();

            cameraTargetPosRef.current = worldPos.clone().add(dir.multiplyScalar(offset));
            cameraTargetLookRef.current = worldPos.clone();
            isZoomingRef.current = true;
            selectedMeshRef.current = hit.mesh;
          }
      }
    }
  };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();

      // Self-rotation always runs regardless of pause state
      textureAnimators.forEach(fn => fn());

       // Orbital rotation pauses when a planet is selected OR manually paused
      if (isRunningRef.current && !isPausedForZoomRef.current) {
        planets.forEach(({ pivot, orbitSpeed, name }) => {
          const scaledSpeed = orbitSpeed * speedMultiplierRef.current;
          if (name === "Uranus") {
            pivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), -Math.abs(scaledSpeed));
          } else {
            pivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), scaledSpeed);
          }
        });

        moonPivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), moonOrbitSpeed * speedMultiplierRef.current);
        animateAsteroids();

      }

      // --- Smooth camera zoom ---
      if (isZoomingRef.current && cameraTargetPosRef.current && cameraTargetLookRef.current) {
        camera.position.lerp(cameraTargetPosRef.current, 0.05);
        controls.target.lerp(cameraTargetLookRef.current, 0.05);

        // Update target each frame to follow the moving planet
        if (selectedMeshRef.current) {
          const worldPos = new THREE.Vector3();
          selectedMeshRef.current.getWorldPosition(worldPos);
          cameraTargetLookRef.current.copy(worldPos);

          const radius = (selectedMeshRef.current.geometry as THREE.SphereGeometry).parameters?.radius ?? 5;
          const offset = radius * 6;
          const dir = new THREE.Vector3()
            .subVectors(camera.position, worldPos)
            .normalize();
          cameraTargetPosRef.current.copy(worldPos).add(dir.multiplyScalar(offset));

          // Project planet to screen to get Y position only
          const screenPos = worldPos.clone().project(camera);
          const y = (screenPos.y * -0.5 + 0.5) * window.innerHeight;

          // Always place tooltips at 25% and 75% of screen width
          const leftX  = window.innerWidth * 0.25 - 75; // center the 150px wide tooltip at 25%
          const rightX = window.innerWidth * 0.75 - 75; // center the 150px wide tooltip at 75%

          // Push tooltips up and clamp so they never go off screen
          const leftH  = leftTooltipRef.current?.offsetHeight  ?? 300;
          const rightH = rightTooltipRef.current?.offsetHeight ?? 300;

          const leftTop  = Math.min(y - leftH / 2,  window.innerHeight - leftH  - 20);
          const rightTop = Math.min(y - rightH / 2, window.innerHeight - rightH - 20);


          if (leftTooltipRef.current) {
            leftTooltipRef.current.style.left    = `${leftX}px`;
            leftTooltipRef.current.style.top     = `${leftTop}px`;
            leftTooltipRef.current.style.opacity = "1";
          }
          if (rightTooltipRef.current) {
            rightTooltipRef.current.style.left    = `${rightX}px`;
            rightTooltipRef.current.style.top     = `${rightTop}px`;
            rightTooltipRef.current.style.opacity = "1";
          }
        }
      }
      renderer.render(scene, camera);
    };

    animate();

    const checkEnter = setInterval(() => {
      if (cameraIntroRef.current) {
        clearInterval(checkEnter);
        camera.position.set(0, 300, 600);
        const introTarget = new THREE.Vector3(0, 0, 0);
        const introPos    = new THREE.Vector3(0, 20, 40);
        const introZoom = () => {
          camera.position.lerp(introPos, 0.012);
          controls.target.lerp(introTarget, 0.012);
        };
        const introInterval = setInterval(introZoom, 1000 / 60);
        setTimeout(() => {
          clearInterval(introInterval);
          // Snap cleanly to final position so nothing drifts
          camera.position.copy(introPos);
          controls.target.copy(introTarget);
        }, 2500);
      }
    }, 100);

    return () => {
      clearInterval(checkEnter); 
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      if (mountNode) mountNode.removeChild(renderer.domElement);
    };
  }, []);
  
  // Define available speed multipliers
  const speedOptions = [0.25, 0.5, 1, 2, 4, 8];

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Orbitron:wght@400;500;700&display=swap');

        * { box-sizing: border-box; }

        .futuristic-btn {
          background: rgba(0, 0, 0, 0.6);
          color: #e0e0e0;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 4px;
          padding: 10px 22px;
          font-family: 'Orbitron', monospace;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          letter-spacing: 2px;
          text-transform: uppercase;
          transition: all 0.2s ease;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 0 0px rgba(120,180,255,0);
          width: 100%;
        }
          .futuristic-btn:hover {
          background: rgba(120, 180, 255, 0.08);
          border-color: rgba(120, 180, 255, 0.5);
          color: #ffffff;
          box-shadow: 0 0 12px rgba(120,180,255,0.15), inset 0 0 12px rgba(120,180,255,0.05);
        }

        .futuristic-select {
          background: rgba(0, 0, 0, 0.6);
          color: #e0e0e0;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 4px;
          padding: 10px 22px;
          font-family: 'Orbitron', monospace;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          letter-spacing: 2px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          width: 100%;
          appearance: none;
          text-align: center;
          transition: all 0.2s ease;
        }
        .futuristic-select:hover {
          border-color: rgba(120, 180, 255, 0.5);
          box-shadow: 0 0 12px rgba(120,180,255,0.15);
        }
        .futuristic-select option {
          background: #0a0a0f;
          color: #e0e0e0;
          font-family: 'Orbitron', monospace;
        }
          .tooltip-panel {
          font-family: 'Rajdhani', sans-serif;
        }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(120,180,255,0.3); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(120,180,255,0.6); }
      `}</style>

      {/* Intro screen */}
      {!hasEntered && (
        <div style={{
          position: "absolute",
          inset: 0,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(ellipse at center, rgba(4,8,24,0.97) 0%, rgba(0,0,0,1) 100%)",
          gap: 12,
        }}>
          {/* Top accent */}
          <div style={{
            width: 260,
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(120,180,255,0.6), transparent)",
            marginBottom: 32,
          }} />

          {/* Eyebrow */}
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 10,
            letterSpacing: 6,
            color: "rgba(120,180,255,0.5)",
            textTransform: "uppercase",
            marginBottom: 16,
          }}>
            An Interactive Experience
          </div>

          {/* Main title */}
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 36,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: 6,
            textTransform: "uppercase",
            textAlign: "center",
            lineHeight: 1.3,
            textShadow: "0 0 40px rgba(120,180,255,0.3)",
          }}>
            Welcome to the<br />
            <span style={{ color: "#7aabff" }}>Solar System</span>
          </div>

          {/* Subtitle */}
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 14,
            color: "rgba(200,220,255,0.45)",
            letterSpacing: 2,
            marginTop: 12,
            marginBottom: 48,
            textAlign: "center",
          }}>
            Explore 8 planets, 1 dwarf planet, and beyond
          </div>

          {/* Enter button */}
          <button
            className="futuristic-btn"
            onClick={handleEnter}
            style={{
              width: 200,
              padding: "14px 32px",
              fontSize: 12,
              letterSpacing: 4,
            }}
          >
            ▶ Enter
          </button>

          {/* Bottom accent */}
          <div style={{
            width: 260,
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(120,180,255,0.6), transparent)",
            marginTop: 32,
          }} />
        </div>
      )}


      {/* Controls - top right */}
      <div style={{
        position: "absolute",
        top: 28,
        right: 28,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: 160,
      }}>
        {/* Top accent line */}
        <div style={{
          width: "100%",
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(120,180,255,0.6), transparent)",
          marginBottom: 4,
        }} />

        <button className="futuristic-btn" onClick={toggleRunning}>
          {isRunning ? "⏸ Pause" : "▶ Play"}
        </button>

        <select
          className="futuristic-select"
          value={speedMultiplier}
          onChange={e => setSpeed(Number(e.target.value))}
        >
          {speedOptions.map(multiplier => (
            <option key={multiplier} value={multiplier}>
              {multiplier}× Speed
            </option>
          ))}
        </select>

        <button className="futuristic-btn" onClick={toggleOrbits}>
          {showOrbits ? "Hide Orbits" : "Show Orbits"}
        </button>

        {/* Bottom accent line */}
        <div style={{
          width: "100%",
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(120,180,255,0.6), transparent)",
          marginTop: 4,
        }} />
      </div>

      {/* Hover tooltip */}
      {hoveredPlanet && !selectedPlanet && (
        <div style={{
          position: "absolute",
          bottom: 48,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.75)",
          color: "#c8dcff",
          padding: "8px 24px",
          borderRadius: 3,
          fontSize: 12,
          fontFamily: "'Orbitron', monospace",
          fontWeight: 500,
          letterSpacing: 3,
          textTransform: "uppercase",
          pointerEvents: "none",
          border: "1px solid rgba(120,180,255,0.3)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 0 20px rgba(120,180,255,0.1)",
        }}>
          {hoveredPlanet}
        </div>
      )}

      {/* Left info tooltip */}
      <div
        ref={leftTooltipRef}
        className="tooltip-panel"
        style={{
          position: "absolute",
          opacity: 0,
          transition: "opacity 0.6s ease",
          background: "rgba(4, 8, 18, 0.88)",
          color: "#e8f0ff",
          padding: "22px 24px",
          borderRadius: 6,
          pointerEvents: "none",
          border: "1px solid rgba(120,180,255,0.2)",
          borderTop: "1px solid rgba(120,180,255,0.5)",
          width: 210,
          backdropFilter: "blur(16px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(120,180,255,0.05)",
        }}
      >
        {selectedPlanet && (() => {
          const data = (celestial_bodies as Record<string, PlanetData>)[selectedPlanet];
          if (!data) return null;

          const orderFromSun: Record<string, string> = {
            Mercury: "1st from the Sun",
            Venus:   "2nd from the Sun",
            Earth:   "3rd from the Sun",
            Mars:    "4th from the Sun",
            Jupiter: "5th from the Sun",
            Saturn:  "6th from the Sun",
            Uranus:  "7th from the Sun",
            Neptune: "8th from the Sun",
            Pluto:   "9th from the Sun",
            Sun:     "The Star",
            Moon:    "Earth's Natural Satellite",
          };

          const formatAtmosphere = (composition: string[]) =>
            composition.map(c => c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, " ")).join(", ");

          const formatDay = (hours: number) => {
            if (hours >= 24) return `${(hours / 24).toFixed(1)} Earth days`;
            return `${hours} hours`;
          };

          const formatYear = (days: number) => {
            if (days >= 365) return `${(days / 365.25).toFixed(1)} Earth years`;
            return `${days} Earth days`;
          };

          const isSun = selectedPlanet === "Sun";
          const isMoon = selectedPlanet === "Moon";

          const bullets = isSun ? [
            {
              label: "Type",
              value: data.type ? data.type.charAt(0).toUpperCase() + data.type.slice(1) : "N/A",
            },
            {
              label: "Spectral Class",
              value: data.spectral_type ?? "N/A",
            },
            {
              label: "Dominant Elements",
              value: [data.dominant_element1, data.dominant_element2]
                .filter(Boolean)
                .map(e => e!.charAt(0).toUpperCase() + e!.slice(1))
                .join(", "),
            },
            {
              label: "Diameter",
              value: data.diameter_km ? `${data.diameter_km.toLocaleString()} km` : "N/A",
            },
            ] : isMoon ? [                            // ADD THIS BLOCK
            { label: "Type",         value: "Natural Satellite" },
            { label: "Atmosphere",   value: "Trace gases" },
            { label: "Day length",   value: "27.3 Earth days" },
            { label: "Orbit period", value: "27.3 Earth days" },
          ] : [
            { label: "Type",        value: data.type ? data.type.charAt(0).toUpperCase() + data.type.slice(1) : "N/A" },
            { label: "Atmosphere",  value: data.atmosphere_composition ? formatAtmosphere(data.atmosphere_composition) : "N/A" },
            { label: "Day length",  value: data.axis_rotation_period_hours != null ? formatDay(data.axis_rotation_period_hours) : "N/A" },
            { label: "Year length", value: data.orbital_period_days != null ? formatYear(data.orbital_period_days) : "N/A" },
          ];
          



          return (
            <>
              {/* Title */}
              <div style={{
                fontSize: 20,
                fontFamily: "'Orbitron', monospace",
                fontWeight: 700,
                textAlign: "center",
                marginBottom: 4,
                letterSpacing: 3,
                color: "#ffffff",
                textTransform: "uppercase",
              }}>
                {selectedPlanet}
              </div>

              {/* Nickname */}
              <div style={{
                fontSize: 11,
                textAlign: "center",
                color: "#7aabff",
                fontStyle: "italic",
                fontFamily: "'Rajdhani', sans-serif",
                marginBottom: 4,
                letterSpacing: 0.5,
              }}>
                {data.Nickname ?? ""}
              </div>

              {/* Subtitle */}
              <div style={{
                fontSize: 10,
                textAlign: "center",
                color: "rgba(120,180,255,0.5)",
                marginBottom: 18,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: "'Orbitron', monospace",
              }}>
                {orderFromSun[selectedPlanet]}
              </div>

              {/* Divider */}
              <div style={{
                width: "100%",
                height: 1,
                background: "linear-gradient(90deg, transparent, rgba(120,180,255,0.4), transparent)",
                marginBottom: 16,
              }} />

              {/* Bullets */}
              {bullets.map(({ label, value }) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{
                    fontSize: 9,
                    color: "rgba(120,180,255,0.55)",
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    fontFamily: "'Orbitron', monospace",
                    marginBottom: 2,
                  }}>
                    {label}
                  </div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.4,
                    color: "#ddeeff",
                    fontFamily: "'Rajdhani', sans-serif",
                    letterSpacing: 0.5,
                  }}>
                    {value}
                  </div>
                </div>
              ))}
            </>
          );        })()}
      </div>

      {/* Right info tooltip */}
      <div
        ref={rightTooltipRef}
        className="tooltip-panel"
        style={{
          position: "absolute",
          opacity: 0,
          transition: "opacity 0.6s ease",
          background: "rgba(4, 8, 18, 0.88)",
          color: "#e8f0ff",
          padding: "22px 24px",
          borderRadius: 6,
          pointerEvents: "auto",
          border: "1px solid rgba(120,180,255,0.2)",
          borderTop: "1px solid rgba(120,180,255,0.5)",
          width: 230,
          maxHeight: "60vh",
          overflowY: "scroll",
          boxSizing: "border-box",
          backdropFilter: "blur(16px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(120,180,255,0.05)",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(120,180,255,0.3) transparent",
        }}
      >
        {selectedPlanet && (() => {
          const data = (celestial_bodies as Record<string, PlanetData>)[selectedPlanet];
          if (!data) return null;

          return (
            <>
              <div style={{
                fontSize: 9,
                color: "rgba(120,180,255,0.55)",
                textTransform: "uppercase",
                letterSpacing: 2,
                fontFamily: "'Orbitron', monospace",
                marginBottom: 10,
              }}>
                About
              </div>

              <div style={{
                width: "100%",
                height: 1,
                background: "linear-gradient(90deg, transparent, rgba(120,180,255,0.4), transparent)",
                marginBottom: 14,
              }} />

              <div style={{
                fontSize: 13,
                color: "#c8d8f0",
                lineHeight: 1.8,
                fontWeight: 400,
                fontFamily: "'Rajdhani', sans-serif",
                letterSpacing: 0.3,
              }}>
                {data.description ?? "No description available."}
              </div>
            </>
          );
        })()}
      </div>

      {/* Three.js mount node */}
      <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />
    </div>
  );
}


