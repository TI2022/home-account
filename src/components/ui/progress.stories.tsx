import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from './progress';

const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Progress>;

export const Zero: Story = {
  args: {
    value: 0,
  },
};

export const Half: Story = {
  args: {
    value: 50,
  },
};

export const Full: Story = {
  args: {
    value: 100,
  },
};

export const WithLabel: Story = {
  render: () => (
    <div>
      <div className="mb-1 text-xs">進捗: 75%</div>
      <Progress value={75} />
    </div>
  ),
};

export const Error: Story = {
  render: () => (
    <div>
      <Progress value={120} className="bg-red-100" />
      <div className="text-red-500 text-xs mt-1">値が範囲外です</div>
    </div>
  ),
}; 