import { useScenarioStore } from '@/store/useScenarioStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';

interface ScenarioSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ScenarioSelector = ({
  value,
  onValueChange,
  placeholder = "シナリオを選択",
  disabled = false
}: ScenarioSelectorProps) => {
  const { scenarios, fetchScenarios, getDefaultScenario } = useScenarioStore();
  const [isLoading, setIsLoading] = useState(true);

  const loadScenarios = async () => {
    try {
      setIsLoading(true);
      await fetchScenarios();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, [fetchScenarios, loadScenarios]);

  // デフォルトシナリオの自動選択
  useEffect(() => {
    if (!isLoading && !value && scenarios.length > 0) {
      const defaultScenario = getDefaultScenario();
      if (defaultScenario) {
        onValueChange(defaultScenario.id);
      }
    }
  }, [isLoading, value, scenarios, getDefaultScenario, onValueChange]);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="text-sm text-gray-500">シナリオ読み込み中...</span>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        シナリオがありません
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {scenarios.map((scenario) => (
          <SelectItem key={scenario.id} value={scenario.id}>
            {scenario.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}; 