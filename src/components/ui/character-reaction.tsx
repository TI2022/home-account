import React from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CharacterReactionProps {
  show: boolean;
  message: string;
  type: 'happy' | 'excited' | 'proud' | 'encouraging';
  character?: 'cat' | 'rabbit' | 'bear' | 'fox';
}

export const CharacterReaction = ({ show, message, type, character = 'cat' }: CharacterReactionProps) => {
  const [currentCharacter, setCurrentCharacter] = useState(character);
  const controls = useAnimation();

  const characters = {
    cat: '🐱',
    rabbit: '🐰', 
    bear: '🐻',
    fox: '🦊'
  };

  const expressions = {
    happy: ['😊', '😄', '🥰', '😍'],
    excited: ['🤩', '🎉', '✨', '🌟'],
    proud: ['👏', '🏆', '💪', '🎊'],
    encouraging: ['💖', '🌸', '🌺', '💕']
  };

  useEffect(() => {
    if (show) {
      // Random character selection for variety
      const characterKeys = Object.keys(characters) as Array<keyof typeof characters>;
      const randomCharacter = characterKeys[Math.floor(Math.random() * characterKeys.length)];
      setCurrentCharacter(randomCharacter);
      
      // Bounce animation sequence
      controls.start({
        scale: [0, 1.2, 1],
        rotate: [0, -5, 5, 0],
        transition: { duration: 0.6, ease: "easeOut" }
      });
    }
  }, [show, controls]);

  const getRandomExpression = () => {
    const expressionList = expressions[type];
    return expressionList[Math.floor(Math.random() * expressionList.length)];
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Character bubble */}
            <motion.div
              className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-3xl shadow-xl p-6 border-2 border-pink-200 relative max-w-sm"
              animate={controls}
            >
              {/* Speech bubble tail */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-pink-100 to-purple-100 rotate-45 border-r-2 border-b-2 border-pink-200"></div>
              
              <div className="flex items-center space-x-4">
                {/* Character avatar */}
                <motion.div
                  className="text-4xl"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {characters[currentCharacter]}
                </motion.div>
                
                <div className="flex-1">
                  <motion.div
                    className="text-lg font-medium text-gray-800 mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {message}
                  </motion.div>
                  
                  {/* Expression icons */}
                  <motion.div
                    className="flex space-x-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {[...Array(3)].map((_, i) => (
                      <motion.span
                        key={i}
                        className="text-lg"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                      >
                        {getRandomExpression()}
                      </motion.span>
                    ))}
                  </motion.div>
                </div>
              </div>
              
              {/* Floating hearts around the bubble */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-pink-400 text-sm"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${10 + (i % 2) * 20}%`,
                  }}
                  animate={{
                    y: [-5, -15, -5],
                    opacity: [0.4, 0.8, 0.4],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3
                  }}
                >
                  💖
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};