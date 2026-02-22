import { render, screen, fireEvent } from '@testing-library/react';
import ExportButtons from '@/components/ExportButtons';

// Mock the plateGenerator module
jest.mock('@/lib/plateGenerator', () => ({
  downloadSTL: jest.fn(),
  downloadBothPlates: jest.fn(),
  flipTopPlateForPrinting: jest.fn((plate) => plate),
}));

import { downloadSTL, downloadBothPlates } from '@/lib/plateGenerator';

describe('ExportButtons', () => {
  const mockPlates = {
    bottom: { type: 'geom3', polygons: [] },
    top: { type: 'geom3', polygons: [] },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders all three export buttons', () => {
      render(
        <ExportButtons
          plates={mockPlates}
          baseName="test"
          topThickness={2}
        />
      );

      expect(screen.getByRole('button', { name: 'Bottom STL' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Top STL' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Export Both' })).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('disables all buttons when plates is null', () => {
      render(
        <ExportButtons
          plates={null}
          baseName="test"
          topThickness={2}
        />
      );

      expect(screen.getByRole('button', { name: 'Bottom STL' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Top STL' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Export Both' })).toBeDisabled();
    });

    it('disables all buttons when disabled prop is true', () => {
      render(
        <ExportButtons
          plates={mockPlates}
          baseName="test"
          topThickness={2}
          disabled
        />
      );

      expect(screen.getByRole('button', { name: 'Bottom STL' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Top STL' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Export Both' })).toBeDisabled();
    });

    it('enables buttons when plates are provided and not disabled', () => {
      render(
        <ExportButtons
          plates={mockPlates}
          baseName="test"
          topThickness={2}
        />
      );

      expect(screen.getByRole('button', { name: 'Bottom STL' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Top STL' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Export Both' })).toBeEnabled();
    });
  });

  describe('export actions', () => {
    it('calls downloadSTL for bottom plate with correct filename', () => {
      render(
        <ExportButtons
          plates={mockPlates}
          baseName="myshape"
          topThickness={2}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Bottom STL' }));

      expect(downloadSTL).toHaveBeenCalledWith(
        mockPlates.bottom,
        'myshape_bottom.stl'
      );
    });

    it('calls downloadSTL for top plate with correct filename', () => {
      render(
        <ExportButtons
          plates={mockPlates}
          baseName="myshape"
          topThickness={2}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Top STL' }));

      expect(downloadSTL).toHaveBeenCalledWith(
        expect.anything(),
        'myshape_top.stl'
      );
    });

    it('calls downloadBothPlates with correct arguments', () => {
      render(
        <ExportButtons
          plates={mockPlates}
          baseName="myshape"
          topThickness={2.5}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Export Both' }));

      expect(downloadBothPlates).toHaveBeenCalledWith(
        mockPlates,
        'myshape',
        2.5
      );
    });

    it('does not call export functions when buttons are disabled', () => {
      render(
        <ExportButtons
          plates={null}
          baseName="test"
          topThickness={2}
        />
      );

      // Buttons are disabled, but let's try clicking anyway
      fireEvent.click(screen.getByRole('button', { name: 'Bottom STL' }));
      fireEvent.click(screen.getByRole('button', { name: 'Top STL' }));
      fireEvent.click(screen.getByRole('button', { name: 'Export Both' }));

      expect(downloadSTL).not.toHaveBeenCalled();
      expect(downloadBothPlates).not.toHaveBeenCalled();
    });
  });

  describe('button variants', () => {
    it('Bottom STL and Top STL are outlined', () => {
      render(
        <ExportButtons
          plates={mockPlates}
          baseName="test"
          topThickness={2}
        />
      );

      const bottomBtn = screen.getByRole('button', { name: 'Bottom STL' });
      const topBtn = screen.getByRole('button', { name: 'Top STL' });

      // MUI outlined buttons have the MuiButton-outlined class
      expect(bottomBtn).toHaveClass('MuiButton-outlined');
      expect(topBtn).toHaveClass('MuiButton-outlined');
    });

    it('Export Both is contained (primary)', () => {
      render(
        <ExportButtons
          plates={mockPlates}
          baseName="test"
          topThickness={2}
        />
      );

      const bothBtn = screen.getByRole('button', { name: 'Export Both' });
      expect(bothBtn).toHaveClass('MuiButton-contained');
    });
  });
});
