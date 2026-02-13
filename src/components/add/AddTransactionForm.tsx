import { useState, useEffect, useMemo } from 'react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { CuteCard } from '@/components/ui/cute-card';
import { CoinAnimation } from '@/components/ui/coin-animation';
import { CharacterReaction } from '@/components/ui/character-reaction';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useGameStore } from '@/store/useGameStore';
import { useSnackbar } from '@/hooks/use-toast';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types';
import { format } from 'date-fns';
import { useCategoryStore } from '@/store/useCategoryStore';

export const AddTransactionForm = () => {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [showCharacterReaction, setShowCharacterReaction] = useState(false);
  const [reactionMessage, setReactionMessage] = useState('');
  const [isMock, setIsMock] = useState(false);
  
  const { addTransaction, transactions } = useTransactionStore();
  const { recordTransaction } = useGameStore();
  const { showSnackbar } = useSnackbar();

  const { categories: userCategories, fetchCategories: fetchUserCategories } = useCategoryStore();

  // budget summary removed: budgets are managed separately from transactions

  const availableCategories = useMemo(() => {
    const fromUser = (userCategories || []).filter(c => c.type === type).map(c => c.name);
    const fromBuilt = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const fromTx = Array.from(new Set((transactions || []).filter(t => t.type === type && t.category).map(t => t.category)));
    return Array.from(new Set([...(fromUser || []), ...fromBuilt, ...fromTx]));
  }, [userCategories, transactions, type]);

  const categories = availableCategories;

  useEffect(() => {
    // load user categories once
    fetchUserCategories().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // budget summary effect removed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !category) {
      showSnackbar('金額とカテゴリを入力してください', 'destructive');
      return;
    }


    setLoading(true);
    try {
      // budget check removed — budgets are independent of transactions
      await addTransaction({
        type,
        amount: parseInt(amount),
        category,
        date,
        memo: memo || undefined,
        isMock,
      });

      showSnackbar(`${type === 'expense' ? '支出' : '収入'}を記録しました`);

      // Record transaction for game progress
      recordTransaction();

      // Show animations and reactions
      setShowCoinAnimation(true);
      
      const messages = [
        'いいね！記録上手だね✨',
        'お疲れさま！今日もがんばったね',
        'しっかり管理できてるよ💪',
        '素晴らしい習慣だね🌟',
        'コツコツ続けてえらい！',
        '家計管理の達人だね💖',
        'きちんと記録できて素敵✨',
        '継続は力なり！がんばって🌸'
      ];
      setReactionMessage(messages[Math.floor(Math.random() * messages.length)]);
      setShowCharacterReaction(true);
      
      setTimeout(() => setShowCharacterReaction(false), 4000);

      // Reset form
      setAmount('');
      setCategory('');
      setMemo('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
    } catch {
      showSnackbar('記録に失敗しました', 'destructive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20">
      <CoinAnimation 
        trigger={showCoinAnimation} 
        onComplete={() => setShowCoinAnimation(false)} 
      />
      <CharacterReaction
        show={showCharacterReaction}
        message={reactionMessage}
        type={type === 'expense' ? 'encouraging' : 'excited'}
        character={Math.random() > 0.5 ? 'cat' : 'rabbit'}
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <CuteCard variant="pink" glow>
          <CardContent>
            <div className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label>種類</Label>
                  <RadioGroup
                    value={type}
                    onValueChange={(value) => {
                      setType(value as 'expense' | 'income');
                      setCategory(''); // Reset category when type changes
                    }}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem className="bg-white" value="expense" id="expense" />
                      <Label htmlFor="expense" className="text-red-600 font-medium">支出</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem className="bg-white" value="income" id="income" />
                      <Label htmlFor="income" className="text-green-600 font-medium">収入</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">金額 (円)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="1"
                    className="text-lg bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">カテゴリ</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="カテゴリを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Budget summary removed */}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">日付</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="memo">メモ（任意）</Label>
                  <Textarea
                    id="memo"
                    placeholder="詳細やメモを記入"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    rows={3}
                    className="bg-white"
                  />
                </div>

                <div className="flex flex-col items-center space-y-1">
                  <div className="flex w-full max-w-xs bg-gray-100 rounded-full p-1">
                    <button
                      type="button"
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-full font-bold transition-all
                        ${!isMock ? 'bg-blue-500 text-white shadow' : 'bg-white text-gray-500'}`}
                      onClick={() => {
                        setIsMock(false);
                      }}
                      aria-pressed={!isMock}
                    >
                      <span className="text-lg">💰</span> 実際の収支
                    </button>
                    <button
                      type="button"
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-full font-bold transition-all
                        ${isMock ? 'bg-orange-400 text-white shadow' : 'bg-white text-gray-500'}`}
                      onClick={() => setIsMock(true)}
                      aria-pressed={isMock}
                    >
                      <span className="text-lg">🕒</span> 予定の収支
                    </button>
                  </div>
                </div>


                <AnimatedButton
                  type="submit"
                  size="lg"
                  className={`w-full py-3 text-lg font-bold ${
                    type === 'expense'
                      ? 'bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white'
                      : 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white'
                  }`}
                  disabled={loading}
                  sparkle
                >
                  {loading ? '記録中...' : '記録する'}
                </AnimatedButton>
              </form>
            </div>
          </CardContent>
        </CuteCard>
      </motion.div>
    </div>
  );
};