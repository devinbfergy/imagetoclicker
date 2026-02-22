import { Box, Button, Stack } from '@mui/material';
import { GeneratedPlates } from '@/lib/types';
import { downloadBothPlates, downloadSTL, flipTopPlateForPrinting } from '@/lib/plateGenerator';

interface ExportButtonsProps {
  plates: GeneratedPlates | null;
  baseName: string;
  topThickness: number;
  disabled?: boolean;
}

export default function ExportButtons({
  plates,
  baseName,
  topThickness,
  disabled = false,
}: ExportButtonsProps) {
  const isDisabled = disabled || !plates;

  const handleExportBottom = () => {
    if (plates) {
      downloadSTL(plates.bottom, `${baseName}_bottom.stl`);
    }
  };

  const handleExportTop = () => {
    if (plates) {
      const flippedTop = flipTopPlateForPrinting(plates.top, topThickness);
      downloadSTL(flippedTop, `${baseName}_top.stl`);
    }
  };

  const handleExportBoth = () => {
    if (plates) {
      downloadBothPlates(plates, baseName, topThickness);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          variant="outlined"
          size="small"
          onClick={handleExportBottom}
          disabled={isDisabled}
        >
          Bottom STL
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={handleExportTop}
          disabled={isDisabled}
        >
          Top STL
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleExportBoth}
          disabled={isDisabled}
        >
          Export Both
        </Button>
      </Stack>
    </Box>
  );
}
