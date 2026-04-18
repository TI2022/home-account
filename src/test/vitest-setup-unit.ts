/**
 * jsdom には ResizeObserver が無い。Radix UI 等のレイアウト用フックで必要。
 */
class ResizeObserverPolyfill {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver =
  globalThis.ResizeObserver ?? (ResizeObserverPolyfill as unknown as typeof ResizeObserver);
