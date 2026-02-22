import { useEffect, useRef, useMemo } from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import { Polygon, GeneratedPlates, SwitchType } from '@/lib/types';
import { SWITCH_SPECS } from '@/lib/constants';
import { getPolygonSize } from '@/lib/plateGenerator';

interface PlatePreviewProps {
  polygon: Polygon | null;
  plates: GeneratedPlates | null;
  switchType: SwitchType;
  scale: number;
  bottomThickness: number;
  topThickness: number;
}

export default function PlatePreview({
  polygon,
  plates,
  switchType,
  scale,
  bottomThickness,
  topThickness,
}: PlatePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scaledPolygon = useMemo(() => {
    if (!polygon) return null;
    return polygon.map((p) => ({ x: p.x * scale, y: p.y * scale }));
  }, [polygon, scale]);

  const size = useMemo(() => {
    if (!scaledPolygon) return null;
    return getPolygonSize(scaledPolygon);
  }, [scaledPolygon]);

  const spec = SWITCH_SPECS[switchType];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !scaledPolygon || scaledPolygon.length < 3) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of scaledPolygon) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }

    const polyWidth = maxX - minX;
    const polyHeight = maxY - minY;
    const padding = 40;
    const availableWidth = rect.width - padding * 2;
    const availableHeight = rect.height - padding * 2;
    const viewScale = Math.min(availableWidth / polyWidth, availableHeight / polyHeight, 10);

    const offsetX = (rect.width - polyWidth * viewScale) / 2 - minX * viewScale;
    const offsetY = (rect.height - polyHeight * viewScale) / 2 - minY * viewScale;

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    const gridSize = 5 * viewScale;
    for (let x = offsetX % gridSize; x < rect.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    for (let y = offsetY % gridSize; y < rect.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    // Draw shape
    ctx.beginPath();
    ctx.moveTo(
      scaledPolygon[0].x * viewScale + offsetX,
      scaledPolygon[0].y * viewScale + offsetY
    );
    for (let i = 1; i < scaledPolygon.length; i++) {
      ctx.lineTo(
        scaledPolygon[i].x * viewScale + offsetX,
        scaledPolygon[i].y * viewScale + offsetY
      );
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(144, 202, 249, 0.3)';
    ctx.fill();
    ctx.strokeStyle = '#90caf9';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw switch outline (centered)
    const switchWidth = spec.bodySize.width * viewScale;
    const switchHeight = spec.bodySize.height * viewScale;
    const centerX = (minX + polyWidth / 2) * viewScale + offsetX;
    const centerY = (minY + polyHeight / 2) * viewScale + offsetY;

    ctx.strokeStyle = '#f48fb1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(
      centerX - switchWidth / 2,
      centerY - switchHeight / 2,
      switchWidth,
      switchHeight
    );
    ctx.setLineDash([]);

    // Draw center crosshair
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - 10, centerY);
    ctx.lineTo(centerX + 10, centerY);
    ctx.moveTo(centerX, centerY - 10);
    ctx.lineTo(centerX, centerY + 10);
    ctx.stroke();

  }, [scaledPolygon, spec]);

  if (!polygon) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          borderRadius: 1,
        }}
      >
        <Typography color="text.secondary">
          Upload an image to see the preview
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        {size && (
          <Chip
            size="small"
            label={`${size.width.toFixed(1)} x ${size.height.toFixed(1)} mm`}
            color="primary"
            variant="outlined"
          />
        )}
        <Chip
          size="small"
          label={`Bottom: ${bottomThickness}mm`}
          variant="outlined"
        />
        <Chip
          size="small"
          label={`Top: ${topThickness}mm`}
          variant="outlined"
        />
        <Chip
          size="small"
          label={spec.name}
          color="secondary"
          variant="outlined"
        />
        {plates && (
          <Chip
            size="small"
            label="Ready to export"
            color="success"
          />
        )}
      </Stack>

      <Box
        sx={{
          flex: 1,
          position: 'relative',
          bgcolor: 'background.default',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        Blue shape = plate outline | Pink dashed = switch body position | Grid = 5mm
      </Typography>
    </Box>
  );
}
