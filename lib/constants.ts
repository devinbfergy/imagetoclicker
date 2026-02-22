import { SwitchSpec, SwitchType } from './types';

// Cherry MX switch dimensions (in mm)
// Reference: Cherry MX datasheet
export const MX_SWITCH: SwitchSpec = {
  name: 'Cherry MX',
  plateCutout: { width: 14.0, height: 14.0 },
  bodySize: { width: 15.6, height: 15.6 },
  belowPlateHeight: 18.5,
  abovePlateHeight: 6.0,
  stemCross: { width: 4.0, depth: 1.2 },
  minimumShapeSize: { width: 20.0, height: 20.0 },
  travel: 4.0,
};

// Kailh Choc (low profile) switch dimensions (in mm)
export const CHOC_SWITCH: SwitchSpec = {
  name: 'Kailh Choc',
  plateCutout: { width: 13.8, height: 13.8 },
  bodySize: { width: 15.0, height: 15.0 },
  belowPlateHeight: 8.0,
  abovePlateHeight: 3.0,
  stemCross: { width: 3.0, depth: 1.2 },
  minimumShapeSize: { width: 18.0, height: 18.0 },
  travel: 3.0,
};

export const SWITCH_SPECS: Record<SwitchType, SwitchSpec> = {
  mx: MX_SWITCH,
  choc: CHOC_SWITCH,
};

// Default values
export const DEFAULTS = {
  processingMode: 'threshold' as const,
  threshold: 128,
  simplificationTolerance: 2.0,
  switchType: 'mx' as const,
  scale: 1.0,
  bottomThickness: 3.0,
  topThickness: 2.0,
};

// 3D printing tolerances (in mm)
export const TOLERANCES = {
  // Extra clearance for switch cavity (loose fit)
  switchCavityClearance: 0.2,
  // Stem mount should be slightly smaller for snug fit
  stemMountClearance: -0.1,
};
