import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { CoinAnimation } from './coin-animation';
import { Button } from './button';

const meta: Meta<typeof CoinAnimation> = {
  title: 'UI/CoinAnimation',
  component: CoinAnimation,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof CoinAnimation>;

export const Default: Story = {
  render: () => {
    const [trigger, setTrigger] = useState(false);
    return (
      <div>
        <Button onClick={() => setTrigger(true)}>コインアニメーション再生</Button>
        <CoinAnimation trigger={trigger} onComplete={() => setTrigger(false)} />
      </div>
    );
  },
};

export const WithOnComplete: Story = {
  render: () => {
    const [trigger, setTrigger] = useState(false);
    const [message, setMessage] = useState('');
    return (
      <div>
        <Button onClick={() => { setTrigger(true); setMessage(''); }}>アニメーション再生</Button>
        <CoinAnimation trigger={trigger} onComplete={() => { setTrigger(false); setMessage('完了コールバック発火！'); }} />
        <div className="mt-2 text-green-600">{message}</div>
      </div>
    );
  },
}; 