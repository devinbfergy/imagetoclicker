import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { SwitchType } from '@/lib/types';
import { SWITCH_SPECS } from '@/lib/constants';

interface SwitchSelectorProps {
  value: SwitchType;
  onChange: (switchType: SwitchType) => void;
  disabled?: boolean;
}

export default function SwitchSelector({
  value,
  onChange,
  disabled = false,
}: SwitchSelectorProps) {
  const handleChange = (_: React.MouseEvent<HTMLElement>, newValue: SwitchType | null) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  const selectedSpec = SWITCH_SPECS[value];

  return (
    <Box>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        fullWidth
        disabled={disabled}
        size="small"
      >
        <ToggleButton value="mx">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" fontWeight="bold">
              Cherry MX
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Standard
            </Typography>
          </Box>
        </ToggleButton>
        <ToggleButton value="choc">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" fontWeight="bold">
              Kailh Choc
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Low Profile
            </Typography>
          </Box>
        </ToggleButton>
      </ToggleButtonGroup>

      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Selected: {selectedSpec.name}
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.5 }}>
          <Typography component="li" variant="caption" color="text.secondary">
            Body: {selectedSpec.bodySize.width} x {selectedSpec.bodySize.height} mm
          </Typography>
          <Typography component="li" variant="caption" color="text.secondary">
            Travel: {selectedSpec.travel} mm
          </Typography>
          <Typography component="li" variant="caption" color="text.secondary">
            Min shape: {selectedSpec.minimumShapeSize.width} x {selectedSpec.minimumShapeSize.height} mm
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
