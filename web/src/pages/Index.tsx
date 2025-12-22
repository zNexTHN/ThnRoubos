import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LobbyScreen } from '@/components/LobbyScreen';
import { HUDScreen } from '@/components/HUDScreen';
import { SpectatorScreen } from '@/components/SpectatorScreen';
import { ResultScreen } from '@/components/ResultScreen';
import { DevTools } from '@/components/DevTools';
import { useFiveMListener, sendCallback } from '@/hooks/useFiveM';

type Screen = 'lobby' | 'hud' | 'spectator' | 'result-win' | 'result-lose';

// Tipos de dados
interface LobbyData {
  robbery: {
    name: string;
    image: string;
    difficulty: string;
    reward: string;
  };
  police: {
    current: number;
    required: number;
  };
  items: Array<{
    id: string;
    name: string;
    owned: boolean;
  }>;
  canStart: boolean;
}

interface KillFeedEntry {
  id: string;
  killer: string;
  victim: string;
  isTeamKill: boolean;
  timestamp: number;
}

interface SquadMember {
  id: string;
  name: string;
  avatar: string;
  health: number;
  armor: number;
  isAlive: boolean;
}

interface SpectatingPlayer {
  id: string;
  name: string;
  health: number;
  armor: number;
}

interface PlayerStats {
  id: string;
  name: string;
  avatar: string;
  kills: number;
  damage: number;
  xp: number;
  isMVP: boolean;
}

// Mock Data (usado quando não há dados do Lua)
const defaultLobbyData: LobbyData = {
  robbery: {
    name: "Banco Central",
    image: "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=800",
    difficulty: "Extremo",
    reward: "R$ 500.000"
  },
  police: { current: 5, required: 6 },
  items: [
    { id: "c4", name: "Explosivo C4", owned: true },
    { id: "card", name: "Cartão Clonado", owned: true },
    { id: "saw", name: "Serra Elétrica", owned: false }
  ],
  canStart: false
};

const defaultSquad: SquadMember[] = [
  { id: '1', name: 'Caveira', avatar: '', health: 100, armor: 75, isAlive: true },
  { id: '2', name: 'Rogério', avatar: '', health: 65, armor: 0, isAlive: true },
  { id: '3', name: 'Thunder', avatar: '', health: 0, armor: 0, isAlive: false },
  { id: '4', name: 'Ninja', avatar: '', health: 45, armor: 50, isAlive: true },
];

const defaultStats: PlayerStats[] = [
  { id: '1', name: 'Caveira', avatar: '', kills: 8, damage: 1250, xp: 450, isMVP: true },
  { id: '2', name: 'Rogério', avatar: '', kills: 5, damage: 890, xp: 320, isMVP: false },
  { id: '3', name: 'Thunder', avatar: '', kills: 3, damage: 450, xp: 180, isMVP: false },
  { id: '4', name: 'Ninja', avatar: '', kills: 4, damage: 720, xp: 280, isMVP: false },
];

