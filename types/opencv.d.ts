// Type declarations for @techstark/opencv-js
// These are partial types for the functions we use

declare module '@techstark/opencv-js' {
  export interface Mat {
    rows: number;
    cols: number;
    data: Uint8Array;
    data32S: Int32Array;
    delete(): void;
    clone(): Mat;
    roi(rect: Rect): Mat;
    setTo(value: Scalar): void;
  }

  export interface MatVector {
    size(): number;
    get(index: number): Mat;
    delete(): void;
  }

  export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export interface Point {
    x: number;
    y: number;
  }

  export interface Scalar {
    [index: number]: number;
  }

  export interface Size {
    width: number;
    height: number;
  }

  export const CV_8UC1: number;
  export const CV_8UC3: number;
  export const CV_8UC4: number;
  export const RETR_EXTERNAL: number;
  export const RETR_LIST: number;
  export const CHAIN_APPROX_SIMPLE: number;
  export const CHAIN_APPROX_TC89_L1: number;
  export const THRESH_BINARY: number;
  export const THRESH_BINARY_INV: number;
  export const COLOR_RGBA2GRAY: number;
  export const COLOR_BGR2GRAY: number;

  export function matFromImageData(imageData: ImageData): Mat;
  export function imread(canvas: HTMLCanvasElement | HTMLImageElement): Mat;
  export function imshow(canvas: HTMLCanvasElement | string, mat: Mat): void;
  
  export function cvtColor(src: Mat, dst: Mat, code: number): void;
  export function threshold(src: Mat, dst: Mat, thresh: number, maxval: number, type: number): void;
  export function findContours(image: Mat, contours: MatVector, hierarchy: Mat, mode: number, method: number): void;
  export function approxPolyDP(curve: Mat, approxCurve: Mat, epsilon: number, closed: boolean): void;
  export function arcLength(curve: Mat, closed: boolean): number;
  export function contourArea(contour: Mat, oriented?: boolean): number;
  export function boundingRect(contour: Mat): Rect;
  export function moments(contour: Mat, binaryImage?: boolean): Moments;
  
  export function Mat(): Mat;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function Mat(rows: number, cols: number, type: number, data?: any): Mat;
  export function MatVector(): MatVector;
  export function Rect(x: number, y: number, width: number, height: number): Rect;
  export function Point(x: number, y: number): Point;
  export function Scalar(v0: number, v1?: number, v2?: number, v3?: number): Scalar;
  export function Size(width: number, height: number): Size;

  export interface Moments {
    m00: number;
    m10: number;
    m01: number;
    m20: number;
    m11: number;
    m02: number;
  }

  // Module loading
  export function onRuntimeInitialized(): void;
  export const onRuntimeInitialized: (() => void) | undefined;
}

declare global {
  interface Window {
    cv: typeof import('@techstark/opencv-js');
  }
}

export {};
