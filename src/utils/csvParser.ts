// 堅牢なCSVパーサー

export interface CSVParseOptions {
  delimiter?: string;
  quote?: string;
  escape?: string;
  skipEmptyLines?: boolean;
}

/**
 * より堅牢なCSV解析関数
 * ダブルクォート、カンマ、改行を適切に処理
 */
export const parseCSV = (text: string, options: CSVParseOptions = {}): string[][] => {
  const {
    delimiter = ',',
    quote = '"',
    escape = '"',
    skipEmptyLines = true
  } = options;

  const result: string[][] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    if (skipEmptyLines && !line.trim()) continue;

    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === quote) {
        if (inQuotes && nextChar === quote) {
          // エスケープされたクォート
          current += quote;
          i += 2;
        } else {
          // クォートの開始/終了
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === delimiter && !inQuotes) {
        // フィールドの終了
        row.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // 最後のフィールドを追加
    row.push(current.trim());
    result.push(row);
  }

  return result;
};

/**
 * 楽天CSVの特殊な構造を解析
 */
export const parseRakutenCSV = (text: string) => {
  console.log('楽天CSV解析開始');
  
  const rows = parseCSV(text);
  if (rows.length === 0) {
    throw new Error('CSVファイルが空です');
  }

  const header = rows[0];
  console.log('解析されたヘッダー:', header);

  // ヘッダーのインデックスを取得
  const dateIndex = header.findIndex(col => col.includes('利用日'));
  const amountIndex = header.findIndex(col => col.includes('利用金額'));
  const storeIndex = header.findIndex(col => col.includes('利用店名') || col.includes('商品名'));

  console.log('カラムインデックス:', { dateIndex, amountIndex, storeIndex });

  if (dateIndex === -1 || amountIndex === -1 || storeIndex === -1) {
    throw new Error('必要なカラムが見つかりません。楽天CSVファイルを確認してください。');
  }

  const transactions = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length <= Math.max(dateIndex, amountIndex, storeIndex)) {
      console.warn(`行${i}: カラム数不足`, row);
      continue;
    }

    let dateStr = row[dateIndex]?.trim();
    const amountStr = row[amountIndex]?.trim();
    const store = row[storeIndex]?.trim();

    // 日付形式の変換 (2025/08/31 → 2025-08-31)
    if (dateStr && dateStr.includes('/')) {
      dateStr = dateStr.replace(/\//g, '-');
    }

    // 金額の解析（カンマを除去）
    const amount = parseFloat(amountStr.replace(/,/g, ''));

    if (dateStr && !isNaN(amount) && amount > 0 && store) {
      transactions.push({
        date: dateStr,
        amount,
        store,
        memo: store
      });
    } else {
      console.warn(`行${i}: 無効なデータ`, { 
        dateStr, 
        amount, 
        store,
        原因: !dateStr ? '日付なし' : isNaN(amount) ? '金額が数値でない' : amount <= 0 ? '金額が0以下' : !store ? '店名なし' : '不明'
      });
    }
  }

  console.log(`楽天CSV解析完了: ${transactions.length}件のトランザクション`);
  return { transactions, totalProcessed: rows.length - 1 };
};

/**
 * 汎用CSVバリデーター
 */
export const validateCSVStructure = (rows: string[][], requiredColumns: string[]): boolean => {
  if (rows.length === 0) return false;
  
  const header = rows[0];
  return requiredColumns.every(col => 
    header.some(headerCol => headerCol.includes(col))
  );
};