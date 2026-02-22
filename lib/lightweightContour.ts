/**
 * Lightweight contour extraction using pure canvas APIs.
 * This is a fallback when OpenCV is not yet loaded.
 * Uses marching squares algorithm for edge detection.
 */

import { Point, Polygon } from './types';

/**
 * Extract contour using alpha channel with marching squares
 */
export function extractContourLightweight(
  canvas: HTMLCanvasElement,
  mode: 'alpha' | 'threshold',
  threshold: number = 128
): Polygon | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { width, height, data } = imageData;

  // Create binary mask
  const mask = new Uint8Array(width * height);
  
  for (let i = 0; i < width * height; i++) {
    const pixelIndex = i * 4;
    if (mode === 'alpha') {
      // Use alpha channel
      mask[i] = data[pixelIndex + 3] > 10 ? 1 : 0;
    } else {
      // Use luminance threshold
      const r = data[pixelIndex];
      const g = data[pixelIndex + 1];
      const b = data[pixelIndex + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      mask[i] = luminance < threshold ? 1 : 0;
    }
  }

  // Find starting point (first non-zero pixel)
  let startX = -1;
  let startY = -1;
  
  outer: for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] === 1) {
        startX = x;
        startY = y;
        break outer;
      }
    }
  }

  if (startX === -1) return null;

  // Moore-Neighbor tracing algorithm for contour extraction
  const contour = mooreNeighborTrace(mask, width, height, startX, startY);
  
  if (contour.length < 3) return null;

  return contour;
}

/**
 * Moore-Neighbor contour tracing algorithm
 */
function mooreNeighborTrace(
  mask: Uint8Array,
  width: number,
  height: number,
  startX: number,
  startY: number
): Polygon {
  const contour: Point[] = [];
  
  // 8-connected neighborhood (clockwise from left)
  const dx = [-1, -1, 0, 1, 1, 1, 0, -1];
  const dy = [0, -1, -1, -1, 0, 1, 1, 1];

  const getMask = (x: number, y: number): number => {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    return mask[y * width + x];
  };

  let x = startX;
  let y = startY;
  let dir = 0; // Start looking left
  
  const maxIterations = width * height * 2;
  let iterations = 0;

  do {
    contour.push({ x, y });

    // Find next boundary pixel
    let found = false;
    for (let i = 0; i < 8; i++) {
      const newDir = (dir + i) % 8;
      const nx = x + dx[newDir];
      const ny = y + dy[newDir];

      if (getMask(nx, ny) === 1) {
        x = nx;
        y = ny;
        // Backtrack direction: opposite of where we came from, then go clockwise
        dir = (newDir + 5) % 8;
        found = true;
        break;
      }
    }

    if (!found) break;
    iterations++;
  } while ((x !== startX || y !== startY) && iterations < maxIterations);

  return contour;
}

/**
 * Simplify polygon using Ramer-Douglas-Peucker algorithm (pure JS)
 */
export function simplifyPolygonLightweight(polygon: Polygon, tolerance: number): Polygon {
  if (polygon.length < 3) return polygon;

  // Calculate epsilon based on polygon perimeter
  const perimeter = calculatePerimeter(polygon);
  const epsilon = tolerance * perimeter;

  return rdpSimplify(polygon, epsilon);
}

function calculatePerimeter(polygon: Polygon): number {
  let perimeter = 0;
  for (let i = 0; i < polygon.length; i++) {
    const next = (i + 1) % polygon.length;
    const dx = polygon[next].x - polygon[i].x;
    const dy = polygon[next].y - polygon[i].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  return perimeter;
}

/**
 * Ramer-Douglas-Peucker line simplification
 */
function rdpSimplify(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points;

  // Find point with max distance from line between first and last
  let maxDist = 0;
  let maxIndex = 0;

  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  // If max distance exceeds epsilon, recursively simplify
  if (maxDist > epsilon) {
    const left = rdpSimplify(points.slice(0, maxIndex + 1), epsilon);
    const right = rdpSimplify(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  // Otherwise, return just the endpoints
  return [first, last];
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  if (dx === 0 && dy === 0) {
    // Line is a point
    const pdx = point.x - lineStart.x;
    const pdy = point.y - lineStart.y;
    return Math.sqrt(pdx * pdx + pdy * pdy);
  }

  const lineLengthSquared = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, 
    ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lineLengthSquared
  ));

  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;

  const pdx = point.x - projX;
  const pdy = point.y - projY;

  return Math.sqrt(pdx * pdx + pdy * pdy);
}

/**
 * Get bounding box of polygon
 */
export function getBoundingBoxLightweight(polygon: Polygon): {
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

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Center polygon at origin
 */
export function centerPolygonLightweight(polygon: Polygon): Polygon {
  const bbox = getBoundingBoxLightweight(polygon);
  const centerX = bbox.minX + bbox.width / 2;
  const centerY = bbox.minY + bbox.height / 2;

  return polygon.map((p) => ({
    x: p.x - centerX,
    y: p.y - centerY,
  }));
}