const Index = () => {
  // Estados principais
  const [isVisible, setIsVisible] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('lobby');
  
  // Estados do Lobby
  const [lobbyData, setLobbyData] = useState<LobbyData>(defaultLobbyData);
  
  // Estados do HUD
  const [timeRemaining, setTimeRemaining] = useState(299);
  const [totalTime, setTotalTime] = useState(300);
  const [killFeed, setKillFeed] = useState<KillFeedEntry[]>([]);
  const [squad, setSquad] = useState<SquadMember[]>(defaultSquad);
  
  // Estados do Spectator
  const [spectatorTarget, setSpectatorTarget] = useState<SpectatingPlayer>({
    id: '1', name: 'Caveira', health: 100, armor: 75
  });
  
  // Estados do Result
  const [isVictory, setIsVictory] = useState(true);
  const [stats, setStats] = useState<PlayerStats[]>(defaultStats);

  // Listener para mensagens NUI do FiveM (Lua)
  useFiveMListener(useCallback((data) => {
    console.log('[NUI Message]', data);
    
    switch (data.action) {
      // Visibilidade
      case 'setVisible':
        setIsVisible(data.visible);
        break;
        
      // Trocar tela
      case 'setScreen':
        if (data.screen === 'result') {
          setCurrentScreen(data.victory ? 'result-win' : 'result-lose');
        } else {
          setCurrentScreen(data.screen);
        }
        break;
        
      // Atualizar dados do Lobby
      case 'updateLobby':
        setLobbyData(data.data);
        break;
        
      // Atualizar timer
      case 'updateTimer':
        if (typeof data.time === 'number') {
          setTimeRemaining(data.time);
        } else if (typeof data.time === 'string') {
          // Parse "04:59" format
          const [min, sec] = data.time.split(':').map(Number);
          setTimeRemaining(min * 60 + sec);
        }
        if (data.totalTime) {
          setTotalTime(data.totalTime);
        }
        break;
        
      // Adicionar kill ao feed
      case 'addKill':
        setKillFeed(prev => {
          const newKill: KillFeedEntry = {
            id: `kill-${Date.now()}`,
            killer: data.kill.killer,
            victim: data.kill.victim,
            isTeamKill: data.kill.isTeamKill || false,
            timestamp: data.kill.timestamp || Date.now()
          };
          // Manter apenas os últimos 6 kills
          return [newKill, ...prev].slice(0, 6);
        });
        break;
        
      // Atualizar squad
      case 'updateSquad':
        setSquad(data.squad.map((member: any) => ({
          id: String(member.id),
          name: member.name,
          avatar: member.avatar || '',
          health: member.health,
          armor: member.armor || 0,
          isAlive: !member.isDead && member.health > 0
        })));
        break;
        
      // Atualizar alvo do spectator
      case 'updateSpectatorTarget':
        setSpectatorTarget({
          id: String(data.target.id || Date.now()),
          name: data.target.name,
          health: data.target.health,
          armor: data.target.armor || 0
        });
        break;
        
      // Jogador morreu
      case 'playerDied':
        setCurrentScreen('spectator');
        break;
        
      // Mostrar resultados
      case 'showResults':
        setIsVictory(data.data.victory);
        setStats(data.data.players.map((player: any, index: number) => ({
          id: String(index + 1),
          name: player.name,
          avatar: player.avatar || '',
          kills: player.kills,
          damage: player.damage,
          xp: player.xp,
          isMVP: data.data.mvp?.name === player.name
        })));
        setCurrentScreen(data.data.victory ? 'result-win' : 'result-lose');
        break;
    }
  }, []));

  // Keybinds
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC para fechar
      if (e.key === 'Escape') {
        sendCallback('closeUI');
      }
      
      // Q/E para navegação no spectator
      if (currentScreen === 'spectator') {
        if (e.key === 'q' || e.key === 'Q') {
          sendCallback('spectatorNavigate', { direction: 'prev' });
        }
        if (e.key === 'e' || e.key === 'E') {
          sendCallback('spectatorNavigate', { direction: 'next' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen]);

  // Timer countdown para HUD (desenvolvimento)
  useEffect(() => {
    if (currentScreen !== 'hud') return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentScreen]);

  // Handlers
  const handleChangeScreen = useCallback((screen: Screen) => {
    setCurrentScreen(screen);
  }, []);

  const handleStartOperation = useCallback(() => {
    sendCallback('startRobbery', { timestamp: Date.now() });
    setCurrentScreen('hud');
  }, []);

  const handleCloseResult = useCallback(() => {
    sendCallback('exitResults');
    setCurrentScreen('lobby');
  }, []);

  const handlePreviousSpectator = useCallback(() => {
    sendCallback('spectatorNavigate', { direction: 'prev' });
  }, []);

  const handleNextSpectator = useCallback(() => {
    sendCallback('spectatorNavigate', { direction: 'next' });
  }, []);

  // Não renderizar se não estiver visível
  if (!isVisible) return null;

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {currentScreen === 'lobby' && (
          <LobbyScreen 
            key="lobby" 
            onStart={handleStartOperation}
            lobbyData={lobbyData}
          />
        )}

        {currentScreen === 'hud' && (
          <HUDScreen
            key="hud"
            killFeed={killFeed}
            squad={squad}
          />
        )}

        {currentScreen === 'spectator' && (
          <SpectatorScreen
            key="spectator"
            currentTarget={spectatorTarget}
            onPrevious={handlePreviousSpectator}
            onNext={handleNextSpectator}
          />
        )}

        {(currentScreen === 'result-win' || currentScreen === 'result-lose') && (
          <ResultScreen
            key="result"
            isVictory={currentScreen === 'result-win'}
            stats={stats}
            onClose={handleCloseResult}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
