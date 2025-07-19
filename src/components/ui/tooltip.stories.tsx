import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './tooltip';
import { Button } from './button';

const meta: Meta<typeof Tooltip> = {
  title: 'UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip content="ツールチップの内容">
      <Button>ホバーで表示</Button>
    </Tooltip>
  ),
};

export const LongText: Story = {
  render: () => (
    <Tooltip content="とても長いツールチップの内容がここに表示されます。とても長いツールチップの内容がここに表示されます。">
      <Button>長文ツールチップ</Button>
    </Tooltip>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Tooltip content="無効化されたボタン">
      <Button disabled>Disabled</Button>
    </Tooltip>
  ),
};

export const Error: Story = {
  render: () => (
    <Tooltip content="エラーが発生しています" className="bg-red-500 text-white">
      <Button>エラー</Button>
    </Tooltip>
  ),
}; 