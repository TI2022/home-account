import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonthlySummary } from '../MonthlySummary';
import { Transaction } from '@/types';

const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2024-01-15',
    type: 'income',
    amount: 300000,
    category: '給与',
    memo: '月給',
    isMock: false,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    date: '2024-01-20',
    type: 'expense',
    amount: 80000,
    category: '家賃',
    memo: '',
    isMock: false,
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
  },
  {
    id: '3',
    date: '2024-01-25',
    type: 'expense',
    amount: 50000,
    category: '食費',
    memo: '',
    isMock: false,
    created_at: '2024-01-25T00:00:00Z',
    updated_at: '2024-01-25T00:00:00Z',
  },
];

describe('MonthlySummary Component', () => {
  const defaultProps = {
    monthTransactions: mockTransactions,
    currentMonth: new Date('2024-01-15'),
    isSummaryFixed: false,
    onToggleFixed: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render monthly summary with correct calculations', () => {
    render(<MonthlySummary {...defaultProps} />);

    // 収入
    expect(screen.getByText('¥300,000')).toBeInTheDocument();
    expect(screen.getByText('収入')).toBeInTheDocument();

    // 支出 (80,000 + 50,000 = 130,000)
    expect(screen.getByText('¥130,000')).toBeInTheDocument();
    expect(screen.getByText('支出')).toBeInTheDocument();

    // 残高 (300,000 - 130,000 = 170,000)
    expect(screen.getByText('¥170,000')).toBeInTheDocument();
    expect(screen.getByText('残高')).toBeInTheDocument();

    // 月の表示
    expect(screen.getByText('2024年1月の概要')).toBeInTheDocument();
  });

  it('should show pin button when not fixed', () => {
    render(<MonthlySummary {...defaultProps} />);

    const pinButton = screen.getByLabelText('概要を下部に固定');
    expect(pinButton).toBeInTheDocument();

    fireEvent.click(pinButton);
    expect(defaultProps.onToggleFixed).toHaveBeenCalledWith(true);
  });

  it('should show close button and fixed badge when fixed', () => {
    render(<MonthlySummary {...defaultProps} isSummaryFixed={true} />);

    expect(screen.getByText('固定中')).toBeInTheDocument();
    
    const closeButton = screen.getByLabelText('概要を閉じる');
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(defaultProps.onToggleFixed).toHaveBeenCalledWith(false);
  });

  it('should display negative balance correctly', () => {
    const negativeBalanceTransactions: Transaction[] = [
      {
        id: '1',
        date: '2024-01-15',
        type: 'income',
        amount: 100000,
        category: '給与',
        memo: '',
        isMock: false,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
      {
        id: '2',
        date: '2024-01-20',
        type: 'expense',
        amount: 150000,
        category: '家賃',
        memo: '',
        isMock: false,
        created_at: '2024-01-20T00:00:00Z',
        updated_at: '2024-01-20T00:00:00Z',
      },
    ];

    render(
      <MonthlySummary 
        {...defaultProps} 
        monthTransactions={negativeBalanceTransactions}
      />
    );

    // 負の残高 (100,000 - 150,000 = -50,000)
    expect(screen.getByText('¥-50,000')).toBeInTheDocument();
    
    // 負の残高の場合、オレンジ色のスタイルが適用されることを確認
    const balanceSection = screen.getByText('¥-50,000').closest('div');
    expect(balanceSection).toHaveClass('text-orange-600');
  });

  it('should handle empty transactions', () => {
    render(<MonthlySummary {...defaultProps} monthTransactions={[]} />);

    expect(screen.getByText('¥0')).toBeInTheDocument(); // 収入
    expect(screen.getAllByText('¥0')).toHaveLength(3); // 収入、支出、残高すべて0
  });

  it('should display correct month and year', () => {
    const props = {
      ...defaultProps,
      currentMonth: new Date('2024-12-25'),
    };

    render(<MonthlySummary {...props} />);

    expect(screen.getByText('2024年12月の概要')).toBeInTheDocument();
  });

  it('should apply correct styling classes based on fixed state', () => {
    const { rerender } = render(<MonthlySummary {...defaultProps} />);

    // 通常モードではfixedクラスはない
    expect(screen.queryByText('固定中')).not.toBeInTheDocument();

    // 固定モードではfixedクラスがある
    rerender(<MonthlySummary {...defaultProps} isSummaryFixed={true} />);
    expect(screen.getByText('固定中')).toBeInTheDocument();
  });
});