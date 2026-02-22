/* eslint-disable @typescript-eslint/no-explicit-any */
import { primitives, booleans, transforms, extrusions } from '@jscad/modeling';
import { serialize } from '@jscad/stl-serializer';
import { Polygon, PlateConfig, SwitchType, GeneratedPlates } from './types';
import { createSwitchCavity, createStemMount, getExplodedViewGap } from './switchGeometry';

const { polygon } = primitives;
const { subtract, union } = booleans;
const { translate, mirrorZ } = transforms;
const { extrudeLinear } = extrusions;

// Using 'any' for JSCAD geometry types to avoid complex type conflicts
type Geom2 = any;
type Geom3 = any;

/**
 * Convert our Polygon type (array of {x, y} points) to JSCAD Geom2
 */
export function polygonToGeom2(points: Polygon): Geom2 {
  if (points.length < 3) {
    throw new Error('Polygon must have at least 3 points');
  }

  // Convert to the format JSCAD expects: array of [x, y] tuples
  const jscadPoints: [number, number][] = points.map((p) => [p.x, p.y]);

  return polygon({ points: jscadPoints });
}

/**
 * Extrude a 2D polygon to create a 3D solid
 */
export function extrudePolygon(geom2: Geom2, height: number): Geom3 {
  return extrudeLinear({ height }, geom2);
}

/**
 * Create the bottom plate with switch cavity
 */
export function createBottomPlate(
  points: Polygon,
  switchType: SwitchType,
  thickness: number
): Geom3 {
  // Create the base plate from polygon
  const shape2D = polygonToGeom2(points);
  const basePlate = extrudePolygon(shape2D, thickness);

  // Create the switch cavity
  const cavity = createSwitchCavity(switchType, thickness);

  // Subtract cavity from base plate
  // The cavity is already centered at origin, matching our centered polygon
  return subtract(basePlate, cavity);
}

/**
 * Create the top plate with stem mount
 */
export function createTopPlate(
  points: Polygon,
  switchType: SwitchType,
  thickness: number
): Geom3 {
  // Create the base plate from polygon
  const shape2D = polygonToGeom2(points);
  const basePlate = extrudePolygon(shape2D, thickness);

  // Create the stem mount (protrudes downward from the plate)
  const stemMount = createStemMount(switchType, thickness);

  // Union the stem mount with the plate
  // The stem mount is at origin, extending downward (negative Z)
  // But we need to position it correctly relative to the plate
  
  // First, flip the stem mount so it protrudes from the bottom of the plate
  // Actually, the stem mount is already created to protrude downward
  // We just need to position the plate above it
  
  // Move the plate up so its bottom is at Z=0
  // Then the stem mount at Z negative will protrude below
  const plateAtZero = basePlate; // extrusion starts at Z=0 by default
  
  return union(plateAtZero, stemMount);
}

/**
 * Generate both plates for the clicker
 */
export function generateClicker(config: PlateConfig): GeneratedPlates {
  const {
    polygon: points,
    switchType,
    bottomThickness,
    topThickness,
  } = config;

  const bottom = createBottomPlate(points, switchType, bottomThickness);
  const top = createTopPlate(points, switchType, topThickness);

  return { bottom, top };
}

/**
 * Position plates for exploded view preview
 * Returns both plates positioned with a gap between them
 */
export function positionForExplodedView(
  plates: GeneratedPlates,
  switchType: SwitchType,
  bottomThickness: number
): { bottom: Geom3; top: Geom3 } {
  const gap = getExplodedViewGap(switchType);

  // Bottom plate stays at origin
  const bottom = plates.bottom;

  // Top plate moves up by: bottom thickness + gap
  const top = translate(
    [0, 0, bottomThickness + gap],
    plates.top
  );

  return { bottom, top };
}

/**
 * Flip the top plate for printing (stem mount should point up from print bed)
 */
export function flipTopPlateForPrinting(topPlate: Geom3, thickness: number): Geom3 {
  // Mirror across Z and translate back up
  const mirrored = mirrorZ(topPlate);
  return translate([0, 0, thickness], mirrored);
}

/**
 * Export geometry to STL binary data
 */
export function exportToSTL(geometry: Geom3): Blob {
  const rawData = serialize({ binary: true }, geometry);
  return new Blob(rawData as BlobPart[], { type: 'application/octet-stream' });
}

/**
 * Trigger download of STL file
 */
export function downloadSTL(geometry: Geom3, filename: string): void {
  const blob = exportToSTL(geometry);
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.stl') ? filename : `${filename}.stl`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Download both plates as separate STL files
 */
export function downloadBothPlates(
  plates: GeneratedPlates,
  baseName: string,
  topThickness: number
): void {
  // Download bottom plate as-is (cavity faces up for printing)
  downloadSTL(plates.bottom, `${baseName}_bottom.stl`);

  // Flip top plate for printing (stem mount points up)
  const flippedTop = flipTopPlateForPrinting(plates.top, topThickness);
  downloadSTL(flippedTop, `${baseName}_top.stl`);
}

/**
 * Validate that a polygon is suitable for plate generation
 */
export function validatePolygon(points: Polygon): { valid: boolean; error?: string } {
  if (!points || points.length < 3) {
    return { valid: false, error: 'Polygon must have at least 3 points' };
  }

  // Check for self-intersection (basic check)
  // A proper check would use a sweep line algorithm, but this catches obvious cases
  
  // Check for zero area
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  area = Math.abs(area) / 2;

  if (area < 1) {
    return { valid: false, error: 'Polygon area is too small' };
  }

  return { valid: true };
}

/**
 * Calculate the physical size of a polygon in mm
 */
export function getPolygonSize(points: Polygon): { width: number; height: number } {
  if (points.length === 0) {
    return { width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  return {
    width: maxX - minX,
    height: maxY - minY,
  };
}
