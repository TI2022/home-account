import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/useAppStore';

export const MonthSelector = () => {
  const { selectedMonth, setSelectedMonth } = useAppStore();

  // Generate month options for the past 12 months
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('ja-JP', { 
        year: 'numeric', 
        month: 'long' 
      });
      options.push({ value, label });
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();
  
  // Get current month label for display
  const getCurrentMonthLabel = () => {
    const option = monthOptions.find(opt => opt.value === selectedMonth);
    return option ? option.label : monthOptions[0]?.label || '';
  };

  return (
    <div className="mb-4">
      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={getCurrentMonthLabel()}>
            {getCurrentMonthLabel()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {monthOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};