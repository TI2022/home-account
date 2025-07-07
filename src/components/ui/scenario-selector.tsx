import { useEffect, useState } from 'react';
import { useScenarioStore } from '@/store/useScenarioStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ScenarioSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const ScenarioSelector = ({ 
  value, 
  onValueChange, 
  placeholder = "シナリオを選択",
  className 
}: ScenarioSelectorProps) => {
  const { scenarios, fetchScenarios, getDefaultScenario } = useScenarioStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadScenarios = async () => {
      await fetchScenarios();
      setIsLoading(false);
    };
    loadScenarios();
  }, [fetchScenarios]);

  useEffect(() => {
    // デフォルトシナリオが設定されていて、現在選択されていない場合は自動選択
    if (!isLoading && !value && scenarios.length > 0) {
      const defaultScenario = getDefaultScenario();
      if (defaultScenario) {
        onValueChange(defaultScenario.id);
      }
    }
  }, [isLoading, value, scenarios, getDefaultScenario, onValueChange]);

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="読み込み中..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (scenarios.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="シナリオがありません" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {scenarios.map((scenario) => (
          <SelectItem key={scenario.id} value={scenario.id}>
            <div className="flex items-center gap-2">
              <span>{scenario.name}</span>
              {scenario.is_default && (
                <span className="px-1 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                  デフォルト
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}; 