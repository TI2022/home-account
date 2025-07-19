import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Default',
    variant: 'default',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Destructive',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};

export const LongText: Story = {
  args: {
    children: 'とても長いバッジテキストが入った場合の表示確認用サンプルです',
    variant: 'default',
  },
};

export const ManyTags: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">給与</Badge>
      <Badge variant="secondary">食費</Badge>
      <Badge variant="destructive">エラー</Badge>
      <Badge variant="outline">タグ</Badge>
      <Badge variant="default">とても長いタグ名の例</Badge>
    </div>
  ),
}; 