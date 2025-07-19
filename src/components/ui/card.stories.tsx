import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from './button';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>カードタイトル</CardTitle>
        <CardDescription>カードの説明文です</CardDescription>
      </CardHeader>
      <CardContent>
        <div>カードの中身（任意の要素）</div>
      </CardContent>
      <CardFooter>
        <Button>アクション</Button>
      </CardFooter>
    </Card>
  ),
};

export const Empty: Story = {
  render: () => (
    <Card>
      <CardContent>
        <div className="text-gray-400 text-center py-8">データがありません</div>
      </CardContent>
    </Card>
  ),
};

export const Error: Story = {
  render: () => (
    <Card>
      <CardContent>
        <div className="text-red-500 text-center py-8">エラーが発生しました</div>
      </CardContent>
    </Card>
  ),
};

export const Loading: Story = {
  render: () => (
    <Card>
      <CardContent>
        <div className="text-blue-500 text-center py-8">読み込み中...</div>
      </CardContent>
    </Card>
  ),
}; 