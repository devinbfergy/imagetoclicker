# Image to Clicker

A web application that converts images into 3D-printable clicker/fidget toys using keyboard switches (Cherry MX or Kailh Choc).

## What It Does

Upload any image and this app will:
1. Extract the silhouette/outline from the image
2. Generate two 3D-printable plates in that shape
3. Export STL files ready for 3D printing

When assembled with a mechanical keyboard switch between the plates, pressing the top plate actuates the switch to create a satisfying "click".

## Features

- **Two processing modes**: Alpha channel extraction or threshold-based silhouette detection
- **Two switch types**: Cherry MX (standard) or Kailh Choc (low profile)
- **Adjustable settings**: Scale, plate thickness, simplification tolerance
- **Real-time preview**: See your shape with switch position overlay
- **STL export**: Download separate top and bottom plate files

## Tech Stack

- Next.js 12 with TypeScript
- React 17
- MUI v5 (Material-UI)
- @jscad/modeling for 3D geometry
- @techstark/opencv-js for image processing
- jscad-react for 3D preview (available)

## Getting Started

### Prerequisites

- Node.js 18+ (recommended to use nvm)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd imagetoclicker

# Install dependencies
npm install
```

### Running the Development Server

```bash
# If using nvm, ensure correct Node version
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Upload an image** - Drag and drop or click to select (PNG, JPG, SVG)
2. **Choose processing mode**:
   - Alpha: Uses image transparency to define shape
   - Threshold: Converts to silhouette based on brightness
3. **Select switch type**: Cherry MX or Kailh Choc
4. **Adjust size**: Scale and plate thickness settings
5. **Export STL files**: Download bottom.stl and top.stl

## Project Structure

```
imagetoclicker/
├── components/           # React UI components
│   ├── ImageUploader.tsx
│   ├── ProcessingOptions.tsx
│   ├── SwitchSelector.tsx
│   ├── SizeControls.tsx
│   ├── PlatePreview.tsx
│   └── ExportButtons.tsx
├── lib/                  # Core logic
│   ├── imageProcessor.ts # OpenCV contour extraction
│   ├── switchGeometry.ts # Switch cavity/stem geometry
│   ├── plateGenerator.ts # JSCAD plate generation
│   ├── types.ts          # TypeScript interfaces
│   └── constants.ts      # Switch dimensions
├── pages/                # Next.js pages
│   ├── index.tsx         # Main application
│   └── _app.tsx          # App wrapper with theme
├── styles/
│   └── globals.scss
└── types/                # Type declarations
    ├── opencv.d.ts
    └── jscad-stl-serializer.d.ts
```

## Switch Dimensions

### Cherry MX
- Plate cutout: 14.0mm x 14.0mm
- Body size: 15.6mm x 15.6mm
- Minimum shape size: 20mm x 20mm
- Travel: 4mm

### Kailh Choc (Low Profile)
- Plate cutout: 13.8mm x 13.8mm
- Body size: 15.0mm x 15.0mm
- Minimum shape size: 18mm x 18mm
- Travel: 3mm

## Development Status

### Completed
- [x] Project setup with Next.js + TypeScript
- [x] Image upload with drag/drop
- [x] OpenCV.js integration for contour extraction
- [x] Both processing modes (alpha + threshold)
- [x] Switch geometry generation (MX + Choc)
- [x] Plate generation with JSCAD
- [x] All UI components
- [x] STL export functionality
- [x] 2D preview with shape and switch overlay

### Pending
- [ ] Full 3D preview with jscad-react (component available, needs integration)
- [ ] Print testing with actual switches
- [ ] Mobile responsive polish
- [ ] Example images

## License

ISC
