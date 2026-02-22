import { Point, Polygon, ProcessingMode } from './types';
import {
  extractContourLightweight,
  simplifyPolygonLightweight,
  getBoundingBoxLightweight,
  centerPolygonLightweight,
} from './lightweightContour';

// OpenCV state
let cv: any = null;
let cvReady = false;
let cvLoading = false;
let cvLoadPromise: Promise<void> | null = null;

// CDN URL for OpenCV.js (much faster than bundled)
const OPENCV_CDN_URL = 'https://docs.opencv.org/4.9.0/opencv.js';

/**
 * Check if OpenCV is ready
 */
export function isOpenCVReady(): boolean {
  return cvReady && cv !== null;
}

/**
 * Check if OpenCV is currently loading
 */
export function isOpenCVLoading(): boolean {
  return cvLoading;
}

/**
 * Load OpenCV.js from CDN (lazy, non-blocking)
 * Returns a promise that resolves when OpenCV is ready
 */
export function loadOpenCV(): Promise<void> {
  if (cvReady && cv) return Promise.resolve();
  if (cvLoadPromise) return cvLoadPromise;

  cvLoading = true;

  cvLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded (from previous page load)
    if (typeof window !== 'undefined' && (window as any).cv && (window as any).cv.Mat) {
      cv = (window as any).cv;
      cvReady = true;
      cvLoading = false;
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = OPENCV_CDN_URL;
    script.async = true;

    script.onload = () => {
      // OpenCV.js sets up cv on window, but needs to initialize
      const checkReady = () => {
        if ((window as any).cv && (window as any).cv.Mat) {
          cv = (window as any).cv;
          cvReady = true;
          cvLoading = false;
          resolve();
        } else if ((window as any).cv && (window as any).cv.onRuntimeInitialized !== undefined) {
          // Wait for WASM to initialize
          (window as any).cv.onRuntimeInitialized = () => {
            cv = (window as any).cv;
            cvReady = true;
            cvLoading = false;
            resolve();
          };
        } else {
          // Keep checking
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    };

    script.onerror = () => {
      cvLoading = false;
      reject(new Error('Failed to load OpenCV from CDN'));
    };

    document.head.appendChild(script);
  });

  return cvLoadPromise;
}

/**
 * Start loading OpenCV in background (fire and forget)
 */
export function preloadOpenCV(): void {
  if (typeof window === 'undefined') return;
  if (cvReady || cvLoading) return;
  
  // Start loading but don't wait
  loadOpenCV().catch((err) => {
    console.warn('OpenCV preload failed:', err.message);
  });
}

/**
 * Load an image file into an HTMLImageElement
 */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Convert an image element to a canvas with the image drawn on it
 */
export function imageToCanvas(
  img: HTMLImageElement,
  maxSize: number = 1024
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Scale down large images to prevent memory issues
  let width = img.width;
  let height = img.height;

  if (width > maxSize || height > maxSize) {
    const scale = maxSize / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  return canvas;
}

/**
 * Extract contour using OpenCV (high quality)
 */
function extractContourOpenCV(
  canvas: HTMLCanvasElement,
  mode: ProcessingMode,
  threshold: number
): Polygon | null {
  if (!cv) return null;

  if (mode === 'alpha') {
    return extractContourAlphaOpenCV(canvas);
  } else {
    return extractContourThresholdOpenCV(canvas, threshold);
  }
}

function extractContourThresholdOpenCV(
  canvas: HTMLCanvasElement,
  threshold: number
): Polygon | null {
  const src = cv.imread(canvas);
  const gray = new cv.Mat();
  const binary = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.threshold(gray, binary, threshold, 255, cv.THRESH_BINARY);
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    if (contours.size() === 0) return null;

    let largestIdx = 0;
    let largestArea = 0;

    for (let i = 0; i < contours.size(); i++) {
      const area = cv.contourArea(contours.get(i));
      if (area > largestArea) {
        largestArea = area;
        largestIdx = i;
      }
    }

    return matToPolygon(contours.get(largestIdx));
  } finally {
    src.delete();
    gray.delete();
    binary.delete();
    contours.delete();
    hierarchy.delete();
  }
}

function extractContourAlphaOpenCV(canvas: HTMLCanvasElement): Polygon | null {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Create binary mask from alpha
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  const maskCtx = maskCanvas.getContext('2d')!;
  const maskData = maskCtx.createImageData(canvas.width, canvas.height);

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    const value = alpha > 10 ? 255 : 0;
    maskData.data[i] = value;
    maskData.data[i + 1] = value;
    maskData.data[i + 2] = value;
    maskData.data[i + 3] = 255;
  }

  maskCtx.putImageData(maskData, 0, 0);

  const src = cv.imread(maskCanvas);
  const gray = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.findContours(gray, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    if (contours.size() === 0) return null;

    let largestIdx = 0;
    let largestArea = 0;

    for (let i = 0; i < contours.size(); i++) {
      const area = cv.contourArea(contours.get(i));
      if (area > largestArea) {
        largestArea = area;
        largestIdx = i;
      }
    }

    return matToPolygon(contours.get(largestIdx));
  } finally {
    src.delete();
    gray.delete();
    contours.delete();
    hierarchy.delete();
  }
}

