import type { Meta, StoryObj } from '@storybook/react';
import { Pagination } from './pagination';

const meta: Meta<typeof Pagination> = {
  title: 'UI/Pagination',
  component: Pagination,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Pagination>;

export const Basic: Story = {
  args: {
    current: 2,
    total: 5,
  },
};

export const FirstPage: Story = {
  args: {
    current: 1,
    total: 5,
  },
};

export const LastPage: Story = {
  args: {
    current: 5,
    total: 5,
  },
};

export const SinglePage: Story = {
  args: {
    current: 1,
    total: 1,
  },
};

export const Error: Story = {
  args: {
    current: 10,
    total: 5,
  },
}; 