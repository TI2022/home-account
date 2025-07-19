import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { FaRegSmile } from 'react-icons/fa';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Primary',
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

export const Link: Story = {
  args: {
    children: 'Link',
    variant: 'link',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost',
    variant: 'ghost',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};

export const WithIcon: Story = {
  args: {
    children: <><FaRegSmile className="mr-2" />アイコン付き</>,
    variant: 'default',
  },
};

export const LongText: Story = {
  args: {
    children: 'とても長いボタンテキストが入った場合の表示確認用サンプルです',
    variant: 'default',
  },
}; 