import '@testing-library/jest-dom';

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock FileReader
class MockFileReader {
  result = null;
  onload = null;
  onerror = null;

  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:image/png;base64,mockdata';
      if (this.onload) this.onload({ target: this });
    }, 0);
  }

  readAsArrayBuffer() {
    setTimeout(() => {
      this.result = new ArrayBuffer(8);
      if (this.onload) this.onload({ target: this });
    }, 0);
  }
}

global.FileReader = MockFileReader as any;

// Mock canvas context for lightweight contour extraction
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  drawImage: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(100 * 100 * 4),
    width: 100,
    height: 100,
  })),
  putImageData: jest.fn(),
  createImageData: jest.fn((w: number, h: number) => ({
    data: new Uint8ClampedArray(w * h * 4),
    width: w,
    height: h,
  })),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
})) as any;
