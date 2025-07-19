import type { Meta, StoryObj } from '@storybook/react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog';
import { Button } from './button';

const meta: Meta = {
  title: 'UI/Dialog',
  component: DialogContent,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>モーダルを開く</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>シンプルモーダル</DialogTitle>
        </DialogHeader>
        <div>これは基本的なモーダルです。</div>
      </DialogContent>
    </Dialog>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>説明付きモーダル</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>詳細モーダル</DialogTitle>
          <DialogDescription>ここに説明文が入ります。</DialogDescription>
        </DialogHeader>
        <div>内容を自由に記述できます。</div>
      </DialogContent>
    </Dialog>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>フッター付きモーダル</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>カスタムフッター</DialogTitle>
        </DialogHeader>
        <div>フッターにアクションボタンを配置できます。</div>
        <DialogFooter>
          <Button variant="secondary">キャンセル</Button>
          <Button>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}; 