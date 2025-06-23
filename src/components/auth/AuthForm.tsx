import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/hooks/use-toast';
import { Calculator } from 'lucide-react';

export const AuthForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuthStore();
  const { toast } = useToast();
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password, rememberMe);

      if (result.error) {
        setErrorMessage(result.error);
        toast({
          title: 'エラー',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        setErrorMessage('');
        toast({
          title: isSignUp ? 'アカウント作成完了' : 'ログイン完了',
          description: 'TT家計簿へようこそ！',
        });
      }
    } catch {
      setErrorMessage('予期しないエラーが発生しました');
      toast({
        title: 'エラー',
        description: '予期しないエラーが発生しました',
        variant: 'destructive',
      });
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
          <h1 className="text-3xl font-bold text-gray-900">TT家計簿</h1>
          <p className="text-gray-600 mt-2">シンプルで使いやすい家計管理アプリ</p>
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
                />
              </div>
              {!isSignUp && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="rememberMe" className="text-sm text-gray-600">
                    ログインしたままにする
                  </Label>
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full bg-green-500 hover:bg-green-600"
                disabled={loading}
              >
                {loading ? '処理中...' : (isSignUp ? 'アカウント作成' : 'ログイン')}
              </Button>
              {errorMessage && (
                <div className="mt-2 text-red-600 text-sm text-center">{errorMessage}</div>
              )}
            </form>
            
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-green-600 hover:text-green-700 text-sm underline"
              >
                {isSignUp 
                  ? 'すでにアカウントをお持ちの方はこちら' 
                  : 'アカウントをお持ちでない方はこちら'
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};