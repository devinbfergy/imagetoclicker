# Image to Clicker - Agent Responsibilities

This document defines the specialized agents and their responsibilities for building the image-to-clicker application.

---

## Agent 1: Project Setup Agent

**Responsibility:** Initialize the Next.js project with all required dependencies and configuration.

### Tasks
1. Create Next.js project with TypeScript
2. Install all npm dependencies
3. Configure TypeScript (tsconfig.json)
4. Set up SCSS support
5. Create initial folder structure
6. Download and set up opencv.js in public folder
7. Create basic _app.tsx and index.tsx stubs
8. Configure ESLint and Prettier

### Deliverables
- Working Next.js dev server
- All dependencies installed
- Folder structure in place
- opencv.js accessible at /opencv.js

### Commands
```bash
npx create-next-app@13.4 imagetoclicker --typescript --use-npm
cd imagetoclicker
npm install @jscad/modeling @jscad/stl-serializer jscad-react
npm install @mui/material @emotion/react @emotion/styled formik
npm install -D sass
# Download opencv.js to public/
```

---

## Agent 2: Image Processing Agent

**Responsibility:** Build the image-to-polygon pipeline using opencv.js.

### Tasks
1. Create opencv.js TypeScript declarations
2. Implement image loading from File to canvas
3. Build threshold-based silhouette extraction
4. Build alpha channel extraction
5. Implement contour tracing with cv.findContours
6. Add polygon simplification (cv.approxPolyDP)
7. Create scaling and centering utilities
8. Add unit tests for polygon operations

### Files to Create
- `lib/imageProcessor.ts`
- `lib/types.ts` (Point, Polygon, BinaryMask types)
- `types/opencv.d.ts` (TypeScript declarations)

### Key Functions
```typescript
export async function loadImage(file: File): Promise<HTMLCanvasElement>
export function extractContour(canvas: HTMLCanvasElement, mode: 'alpha' | 'threshold', threshold?: number): Point[]
export function simplifyPolygon(points: Point[], epsilon: number): Point[]
export function scaleToMinimum(points: Point[], minWidth: number, minHeight: number): Point[]
export function centerPolygon(points: Point[]): Point[]
```

### Dependencies
- opencv.js (loaded from public/)

---

## Agent 3: Switch Geometry Agent

**Responsibility:** Create accurate 3D geometry for keyboard switch mounting.

### Tasks
1. Define Cherry MX switch constants (all dimensions)
2. Define Kailh Choc switch constants (all dimensions)
3. Create switch cavity geometry for bottom plate
4. Create stem mount geometry for top plate
5. Handle tolerances for 3D printing
6. Add unit tests verifying dimensions

### Files to Create
- `lib/constants.ts`
- `lib/switchGeometry.ts`

### Key Functions
```typescript
export function createSwitchCavity(type: SwitchType): Geom3
export function createStemMount(type: SwitchType): Geom3
export function getMinimumShapeSize(type: SwitchType): { width: number; height: number }
export function getPlateCutoutSize(type: SwitchType): { width: number; height: number }
```

### JSCAD Operations Used
- `primitives.cuboid()` - rectangular shapes
- `booleans.subtract()` - cavity creation
- `booleans.union()` - combining shapes
- `transforms.translate()` - positioning

---

## Agent 4: Plate Generator Agent

**Responsibility:** Generate the final 3D plate geometry from polygon + switch geometry.

### Tasks
1. Convert Point[] polygon to JSCAD geometry
2. Implement bottom plate generation (extrude + subtract cavity)
3. Implement top plate generation (extrude + add stem mount)
4. Handle polygon centering and switch placement
5. Position plates for exploded preview view
6. Implement STL serialization for export

### Files to Create
- `lib/plateGenerator.ts`

### Key Functions
```typescript
export function polygonToGeom2(points: Point[]): Geom2
export function createBottomPlate(polygon: Point[], switchType: SwitchType, thickness: number): Geom3
export function createTopPlate(polygon: Point[], switchType: SwitchType, thickness: number): Geom3
export function generateClicker(config: PlateConfig): { bottom: Geom3; top: Geom3 }
export function exportSTL(geometry: Geom3, filename: string): void
```

