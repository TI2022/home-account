import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from './toast';
import { Button } from './button';
import { useState } from 'react';

const meta: Meta<typeof Toast> = {
  title: 'UI/Toast',
  component: Toast,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <Button onClick={() => setOpen(true)}>トースト表示</Button>
        <Toast open={open} onOpenChange={setOpen} message="通常のトースト" />
      </div>
    );
  },
};

export const Success: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <Button onClick={() => setOpen(true)}>成功トースト</Button>
        <Toast open={open} onOpenChange={setOpen} message="成功しました" type="success" />
      </div>
    );
  },
};

export const Error: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <Button onClick={() => setOpen(true)}>エラートースト</Button>
        <Toast open={open} onOpenChange={setOpen} message="エラーが発生しました" type="error" />
      </div>
    );
  },
};

export const LongText: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <Button onClick={() => setOpen(true)}>長文トースト</Button>
        <Toast open={open} onOpenChange={setOpen} message={"とても長いトーストメッセージがここに表示されます。とても長いトーストメッセージがここに表示されます。"} />
      </div>
    );
  },
}; 