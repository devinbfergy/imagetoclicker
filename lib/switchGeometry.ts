import { primitives, booleans, transforms } from '@jscad/modeling';
import type { Geom3 } from '@jscad/modeling/src/geometries/types';
import { SwitchType } from './types';
import { SWITCH_SPECS, TOLERANCES } from './constants';

const { cuboid, cylinder } = primitives;
const { subtract, union } = booleans;
const { translate } = transforms;

/**
 * Create the cavity geometry for the bottom plate
 * This is where the switch body sits
 */
export function createSwitchCavity(
  type: SwitchType,
  plateThickness: number
): Geom3 {
  const spec = SWITCH_SPECS[type];
  const clearance = TOLERANCES.switchCavityClearance;

  // Main cavity for the switch body
  // The cavity goes through the entire plate thickness plus some depth below
  const cavityWidth = spec.plateCutout.width + clearance * 2;
  const cavityHeight = spec.plateCutout.height + clearance * 2;
  const cavityDepth = plateThickness + 0.1; // Slight extra to ensure clean subtraction

  const mainCavity = cuboid({
    size: [cavityWidth, cavityHeight, cavityDepth],
    center: [0, 0, plateThickness / 2],
  });

  // Add small chamfer/relief at the top for easier switch insertion
  // This creates a slight taper at the entry point
  const reliefWidth = cavityWidth + 0.5;
  const reliefHeight = cavityHeight + 0.5;
  const reliefDepth = 0.5;

  const relief = cuboid({
    size: [reliefWidth, reliefHeight, reliefDepth],
    center: [0, 0, plateThickness - reliefDepth / 2 + 0.1],
  });

  return union(mainCavity, relief);
}

/**
 * Create the stem mount geometry for the top plate
 * This is the cruciform shape that fits into the switch stem
 */
export function createStemMount(
  type: SwitchType,
  plateThickness: number
): Geom3 {
  const spec = SWITCH_SPECS[type];
  const clearance = TOLERANCES.stemMountClearance;

  // Stem dimensions (cruciform cross pattern)
  const crossWidth = spec.stemCross.width + clearance;
  const crossDepth = spec.stemCross.depth + clearance;
  
  // Height of the stem mount that protrudes below the plate
  // This needs to engage with the switch stem
  const stemHeight = 3.5; // mm - typical engagement depth

  // Create the cruciform shape (two intersecting rectangles)
  const horizontalBar = cuboid({
    size: [crossWidth, crossDepth, stemHeight],
    center: [0, 0, -stemHeight / 2],
  });

  const verticalBar = cuboid({
    size: [crossDepth, crossWidth, stemHeight],
    center: [0, 0, -stemHeight / 2],
  });

  const cross = union(horizontalBar, verticalBar);

  // Add a small base/collar where the stem meets the plate
  // This provides a more solid connection point
  const collarDiameter = 7.0; // mm
  const collarHeight = 1.0; // mm

  const collar = cylinder({
    radius: collarDiameter / 2,
    height: collarHeight,
    center: [0, 0, -collarHeight / 2],
    segments: 32,
  });

  return union(cross, collar);
}

/**
 * Create the plate cutout hole (just the square hole, no depth)
 * Used for visualization or alternative designs
 */
export function createPlateCutout(type: SwitchType): { width: number; height: number } {
  const spec = SWITCH_SPECS[type];
  return {
    width: spec.plateCutout.width,
    height: spec.plateCutout.height,
  };
}

/**
 * Get minimum shape size required for a switch type
 */
export function getMinimumShapeSize(type: SwitchType): { width: number; height: number } {
  const spec = SWITCH_SPECS[type];
  return {
    width: spec.minimumShapeSize.width,
    height: spec.minimumShapeSize.height,
  };
}

/**
 * Get recommended plate thicknesses for a switch type
 */
export function getRecommendedThicknesses(type: SwitchType): {
  bottom: number;
  top: number;
} {
  const spec = SWITCH_SPECS[type];
  
  // Bottom plate needs to be thick enough for the switch cavity
  // but not so thick that it's unwieldy
  const bottomThickness = Math.min(spec.belowPlateHeight * 0.2, 5.0);
  
  // Top plate can be thinner since it just needs the stem mount
  const topThickness = 2.0;

  return {
    bottom: Math.max(bottomThickness, 3.0),
    top: topThickness,
  };
}

/**
 * Calculate the total assembled height of the clicker
 */
export function getAssembledHeight(
  type: SwitchType,
  bottomThickness: number,
  topThickness: number
): number {
  const spec = SWITCH_SPECS[type];
  
  // Total height = bottom plate + switch below plate + switch above plate + top plate
  return bottomThickness + spec.belowPlateHeight + spec.abovePlateHeight + topThickness;
}

/**
 * Get the gap between plates when assembled (for exploded view)
 */
export function getExplodedViewGap(type: SwitchType): number {
  const spec = SWITCH_SPECS[type];
  // Gap should be roughly the switch height for visualization
  return spec.belowPlateHeight + spec.abovePlateHeight + 5;
}

/**
 * Create visual representation of switch for preview
 * This is just for UI preview, not for printing
 */
export function createSwitchPreview(type: SwitchType): Geom3 {
  const spec = SWITCH_SPECS[type];

  // Simple box representation of the switch body
  const body = cuboid({
    size: [spec.bodySize.width, spec.bodySize.height, spec.belowPlateHeight + spec.abovePlateHeight],
    center: [0, 0, (spec.abovePlateHeight - spec.belowPlateHeight) / 2],
  });

  // Stem on top
  const stemWidth = 6;
  const stemHeight = 4;
  const stem = cuboid({
    size: [stemWidth, stemWidth, stemHeight],
    center: [0, 0, spec.abovePlateHeight + stemHeight / 2],
  });

  return union(body, stem);
}
