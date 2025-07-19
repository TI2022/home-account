import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from './slider';

const meta: Meta<typeof Slider> = {
  title: 'UI/Slider',
  component: Slider,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: {},
};

export const WithValue: Story = {
  args: {
    value: 50,
    min: 0,
    max: 100,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 30,
    min: 0,
    max: 100,
  },
};

export const Error: Story = {
  render: () => (
    <div>
      <Slider value={80} min={0} max={100} className="border-red-500" />
      <div className="text-red-500 text-xs mt-1">エラーが発生しています</div>
    </div>
  ),
};

export const ExtremeValues: Story = {
  args: {
    value: 1000,
    min: 0,
    max: 1000,
  },
}; 