### JSCAD Operations Used
- `primitives.polygon()` - create 2D shape from points
- `extrusions.extrudeLinear()` - extrude to 3D
- `booleans.subtract()` - remove cavity
- `booleans.union()` - add stem mount
- `@jscad/stl-serializer` - export

---

## Agent 5: UI Components Agent

**Responsibility:** Build all React UI components with MUI.

### Tasks
1. Create ImageUploader with drag-drop support
2. Create ProcessingOptions (alpha/threshold toggle + threshold slider)
3. Create SwitchSelector (MX/Choc radio buttons)
4. Create SizeControls (scale slider with min enforcement)
5. Create PlatePreview wrapper for jscad-react
6. Create ExportButtons for STL download
7. Create main Menu layout combining all controls
8. Style all components with SCSS

### Files to Create
- `components/ImageUploader.tsx`
- `components/ProcessingOptions.tsx`
- `components/SwitchSelector.tsx`
- `components/SizeControls.tsx`
- `components/PlatePreview.tsx`
- `components/ExportButtons.tsx`
- `components/Menu.tsx`
- `styles/components.scss`

### Component Props
```typescript
// ImageUploader
interface ImageUploaderProps {
  onImageLoad: (file: File) => void;
  disabled?: boolean;
}

// ProcessingOptions
interface ProcessingOptionsProps {
  mode: 'alpha' | 'threshold';
  threshold: number;
  onModeChange: (mode: 'alpha' | 'threshold') => void;
  onThresholdChange: (value: number) => void;
}

// SwitchSelector
interface SwitchSelectorProps {
  value: SwitchType;
  onChange: (type: SwitchType) => void;
}

// SizeControls
interface SizeControlsProps {
  scale: number;
  minScale: number;
  maxScale: number;
  onChange: (scale: number) => void;
}

// ExportButtons
interface ExportButtonsProps {
  onExportTop: () => void;
  onExportBottom: () => void;
  disabled?: boolean;
}
```

---

## Agent 6: Integration Agent

**Responsibility:** Wire everything together on the main page.

### Tasks
1. Create main page state management
2. Wire image upload to processing pipeline
3. Connect processing output to plate generator
4. Integrate 3D preview with jscad-react
5. Connect export buttons to STL serialization
6. Add loading states and error handling
7. Implement exploded view positioning
8. Final end-to-end testing

### Files to Modify
- `pages/index.tsx`
- `pages/_app.tsx`

### State Shape
```typescript
interface AppState {
  imageFile: File | null;
  polygon: Point[] | null;
  processingMode: 'alpha' | 'threshold';
  threshold: number;
  switchType: SwitchType;
  scale: number;
  bottomThickness: number;
  topThickness: number;
  isProcessing: boolean;
  error: string | null;
}
```

---

## Agent Execution Order

```
1. Project Setup Agent
   |
   v
2. Image Processing Agent  <----+
   |                            |
   v                            | (parallel)
3. Switch Geometry Agent   <----+
   |
   v
4. Plate Generator Agent (depends on 2 + 3)
   |
   v
5. UI Components Agent
   |
   v
6. Integration Agent (depends on all above)
```

Agents 2 and 3 can run in parallel since they have no dependencies on each other.

---

## Communication Between Agents

### Shared Types (lib/types.ts)
```typescript
export interface Point {
  x: number;
  y: number;
}

export type Polygon = Point[];

export type SwitchType = 'mx' | 'choc';

export interface PlateConfig {
  polygon: Polygon;
  switchType: SwitchType;
  bottomThickness: number;
  topThickness: number;
  scale: number;
}

export interface GeneratedPlates {
  bottom: Geom3;
  top: Geom3;
}
```

### Data Flow
```
File -> ImageUploader
     -> imageProcessor.extractContour() -> Polygon
     -> plateGenerator.generateClicker() -> { bottom: Geom3, top: Geom3 }
     -> PlatePreview (renders both)
     -> ExportButtons -> STL files
```

---

## Testing Responsibilities

| Agent | Test Focus |
|-------|------------|
| Image Processing | Polygon extraction accuracy, simplification |
| Switch Geometry | Dimension correctness, CSG validity |
| Plate Generator | Proper boolean operations, manifold output |
| UI Components | User interactions, form validation |
| Integration | End-to-end workflow, error states |
