import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LobbyScreen } from '@/components/LobbyScreen';
import { HUDScreen } from '@/components/HUDScreen';
import { SpectatorScreen } from '@/components/SpectatorScreen';
import { ResultScreen } from '@/components/ResultScreen';
import { DevTools } from '@/components/DevTools';

type Screen = 'lobby' | 'hud' | 'spectator' | 'result-win' | 'result-lose';

// Mock Data
const mockSquad = [
  { id: '1', name: 'Caveira', avatar: '', health: 100, armor: 75, isAlive: true },
  { id: '2', name: 'Rogério', avatar: '', health: 65, armor: 0, isAlive: true },
  { id: '3', name: 'Thunder', avatar: '', health: 0, armor: 0, isAlive: false },
  { id: '4', name: 'Ninja', avatar: '', health: 45, armor: 50, isAlive: true },
];

const mockKillFeed = [
  { id: '1', killer: 'Caveira', victim: 'Policial01', isTeamKill: false, timestamp: Date.now() },
  { id: '2', killer: 'Rogério', victim: 'Policial02', isTeamKill: false, timestamp: Date.now() - 5000 },
  { id: '3', killer: 'Thunder', victim: 'Policial03', isTeamKill: false, timestamp: Date.now() - 10000 },
];

const mockSpectatingPlayers = [
  { id: '1', name: 'Caveira', health: 100, armor: 75 },
  { id: '2', name: 'Rogério', health: 65, armor: 0 },
  { id: '4', name: 'Ninja', health: 45, armor: 50 },
];

const mockStats = [
  { id: '1', name: 'Caveira', avatar: '', kills: 8, damage: 1250, xp: 450, isMVP: true },
  { id: '2', name: 'Rogério', avatar: '', kills: 5, damage: 890, xp: 320, isMVP: false },
  { id: '3', name: 'Thunder', avatar: '', kills: 3, damage: 450, xp: 180, isMVP: false },
  { id: '4', name: 'Ninja', avatar: '', kills: 4, damage: 720, xp: 280, isMVP: false },
];

const Index = () => {
  const [isVisible, setIsVisible] = useState(false); // Começa invisível
  const [currentScreen, setCurrentScreen] = useState<Screen>('lobby');
  const [timeRemaining, setTimeRemaining] = useState(299); // 4:59
  const [spectatorIndex, setSpectatorIndex] = useState(0);

  // Timer countdown for HUD
  useEffect(() => {
    const handleNuiMessage = (event: MessageEvent) => {
      const data = event.data;

      if (data.action === "setVisible") {
        console.log('Alterando visibilidade para:', data.visible); // LOG
        setIsVisible(data.visible);
      }

      if (data.action === "setScreen") {
        setCurrentScreen(data.screen);
      }
      
      // Mapeie outras ações do client.lua aqui (updateLobby, etc)
      // Exemplo:
      // if (data.action === "updateLobby") { ... }
    };

    window.addEventListener("message", handleNuiMessage);

    return () => {
      window.removeEventListener("message", handleNuiMessage);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isVisible && e.key === "Escape") {
        // Envia callback para fechar no Lua
        fetch(`https://${(window as any).GetParentResourceName?.() || 'nome-do-script'}/closeUI`, {
          method: 'POST',
          body: JSON.stringify({})
        });
        setIsVisible(false); // Fecha visualmente na hora
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible]);

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

  // Reset timer when going to HUD
  useEffect(() => {
    if (currentScreen === 'hud') {
      setTimeRemaining(299);
    }
  }, [currentScreen]);

  const handleChangeScreen = useCallback((screen: Screen) => {
    setCurrentScreen(screen);
  }, []);

  const handleStartOperation = useCallback(() => {
    setCurrentScreen('hud');
  }, []);

  const handleCloseResult = useCallback(() => {
    setCurrentScreen('lobby');
  }, []);

  const handlePreviousSpectator = useCallback(() => {
    setSpectatorIndex((prev) =>
      prev === 0 ? mockSpectatingPlayers.length - 1 : prev - 1
    );
  }, []);

  const handleNextSpectator = useCallback(() => {
    setSpectatorIndex((prev) =>
      prev === mockSpectatingPlayers.length - 1 ? 0 : prev + 1
    );
  }, []);

  if (!isVisible) return null;

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {currentScreen === 'lobby' && (
          <LobbyScreen key="lobby" onStart={handleStartOperation} />
        )}

        {currentScreen === 'hud' && (
          <HUDScreen
            key="hud"
            timeRemaining={timeRemaining}
            totalTime={300}
            killFeed={mockKillFeed}
            squad={mockSquad}
          />
        )}

        {currentScreen === 'spectator' && (
          <SpectatorScreen
            key="spectator"
            currentTarget={mockSpectatingPlayers[spectatorIndex]}
            onPrevious={handlePreviousSpectator}
            onNext={handleNextSpectator}
          />
        )}

        {(currentScreen === 'result-win' || currentScreen === 'result-lose') && (
          <ResultScreen
            key="result"
            isVictory={currentScreen === 'result-win'}
            stats={mockStats}
            onClose={handleCloseResult}
          />
        )}
      </AnimatePresence>

      {/* DevTools Panel */}
      <DevTools currentScreen={currentScreen} onChangeScreen={handleChangeScreen} />
    </div>
  );
};

export default Index;
