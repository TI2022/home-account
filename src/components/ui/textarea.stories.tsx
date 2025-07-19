import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './textarea';

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: 'メモを入力',
  },
};

export const WithValue: Story = {
  args: {
    value: '初期値が入った状態',
    readOnly: true,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: '入力不可',
    disabled: true,
  },
};

export const Error: Story = {
  render: () => (
    <div>
      <Textarea defaultValue="エラー値" className="border-red-500" />
      <div className="text-red-500 text-xs mt-1">エラーが発生しています</div>
    </div>
  ),
};

export const LongText: Story = {
  args: {
    value: 'とても長いテキストが入力された場合の表示確認用サンプルです。とても長いテキストが入力された場合の表示確認用サンプルです。',
    readOnly: true,
    rows: 5,
  },
}; 