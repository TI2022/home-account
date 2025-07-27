import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';

export default {
  title: 'UI/Tooltip',
  component: Tooltip,
};

export const Default = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>Hover me</TooltipTrigger>
      <TooltipContent>Tooltip content</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const LongText = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>Long text</TooltipTrigger>
      <TooltipContent>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, urna eu tincidunt consectetur, nisi nisl aliquam eros, eget tincidunt.</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const Disabled = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger disabled>Disabled</TooltipTrigger>
      <TooltipContent>Disabled tooltip</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const Error = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>Error</TooltipTrigger>
      <TooltipContent>Error tooltip</TooltipContent>
    </Tooltip>
  </TooltipProvider>
); 