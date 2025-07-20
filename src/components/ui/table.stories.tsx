import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table } from './table';

const meta: Meta<typeof Table> = {
  title: 'UI/Table',
  component: Table,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Table>;

export const Basic: Story = {
  render: () => (
    <Table>
      <thead>
        <tr>
          <th>日付</th>
          <th>カテゴリ</th>
          <th>金額</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>2024-07-01</td>
          <td>食費</td>
          <td>1,200</td>
        </tr>
        <tr>
          <td>2024-07-02</td>
          <td>交通費</td>
          <td>800</td>
        </tr>
      </tbody>
    </Table>
  ),
};

export const Empty: Story = {
  render: () => (
    <Table>
      <tbody>
        <tr>
          <td colSpan={3} className="text-center text-gray-400">データがありません</td>
        </tr>
      </tbody>
    </Table>
  ),
};

export const Error: Story = {
  render: () => (
    <Table>
      <tbody>
        <tr>
          <td colSpan={3} className="text-center text-red-500">エラーが発生しました</td>
        </tr>
      </tbody>
    </Table>
  ),
};

export const ManyRows: Story = {
  render: () => (
    <Table>
      <thead>
        <tr>
          <th>日付</th>
          <th>カテゴリ</th>
          <th>金額</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 20 }, (_, i) => (
          <tr key={i}>
            <td>2024-07-{String(i+1).padStart(2, '0')}</td>
            <td>カテゴリ{i+1}</td>
            <td>{(i+1)*100}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  ),
}; 