import type { Meta, StoryObj } from '@storybook/react';
import { RadioGroup } from './radio-group';

const meta: Meta<typeof RadioGroup> = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  args: {
    options: [
      { value: 'option1', label: 'オプション1' },
      { value: 'option2', label: 'オプション2' },
      { value: 'option3', label: 'オプション3' },
    ],
  },
};

export const Selected: Story = {
  args: {
    options: [
      { value: 'option1', label: 'オプション1' },
      { value: 'option2', label: 'オプション2' },
      { value: 'option3', label: 'オプション3' },
    ],
    value: 'option2',
    readOnly: true,
  },
};

export const Disabled: Story = {
  args: {
    options: [
      { value: 'option1', label: 'オプション1' },
      { value: 'option2', label: 'オプション2' },
      { value: 'option3', label: 'オプション3' },
    ],
    disabled: true,
  },
};

export const Error: Story = {
  render: () => (
    <div>
      <RadioGroup options={[
        { value: 'option1', label: 'オプション1' },
        { value: 'option2', label: 'オプション2' },
        { value: 'option3', label: 'オプション3' },
      ]} className="border-red-500" />
      <div className="text-red-500 text-xs mt-1">エラーが発生しています</div>
    </div>
  ),
};

export const ManyOptions: Story = {
  args: {
    options: Array.from({ length: 10 }, (_, i) => ({ value: `opt${i+1}`, label: `オプション${i+1}` })),
  },
}; 