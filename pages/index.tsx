import Head from 'next/head';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Container, Grid, Typography, Box, Paper, Alert, CircularProgress } from '@mui/material';
import { AppState, ProcessingMode, SwitchType, GeneratedPlates, Polygon } from '@/lib/types';
import { DEFAULTS, SWITCH_SPECS } from '@/lib/constants';
import {
  ImageUploader,
  ProcessingOptions,
  SwitchSelector,
  SizeControls,
  PlatePreview,
  ExportButtons,
} from '@/components';
import {
  loadOpenCV,
  preloadOpenCV,
  isOpenCVReady,
  isOpenCVLoading,
  loadImage,
  imageToCanvas,
  extractContour,
  simplifyPolygon,
  centerPolygon,
  getBoundingBox,
} from '@/lib/imageProcessor';
import { generateClicker, getPolygonSize } from '@/lib/plateGenerator';

const initialState: AppState = {
  imageFile: null,
  imageDataUrl: null,
  polygon: null,
  processingMode: DEFAULTS.processingMode,
  threshold: DEFAULTS.threshold,
  simplificationTolerance: DEFAULTS.simplificationTolerance,
  switchType: DEFAULTS.switchType,
  scale: DEFAULTS.scale,
  bottomThickness: DEFAULTS.bottomThickness,
  topThickness: DEFAULTS.topThickness,
  isProcessing: false,
  error: null,
};

