export interface Point {
  x: number;
  y: number;
}

export type Polygon = Point[];

export type SwitchType = 'mx' | 'choc';

export type ProcessingMode = 'alpha' | 'threshold';

export interface SwitchSpec {
  name: string;
  plateCutout: { width: number; height: number };
  bodySize: { width: number; height: number };
  belowPlateHeight: number;
  abovePlateHeight: number;
  stemCross: { width: number; depth: number };
  minimumShapeSize: { width: number; height: number };
  travel: number;
}

export interface ProcessingConfig {
  mode: ProcessingMode;
  threshold: number;
  simplificationTolerance: number;
  invertThreshold: boolean;
}

export interface PlateConfig {
  polygon: Polygon;
  switchType: SwitchType;
  bottomThickness: number;
  topThickness: number;
  scale: number;
}

// Using 'any' for JSCAD geometry types to avoid complex type conflicts with @jscad/modeling
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface GeneratedPlates {
  bottom: any; // Geom3 from @jscad/modeling
  top: any;    // Geom3 from @jscad/modeling
}

export interface AppState {
  imageFile: File | null;
  imageDataUrl: string | null;
  polygon: Polygon | null;
  processingMode: ProcessingMode;
  threshold: number;
  simplificationTolerance: number;
  invertThreshold: boolean;
  switchType: SwitchType;
  scale: number;
  bottomThickness: number;
  topThickness: number;
  isProcessing: boolean;
  error: string | null;
}
