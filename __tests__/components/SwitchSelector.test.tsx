import { render, screen, fireEvent } from '@testing-library/react';
import SwitchSelector from '@/components/SwitchSelector';

describe('SwitchSelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('rendering', () => {
    it('displays both switch options', () => {
      render(<SwitchSelector value="mx" onChange={mockOnChange} />);

      expect(screen.getByText('Cherry MX')).toBeInTheDocument();
      expect(screen.getByText('Kailh Choc')).toBeInTheDocument();
    });

    it('shows Standard label for Cherry MX', () => {
      render(<SwitchSelector value="mx" onChange={mockOnChange} />);

      expect(screen.getByText('Standard')).toBeInTheDocument();
    });

    it('shows Low Profile label for Kailh Choc', () => {
      render(<SwitchSelector value="mx" onChange={mockOnChange} />);

      expect(screen.getByText('Low Profile')).toBeInTheDocument();
    });
  });

  describe('selection state', () => {
    it('indicates Cherry MX as selected when value is mx', () => {
      render(<SwitchSelector value="mx" onChange={mockOnChange} />);

      const mxButton = screen.getByRole('button', { name: /cherry mx/i });
      expect(mxButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('indicates Kailh Choc as selected when value is choc', () => {
      render(<SwitchSelector value="choc" onChange={mockOnChange} />);

      const chocButton = screen.getByRole('button', { name: /kailh choc/i });
      expect(chocButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('switch specs display', () => {
    it('shows Cherry MX specs when mx is selected', () => {
      render(<SwitchSelector value="mx" onChange={mockOnChange} />);

      expect(screen.getByText(/Selected: Cherry MX/)).toBeInTheDocument();
      expect(screen.getByText(/Body: 15.6 x 15.6 mm/)).toBeInTheDocument();
      expect(screen.getByText(/Travel: 4 mm/)).toBeInTheDocument();
      expect(screen.getByText(/Min shape: 20 x 20 mm/)).toBeInTheDocument();
    });

    it('shows Kailh Choc specs when choc is selected', () => {
      render(<SwitchSelector value="choc" onChange={mockOnChange} />);

      expect(screen.getByText(/Selected: Kailh Choc/)).toBeInTheDocument();
      expect(screen.getByText(/Body: 15 x 15 mm/)).toBeInTheDocument();
      expect(screen.getByText(/Travel: 3 mm/)).toBeInTheDocument();
      expect(screen.getByText(/Min shape: 18 x 18 mm/)).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onChange when clicking Kailh Choc', () => {
      render(<SwitchSelector value="mx" onChange={mockOnChange} />);

      const chocButton = screen.getByRole('button', { name: /kailh choc/i });
      fireEvent.click(chocButton);

      expect(mockOnChange).toHaveBeenCalledWith('choc');
    });

    it('calls onChange when clicking Cherry MX', () => {
      render(<SwitchSelector value="choc" onChange={mockOnChange} />);

      const mxButton = screen.getByRole('button', { name: /cherry mx/i });
      fireEvent.click(mxButton);

      expect(mockOnChange).toHaveBeenCalledWith('mx');
    });

    it('does not call onChange when clicking already selected option', () => {
      render(<SwitchSelector value="mx" onChange={mockOnChange} />);

      const mxButton = screen.getByRole('button', { name: /cherry mx/i });
      fireEvent.click(mxButton);

      // MUI ToggleButtonGroup with exclusive doesn't call onChange when same value is clicked
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('disables both buttons when disabled prop is true', () => {
      render(<SwitchSelector value="mx" onChange={mockOnChange} disabled />);

      const mxButton = screen.getByRole('button', { name: /cherry mx/i });
      const chocButton = screen.getByRole('button', { name: /kailh choc/i });

      expect(mxButton).toBeDisabled();
      expect(chocButton).toBeDisabled();
    });

    it('does not call onChange when disabled', () => {
      render(<SwitchSelector value="mx" onChange={mockOnChange} disabled />);

      const chocButton = screen.getByRole('button', { name: /kailh choc/i });
      fireEvent.click(chocButton);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });
});
