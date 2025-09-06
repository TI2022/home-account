import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/useAuthStore';
import { useSnackbar } from '@/hooks/use-toast';
import { Calculator } from 'lucide-react';
import { sanitizeInput, isValidEmail, checkPasswordStrength } from '@/utils/security';
import { logger } from '@/utils/logger';

export const AuthForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuthStore();
  const { showSnackbar } = useSnackbar();
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      // 入力値の検証とサニタイゼーション
      const sanitizedEmail = sanitizeInput(email).toLowerCase();
      const sanitizedPassword = password; // パスワードはサニタイズしない

      // バリデーション
      if (!isValidEmail(sanitizedEmail)) {
        setErrorMessage('正しいメールアドレスを入力してください');
        return;
      }

      if (sanitizedPassword.length < 6) {
        setErrorMessage('パスワードは6文字以上で入力してください');
        return;
      }

      // サインアップ時の追加バリデーション
      if (isSignUp) {
        const passwordCheck = checkPasswordStrength(sanitizedPassword);
        if (!passwordCheck.isValid) {
          setErrorMessage('パスワードが弱すぎます: ' + passwordCheck.feedback.join(', '));
          return;
        }
      }

      logger.debug('Authentication attempt', { email: sanitizedEmail, isSignUp });

      const result = isSignUp 
        ? await signUp(sanitizedEmail, sanitizedPassword)
        : await signIn(sanitizedEmail, sanitizedPassword);

      if (result.error) {
        logger.warn('Authentication failed', { error: result.error });
        setErrorMessage(result.error);
        showSnackbar(result.error, 'destructive');
      } else {
        setErrorMessage('');
        logger.log('Authentication successful');
        showSnackbar(isSignUp ? 'アカウント作成完了' : 'ログイン完了');
      }
    } catch (error) {
      logger.error('Authentication error', error);
      setErrorMessage('予期しないエラーが発生しました');
      showSnackbar('予期しないエラーが発生しました', 'destructive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-500 p-3 rounded-full">
              <Calculator className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">どこ？マネ</h1>
          <p className="text-gray-600 mt-2">お金のモヤモヤ、毎日ちょっとずつ晴れていく。</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {isSignUp ? 'アカウント作成' : 'ログイン'}
            </CardTitle>
            <CardDescription>
              {isSignUp 
                ? '新しいアカウントを作成してください' 
                : 'メールアドレスとパスワードを入力してください'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                  data-testid="email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full"
                  data-testid="password-input"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-green-500 hover:bg-green-600"
                disabled={loading}
                data-testid="login-button"
              >
                {loading ? '処理中...' : (isSignUp ? 'アカウント作成' : 'ログイン')}
              </Button>
              {errorMessage && (
                <div className="mt-2 text-red-600 text-center" data-testid="error-message">{errorMessage}</div>
              )}
            </form>
            
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-green-600 hover:text-green-700 underline"
              >
                {isSignUp 
                  ? 'すでにアカウントをお持ちの方はこちら' 
                  : 'アカウントをお持ちでない方はこちら'
                }
              </button>
            </div>
          </CardContent>
        </Card>
        <div className="mt-6 text-center text-gray-500">
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-600">利用規約</a> をご確認ください。
        </div>
      </div>
    </div>
  );
};