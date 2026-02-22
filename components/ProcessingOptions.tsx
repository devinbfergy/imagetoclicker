import {
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Slider,
  Switch,
  Typography,
} from '@mui/material';
import { ProcessingMode } from '@/lib/types';

interface ProcessingOptionsProps {
  mode: ProcessingMode;
  threshold: number;
  simplificationTolerance: number;
  invertThreshold: boolean;
  onModeChange: (mode: ProcessingMode) => void;
  onThresholdChange: (value: number) => void;
  onSimplificationChange: (value: number) => void;
  onInvertChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function ProcessingOptions({
  mode,
  threshold,
  simplificationTolerance,
  invertThreshold,
  onModeChange,
  onThresholdChange,
  onSimplificationChange,
  onInvertChange,
  disabled = false,
}: ProcessingOptionsProps) {
  return (
    <Box>
      <FormControl component="fieldset" disabled={disabled}>
        <RadioGroup
          value={mode}
          onChange={(e) => onModeChange(e.target.value as ProcessingMode)}
        >
          <FormControlLabel
            value="alpha"
            control={<Radio size="small" />}
            label={
              <Box>
                <Typography variant="body2">Alpha Channel</Typography>
                <Typography variant="caption" color="text.secondary">
                  Use image transparency to define shape
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            value="threshold"
            control={<Radio size="small" />}
            label={
              <Box>
                <Typography variant="body2">Threshold</Typography>
                <Typography variant="caption" color="text.secondary">
                  Convert to silhouette using brightness
                </Typography>
              </Box>
            }
          />
        </RadioGroup>
      </FormControl>

      {mode === 'threshold' && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Threshold: {threshold}
          </Typography>
          <Slider
            value={threshold}
            onChange={(_, value) => onThresholdChange(value as number)}
            min={0}
            max={255}
            step={1}
            disabled={disabled}
            size="small"
          />
          <FormControlLabel
            control={
              <Switch
                checked={invertThreshold}
                onChange={(e) => onInvertChange(e.target.checked)}
                disabled={disabled}
                size="small"
              />
            }
            label={
              <Box>
                <Typography variant="body2">Invert</Typography>
                <Typography variant="caption" color="text.secondary">
                  Use for bright logos on dark backgrounds
                </Typography>
              </Box>
            }
            sx={{ mt: 1 }}
          />
        </Box>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          Simplification: {simplificationTolerance.toFixed(1)}
        </Typography>
        <Slider
          value={simplificationTolerance}
          onChange={(_, value) => onSimplificationChange(value as number)}
          min={0.5}
          max={10}
          step={0.5}
          disabled={disabled}
          size="small"
        />
        <Typography variant="caption" color="text.secondary" display="block">
          Higher values = fewer points, smoother edges
        </Typography>
      </Box>
    </Box>
  );
}
