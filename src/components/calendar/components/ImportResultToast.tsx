import React from 'react';

interface ImportResult {
  success: number;
  fail: number;
  paymentDate: string;
  type: 'success' | 'fail';
  failedRows?: (Record<string, string> & { reason: string })[];
}

interface ImportResultToastProps {
  importResult: ImportResult | null;
  onClose: () => void;
}

export const ImportResultToast: React.FC<ImportResultToastProps> = ({ importResult, onClose }) => {
  if (!importResult) return null;

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[1400] px-6 py-3 rounded-lg shadow-lg border-2 flex flex-col items-start min-w-[260px] animate-fade-in-out
        ${importResult.type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}
    >
      <div className="font-bold text-base mb-1">
        楽天明細インポート{importResult.type === 'success' ? '完了' : '失敗'}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="font-bold text-green-600">成功: {importResult.success}件</span>
        <span className="font-bold text-red-600">失敗: {importResult.fail}件</span>
      </div>
      {importResult.paymentDate && (
        <div className="text-xs text-gray-500 mt-1">引き落とし日: {importResult.paymentDate}</div>
      )}
      {importResult.failedRows && importResult.failedRows.length > 0 && (
        <details className="mt-2 w-full">
          <summary className="cursor-pointer text-xs text-red-600 underline">失敗データの詳細を表示</summary>
          <div className="max-h-[70vh] overflow-y-auto mt-1 text-[10px] w-[80vw]">
            <table className="w-full border text-[10px] table-fixed">
              <thead>
                <tr>
                  {Object.keys(importResult.failedRows[0]).filter(key => key !== 'reason').map((key) => (
                    <th key={key} className="border px-1 py-0.5 bg-gray-100 break-words max-w-[5.5em] whitespace-pre-line text-[10px]">
                      {key.replace('利用店名・商品名','店名').replace('支払金額','金額').replace('利用日','日付')}
                    </th>
                  ))}
                  <th className="border px-1 py-0.5 bg-gray-100 break-words max-w-[5.5em] whitespace-pre-line text-[10px]">失敗理由</th>
                </tr>
              </thead>
              <tbody>
                {importResult.failedRows.map((row, i) => (
                  <tr key={i} className="odd:bg-red-50 even:bg-white">
                    {(() => {
                      const cells = [];
                      for (const [key, val] of Object.entries(row) as [string, string][]) {
                        if (key === 'reason') continue;
                        cells.push(
                          <td key={key} className="border px-1 py-0.5 break-words max-w-[5.5em] whitespace-pre-line text-[10px]">{val}</td>
                        );
                      }
                      return cells;
                    })()}
                    <td className="border px-1 py-0.5 break-words max-w-[5.5em] whitespace-pre-line text-[10px]">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      <button
        className="absolute top-1 right-2 text-gray-400 hover:text-gray-700 text-lg"
        onClick={onClose}
        aria-label="閉じる"
      >
        ×
      </button>
    </div>
  );
};