// Scales real solar system distances and radii to manageable 3D scene units

// Logarithmic scaling for distance, square root scaling for radius
const DISTANCE_LOG_BASE = 1.2; // Adjust for desired spread
const DISTANCE_MULTIPLIER = 10; // Adjust for scene size
const RADIUS_MULTIPLIER = 0.25;  // Adjust for planet size
const AU_LOG_BASE = 1.2; // Adjust for desired spread
const AU_MULTIPLIER = 30; // Increased to accommodate larger sun and prevent overlap

export function scaleDistance(distanceKm) {
  // Avoid log(0) and negative values
  const scaled = Math.log(distanceKm + 1) / Math.log(DISTANCE_LOG_BASE) * DISTANCE_MULTIPLIER;
  console.log(`scaleDistance: input=${distanceKm}, output=${scaled}`);
  return scaled;
}

export function scaleDistanceAU(au) {
  // Avoid log(0) and negative values
  const safeAU = Math.max(au, 0.01); // Prevent log(0) or negative
  const scaled = Math.log(safeAU + 1) / Math.log(AU_LOG_BASE) * AU_MULTIPLIER;
  console.log(`scaleDistanceAU: input=${au}, output=${scaled}`);
  return scaled;
}

export function scaleRadius(radiusKm) {
  const scaled = Math.sqrt(radiusKm) * RADIUS_MULTIPLIER;
  console.log(`scaleRadius: input=${radiusKm}, output=${scaled}`);
  return scaled;
}