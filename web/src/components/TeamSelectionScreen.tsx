import { motion } from 'framer-motion';
import { Users, Shield, Skull, Check, X, ChevronRight, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

interface Player {
  id: string;
  name: string;
  avatar?: string;
  level?: number;
  role?: string;
}

interface TeamSelectionScreenProps {
  type: 'criminals' | 'police';
  availablePlayers: Player[];
  maxTeamSize: number;
  minTeamSize: number;
  onConfirm: (selectedIds: string[]) => void;
  onCancel: () => void;
}

const defaultPlayers: Record<'criminals' | 'police', Player[]> = {
  criminals: [
    { id: 'c1', name: 'Shadow_X', level: 45, role: 'Hacker' },
    { id: 'c2', name: 'NightRider', level: 38, role: 'Driver' },
    { id: 'c3', name: 'GhostFace', level: 52, role: 'Explosivos' },
    { id: 'c4', name: 'Viper_01', level: 41, role: 'Atirador' },
    { id: 'c5', name: 'BladeRunner', level: 33, role: 'Suporte' },
    { id: 'c6', name: 'DarkMatter', level: 47, role: 'Infiltrador' },
    { id: 'c7', name: 'CyberPunk', level: 29, role: 'Hacker' },
    { id: 'c8', name: 'DeathStroke', level: 55, role: 'Atirador' },
  ],
  police: [
    { id: 'p1', name: 'Capitão_Silva', level: 60, role: 'Comandante' },
    { id: 'p2', name: 'Oficial_Rex', level: 42, role: 'SWAT' },
    { id: 'p3', name: 'Sargento_Lima', level: 38, role: 'Negociador' },
    { id: 'p4', name: 'Agente_Cruz', level: 35, role: 'Sniper' },
    { id: 'p5', name: 'Tenente_Rocha', level: 48, role: 'Tático' },
    { id: 'p6', name: 'Cabo_Santos', level: 31, role: 'Patrulha' },
    { id: 'p7', name: 'Detetive_Alves', level: 44, role: 'Investigador' },
    { id: 'p8', name: 'Oficial_Nunes', level: 36, role: 'K9' },
    { id: 'p9', name: 'Sargento_Costa', level: 50, role: 'SWAT' },
    { id: 'p10', name: 'Agente_Dias', level: 33, role: 'Patrulha' },
  ],
};

export function TeamSelectionScreen({ 
  type,
  availablePlayers,
  maxTeamSize,
  minTeamSize,
  onConfirm, 
  onCancel 
}: TeamSelectionScreenProps) {
  const players = availablePlayers.length > 0 ? availablePlayers : defaultPlayers[type];
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const isCriminal = type === 'criminals';
  const canProceed = selectedPlayers.length >= minTeamSize && selectedPlayers.length <= maxTeamSize;

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return players;
    const query = searchQuery.toLowerCase();
    return players.filter(
      player => 
        player.name.toLowerCase().includes(query) ||
        player.role?.toLowerCase().includes(query)
    );
  }, [players, searchQuery]);

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      }
      if (prev.length >= maxTeamSize) {
        return prev;
      }
      return [...prev, playerId];
    });
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const handleConfirm = () => {
    onConfirm(selectedPlayers);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="glass-panel rounded-2xl w-full max-w-2xl overflow-hidden scanlines"
      >
        {/* Header */}
        <div className={`p-6 ${isCriminal ? 'bg-primary/10' : 'bg-info/10'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isCriminal ? 'bg-primary/20' : 'bg-info/20'}`}>
              {isCriminal ? (
                <Skull className="w-8 h-8 text-primary" />
              ) : (
                <Shield className="w-8 h-8 text-info" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-tactical text-2xl font-bold text-foreground tracking-wide uppercase">
                {isCriminal ? 'Selecionar Bandidos' : 'Selecionar Policiais'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Escolha {minTeamSize} a {maxTeamSize} jogadores
              </p>
            </div>
          </div>

          {/* Search & Counter */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar jogador..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted/50 border border-border 
                         text-sm text-foreground placeholder:text-muted-foreground
                         focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className={`font-bold ${canProceed ? 'text-success' : 'text-muted-foreground'}`}>
                {selectedPlayers.length}/{maxTeamSize}
              </span>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="p-4 max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-track-muted/20 scrollbar-thumb-muted">
          <div className="grid grid-cols-2 gap-3">
            {filteredPlayers.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                Nenhum jogador encontrado
              </div>
            ) : (
              filteredPlayers.map((player, index) => {
                const isSelected = selectedPlayers.includes(player.id);
                const isDisabled = !isSelected && selectedPlayers.length >= maxTeamSize;

                return (
                  <motion.button
                    key={player.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    onClick={() => !isDisabled && togglePlayer(player.id)}
                    disabled={isDisabled}
                    className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      isSelected
                        ? isCriminal
                          ? 'bg-primary/20 border-primary/50 ring-1 ring-primary/30'
                          : 'bg-info/20 border-info/50 ring-1 ring-info/30'
                        : isDisabled
                          ? 'bg-muted/20 border-border opacity-40 cursor-not-allowed'
                          : 'bg-muted/30 border-border hover:bg-muted/50 hover:border-muted-foreground/30'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                      isSelected
                        ? isCriminal
                          ? 'bg-primary/30 text-primary'
                          : 'bg-info/30 text-info'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {player.avatar ? (
                        <img 
                          src={player.avatar} 
                          alt={player.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(player.name)
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {player.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {player.level && (
                          <span className="text-xs text-muted-foreground">
                            Nv.{player.level}
                          </span>
                        )}
                        {player.role && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            isSelected
                              ? isCriminal
                                ? 'bg-primary/20 text-primary'
                                : 'bg-info/20 text-info'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {player.role}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? isCriminal
                          ? 'bg-primary border-primary'
                          : 'bg-info border-info'
                        : 'border-muted-foreground/30'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-muted/20 flex gap-3">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl font-tactical font-medium tracking-wider 
                       bg-muted/50 text-muted-foreground border border-border
                       hover:bg-muted hover:text-foreground transition-all
                       flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            CANCELAR
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={handleConfirm}
            disabled={!canProceed}
            className={`flex-1 py-3 px-4 rounded-xl font-tactical font-bold tracking-wider 
                       flex items-center justify-center gap-2 transition-all ${
              canProceed
                ? isCriminal
                  ? 'bg-primary text-primary-foreground hover:brightness-110'
                  : 'bg-info text-info-foreground hover:brightness-110'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            CONFIRMAR
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
