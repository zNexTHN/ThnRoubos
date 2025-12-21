import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Skull, Target, Zap, Star, X } from 'lucide-react';

interface PlayerStats {
  id: string;
  name: string;
  avatar: string;
  kills: number;
  damage: number;
  xp: number;
  isMVP: boolean;
}

interface ResultScreenProps {
  isVictory: boolean;
  stats: PlayerStats[];
  onClose: () => void;
}

export function ResultScreen({ isVictory, stats, onClose }: ResultScreenProps) {
  const [showCloseButton, setShowCloseButton] = useState(false);
  const mvp = stats.find((s) => s.isMVP);

  useEffect(() => {
    const timer = setTimeout(() => setShowCloseButton(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="glass-panel rounded-3xl w-full max-w-2xl overflow-hidden scanlines"
      >
        {/* Header - Victory/Defeat */}
        <div
          className={`relative py-8 px-6 text-center ${
            isVictory
              ? 'bg-gradient-to-b from-success/20 to-transparent'
              : 'bg-gradient-to-b from-primary/20 to-transparent'
          }`}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              isVictory ? 'bg-success/20 glow-success' : 'bg-primary/20 glow-red'
            }`}
          >
            {isVictory ? (
              <Trophy className="w-10 h-10 text-success" />
            ) : (
              <Skull className="w-10 h-10 text-primary" />
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`font-tactical text-4xl font-bold tracking-wider ${
              isVictory ? 'text-success text-glow-success' : 'text-primary text-glow-red'
            }`}
          >
            {isVictory ? 'MISSÃO CUMPRIDA' : 'OPERAÇÃO FALHOU'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mt-2"
          >
            {isVictory ? 'Saque realizado com sucesso!' : 'A polícia venceu desta vez...'}
          </motion.p>
        </div>

        {/* MVP Card */}
        {mvp && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mx-6 -mt-2 mb-6"
          >
            <div className="glass-panel rounded-2xl p-4 border-2 border-gold/30 bg-gradient-to-r from-gold/10 to-gold/5 glow-gold">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    className="w-16 h-16 rounded-full bg-muted border-2 border-gold"
                    style={{
                      backgroundImage: `url(${mvp.avatar})`,
                      backgroundSize: 'cover',
                    }}
                  />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-warning-foreground" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gold uppercase tracking-wider font-medium">
                      MVP da Partida
                    </span>
                  </div>
                  <p className="font-tactical text-xl font-bold text-foreground">
                    {mvp.name}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" /> {mvp.kills} kills
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-4 h-4" /> {mvp.damage} dano
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="px-6 pb-6"
        >
          <div className="glass-panel rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-muted/50 border-b border-border">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Jogador
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider text-center">
                Kills
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider text-center">
                Dano
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider text-center">
                XP Ganho
              </span>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border">
              {stats.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className={`grid grid-cols-4 gap-4 px-4 py-3 items-center ${
                    player.isMVP ? 'bg-gold/5' : ''
                  }`}
                >
                  {/* Player */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full bg-muted"
                      style={{
                        backgroundImage: `url(${player.avatar})`,
                        backgroundSize: 'cover',
                      }}
                    />
                    <span className="font-medium text-foreground truncate">
                      {player.name}
                    </span>
                    {player.isMVP && <Star className="w-4 h-4 text-gold flex-shrink-0" />}
                  </div>

                  {/* Kills */}
                  <div className="text-center">
                    <span className="font-bold text-lg text-primary">{player.kills}</span>
                  </div>

                  {/* Damage */}
                  <div className="text-center">
                    <span className="font-medium text-foreground">{player.damage.toLocaleString()}</span>
                  </div>

                  {/* XP */}
                  <div className="text-center">
                    <span className="font-bold text-success">+{player.xp.toLocaleString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Close Button */}
        <AnimatePresence>
          {showCloseButton && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="px-6 pb-6"
            >
              <button
                onClick={onClose}
                className="w-full py-4 rounded-xl bg-muted hover:bg-muted/80 border border-border transition-all font-medium text-foreground flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Fechar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
