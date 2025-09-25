import { useState, useCallback } from 'react';
import { CalendarError, CalendarErrorType, UseCalendarErrorReturn } from '../types/calendar.types';

export const useCalendarError = (): UseCalendarErrorReturn => {
  const [error, setError] = useState<CalendarError | null>(null);

  const handleError = useCallback((
    error: unknown, 
    context: string, 
    type: CalendarErrorType = 'UNKNOWN_ERROR'
  ) => {
    console.error(`Calendar Error [${context}]:`, error);
    
    let message = 'An unknown error occurred';
    
    // エラータイプに応じたメッセージの生成
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object') {
      // API エラーレスポンスの処理
      const errorObj = error as { 
        message?: string; 
        error_description?: string; 
        status?: number 
      };
      
      if (errorObj.message) {
        message = errorObj.message;
      } else if (errorObj.error_description) {
        message = errorObj.error_description;
      } else if (errorObj.status) {
        message = `HTTP Error ${errorObj.status}`;
      }
    }

    // エラータイプに基づいたユーザーフレンドリーなメッセージ
    const userFriendlyMessage = getUserFriendlyMessage(type, message);

    const calendarError: CalendarError = {
      message: userFriendlyMessage,
      context,
      timestamp: new Date(),
      type,
    };

    setError(calendarError);

    // 重要なエラーの場合は追加のログ出力
    if (type === 'NETWORK_ERROR' || type === 'TRANSACTION_SAVE_ERROR') {
      console.error('Critical Calendar Error:', {
        type,
        context,
        originalError: error,
        timestamp: calendarError.timestamp
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
  };
};

// エラータイプに基づいたユーザーフレンドリーなメッセージの生成
function getUserFriendlyMessage(type: CalendarErrorType, originalMessage: string): string {
  switch (type) {
    case 'TRANSACTION_LOAD_ERROR':
      return '取引データの読み込みに失敗しました。ページを再読み込みしてください。';
    
    case 'TRANSACTION_SAVE_ERROR':
      return '取引データの保存に失敗しました。再度お試しください。';
    
    case 'TRANSACTION_DELETE_ERROR':
      return '取引の削除に失敗しました。再度お試しください。';
    
    case 'VALIDATION_ERROR':
      return '入力内容に問題があります。入力内容を確認してください。';
    
    case 'NETWORK_ERROR':
      return 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
    
    case 'UNKNOWN_ERROR':
    default:
      return `予期しないエラーが発生しました: ${originalMessage}`;
  }
}