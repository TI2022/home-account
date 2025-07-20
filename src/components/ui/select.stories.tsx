import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './select';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    options: [
      { value: 'option1', label: 'オプション1' },
      { value: 'option2', label: 'オプション2' },
      { value: 'option3', label: 'オプション3' },
    ],
    placeholder: '選択してください',
  },
};

export const WithValue: Story = {
  args: {
    options: [
      { value: 'option1', label: 'オプション1' },
      { value: 'option2', label: 'オプション2' },
      { value: 'option3', label: 'オプション3' },
    ],
    value: 'option2',
    placeholder: '選択してください',
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
    placeholder: '選択不可',
    disabled: true,
  },
};

export const Error: Story = {
  render: () => (
    <div>
      <Select options={[
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
    options: Array.from({ length: 20 }, (_, i) => ({ value: `opt${i+1}`, label: `オプション${i+1}` })),
    placeholder: '多項目選択',
  },
}; 