export default function Home() {
  const [state, setState] = useState<AppState>(initialState);
  const [plates, setPlates] = useState<GeneratedPlates | null>(null);
  const [cvReady, setCvReady] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Start preloading OpenCV in background on mount
  useEffect(() => {
    preloadOpenCV();

    // Check periodically if OpenCV is ready
    const checkInterval = setInterval(() => {
      if (isOpenCVReady()) {
        setCvReady(true);
        clearInterval(checkInterval);
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, []);

  // Reprocess with OpenCV when it becomes ready (if we used fallback before)
  useEffect(() => {
    if (cvReady && usingFallback && state.imageFile) {
      // OpenCV just loaded - reprocess for better quality
      processImage();
    }
  }, [cvReady]);

  // Process image when relevant state changes
  const processImage = useCallback(async () => {
    if (!state.imageFile) return;

    updateState({ isProcessing: true, error: null });

    try {
      const img = await loadImage(state.imageFile);
      const canvas = imageToCanvas(img);

      const { polygon: contour, usedFallback } = extractContour(
        canvas,
        state.processingMode,
        state.threshold
      );

      if (!contour || contour.length < 3) {
        throw new Error('Could not extract shape from image. Try adjusting the threshold.');
      }

      setUsingFallback(usedFallback);

      // Simplify the contour
      let simplified = simplifyPolygon(contour, state.simplificationTolerance / 100);

      // Center at origin
      simplified = centerPolygon(simplified);

      // Convert pixels to mm (assume ~10 pixels per mm as base, user can scale)
      const bbox = getBoundingBox(simplified);
      const pixelsPerMm = Math.max(bbox.width, bbox.height) / 50; // Default to ~50mm max dimension
      simplified = simplified.map((p) => ({ x: p.x / pixelsPerMm, y: p.y / pixelsPerMm }));

      updateState({ polygon: simplified, isProcessing: false });
    } catch (err) {
      updateState({
        isProcessing: false,
        error: err instanceof Error ? err.message : 'Failed to process image',
      });
    }
  }, [state.imageFile, state.processingMode, state.threshold, state.simplificationTolerance, updateState]);

  // Reprocess when settings change
  useEffect(() => {
    if (state.imageFile) {
      processImage();
    }
  }, [state.imageFile, state.processingMode, state.threshold, state.simplificationTolerance, processImage]);

  // Generate plates when polygon or settings change
  useEffect(() => {
    if (!state.polygon) {
      setPlates(null);
      return;
    }

    try {
      const scaledPolygon = state.polygon.map((p) => ({
        x: p.x * state.scale,
        y: p.y * state.scale,
      }));

      const generated = generateClicker({
        polygon: scaledPolygon,
        switchType: state.switchType,
        bottomThickness: state.bottomThickness,
        topThickness: state.topThickness,
        scale: state.scale,
      });

      setPlates(generated);
    } catch (err) {
      console.error('Failed to generate plates:', err);
      setPlates(null);
    }
  }, [state.polygon, state.scale, state.switchType, state.bottomThickness, state.topThickness]);

  const handleImageSelect = useCallback((file: File, dataUrl: string) => {
    updateState({
      imageFile: file,
      imageDataUrl: dataUrl,
      polygon: null,
      error: null,
    });
  }, [updateState]);

  const polygonSize = useMemo(() => {
    if (!state.polygon) return null;
    return getPolygonSize(state.polygon);
  }, [state.polygon]);

  return (
    <>
      <Head>
        <title>Image to Clicker</title>
        <meta name="description" content="Convert images to 3D printable clicker fidget toys" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Box component="main" className="main-container">
        <Container maxWidth="xl">
          <Typography variant="h3" component="h1" gutterBottom sx={{ py: 3 }}>
            Image to Clicker
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Convert any image into a 3D-printable clicker fidget toy using keyboard switches.
          </Typography>

          {state.error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => updateState({ error: null })}>
              {state.error}
            </Alert>
          )}

          {usingFallback && state.polygon && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Using quick processing mode. Higher quality processing is loading in the background...
            </Alert>
          )}

          <Grid container spacing={3} sx={{ mt: 2 }}>
            {/* Left Panel - Controls */}
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Settings
                </Typography>

                {/* Image Upload Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    1. Upload Image
                  </Typography>
                  <ImageUploader
                    imageDataUrl={state.imageDataUrl}
                    onImageSelect={handleImageSelect}
                    disabled={state.isProcessing}
                  />
                </Box>

                {/* Processing Options */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    2. Processing Mode
                  </Typography>
                  <ProcessingOptions
                    mode={state.processingMode}
                    threshold={state.threshold}
                    simplificationTolerance={state.simplificationTolerance}
                    onModeChange={(mode) => updateState({ processingMode: mode })}
                    onThresholdChange={(value) => updateState({ threshold: value })}
                    onSimplificationChange={(value) => updateState({ simplificationTolerance: value })}
                    disabled={state.isProcessing}
                  />
                </Box>

                {/* Switch Selection */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    3. Switch Type
                  </Typography>
                  <SwitchSelector
                    value={state.switchType}
                    onChange={(switchType) => updateState({ switchType })}
                    disabled={state.isProcessing}
                  />
                </Box>

                {/* Size Controls */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    4. Size & Thickness
                  </Typography>
                  <SizeControls
                    scale={state.scale}
                    bottomThickness={state.bottomThickness}
                    topThickness={state.topThickness}
                    switchType={state.switchType}
                    polygonWidth={polygonSize?.width}
                    polygonHeight={polygonSize?.height}
                    onScaleChange={(value) => updateState({ scale: value })}
                    onBottomThicknessChange={(value) => updateState({ bottomThickness: value })}
                    onTopThicknessChange={(value) => updateState({ topThickness: value })}
                    disabled={!state.polygon || state.isProcessing}
                  />
                </Box>

                {/* Export */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    5. Export STL Files
                  </Typography>
                  <ExportButtons
                    plates={plates}
                    baseName={state.imageFile?.name.replace(/\.[^/.]+$/, '') || 'clicker'}
                    topThickness={state.topThickness}
                    disabled={!plates || state.isProcessing}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Right Panel - Preview */}
            <Grid item xs={12} md={8}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  minHeight: 500,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Preview
                </Typography>
                {state.isProcessing ? (
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <CircularProgress />
                    <Typography color="text.secondary">Processing image...</Typography>
                  </Box>
                ) : (
                  <PlatePreview
                    polygon={state.polygon}
                    plates={plates}
                    switchType={state.switchType}
                    scale={state.scale}
                    bottomThickness={state.bottomThickness}
                    topThickness={state.topThickness}
                  />
                )}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
}
