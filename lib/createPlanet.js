import * as THREE from "three";
import { scaleDistance, scaleRadius } from "./scale";
import celestial_bodies from "./celestialData";

// Helper to get orbit speed based on orbital period (in days)
function getOrbitSpeed(planetData) {
  const orbitalPeriod = planetData.orbital_period_days;
  if (!orbitalPeriod || isNaN(orbitalPeriod)) return 0.001;
  const baseSpeed = 0.2;
  return baseSpeed / orbitalPeriod;
}

/**
 * Creates a planet mesh, its pivot, and orbit speed.
 * @param {Object} planetData - Data for the planet (radius_km, color, distance_from_sun_km, etc.)
 * @returns {{ mesh: THREE.Mesh, pivot: THREE.Object3D, orbitSpeed: number }} 
 */
export function createPlanet(planetData) {
  const group = new THREE.Group();

  // Scale radius and distance
  const radius = scaleRadius(planetData.radius_km);
  const distance = scaleDistance(planetData.distance_from_sun_km);
  if (isNaN(distance) || typeof distance !== "number") {
    console.error(`createPlanet: Invalid distance for ${planetData.Name}:`, distance);
    return { mesh: null, pivot: null, orbitSpeed: 0 };
  }

  // Create planet mesh
  const geometry = new THREE.SphereGeometry(radius, 48, 48);
  const material = new THREE.MeshStandardMaterial({ color: planetData.color });
  const planet = new THREE.Mesh(geometry, material);
  planet.position.set(distance, 0, 0);

  // Create orbit ring
  const orbitSegments = 128;
  const orbitGeometry = new THREE.BufferGeometry();
  const orbitVertices = [];
  for (let i = 0; i <= orbitSegments; i++) {
    const theta = (i / orbitSegments) * Math.PI * 2;
    orbitVertices.push(
      Math.cos(theta) * distance,
      0,
      Math.sin(theta) * distance
    );
  }
  orbitGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(orbitVertices, 3)
  );
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x8888ff });
  const orbitRing = new THREE.Line(orbitGeometry, orbitMaterial);

  // Create pivot and add planet and ring to it
  const pivot = new THREE.Object3D();
  pivot.add(planet);
  pivot.add(orbitRing);

  // Calculate orbit speed
  const orbitSpeed = getOrbitSpeed(planetData);

  return { mesh: planet, pivot, orbitSpeed };
}

/**
 * Creates a planet mesh, its pivot, and orbit speed by planet name.
 * @param {string} planetName - Name of the planet (e.g. "Earth")
 * @returns {{ mesh: THREE.Mesh, pivot: THREE.Object3D, orbitSpeed: number } | null}
 */
export function createPlanetByName(planetName) {
  const planetData = celestial_bodies[planetName];
  if (!planetData) return null;
  return createPlanet(planetData);
}