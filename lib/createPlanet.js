import * as THREE from "three";
import { scaleDistance, scaleRadius } from "./scale";
import celestial_bodies from "./celestialData";

/**
 * Creates a planet mesh and its orbit ring.
 * @param {Object} planetData - Data for the planet (radius_km, color, distance_from_sun_km, etc.)
 * @returns {THREE.Group} - Group containing the planet mesh and orbit ring
 */
export function createPlanet(planetData) {
  const group = new THREE.Group();

  // Scale radius and distance
  const radius = scaleRadius(planetData.radius_km);
  const distance = scaleDistance(planetData.distance_from_sun_km);
  if (isNaN(distance) || typeof distance !== "number") {
    console.error(`createPlanet: Invalid distance for ${planetData.Name}:`, distance);
    return group;
  }

  // Create planet mesh
  const geometry = new THREE.SphereGeometry(radius, 48, 48);
  const material = new THREE.MeshStandardMaterial({ color: planetData.color });
  const planet = new THREE.Mesh(geometry, material);
  planet.position.set(distance, 0, 0);
  group.add(planet);

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
  group.add(orbitRing);

  return group;
}

/**
 * Creates a planet mesh and its orbit ring by planet name.
 * @param {string} planetName - Name of the planet (e.g. "Earth")
 * @returns {THREE.Group|null} - Group containing the planet mesh and orbit ring, or null if not found
 */
export function createPlanetByName(planetName) {
  const planetData = celestial_bodies[planetName];
  if (!planetData) return null;
  return createPlanet(planetData);
}