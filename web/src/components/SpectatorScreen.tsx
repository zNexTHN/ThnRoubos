import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Eye, Heart, Shield, Skull } from 'lucide-react';

interface SpectatingPlayer {
  id: string;
  name: string;
  health: number;
  armor: number;
}

interface SpectatorScreenProps {
  currentTarget: SpectatingPlayer;
  onPrevious: () => void;
  onNext: () => void;
}

export function SpectatorScreen({ currentTarget, onPrevious, onNext }: SpectatorScreenProps) {
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Top Center - Death Notice */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-8 py-4 text-center bg-transparent" 
        >
          <div className="flex items-center gap-3 justify-center">
            <Skull className="w-6 h-6 text-primary" />
            <span className="font-tactical text-2xl font-bold text-primary animate-pulse-warning text-glow-red">
              VOCÊ ESTÁ MORTO
            </span>
            <Skull className="w-6 h-6 text-primary" />
          </div>
          <div className="flex items-center gap-2 justify-center mt-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Modo Espectador Ativo
            </span>
          </div>
        </motion.div>
      </div>

      {/* Bottom - Control Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-4 flex items-center gap-6"
        >
          {/* Previous Button */}
          <button
            onClick={onPrevious}
            className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
          >
            <div className="w-14 h-14 rounded-xl bg-muted/50 border border-border flex items-center justify-center transition-colors group-hover:bg-secondary/20 group-hover:border-secondary/50">
              <ChevronLeft className="w-8 h-8 text-foreground group-hover:text-secondary" />
            </div>
            <span className="text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Q</kbd> Anterior
            </span>
          </button>

          {/* Current Target Info */}
          <div className="min-w-[200px] text-center px-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Espectando
            </p>
            <p className="font-tactical text-xl font-bold text-foreground mb-3">
              {currentTarget.name}
            </p>

            {/* Health Bar */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-success flex-shrink-0" />
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      currentTarget.health < 30
                        ? 'bg-gradient-to-r from-primary to-primary/70'
                        : 'bg-gradient-to-r from-success to-success/70'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${currentTarget.health}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-sm font-bold text-foreground w-10 text-right">
                  {currentTarget.health}%
                </span>
              </div>

              {/* Armor Bar */}
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${currentTarget.armor}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-sm font-medium text-muted-foreground w-10 text-right">
                  {currentTarget.armor}%
                </span>
              </div>
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={onNext}
            className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
          >
            <div className="w-14 h-14 rounded-xl bg-muted/50 border border-border flex items-center justify-center transition-colors group-hover:bg-secondary/20 group-hover:border-secondary/50">
              <ChevronRight className="w-8 h-8 text-foreground group-hover:text-secondary" />
            </div>
            <span className="text-xs text-muted-foreground">
              Próximo <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">E</kbd>
            </span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
