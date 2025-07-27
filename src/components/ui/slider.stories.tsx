import { Slider } from './slider';

export default {
  title: 'UI/Slider',
  component: Slider,
};

export const Default = () => <Slider defaultValue={[50]} />;

export const WithValue = () => <Slider value={[50]} />;

export const Disabled = () => <Slider value={[30]} disabled />;

export const Error = () => <Slider value={[10, 90]} />;

export const ExtremeValues = () => <Slider value={[0, 100]} min={0} max={100} />; 