import { useState, useCallback } from 'react';

export interface CalendarState {
  selectedDate: Date;
  currentMonth: Date;
  isDialogOpen: boolean;
  showMock: boolean;
  showGuide: boolean;
  dontShowNext: boolean;
  isSummaryFixed: boolean;
}

export interface CalendarActions {
  setSelectedDate: (date: Date) => void;
  setCurrentMonth: (date: Date) => void;
  setIsDialogOpen: (open: boolean) => void;
  setShowMock: (show: boolean) => void;
  setShowGuide: (show: boolean) => void;
  setDontShowNext: (dontShow: boolean) => void;
  setIsSummaryFixed: (fixed: boolean) => void;
  handleDateSelect: (date: Date | null) => void;
  handleMonthChange: (date: Date) => void;
  handleCloseGuide: () => void;
}

export const useCalendarState = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showMock, setShowMock] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [dontShowNext, setDontShowNext] = useState(false);
  const [isSummaryFixed, setIsSummaryFixed] = useState(false);

  const handleDateSelect = useCallback((date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      setIsDialogOpen(true);
    }
  }, []);

  const handleMonthChange = useCallback((date: Date) => {
    setCurrentMonth(date);
    setSelectedDate(date); // カレンダーの表示月も切り替える
  }, []);

  const handleCloseGuide = useCallback(() => {
    setShowGuide(false);
    if (dontShowNext) {
      localStorage.setItem('calendarGuideShown', '1');
    } else {
      localStorage.removeItem('calendarGuideShown');
    }
  }, [dontShowNext]);

  const state: CalendarState = {
    selectedDate,
    currentMonth,
    isDialogOpen,
    showMock,
    showGuide,
    dontShowNext,
    isSummaryFixed,
  };

  const actions: CalendarActions = {
    setSelectedDate,
    setCurrentMonth,
    setIsDialogOpen,
    setShowMock,
    setShowGuide,
    setDontShowNext,
    setIsSummaryFixed,
    handleDateSelect,
    handleMonthChange,
    handleCloseGuide,
  };

  return { state, actions };
};