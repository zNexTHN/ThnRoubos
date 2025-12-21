import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Bomb, CreditCard, CircleDot, Check, X, Users, DollarSign } from 'lucide-react';

interface LobbyScreenProps {
  onStart: () => void;
}

const mockRequirements = {
  police: { current: 5, required: 6 },
  items: [
    { id: 'c4', name: 'C4 Explosivo', icon: Bomb, owned: true },
    { id: 'card', name: 'Cartão Clonado', icon: CreditCard, owned: true },
    { id: 'drill', name: 'Serra Industrial', icon: CircleDot, owned: false },
  ],
  reward: { min: 400000, max: 600000 },
};

export function LobbyScreen({ onStart }: LobbyScreenProps) {
  const policeOk = mockRequirements.police.current >= mockRequirements.police.required;
  const allItemsOwned = mockRequirements.items.every((item) => item.owned);
  const canStart = policeOk && allItemsOwned;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="glass-panel rounded-2xl w-full max-w-lg overflow-hidden scanlines"
      >
        {/* Header with Image */}
        <div className="relative h-48 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=800&q=80')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
          
          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="inline-block px-3 py-1 bg-primary/20 border border-primary/40 rounded-full text-xs font-medium text-primary uppercase tracking-wider mb-2">
                Dificuldade: Extrema
              </span>
              <h1 className="font-tactical text-3xl font-bold text-foreground tracking-wide">
                BANCO CENTRAL
              </h1>
            </motion.div>
          </div>
        </div>

        {/* Requirements Panel */}
        <div className="p-6 space-y-5">
          {/* Police Requirement */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${policeOk ? 'bg-success/20' : 'bg-primary/20'}`}>
                <Shield className={`w-5 h-5 ${policeOk ? 'text-success' : 'text-primary'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Polícia Online</p>
                <p className={`font-bold text-lg ${policeOk ? 'text-success' : 'text-primary'}`}>
                  {mockRequirements.police.current}/{mockRequirements.police.required} Disponíveis
                </p>
              </div>
            </div>
            {policeOk ? (
              <Check className="w-6 h-6 text-success" />
            ) : (
              <X className="w-6 h-6 text-primary" />
            )}
          </motion.div>

          {/* Items Grid */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm text-muted-foreground mb-3">Itens Necessários</p>
            <div className="grid grid-cols-3 gap-3">
              {mockRequirements.items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={`relative p-4 rounded-xl border text-center transition-all ${
                    item.owned
                      ? 'bg-success/10 border-success/30'
                      : 'bg-muted/30 border-border opacity-50'
                  }`}
                >
                  <item.icon
                    className={`w-8 h-8 mx-auto mb-2 ${
                      item.owned ? 'text-success' : 'text-muted-foreground'
                    }`}
                  />
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  {item.owned && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-success-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Reward */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/30"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gold/20">
                <DollarSign className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recompensa Estimada</p>
                <p className="font-tactical font-bold text-xl text-gold">
                  R$ {mockRequirements.reward.min.toLocaleString('pt-BR')} - R$ {mockRequirements.reward.max.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Start Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={onStart}
            disabled={!canStart}
            className={`w-full py-4 rounded-xl font-tactical font-bold text-lg tracking-wider transition-all ${
              canStart
                ? 'bg-success text-success-foreground animate-breathe hover:brightness-110'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {canStart ? 'INICIAR OPERAÇÃO' : 'REQUISITOS NÃO CUMPRIDOS'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
