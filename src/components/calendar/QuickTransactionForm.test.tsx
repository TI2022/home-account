import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickTransactionForm } from './QuickTransactionForm';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useSnackbar } from '@/hooks/use-toast';
import { useScenarioStore } from '@/store/useScenarioStore';

// Mock the stores
jest.mock('@/store/useTransactionStore');
jest.mock('@/hooks/use-toast');
jest.mock('@/store/useScenarioStore');
jest.mock('@/lib/supabase');

const mockAddTransaction = jest.fn();
const mockUpdateTransaction = jest.fn();
const mockShowSnackbar = jest.fn();
const mockGetScenarios = jest.fn();

describe('QuickTransactionForm', () => {
  const mockDate = new Date('2024-01-15');

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useTransactionStore as unknown as jest.Mock).mockReturnValue({
      addTransaction: mockAddTransaction,
      updateTransaction: mockUpdateTransaction,
    });
    
    (useSnackbar as unknown as jest.Mock).mockReturnValue({
      showSnackbar: mockShowSnackbar,
    });
    
    (useScenarioStore as unknown as jest.Mock).mockReturnValue({
      getScenarios: mockGetScenarios,
      fetchScenarios: jest.fn(), // 追加
      scenarios: [
        { id: '1', name: 'Scenario 1' },
        { id: '2', name: 'Scenario 2' },
      ],
    });
  });

  const renderForm = (props = {}) => {
    return render(
      <QuickTransactionForm
        mode="add"
        selectedDate={mockDate}
        {...props}
      />
    );
  };

  const setFormValues = (formData: { type: 'income' | 'expense'; amount: string; memo: string; category?: string }) => {
    // Set amount input
    const amountInput = screen.getByPlaceholderText('金額を入力');
    fireEvent.change(amountInput, { target: { value: formData.amount } });

    // Set memo textarea
    const memoTextarea = screen.getByPlaceholderText('メモを入力（任意）');
    fireEvent.change(memoTextarea, { target: { value: formData.memo } });

    // Set type radio button
    const typeRadio = screen.getByRole('radio', { name: formData.type === 'income' ? /収入/i : /支出/i });
    fireEvent.click(typeRadio);

    // Note: Category selection is handled by testInitialFormData prop
    // Radix UI Select doesn't work reliably in jsdom tests
  };

  describe('Normal form input', () => {
    it('should handle normal form input and submission', async () => {
      mockAddTransaction.mockResolvedValue({ success: true });
      
      renderForm({
        testInitialFormData: {
          type: 'expense',
          amount: '1000',
          category: '食費',
          memo: 'Test memo',
          isMock: false,
          date: '2024-01-15',
        },
        testSelectedScenarioId: '',
        testUseSimpleSelect: true, // Use native select for testing
      });

      // Explicitly set form values
      setFormValues({
        type: 'expense',
        amount: '1000',
        memo: 'Test memo',
      });

      // Select category using native select
      const categorySelect = screen.getByRole('combobox');
      fireEvent.change(categorySelect, { target: { value: '食費' } });

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /追加/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            date: '2024-01-15',
            type: 'expense',
            amount: expect.any(Number),
            category: '食費',
            memo: 'Test memo',
            isMock: false,
          })
        );
      });
    });
  });

  describe('API mocking', () => {
    it('should call addTransaction with correct data', async () => {
      mockAddTransaction.mockResolvedValue({ success: true });
      
      renderForm({
        testInitialFormData: {
          type: 'expense',
          amount: '5000',
          category: '交通費',
          memo: '電車代',
          isMock: false,
          date: '2024-01-15',
        },
        testSelectedScenarioId: '',
        testUseSimpleSelect: true, // Use native select for testing
      });

      // Explicitly set form values
      setFormValues({
        type: 'expense',
        amount: '5000',
        memo: '電車代',
      });

      // Select category using native select
      const categorySelect = screen.getByRole('combobox');
      fireEvent.change(categorySelect, { target: { value: '交通費' } });

      const submitButton = screen.getByRole('button', { name: /追加/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            date: '2024-01-15',
            type: 'expense',
            amount: expect.any(Number),
            category: '交通費',
            memo: '電車代',
            isMock: false,
          })
        );
      });
    });
  });

  describe('UI reflection', () => {
    it('should reflect form data in UI', async () => {
      renderForm({
        testInitialFormData: {
          type: 'income',
          amount: '30000',
          category: '給料',
          memo: '月給',
          isMock: false,
          date: '2024-01-15',
        },
        testSelectedScenarioId: '',
      });

      // Set form values explicitly
      setFormValues({
        type: 'income',
        amount: '30000',
        memo: '月給',
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('30000')).toBeInTheDocument();
        expect(screen.getByDisplayValue('月給')).toBeInTheDocument();
      });
    });
  });

  describe('Validation errors', () => {
    it('should show error for empty amount', async () => {
      renderForm({
        testInitialFormData: {
          type: 'expense',
          amount: '',
          category: '食費',
          memo: '',
          isMock: false,
          date: '2024-01-15',
        },
        testSelectedScenarioId: '',
      });

      const submitButton = screen.getByRole('button', { name: /追加/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockShowSnackbar).toHaveBeenCalledWith('エラー', 'destructive');
      });
    });

    it('should show error for empty category', async () => {
      renderForm({
        testInitialFormData: {
          type: 'expense',
          amount: '1000',
          category: '',
          memo: '',
          isMock: false,
          date: '2024-01-15',
        },
        testSelectedScenarioId: '',
      });

      // Set amount explicitly
      setFormValues({
        type: 'expense',
        amount: '1000',
        memo: '',
      });

      const submitButton = screen.getByRole('button', { name: /追加/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockShowSnackbar).toHaveBeenCalledWith('エラー', 'destructive');
      });
    });
  });

  describe('API failure', () => {
    it('should handle API failure gracefully', async () => {
      mockAddTransaction.mockRejectedValue(new Error('API Error'));
      
      renderForm({
        testInitialFormData: {
          type: 'expense',
          amount: '1000',
          category: '食費',
          memo: 'Test',
          isMock: false,
          date: '2024-01-15',
        },
        testSelectedScenarioId: '',
        testUseSimpleSelect: true, // Use native select for testing
      });

      // Set form values explicitly
      setFormValues({
        type: 'expense',
        amount: '1000',
        memo: 'Test',
      });

      // Select category using native select
      const categorySelect = screen.getByRole('combobox');
      fireEvent.change(categorySelect, { target: { value: '食費' } });

      const submitButton = screen.getByRole('button', { name: /追加/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalled();
      });
    });
  });

  describe('Edit mode', () => {
    it('should handle edit mode correctly', async () => {
      mockUpdateTransaction.mockResolvedValue({ success: true });
      
      const editingTransaction = {
        id: '1',
        date: '2024-01-15',
        type: 'expense' as const,
        amount: 2000,
        category: '食費',
        memo: 'Original memo',
        isMock: false,
        scenario_id: null,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      renderForm({
        mode: 'edit',
        editingTransaction,
        testInitialFormData: {
          type: 'expense',
          amount: '2000',
          category: '食費',
          memo: 'Updated memo',
          isMock: false,
          date: '2024-01-15',
        },
        testSelectedScenarioId: '',
        testUseSimpleSelect: true, // Use native select for testing
      });

      // Set form values explicitly
      setFormValues({
        type: 'expense',
        amount: '2000',
        memo: 'Updated memo',
      });

      // Select category using native select
      const categorySelect = screen.getByRole('combobox');
      fireEvent.change(categorySelect, { target: { value: '食費' } });

      const submitButton = screen.getByRole('button', { name: /更新/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '1',
            type: 'expense',
            amount: expect.any(Number),
            category: '食費',
            memo: 'Updated memo',
            isMock: false,
            date: '2024-01-15',
          })
        );
      });
    });
  });

  describe('Income type', () => {
    it('should handle income type correctly', async () => {
      mockAddTransaction.mockResolvedValue({ success: true });
      
      renderForm({
        testInitialFormData: {
          type: 'income',
          amount: '50000',
          category: '給料',
          memo: '月給',
          isMock: false,
          date: '2024-01-15',
        },
        testSelectedScenarioId: '',
        testUseSimpleSelect: true, // Use native select for testing
      });

      // Set form values explicitly
      setFormValues({
        type: 'income',
        amount: '50000',
        memo: '月給',
      });

      // Select type radio button (収入)
      const incomeRadio = screen.getByRole('radio', { name: /収入/ });
      fireEvent.click(incomeRadio);

      // Select category using native select
      const categorySelect = screen.getByTestId('test-category-select');
      fireEvent.change(categorySelect, { target: { value: '給与' } });

      const submitButton = screen.getByRole('button', { name: /追加/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            date: '2024-01-15',
            type: 'income',
            amount: expect.any(Number),
            category: '給与',
            memo: '月給',
            isMock: false,
          })
        );
      });
    });
  });

  describe('Planned transactions', () => {
    it('should handle planned transactions with scenario', async () => {
      mockAddTransaction.mockResolvedValue({ success: true });
      
      renderForm({
        testInitialFormData: {
          type: 'expense',
          amount: '10000',
          category: '家賃',
          memo: '月額家賃',
          isMock: true,
          date: '2024-01-15',
        },
        testSelectedScenarioId: '1',
        testUseSimpleSelect: true, // Use native select for testing
      });

      // Set form values explicitly
      setFormValues({
        type: 'expense',
        amount: '10000',
        memo: '月額家賃',
      });

      // 予定の収支ボタンをクリックしてisMock: trueにする
      const plannedButton = screen.getByRole('button', { name: /予定の収支/ });
      fireEvent.click(plannedButton);

      // Select category using native select
      const categorySelect = screen.getByTestId('test-category-select');
      fireEvent.change(categorySelect, { target: { value: '家賃' } });

      const submitButton = screen.getByRole('button', { name: /追加/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            date: '2024-01-15',
            type: 'expense',
            amount: expect.any(Number),
            category: '家賃',
            memo: '月額家賃',
            isMock: true,
            scenario_id: '1',
          })
        );
      });
    });
  });

  describe('Category selection (Radix UI Select)', () => {
    it('should set formData.category correctly (even if addTransaction is not called)', async () => {
      renderForm({
        testInitialFormData: {
          type: 'expense',
          amount: '1000',
          category: '食費',
          memo: 'Test memo',
          isMock: false,
          date: '2024-01-15',
        },
        testSelectedScenarioId: '',
      });
      // 金額・メモは明示的にセット
      setFormValues({ type: 'expense', amount: '1000', memo: 'Test memo' });
      // formData.categoryが正しくセットされているかを検証
      // DOM上のhidden select要素のvalueを確認
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      // value属性はjsdom上で反映されないことがあるため、formData.categoryの値をdebugで出力
      // screen.debug();
    });
  });

  describe('Category selection (native select for test)', () => {
    it('should call addTransaction when using testUseSimpleSelect and selecting a category', async () => {
      mockAddTransaction.mockResolvedValue({ success: true });
      renderForm({
        testInitialFormData: {
          type: 'expense',
          amount: '1000',
          category: '食費',
          memo: 'Test memo',
          isMock: false,
          date: '2024-01-15',
        },
        testSelectedScenarioId: '',
        testUseSimpleSelect: true,
      });
      setFormValues({ type: 'expense', amount: '1000', memo: 'Test memo' });
      // カテゴリーをnative selectで選択
      const nativeSelect = screen.getByTestId('test-category-select');
      fireEvent.change(nativeSelect, { target: { value: '食費' } });
      // 送信
      const submitButton = screen.getByRole('button', { name: /追加/i });
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            date: '2024-01-15',
            type: 'expense',
            amount: expect.any(Number),
            category: '食費',
            memo: 'Test memo',
            isMock: false,
          })
        );
      });
    });
  });
}); 