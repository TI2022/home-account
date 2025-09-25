import React from 'react';
import bearImg from '@/assets/bear-guide.png';

export interface BearGuideProps {
  onClose: () => void;
  dontShowNext: boolean;
  setDontShowNext: (value: boolean) => void;
}

export const BearGuide: React.FC<BearGuideProps> = ({
  onClose,
  dontShowNext,
  setDontShowNext,
}) => (
  <div className="relative" data-testid="bear-guide">
    <div
      className="rounded-xl shadow-lg px-4 py-2 text-base font-bold text-brown-700 border border-yellow-200 flex flex-col items-center gap-2 min-w-[260px]"
      style={{ background: 'rgba(255,255,255,0.9)' }}
    >
      <div className="flex items-center w-full justify-between">
        <div className="flex items-center">
          <input
            id="dontShowNext"
            type="checkbox"
            checked={dontShowNext}
            onChange={e => setDontShowNext(e.target.checked)}
            className="mr-1 accent-yellow-400"
          />
          <label htmlFor="dontShowNext" className="text-xs text-gray-600 select-none">
            次回から表示しない
          </label>
        </div>
        <button
          onClick={onClose}
          className="ml-2 bg-white rounded-full border border-gray-300 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 shadow"
          aria-label="ガイドを閉じる"
          tabIndex={0}
        >
          ×
        </button>
      </div>
      <img
        src={bearImg}
        alt="くま"
        className="w-16 h-16 drop-shadow-lg my-1"
        style={{ filter: 'drop-shadow(0 2px 8px #fbbf24)' }}
      />
      <div>日付をタップして記録できます！</div>
    </div>
    <div className="flex justify-center mt-1 animate-bounce">
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path d="M12 4v14m0 0l-6-6m6 6l6-6" stroke="#fbbf24" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    </div>
  </div>
);