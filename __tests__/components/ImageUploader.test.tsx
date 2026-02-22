import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageUploader from '@/components/ImageUploader';

describe('ImageUploader', () => {
  const mockOnImageSelect = jest.fn();

  beforeEach(() => {
    mockOnImageSelect.mockClear();
  });

  describe('initial state', () => {
    it('shows drop zone text when no image is uploaded', () => {
      render(
        <ImageUploader imageDataUrl={null} onImageSelect={mockOnImageSelect} />
      );

      expect(screen.getByText(/drag & drop an image here/i)).toBeInTheDocument();
      expect(screen.getByText(/png, jpg, svg supported/i)).toBeInTheDocument();
    });

    it('shows plus icon in empty state', () => {
      render(
        <ImageUploader imageDataUrl={null} onImageSelect={mockOnImageSelect} />
      );

      expect(screen.getByText('+')).toBeInTheDocument();
    });
  });

  describe('with uploaded image', () => {
    const mockImageUrl = 'data:image/png;base64,testdata';

    it('displays the uploaded image', () => {
      render(
        <ImageUploader
          imageDataUrl={mockImageUrl}
          onImageSelect={mockOnImageSelect}
        />
      );

      const img = screen.getByAltText('Uploaded image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', mockImageUrl);
    });

    it('shows replacement text', () => {
      render(
        <ImageUploader
          imageDataUrl={mockImageUrl}
          onImageSelect={mockOnImageSelect}
        />
      );

      expect(screen.getByText(/click or drag to replace/i)).toBeInTheDocument();
    });

    it('shows Change Image button', () => {
      render(
        <ImageUploader
          imageDataUrl={mockImageUrl}
          onImageSelect={mockOnImageSelect}
        />
      );

      expect(screen.getByRole('button', { name: /change image/i })).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('disables the hidden file input when disabled', () => {
      const { container } = render(
        <ImageUploader
          imageDataUrl={null}
          onImageSelect={mockOnImageSelect}
          disabled
        />
      );

      const input = container.querySelector('input[type="file"]');
      expect(input).toBeDisabled();
    });

    it('disables Change Image button when disabled', () => {
      render(
        <ImageUploader
          imageDataUrl="data:image/png;base64,test"
          onImageSelect={mockOnImageSelect}
          disabled
        />
      );

      expect(screen.getByRole('button', { name: /change image/i })).toBeDisabled();
    });
  });

  describe('file input', () => {
    it('has correct accept attribute', () => {
      const { container } = render(
        <ImageUploader imageDataUrl={null} onImageSelect={mockOnImageSelect} />
      );

      const input = container.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('accept', 'image/*');
    });

    it('calls onImageSelect when file is selected', async () => {
      const { container } = render(
        <ImageUploader imageDataUrl={null} onImageSelect={mockOnImageSelect} />
      );

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockOnImageSelect).toHaveBeenCalledWith(
          file,
          expect.stringContaining('data:')
        );
      });
    });

    it('ignores non-image files', async () => {
      const { container } = render(
        <ImageUploader imageDataUrl={null} onImageSelect={mockOnImageSelect} />
      );

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      // Simulate change event with non-image file
      Object.defineProperty(input, 'files', {
        value: [file],
      });
      fireEvent.change(input);

      // Should not call onImageSelect for non-image
      await waitFor(() => {
        expect(mockOnImageSelect).not.toHaveBeenCalled();
      }, { timeout: 100 });
    });
  });

  describe('drag and drop', () => {
    it('handles dragOver event', () => {
      render(
        <ImageUploader imageDataUrl={null} onImageSelect={mockOnImageSelect} />
      );

      const dropZone = screen.getByText(/drag & drop/i).closest('div');
      const dragEvent = createDragEvent('dragover');

      fireEvent(dropZone!, dragEvent);

      expect(dragEvent.preventDefault).toHaveBeenCalled();
    });

    it('handles drop event with image file', async () => {
      render(
        <ImageUploader imageDataUrl={null} onImageSelect={mockOnImageSelect} />
      );

      const dropZone = screen.getByText(/drag & drop/i).closest('div');
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      const dropEvent = createDragEvent('drop', [file]);
      fireEvent(dropZone!, dropEvent);

      await waitFor(() => {
        expect(mockOnImageSelect).toHaveBeenCalledWith(
          file,
          expect.stringContaining('data:')
        );
      });
    });
  });
});

// Helper to create drag events
function createDragEvent(type: string, files: File[] = []) {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, {
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    dataTransfer: {
      files,
      items: files.map((f) => ({ kind: 'file', getAsFile: () => f })),
      types: ['Files'],
    },
  });
  return event;
}
