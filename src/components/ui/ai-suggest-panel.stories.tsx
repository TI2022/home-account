import type { Meta, StoryObj } from '@storybook/react';
import { AiSuggestPanel } from './ai-suggest-panel';
import { FaRegLightbulb, FaRegSmile, FaRegFrown } from 'react-icons/fa';

const meta: Meta<typeof AiSuggestPanel> = {
  title: 'UI/AiSuggestPanel',
  component: AiSuggestPanel,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof AiSuggestPanel>;

export const Default: Story = {
  args: {
    title: 'AIのおすすめ',
    suggestions: [
      { label: '食費をあと1,000円節約', value: 'save-food', icon: <FaRegLightbulb /> },
      { label: '今月の目標を見直す', value: 'review-goal', icon: <FaRegSmile /> },
      { label: '支出の異常値を確認', value: 'check-anomaly', icon: <FaRegFrown /> },
    ],
  },
};

export const Loading: Story = {
  args: {
    suggestions: [],
    loading: true,
  },
};

export const Error: Story = {
  args: {
    suggestions: [],
    error: 'AIサーバーに接続できません',
  },
};

export const NoSuggestions: Story = {
  args: {
    suggestions: [],
  },
}; 