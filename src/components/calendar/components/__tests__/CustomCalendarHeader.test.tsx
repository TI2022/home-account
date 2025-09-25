import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomCalendarHeader } from '../CustomCalendarHeader';

describe('CustomCalendarHeader Component', () => {
  const defaultProps = {
    currentMonth: new Date('2024-01-15'),
    onMonthChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render current month and year correctly', () => {
    render(<CustomCalendarHeader {...defaultProps} />);
    
    expect(screen.getByText('2024年')).toBeInTheDocument();
    expect(screen.getByText('1月')).toBeInTheDocument();
  });

  it('should call onMonthChange when next month button is clicked', () => {
    render(<CustomCalendarHeader {...defaultProps} />);
    
    const nextButton = screen.getByLabelText('次の月');
    fireEvent.click(nextButton);
    
    expect(defaultProps.onMonthChange).toHaveBeenCalledWith(new Date('2024-02-15'));
  });

  it('should call onMonthChange when previous month button is clicked', () => {
    render(<CustomCalendarHeader {...defaultProps} />);
    
    const prevButton = screen.getByLabelText('前の月');
    fireEvent.click(prevButton);
    
    expect(defaultProps.onMonthChange).toHaveBeenCalledWith(new Date('2023-12-15'));
  });

  it('should disable previous button when minDate is set and current month is at minimum', () => {
    const minDate = new Date('2024-01-01');
    render(<CustomCalendarHeader {...defaultProps} minDate={minDate} />);
    
    const prevButton = screen.getByLabelText('前の月');
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button when maxDate is set and current month is at maximum', () => {
    const maxDate = new Date('2024-01-31');
    render(<CustomCalendarHeader {...defaultProps} maxDate={maxDate} />);
    
    const nextButton = screen.getByLabelText('次の月');
    expect(nextButton).toBeDisabled();
  });

  it('should enable both buttons when no min/max date restrictions', () => {
    render(<CustomCalendarHeader {...defaultProps} />);
    
    const prevButton = screen.getByLabelText('前の月');
    const nextButton = screen.getByLabelText('次の月');
    
    expect(prevButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  it('should enable previous button when current month is after minDate', () => {
    const minDate = new Date('2023-12-01');
    render(<CustomCalendarHeader {...defaultProps} minDate={minDate} />);
    
    const prevButton = screen.getByLabelText('前の月');
    expect(prevButton).not.toBeDisabled();
  });

  it('should enable next button when current month is before maxDate', () => {
    const maxDate = new Date('2024-02-01');
    render(<CustomCalendarHeader {...defaultProps} maxDate={maxDate} />);
    
    const nextButton = screen.getByLabelText('次の月');
    expect(nextButton).not.toBeDisabled();
  });

  it('should have proper accessibility attributes', () => {
    render(<CustomCalendarHeader {...defaultProps} />);
    
    const prevButton = screen.getByLabelText('前の月');
    const nextButton = screen.getByLabelText('次の月');
    
    expect(prevButton).toHaveAttribute('type', 'button');
    expect(nextButton).toHaveAttribute('type', 'button');
    expect(prevButton).toHaveAttribute('aria-label', '前の月');
    expect(nextButton).toHaveAttribute('aria-label', '次の月');
  });

  it('should not call onMonthChange when disabled button is clicked', () => {
    const minDate = new Date('2024-01-01');
    render(<CustomCalendarHeader {...defaultProps} minDate={minDate} />);
    
    const prevButton = screen.getByLabelText('前の月');
    fireEvent.click(prevButton);
    
    expect(defaultProps.onMonthChange).not.toHaveBeenCalled();
  });

  it('should render with correct CSS classes', () => {
    render(<CustomCalendarHeader {...defaultProps} />);
    
    const container = screen.getByText('2024年').closest('div');
    expect(container).toHaveClass('flex', 'items-center', 'justify-center', 'py-2', 'select-none');
    
    const prevButton = screen.getByLabelText('前の月');
    const nextButton = screen.getByLabelText('次の月');
    
    expect(prevButton).toHaveClass('w-8', 'h-8', 'flex', 'items-center', 'justify-center', 'rounded-full', 'hover:bg-gray-100', 'border', 'border-gray-200', 'mr-5');
    expect(nextButton).toHaveClass('w-8', 'h-8', 'flex', 'items-center', 'justify-center', 'rounded-full', 'hover:bg-gray-100', 'border', 'border-gray-200', 'ml-5');
  });
});