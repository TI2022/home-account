import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { PlantGrowth } from '@/store/useGameStore';
import { Droplets, Sun, Sparkles } from 'lucide-react';

interface PlantGardenProps {
  plant: PlantGrowth;
  className?: string;
}

export const PlantGarden = ({ plant, className }: PlantGardenProps) => {
  const getPlantEmoji = (stage: PlantGrowth['stage']) => {
    switch (stage) {
      case 'seed': return '🌱';
      case 'sprout': return '🌿';
      case 'sapling': return '🌳';
      case 'tree': return '🌲';
      case 'blooming': return '🌸';
      default: return '🌱';
    }
  };
  
  const getStageText = (stage: PlantGrowth['stage']) => {
    switch (stage) {
      case 'seed': return '種';
      case 'sprout': return '芽';
      case 'sapling': return '若木';
      case 'tree': return '大木';
      case 'blooming': return '開花';
      default: return '種';
    }
  };
  
  const getBackgroundGradient = (stage: PlantGrowth['stage']) => {
    switch (stage) {
      case 'seed': return 'from-amber-50 to-yellow-50';
      case 'sprout': return 'from-green-50 to-emerald-50';
      case 'sapling': return 'from-emerald-50 to-green-100';
      case 'tree': return 'from-green-100 to-emerald-100';
      case 'blooming': return 'from-pink-50 to-rose-50';
      default: return 'from-amber-50 to-yellow-50';
    }
  };

  return (
    <Card className={`bg-gradient-to-br ${getBackgroundGradient(plant.stage)} border-2 border-green-200 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-green-600" />
          <span>あなたの植物</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plant Display */}
        <div className="text-center">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-8xl mb-2"
          >
            {getPlantEmoji(plant.stage)}
          </motion.div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-green-800">
              レベル {plant.level} - {getStageText(plant.stage)}
            </h3>
            <p className="text-sm text-green-600">
              記録するたびに成長します
            </p>
          </div>
        </div>
        
        {/* Growth Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-700 font-medium">成長度</span>
            <span className="text-green-600">{plant.experience}/{plant.maxExperience}</span>
          </div>
          <ProgressBar
            value={plant.experience}
            max={plant.maxExperience}
            color="green"
            showText={false}
          />
        </div>
        
        {/* Care Status */}
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-1 text-blue-600">
            <Droplets className="h-4 w-4" />
            <span>水やり済み</span>
          </div>
          <div className="flex items-center space-x-1 text-yellow-600">
            <Sun className="h-4 w-4" />
            <span>日光充分</span>
          </div>
        </div>
        
        {/* Growth Tips */}
        <div className="bg-white/50 rounded-lg p-3 text-center">
          <p className="text-xs text-green-700">
            💡 毎日記録を続けると、植物がどんどん成長します！
          </p>
        </div>
      </CardContent>
    </Card>
  );
};