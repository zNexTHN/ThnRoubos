import { motion } from 'framer-motion';
import { Bug, Play, Skull, Trophy, Eye, RotateCcw } from 'lucide-react';

type Screen = 'lobby' | 'hud' | 'spectator' | 'result-win' | 'result-lose';

interface DevToolsProps {
  currentScreen: Screen;
  onChangeScreen: (screen: Screen) => void;
}

export function DevTools({ currentScreen, onChangeScreen }: DevToolsProps) {
  const screens: { id: Screen; label: string; icon: React.ReactNode }[] = [
    { id: 'lobby', label: 'Lobby', icon: <RotateCcw className="w-4 h-4" /> },
    { id: 'hud', label: 'HUD Ativo', icon: <Play className="w-4 h-4" /> },
    { id: 'spectator', label: 'Espectador', icon: <Eye className="w-4 h-4" /> },
    { id: 'result-win', label: 'Vitória', icon: <Trophy className="w-4 h-4" /> },
    { id: 'result-lose', label: 'Derrota', icon: <Skull className="w-4 h-4" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed bottom-4 left-4 z-50"
    >
      <div className="glass-panel rounded-xl p-4 min-w-[200px]">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
          <Bug className="w-4 h-4 text-secondary" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            DevTools
          </span>
        </div>

        <div className="space-y-2">
          {screens.map((screen) => (
            <button
              key={screen.id}
              onClick={() => onChangeScreen(screen.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentScreen === screen.id ||
                (currentScreen === 'result-win' && screen.id === 'result-win') ||
                (currentScreen === 'result-lose' && screen.id === 'result-lose')
                  ? 'bg-secondary/20 text-secondary border border-secondary/30'
                  : 'bg-muted/50 text-foreground hover:bg-muted border border-transparent'
              }`}
            >
              {screen.icon}
              {screen.label}
            </button>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Tela Atual:{' '}
            <span className="text-secondary font-medium capitalize">
              {currentScreen.replace('-', ' ')}
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
