import { useCallback, useRef } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface ImageUploaderProps {
  imageDataUrl: string | null;
  onImageSelect: (file: File, dataUrl: string) => void;
  disabled?: boolean;
}

export default function ImageUploader({
  imageDataUrl,
  onImageSelect,
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onImageSelect(file, dataUrl);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      <Box
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleClick}
        sx={{
          border: '2px dashed',
          borderColor: disabled ? 'action.disabled' : 'divider',
          borderRadius: 2,
          p: imageDataUrl ? 2 : 4,
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'border-color 0.2s',
          '&:hover': {
            borderColor: disabled ? 'action.disabled' : 'primary.main',
          },
        }}
      >
        {imageDataUrl ? (
          <Box>
            <Box
              component="img"
              src={imageDataUrl}
              alt="Uploaded image"
              sx={{
                maxWidth: '100%',
                maxHeight: 150,
                objectFit: 'contain',
                borderRadius: 1,
                mb: 1,
              }}
            />
            <Typography variant="caption" color="text.secondary" display="block">
              Click or drag to replace
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography sx={{ fontSize: 48, mb: 1 }}>
              +
            </Typography>
            <Typography color="text.secondary">
              Drag & drop an image here, or click to select
            </Typography>
            <Typography variant="caption" color="text.secondary">
              PNG, JPG, SVG supported
            </Typography>
          </Box>
        )}
      </Box>

      {imageDataUrl && (
        <Button
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          sx={{ mt: 1 }}
          disabled={disabled}
        >
          Change Image
        </Button>
      )}
    </Box>
  );
}
