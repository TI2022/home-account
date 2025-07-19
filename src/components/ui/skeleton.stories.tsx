import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  render: () => <Skeleton className="w-32 h-6" />,
};

export const Multiple: Story = {
  render: () => (
    <div className="space-y-2">
      <Skeleton className="w-32 h-6" />
      <Skeleton className="w-24 h-6" />
      <Skeleton className="w-40 h-6" />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Skeleton className="w-10 h-10 rounded-full" />
      <span>ユーザー画像読み込み中...</span>
    </div>
  ),
};

export const Error: Story = {
  render: () => <Skeleton className="w-0 h-0 bg-red-200" />,
}; 