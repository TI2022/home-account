import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalendarDayCard } from './CalendarDayCard';
import { FaRegSmile, FaRegFrown, FaRegStar } from 'react-icons/fa';

const meta: Meta<typeof CalendarDayCard> = {
  title: 'Calendar/CalendarDayCard',
  component: CalendarDayCard,
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
  },
};
export default meta;

type Story = StoryObj<typeof CalendarDayCard>;

export const Default: Story = {
  args: {
    date: '2024-07-01',
    totalAmount: 12000,
    icon: <FaRegSmile />,
    tags: ['給与', 'ボーナス'],
    selected: false,
  },
};

export const Negative: Story = {
  args: {
    date: '2024-07-02',
    totalAmount: -3500,
    icon: <FaRegFrown />,
    tags: ['食費', '外食'],
    selected: false,
  },
};

export const Selected: Story = {
  args: {
    date: '2024-07-03',
    totalAmount: 0,
    icon: <FaRegStar />,
    tags: ['休日'],
    selected: true,
  },
};

export const ManyTags: Story = {
  args: {
    date: '2024-07-04',
    totalAmount: 500,
    icon: <FaRegSmile />,
    tags: ['日用品', 'ポイント', '特売', 'クーポン', 'まとめ買い'],
    selected: false,
  },
}; 