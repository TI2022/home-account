import { renderHook, act } from '@testing-library/react';
import { useCalendarState } from '../useCalendarState';

describe('useCalendarState', () => {
  beforeEach(() => {
    // localStorage をクリア
    localStorage.clear();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useCalendarState());

    expect(result.current.state.selectedDate).toBeInstanceOf(Date);
    expect(result.current.state.currentMonth).toBeInstanceOf(Date);
    expect(result.current.state.isDialogOpen).toBe(false);
    expect(result.current.state.showMock).toBe(false);
    expect(result.current.state.showGuide).toBe(false);
    expect(result.current.state.dontShowNext).toBe(false);
    expect(result.current.state.isSummaryFixed).toBe(false);
  });

  it('should update selectedDate', () => {
    const { result } = renderHook(() => useCalendarState());
    const newDate = new Date('2024-02-15');

    act(() => {
      result.current.actions.setSelectedDate(newDate);
    });

    expect(result.current.state.selectedDate).toEqual(newDate);
  });

  it('should update currentMonth', () => {
    const { result } = renderHook(() => useCalendarState());
    const newMonth = new Date('2024-03-01');

    act(() => {
      result.current.actions.setCurrentMonth(newMonth);
    });

    expect(result.current.state.currentMonth).toEqual(newMonth);
  });

  it('should toggle dialog open state', () => {
    const { result } = renderHook(() => useCalendarState());

    act(() => {
      result.current.actions.setIsDialogOpen(true);
    });

    expect(result.current.state.isDialogOpen).toBe(true);

    act(() => {
      result.current.actions.setIsDialogOpen(false);
    });

    expect(result.current.state.isDialogOpen).toBe(false);
  });

  it('should handle date selection correctly', () => {
    const { result } = renderHook(() => useCalendarState());
    const testDate = new Date('2024-01-20');

    act(() => {
      result.current.actions.handleDateSelect(testDate);
    });

    expect(result.current.state.selectedDate).toEqual(testDate);
    expect(result.current.state.isDialogOpen).toBe(true);
  });

  it('should not open dialog when handleDateSelect receives null', () => {
    const { result } = renderHook(() => useCalendarState());

    act(() => {
      result.current.actions.handleDateSelect(null);
    });

    expect(result.current.state.isDialogOpen).toBe(false);
  });

  it('should handle month change correctly', () => {
    const { result } = renderHook(() => useCalendarState());
    const newMonth = new Date('2024-04-01');

    act(() => {
      result.current.actions.handleMonthChange(newMonth);
    });

    expect(result.current.state.currentMonth).toEqual(newMonth);
    expect(result.current.state.selectedDate).toEqual(newMonth);
  });

  it('should handle guide closure with localStorage update', () => {
    const { result } = renderHook(() => useCalendarState());

    // dontShowNext を true に設定
    act(() => {
      result.current.actions.setDontShowNext(true);
    });

    act(() => {
      result.current.actions.handleCloseGuide();
    });

    expect(result.current.state.showGuide).toBe(false);
    expect(localStorage.getItem('calendarGuideShown')).toBe('1');
  });

  it('should handle guide closure with localStorage removal', () => {
    const { result } = renderHook(() => useCalendarState());

    // dontShowNext を false のままにして
    act(() => {
      result.current.actions.handleCloseGuide();
    });

    expect(result.current.state.showGuide).toBe(false);
    expect(localStorage.getItem('calendarGuideShown')).toBeNull();
  });

  it('should toggle showMock state', () => {
    const { result } = renderHook(() => useCalendarState());

    act(() => {
      result.current.actions.setShowMock(true);
    });

    expect(result.current.state.showMock).toBe(true);

    act(() => {
      result.current.actions.setShowMock(false);
    });

    expect(result.current.state.showMock).toBe(false);
  });

  it('should toggle summary fixed state', () => {
    const { result } = renderHook(() => useCalendarState());

    act(() => {
      result.current.actions.setIsSummaryFixed(true);
    });

    expect(result.current.state.isSummaryFixed).toBe(true);

    act(() => {
      result.current.actions.setIsSummaryFixed(false);
    });

    expect(result.current.state.isSummaryFixed).toBe(false);
  });
});