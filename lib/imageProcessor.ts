import { Point, Polygon, ProcessingMode } from './types';

// OpenCV will be loaded dynamically
let cv: typeof import('@techstark/opencv-js') | null = null;
let cvReady = false;

/**
 * Load OpenCV.js dynamically
 */
export async function loadOpenCV(): Promise<void> {
  if (cvReady && cv) return;

  try {
    const opencv = await import('@techstark/opencv-js');
    cv = opencv;
    cvReady = true;
  } catch (error) {
    console.error('Failed to load OpenCV:', error);
    throw new Error('Failed to load OpenCV. Please refresh the page.');
  }
}

/**
 * Check if OpenCV is ready
 */
export function isOpenCVReady(): boolean {
  return cvReady && cv !== null;
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
 * Extract contour from image using threshold-based detection
 */
function extractContourThreshold(
  canvas: HTMLCanvasElement,
  threshold: number
): Polygon | null {
  if (!cv) throw new Error('OpenCV not loaded');

  const src = cv.imread(canvas);
  const gray = new cv.Mat();
  const binary = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    // Convert to grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // Apply threshold
    cv.threshold(gray, binary, threshold, 255, cv.THRESH_BINARY);

    // Find contours
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    if (contours.size() === 0) {
      return null;
    }

    // Find the largest contour
    let largestIdx = 0;
    let largestArea = 0;

    for (let i = 0; i < contours.size(); i++) {
      const area = cv.contourArea(contours.get(i));
      if (area > largestArea) {
        largestArea = area;
        largestIdx = i;
      }
    }

    const largestContour = contours.get(largestIdx);
    return matToPolygon(largestContour);
  } finally {
    src.delete();
    gray.delete();
    binary.delete();
    contours.delete();
    hierarchy.delete();
  }
}

/**
 * Extract contour from image using alpha channel
 */
function extractContourAlpha(canvas: HTMLCanvasElement): Polygon | null {
  if (!cv) throw new Error('OpenCV not loaded');

  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Create a binary mask from alpha channel
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  const maskCtx = maskCanvas.getContext('2d')!;
  const maskData = maskCtx.createImageData(canvas.width, canvas.height);

  // Set pixels to white where alpha > 0, black otherwise
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    const value = alpha > 10 ? 255 : 0; // Small threshold to handle anti-aliasing
    maskData.data[i] = value;
    maskData.data[i + 1] = value;
    maskData.data[i + 2] = value;
    maskData.data[i + 3] = 255;
  }

  maskCtx.putImageData(maskData, 0, 0);

  // Now process the mask
  const src = cv.imread(maskCanvas);
  const gray = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.findContours(gray, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    if (contours.size() === 0) {
      return null;
    }

    // Find the largest contour
    let largestIdx = 0;
    let largestArea = 0;

    for (let i = 0; i < contours.size(); i++) {
      const area = cv.contourArea(contours.get(i));
      if (area > largestArea) {
        largestArea = area;
        largestIdx = i;
      }
    }

    const largestContour = contours.get(largestIdx);
    return matToPolygon(largestContour);
  } finally {
    src.delete();
    gray.delete();
    contours.delete();
    hierarchy.delete();
  }
}

/**
 * Convert OpenCV Mat contour to our Polygon type
 */
function matToPolygon(mat: import('@techstark/opencv-js').Mat): Polygon {
  const points: Point[] = [];
  const data = mat.data32S;

  for (let i = 0; i < data.length; i += 2) {
    points.push({ x: data[i], y: data[i + 1] });
  }

  return points;
}

/**
 * Simplify a polygon using Ramer-Douglas-Peucker algorithm
 * OpenCV's approxPolyDP does this for us
 */
export function simplifyPolygon(polygon: Polygon, tolerance: number): Polygon {
  if (!cv) throw new Error('OpenCV not loaded');
  if (polygon.length < 3) return polygon;

  // Convert polygon to Mat
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
 * Main function to extract contour from an image
 */
export function extractContour(
  canvas: HTMLCanvasElement,
  mode: ProcessingMode,
  threshold: number = 128
): Polygon | null {
  if (!cv) throw new Error('OpenCV not loaded');

  if (mode === 'alpha') {
    return extractContourAlpha(canvas);
  } else {
    return extractContourThreshold(canvas, threshold);
  }
}

/**
 * Get the bounding box of a polygon
 */
export function getBoundingBox(polygon: Polygon): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (polygon.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of polygon) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Center a polygon at origin (0, 0)
 */
export function centerPolygon(polygon: Polygon): Polygon {
  const bbox = getBoundingBox(polygon);
  const centerX = bbox.minX + bbox.width / 2;
  const centerY = bbox.minY + bbox.height / 2;

  return polygon.map((p) => ({
    x: p.x - centerX,
    y: p.y - centerY,
  }));
}

/**
 * Scale a polygon to fit within a target size while maintaining aspect ratio
 * Also ensures minimum size for switch fitting
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

  // Calculate scale to fit target size
  const scaleX = targetWidth / bbox.width;
  const scaleY = targetHeight / bbox.height;
  let scale = Math.min(scaleX, scaleY);

  // Ensure minimum size
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
 * Convert pixel polygon to millimeters based on DPI or manual scale
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
