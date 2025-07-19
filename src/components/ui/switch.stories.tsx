import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './switch';

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {},
};

export const On: Story = {
  args: {
    checked: true,
    readOnly: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Error: Story = {
  render: () => (
    <div>
      <Switch className="border-red-500" />
      <div className="text-red-500 text-xs mt-1">エラーが発生しています</div>
    </div>
  ),
};

export const ManySwitches: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {[...Array(5)].map((_, i) => (
        <Switch key={i} />
      ))}
    </div>
  ),
}; 