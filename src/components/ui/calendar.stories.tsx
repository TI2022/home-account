import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar } from './calendar';

const meta: Meta<typeof Calendar> = {
  title: 'UI/Calendar',
  component: Calendar,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  args: {},
};

export const WithSelectedDate: Story = {
  args: {
    selected: new Date('2024-07-01'),
    onSelect: (date: Date) => alert(`選択: ${date.toLocaleDateString()}`),
  },
};

export const RangeSelection: Story = {
  args: {
    mode: 'range',
    selected: {
      from: new Date('2024-07-01'),
      to: new Date('2024-07-10'),
    },
  },
};

export const CustomClass: Story = {
  args: {
    className: 'bg-gray-50 rounded-xl shadow-lg',
  },
}; 