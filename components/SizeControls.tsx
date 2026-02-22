import { Box, Slider, TextField, Typography, InputAdornment } from '@mui/material';
import { SwitchType } from '@/lib/types';
import { SWITCH_SPECS } from '@/lib/constants';

interface SizeControlsProps {
  scale: number;
  bottomThickness: number;
  topThickness: number;
  switchType: SwitchType;
  polygonWidth?: number;
  polygonHeight?: number;
  onScaleChange: (value: number) => void;
  onBottomThicknessChange: (value: number) => void;
  onTopThicknessChange: (value: number) => void;
  disabled?: boolean;
}

export default function SizeControls({
  scale,
  bottomThickness,
  topThickness,
  switchType,
  polygonWidth,
  polygonHeight,
  onScaleChange,
  onBottomThicknessChange,
  onTopThicknessChange,
  disabled = false,
}: SizeControlsProps) {
  const spec = SWITCH_SPECS[switchType];
  const minScale = Math.max(
    spec.minimumShapeSize.width / (polygonWidth || spec.minimumShapeSize.width),
    spec.minimumShapeSize.height / (polygonHeight || spec.minimumShapeSize.height)
  );

  const actualWidth = (polygonWidth || 0) * scale;
  const actualHeight = (polygonHeight || 0) * scale;

  return (
    <Box>
      {/* Scale */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          Scale: {scale.toFixed(2)}x
        </Typography>
        <Slider
          value={scale}
          onChange={(_, value) => onScaleChange(value as number)}
          min={Math.max(0.1, minScale)}
          max={5}
          step={0.05}
          disabled={disabled || !polygonWidth}
          size="small"
        />
        {polygonWidth && polygonHeight && (
          <Typography variant="caption" color="text.secondary" display="block">
            Output: {actualWidth.toFixed(1)} x {actualHeight.toFixed(1)} mm
          </Typography>
        )}
        {scale < minScale && (
          <Typography variant="caption" color="warning.main" display="block">
            Scale must be at least {minScale.toFixed(2)}x to fit the switch
          </Typography>
        )}
      </Box>

      {/* Thickness controls */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          label="Bottom"
          type="number"
          value={bottomThickness}
          onChange={(e) => onBottomThicknessChange(parseFloat(e.target.value) || 1)}
          size="small"
          disabled={disabled}
          InputProps={{
            endAdornment: <InputAdornment position="end">mm</InputAdornment>,
          }}
          inputProps={{
            min: 1,
            max: 10,
            step: 0.5,
          }}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Top"
          type="number"
          value={topThickness}
          onChange={(e) => onTopThicknessChange(parseFloat(e.target.value) || 1)}
          size="small"
          disabled={disabled}
          InputProps={{
            endAdornment: <InputAdornment position="end">mm</InputAdornment>,
          }}
          inputProps={{
            min: 1,
            max: 10,
            step: 0.5,
          }}
          sx={{ flex: 1 }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Bottom plate holds the switch, top plate presses it
      </Typography>
    </Box>
  );
}
