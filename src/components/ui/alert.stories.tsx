import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from './alert';

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  args: {
    children: '通常のアラート',
  },
};

export const Success: Story = {
  args: {
    children: '成功しました',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: '警告です',
    variant: 'warning',
  },
};

export const Info: Story = {
  args: {
    children: '情報メッセージ',
    variant: 'info',
  },
};

export const Error: Story = {
  args: {
    children: 'エラーが発生しました',
    variant: 'error',
  },
};

export const LongText: Story = {
  args: {
    children: 'とても長いアラートメッセージがここに表示されます。とても長いアラートメッセージがここに表示されます。',
  },
}; 