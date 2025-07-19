import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from './tabs';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Tabs>;

export const Basic: Story = {
  args: {
    tabs: [
      { label: 'タブ1', value: 'tab1' },
      { label: 'タブ2', value: 'tab2' },
      { label: 'タブ3', value: 'tab3' },
    ],
    value: 'tab1',
  },
};

export const ManyTabs: Story = {
  args: {
    tabs: Array.from({ length: 10 }, (_, i) => ({ label: `タブ${i+1}`, value: `tab${i+1}` })),
    value: 'tab1',
  },
};

export const Error: Story = {
  render: () => (
    <div>
      <Tabs tabs={[
        { label: 'タブ1', value: 'tab1' },
        { label: 'タブ2', value: 'tab2' },
      ]} value="tab1" className="border-red-500" />
      <div className="text-red-500 text-xs mt-1">エラーが発生しています</div>
    </div>
  ),
};

export const Empty: Story = {
  args: {
    tabs: [],
    value: '',
  },
}; 