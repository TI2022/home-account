import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { BearGuide } from '../BearGuide';

describe('BearGuide Component', () => {
  const defaultProps = {
    onClose: jest.fn(),
    dontShowNext: false,
    setDontShowNext: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly with default props', () => {
    render(<BearGuide {...defaultProps} />);
    
    expect(screen.getByText('日付をタップして記録できます！')).toBeInTheDocument();
    expect(screen.getByLabelText('ガイドを閉じる')).toBeInTheDocument();
    expect(screen.getByLabelText('次回から表示しない')).toBeInTheDocument();
    expect(screen.getByAltText('くま')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<BearGuide {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('ガイドを閉じる');
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call setDontShowNext when checkbox is toggled', () => {
    render(<BearGuide {...defaultProps} />);
    
    const checkbox = screen.getByLabelText('次回から表示しない');
    fireEvent.click(checkbox);
    
    expect(defaultProps.setDontShowNext).toHaveBeenCalledWith(true);
  });

  it('should show checkbox as checked when dontShowNext is true', () => {
    render(<BearGuide {...defaultProps} dontShowNext={true} />);
    
    const checkbox = screen.getByLabelText('次回から表示しない') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('should show checkbox as unchecked when dontShowNext is false', () => {
    render(<BearGuide {...defaultProps} dontShowNext={false} />);
    
    const checkbox = screen.getByLabelText('次回から表示しない') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('should have proper accessibility attributes', () => {
    render(<BearGuide {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('ガイドを閉じる');
    expect(closeButton).toHaveAttribute('tabIndex', '0');
    expect(closeButton).toHaveAttribute('aria-label', 'ガイドを閉じる');
    
    const checkbox = screen.getByLabelText('次回から表示しない');
    expect(checkbox).toHaveAttribute('id', 'dontShowNext');
  });

  it('should render the bear image with correct attributes', () => {
    render(<BearGuide {...defaultProps} />);
    
    const bearImage = screen.getByAltText('くま');
    expect(bearImage).toHaveAttribute('src');
    expect(bearImage).toHaveClass('w-16', 'h-16', 'drop-shadow-lg', 'my-1');
  });

  it('should render the arrow SVG', () => {
    render(<BearGuide {...defaultProps} />);
    
    const svg = screen.getByRole('img', { hidden: true }); // SVGs are often hidden from screen readers
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });
});