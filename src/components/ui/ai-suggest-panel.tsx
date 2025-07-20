import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './card';
import { Badge } from './badge';
import { Button } from './button';

export interface AiSuggestPanelProps {
  title?: string;
  suggestions: { label: string; value: string; icon?: React.ReactNode }[];
  onSelect?: (value: string) => void;
  loading?: boolean;
  error?: string;
  children?: React.ReactNode;
}

export const AiSuggestPanel: React.FC<AiSuggestPanelProps> = ({
  title = 'AIアシスタント',
  suggestions,
  onSelect,
  loading = false,
  error,
  children,
}) => {
  return (
    <Card className="w-full max-w-xs bg-gradient-to-b from-blue-50 to-white border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🤖 {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-blue-500 py-4">AIが提案を生成中...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">{error}</div>
        ) : suggestions.length === 0 ? (
          <div className="text-center text-gray-400 py-4">提案がありません</div>
        ) : (
          <ul className="space-y-2">
            {suggestions.map((s) => (
              <li key={s.value}>
                <Button
                  variant="secondary"
                  className="w-full flex items-center gap-2 justify-start"
                  onClick={() => onSelect?.(s.value)}
                >
                  {s.icon && <span>{s.icon}</span>}
                  <span>{s.label}</span>
                  <Badge className="ml-auto" variant="outline">AI</Badge>
                </Button>
              </li>
            ))}
          </ul>
        )}
        {children && <div className="mt-4">{children}</div>}
      </CardContent>
    </Card>
  );
};

export default AiSuggestPanel; 