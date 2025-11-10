// セキュリティ強化: 本番環境でのログ制御

interface Logger {
  log: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
}

const isProduction = import.meta.env.PROD;
const isTest = import.meta.env.VITE_ENVIRONMENT === 'test' || process.env.NODE_ENV === 'test';

class SecureLogger implements Logger {
  private shouldLog(level: 'log' | 'warn' | 'error' | 'debug'): boolean {
    // 本番環境では ERROR のみ許可
    if (isProduction) {
      return level === 'error';
    }
    
    // テスト環境では WARN 以上を許可
    if (isTest) {
      return level === 'warn' || level === 'error';
    }
    
    // 開発環境では全てを許可
    return true;
  }

  log(message: string, ...args: unknown[]): void {
    if (this.shouldLog('log')) {
      console.log(`[LOG] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  // セキュリティ: 機密情報を含む可能性のあるオブジェクトのログ
  secureLog(message: string, data: unknown): void {
    if (!this.shouldLog('debug')) return;

    // 機密情報をマスクしてログ出力
    const sanitizedData = this.sanitizeData(data);
    console.debug(`[SECURE] ${message}`, sanitizedData);
  }

  private sanitizeData(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential'];
    const sanitized = { ...data };

    for (const [key, value] of Object.entries(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '***MASKED***';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      }
    }

    return sanitized;
  }
}

export const logger = new SecureLogger();

// 既存のconsole.logを段階的に置き換えるためのヘルパー
export const replaceConsoleLog = () => {
  if (isProduction) {
    // 本番環境では console.log を無効化
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
  }
};

// アプリケーション初期化時に実行
replaceConsoleLog();