const jestDom = require('@testing-library/jest-dom');

// ResizeObserver polyfill for Jest/jsdom
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// IntersectionObserver polyfill for Jest/jsdom
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// MatchMedia polyfill for Jest/jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// pointer-eventsの問題を解決するためのスタイル設定
const style = document.createElement('style');
style.textContent = `
  * {
    pointer-events: auto !important;
  }
`;
document.head.appendChild(style); 