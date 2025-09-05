// セキュリティユーティリティ

/**
 * 入力値のサニタイゼーション
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // HTMLタグの除去
    .replace(/javascript:/gi, '') // JavaScriptプロトコルの除去
    .replace(/on\w+=/gi, '') // イベントハンドラーの除去
    .trim();
};

/**
 * HTMLエスケープ
 */
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * URLの検証
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

/**
 * メールアドレスの検証
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * パスワード強度チェック
 */
export const checkPasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('8文字以上にしてください');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('小文字を含めてください');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('大文字を含めてください');

  if (/\d/.test(password)) score += 1;
  else feedback.push('数字を含めてください');

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) score += 1;
  else feedback.push('記号を含めてください');

  return {
    isValid: score >= 3,
    score,
    feedback
  };
};

/**
 * CSRFトークンの生成
 */
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * セキュアなランダム文字列生成
 */
export const generateSecureRandomString = (length: number = 32): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => charset[byte % charset.length]).join('');
};

/**
 * 機密データの検出
 */
export const containsSensitiveData = (text: string): boolean => {
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /credential/i,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  ];

  return sensitivePatterns.some(pattern => pattern.test(text));
};

/**
 * セキュリティヘッダーの設定
 */
export const setSecurityHeaders = (): void => {
  if (typeof document !== 'undefined') {
    // Content Security Policy (開発環境でのみ警告)
    if (import.meta.env.DEV) {
      console.warn('🔒 セキュリティ: 本番環境ではCSPヘッダーを設定してください');
    }

    // X-Content-Type-Options
    const meta1 = document.createElement('meta');
    meta1.httpEquiv = 'X-Content-Type-Options';
    meta1.content = 'nosniff';
    document.head.appendChild(meta1);

    // X-Frame-Options
    const meta2 = document.createElement('meta');
    meta2.httpEquiv = 'X-Frame-Options';
    meta2.content = 'DENY';
    document.head.appendChild(meta2);

    // Referrer Policy
    const meta3 = document.createElement('meta');
    meta3.name = 'referrer';
    meta3.content = 'strict-origin-when-cross-origin';
    document.head.appendChild(meta3);
  }
};

/**
 * 環境設定の検証
 */
export const validateEnvironmentSecurity = (): void => {
  const warnings: string[] = [];

  // 本番環境での設定チェック
  if (import.meta.env.PROD) {
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      warnings.push('本番環境でデモモードが有効になっています');
    }

    if (import.meta.env.VITE_SUPABASE_URL === 'INVALID_URL_NEEDS_REPLACEMENT') {
      warnings.push('Supabase URLが設定されていません');
    }
  }

  if (warnings.length > 0) {
    console.error('🚨 セキュリティ警告:', warnings);
    throw new Error('セキュリティ設定に問題があります');
  }
};