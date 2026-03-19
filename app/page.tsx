"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import celestial_bodies from "../lib/celestialData";
import { scaleDistanceAU, scaleRadius } from "../lib/scale";

type PlanetData = {
  color?: string;
  AU?: number;
  radius_km?: number;
  // Add other relevant properties as needed
};

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);

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

    // Create a pivot at the sun's position
    const mercuryPivot = new THREE.Object3D();
    mercuryPivot.position.set(0, 0, 0);
    scene.add(mercuryPivot);

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
      if (name === "Mercury") {
        // Mercury: attach to pivot, move from center, and rotate pivot
        // Calculate Mercury's orbital path direction (angle and y-variation)
        // Use the same tilt as the orbit ring
        const mercuryAngle = angle;
        const mercuryY = yVariation;
        const mercuryTiltAxis = new THREE.Vector3(-Math.sin(mercuryAngle), 0, Math.cos(mercuryAngle)).normalize();
        const mercuryTiltAngle = Math.atan2(mercuryY, orbitRadius);
        // Start at (orbitRadius, 0, 0) and rotate to match the tilted ring
        const mercuryPos = new THREE.Vector3(orbitRadius, 0, 0);
        mercuryPos.applyAxisAngle(mercuryTiltAxis, mercuryTiltAngle);
        planet.position.copy(mercuryPos);
        mercuryPivot.add(planet);
        // Set the tilt ONCE here
        mercuryPivot.setRotationFromAxisAngle(mercuryTiltAxis, mercuryTiltAngle);
        // Save for animation (only need orbitRadius for possible future use)
        mercuryPivot.userData = { orbitRadius };
      } else {
        planet.position.set(
          Math.cos(angle) * orbitRadius,
          yVariation,
          Math.sin(angle) * orbitRadius
        );
        scene.add(planet);
      }
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
    });

    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambient);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      // Mercury: rotate the pivot around the correct orbital axis
      if (mercuryPivot.userData) {
        // Only rotate around the local Y (which is the orbital normal)
        mercuryPivot.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.005); // Slowed down by 50%
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

  return <div ref={mountRef} />;
}