import { renderHook, act } from '@testing-library/react';
import { useBulkSelection } from '../useBulkSelection';
import { Transaction } from '@/types';

const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2024-01-15',
    type: 'expense',
    amount: 1000,
    category: '食費',
    memo: 'ランチ',
    isMock: false,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    date: '2024-01-15',
    type: 'income',
    amount: 5000,
    category: '給与',
    memo: '',
    isMock: false,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '3',
    date: '2024-01-15',
    type: 'expense',
    amount: 500,
    category: '交通費',
    memo: '',
    isMock: false,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
];

describe('useBulkSelection', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useBulkSelection());

    expect(result.current.state.isBulkSelectMode).toBe(false);
    expect(result.current.state.selectedIds).toEqual([]);
    expect(result.current.state.isConfirmDialogOpen).toBe(false);
  });

  it('should toggle bulk select mode', () => {
    const { result } = renderHook(() => useBulkSelection());

    act(() => {
      result.current.actions.toggleBulkMode();
    });

    expect(result.current.state.isBulkSelectMode).toBe(true);

    act(() => {
      result.current.actions.toggleBulkMode();
    });

    expect(result.current.state.isBulkSelectMode).toBe(false);
    expect(result.current.state.selectedIds).toEqual([]);
  });

  it('should toggle individual selection', () => {
    const { result } = renderHook(() => useBulkSelection());

    // 選択追加
    act(() => {
      result.current.actions.toggleSelection('1');
    });

    expect(result.current.state.selectedIds).toEqual(['1']);

    // さらに追加
    act(() => {
      result.current.actions.toggleSelection('2');
    });

    expect(result.current.state.selectedIds).toEqual(['1', '2']);

    // 選択解除
    act(() => {
      result.current.actions.toggleSelection('1');
    });

    expect(result.current.state.selectedIds).toEqual(['2']);
  });

  it('should select all transactions', () => {
    const { result } = renderHook(() => useBulkSelection());

    act(() => {
      result.current.actions.selectAll(mockTransactions);
    });

    expect(result.current.state.selectedIds).toEqual(['1', '2', '3']);
  });

  it('should clear selection', () => {
    const { result } = renderHook(() => useBulkSelection());

    // 先に何かを選択
    act(() => {
      result.current.actions.selectAll(mockTransactions);
      result.current.actions.setIsBulkSelectMode(true);
    });

    expect(result.current.state.selectedIds).toEqual(['1', '2', '3']);
    expect(result.current.state.isBulkSelectMode).toBe(true);

    // クリア
    act(() => {
      result.current.actions.clearSelection();
    });

    expect(result.current.state.selectedIds).toEqual([]);
    expect(result.current.state.isBulkSelectMode).toBe(false);
  });

  it('should manage confirm dialog state', () => {
    const { result } = renderHook(() => useBulkSelection());

    act(() => {
      result.current.actions.setIsConfirmDialogOpen(true);
    });

    expect(result.current.state.isConfirmDialogOpen).toBe(true);

    act(() => {
      result.current.actions.setIsConfirmDialogOpen(false);
    });

    expect(result.current.state.isConfirmDialogOpen).toBe(false);
  });

  it('should set selected IDs directly', () => {
    const { result } = renderHook(() => useBulkSelection());
    const newIds = ['1', '3'];

    act(() => {
      result.current.actions.setSelectedIds(newIds);
    });

    expect(result.current.state.selectedIds).toEqual(newIds);
  });

  it('should clear selection when exiting bulk mode', () => {
    const { result } = renderHook(() => useBulkSelection());

    // 一括選択モードにして、何かを選択
    act(() => {
      result.current.actions.setIsBulkSelectMode(true);
      result.current.actions.toggleSelection('1');
      result.current.actions.toggleSelection('2');
    });

    expect(result.current.state.isBulkSelectMode).toBe(true);
    expect(result.current.state.selectedIds).toEqual(['1', '2']);

    // toggleBulkMode で終了
    act(() => {
      result.current.actions.toggleBulkMode();
    });

    expect(result.current.state.isBulkSelectMode).toBe(false);
    expect(result.current.state.selectedIds).toEqual([]);
  });
});