function matToPolygon(mat: any): Polygon {
  const points: Point[] = [];
  const data = mat.data32S;

  for (let i = 0; i < data.length; i += 2) {
    points.push({ x: data[i], y: data[i + 1] });
  }

  return points;
}

/**
 * Simplify polygon using OpenCV (high quality)
 */
function simplifyPolygonOpenCV(polygon: Polygon, tolerance: number): Polygon {
  if (!cv || polygon.length < 3) return polygon;

  const contour = new cv.Mat(polygon.length, 1, cv.CV_32SC2);
  const data = contour.data32S;

  for (let i = 0; i < polygon.length; i++) {
    data[i * 2] = Math.round(polygon[i].x);
    data[i * 2 + 1] = Math.round(polygon[i].y);
  }

  const approx = new cv.Mat();

  try {
    const epsilon = tolerance * cv.arcLength(contour, true);
    cv.approxPolyDP(contour, approx, epsilon, true);
    return matToPolygon(approx);
  } finally {
    contour.delete();
    approx.delete();
  }
}

/**
 * Extract contour - uses OpenCV if available, otherwise lightweight fallback
 * Returns { polygon, usedFallback } to indicate which method was used
 */
export function extractContour(
  canvas: HTMLCanvasElement,
  mode: ProcessingMode,
  threshold: number = 128
): { polygon: Polygon | null; usedFallback: boolean } {
  // Try OpenCV first if available
  if (isOpenCVReady()) {
    const polygon = extractContourOpenCV(canvas, mode, threshold);
    return { polygon, usedFallback: false };
  }

  // Fall back to lightweight extraction
  const polygon = extractContourLightweight(canvas, mode, threshold);
  return { polygon, usedFallback: true };
}

/**
 * Simplify polygon - uses OpenCV if available, otherwise lightweight fallback
 */
export function simplifyPolygon(polygon: Polygon, tolerance: number): Polygon {
  if (isOpenCVReady()) {
    return simplifyPolygonOpenCV(polygon, tolerance);
  }
  return simplifyPolygonLightweight(polygon, tolerance);
}

/**
 * Get bounding box - pure JS, no OpenCV needed
 */
export function getBoundingBox(polygon: Polygon): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  return getBoundingBoxLightweight(polygon);
}

/**
 * Center polygon at origin - pure JS, no OpenCV needed
 */
export function centerPolygon(polygon: Polygon): Polygon {
  return centerPolygonLightweight(polygon);
}

/**
 * Scale a polygon to fit within a target size while maintaining aspect ratio
 */
export function scalePolygon(
  polygon: Polygon,
  targetWidth: number,
  targetHeight: number,
  minWidth: number,
  minHeight: number
): Polygon {
  const bbox = getBoundingBox(polygon);

  if (bbox.width === 0 || bbox.height === 0) {
    return polygon;
  }

  const scaleX = targetWidth / bbox.width;
  const scaleY = targetHeight / bbox.height;
  let scale = Math.min(scaleX, scaleY);

  const scaledWidth = bbox.width * scale;
  const scaledHeight = bbox.height * scale;

  if (scaledWidth < minWidth || scaledHeight < minHeight) {
    const minScaleX = minWidth / bbox.width;
    const minScaleY = minHeight / bbox.height;
    scale = Math.max(minScaleX, minScaleY);
  }

  return polygon.map((p) => ({
    x: p.x * scale,
    y: p.y * scale,
  }));
}

/**
 * Convert pixel polygon to millimeters
 */
export function pixelsToMm(polygon: Polygon, pixelsPerMm: number): Polygon {
  return polygon.map((p) => ({
    x: p.x / pixelsPerMm,
    y: p.y / pixelsPerMm,
  }));
}

/**
 * Apply a uniform scale to a polygon
 */
export function applyScale(polygon: Polygon, scale: number): Polygon {
  return polygon.map((p) => ({
    x: p.x * scale,
    y: p.y * scale,
  }));
}

/**
 * Draw a polygon to a canvas for preview
 */
export function drawPolygonPreview(
  canvas: HTMLCanvasElement,
  polygon: Polygon,
  strokeColor: string = '#00ff00',
  fillColor: string = 'rgba(0, 255, 0, 0.2)'
): void {
  const ctx = canvas.getContext('2d')!;

  if (polygon.length < 3) return;

  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);

  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i].x, polygon[i].y);
  }

  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.stroke();
}
