import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './avatar';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Avatar>;

export const Initial: Story = {
  args: {
    children: 'A',
  },
};

export const WithImage: Story = {
  args: {
    src: 'https://randomuser.me/api/portraits/men/32.jpg',
    alt: 'ユーザー画像',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Avatar src="https://randomuser.me/api/portraits/women/44.jpg" alt="ユーザー画像" />
      <span>山田 花子</span>
    </div>
  ),
};

export const Error: Story = {
  args: {
    src: '',
    alt: '画像なし',
  },
}; 