import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { PlantGarden } from '@/components/ui/plant-garden';
import { BadgeNotification } from '@/components/ui/badge-notification';
import { useGameStore } from '@/store/useGameStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { Trophy, Star, Flame, Target } from 'lucide-react';
import type { Badge } from '@/store/useGameStore';

export const GameDashboard = () => {
  const {
    level,
    experience,
    maxExperience,
    consecutiveDays,
    totalTransactions,
    badges,
    unlockedBadges,
    plant,
    checkAchievements,
  } = useGameStore();
  
  const { transactions, budgets } = useTransactionStore();
  
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);
  const [newBadge] = useState<Badge | null>(null);

  useEffect(() => {
    checkAchievements(transactions, budgets);
  }, [transactions, budgets, checkAchievements]);

  const unlockedBadgesList = badges.filter(badge => unlockedBadges.includes(badge.id));
  const lockedBadgesList = badges.filter(badge => !unlockedBadges.includes(badge.id));

  return (
    <div className="space-y-6">
      {/* User Level & Experience */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-purple-600" />
              <span>あなたのレベル</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-purple-700">レベル {level}</div>
                <div className="text-sm text-purple-600">家計管理マスター</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-purple-700">{experience} / {maxExperience}</div>
                <div className="text-sm text-purple-600">経験値</div>
              </div>
            </div>
            <ProgressBar
              value={experience}
              max={maxExperience}
              color="purple"
              showText={false}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <CardContent className="p-4 text-center">
              <Flame className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-700">{consecutiveDays}</div>
              <div className="text-sm text-orange-600">連続記録日数</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700">{totalTransactions}</div>
              <div className="text-sm text-blue-600">総記録回数</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Plant Garden */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <PlantGarden plant={plant} />
      </motion.div>

      {/* Badges Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <span>獲得バッジ</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Unlocked Badges */}
              {unlockedBadgesList.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">獲得済み ({unlockedBadgesList.length})</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {unlockedBadgesList.map((badge) => (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-3 rounded-lg border ${badge.color} text-center`}
                      >
                        <div className="text-2xl mb-1">{badge.icon}</div>
                        <div className="text-xs font-medium">{badge.name}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Locked Badges */}
              {lockedBadgesList.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">未獲得 ({lockedBadgesList.length})</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {lockedBadgesList.slice(0, 4).map((badge) => (
                      <div
                        key={badge.id}
                        className="p-3 rounded-lg border bg-gray-50 text-center opacity-60"
                      >
                        <div className="text-2xl mb-1 grayscale">🔒</div>
                        <div className="text-xs font-medium text-gray-500">{badge.name}</div>
                        <div className="text-xs text-gray-400 mt-1">{badge.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <BadgeNotification
        badge={newBadge}
        show={showBadgeNotification}
        onClose={() => setShowBadgeNotification(false)}
      />
    </div>
  );
};