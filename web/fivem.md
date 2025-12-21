# FiveM NUI Integration - Robbery System

## Visão Geral

Este documento descreve os callbacks NUI para integrar a interface de roubos com seu script FiveM (Lua/C#).

---

## Configuração Inicial

### 1. Registrar o NUI no `fxmanifest.lua`

```lua
fx_version 'cerulean'
game 'gta5'

ui_page 'web/dist/index.html'

files {
    'web/dist/**/*'
}

client_scripts {
    'client/*.lua'
}

server_scripts {
    'server/*.lua'
}
```

---

## Callbacks do Cliente → UI (Lua → React)

Use `SendNUIMessage` para enviar dados do cliente Lua para a UI React.

### Abrir/Fechar UI

```lua
-- Abrir a UI
function OpenRobberyUI()
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = "setVisible",
        visible = true
    })
end

-- Fechar a UI
function CloseRobberyUI()
    SetNuiFocus(false, false)
    SendNUIMessage({
        action = "setVisible",
        visible = false
    })
end
```

### Trocar de Tela

```lua
-- Telas disponíveis: 'lobby', 'hud', 'spectator', 'result'
function SetScreen(screenName)
    SendNUIMessage({
        action = "setScreen",
        screen = screenName
    })
end

-- Exemplos:
SetScreen('lobby')     -- Mostra tela de preparação
SetScreen('hud')       -- Mostra HUD ativo (após iniciar roubo)
SetScreen('spectator') -- Mostra modo espectador (jogador morreu)
SetScreen('result')    -- Mostra resultados finais
```

### Atualizar Dados do Lobby

```lua
function UpdateLobbyData(data)
    SendNUIMessage({
        action = "updateLobby",
        data = {
            robbery = {
                name = "Banco Central",
                image = "https://exemplo.com/banco.jpg",
                difficulty = "Extremo",
                reward = "R$ 500.000"
            },
            police = {
                current = 5,
                required = 6
            },
            items = {
                { id = "c4", name = "Explosivo C4", owned = true },
                { id = "card", name = "Cartão Clonado", owned = true },
                { id = "saw", name = "Serra Elétrica", owned = false }
            },
            canStart = true -- Se todos requisitos foram cumpridos
        }
    })
end
```

### Atualizar HUD (Durante o Roubo)

```lua
-- Atualizar cronômetro
function UpdateTimer(minutes, seconds)
    SendNUIMessage({
        action = "updateTimer",
        time = string.format("%02d:%02d", minutes, seconds),
        progress = (minutes * 60 + seconds) / 300 -- 300 = tempo total em segundos
    })
end

-- Adicionar kill no feed
function AddKillFeed(killer, victim, isTeamKill)
    SendNUIMessage({
        action = "addKill",
        kill = {
            killer = killer,
            victim = victim,
            isTeamKill = isTeamKill, -- true = aliado matou policial
            timestamp = GetGameTimer()
        }
    })
end

-- Atualizar lista do squad
function UpdateSquad(members)
    SendNUIMessage({
        action = "updateSquad",
        squad = {
            {
                id = 1,
                name = "Player Um",
                health = 100,
                maxHealth = 100,
                isDead = false
            },
            {
                id = 2,
                name = "Player Dois",
                health = 45,
                maxHealth = 100,
                isDead = false
            },
            {
                id = 3,
                name = "Player Três",
                health = 0,
                maxHealth = 100,
                isDead = true
            }
        }
    })
end
```

### Modo Espectador

```lua
-- Atualizar alvo espectado
function UpdateSpectatorTarget(playerData)
    SendNUIMessage({
        action = "updateSpectatorTarget",
        target = {
            name = playerData.name,
            health = playerData.health,
            maxHealth = 100,
            armor = playerData.armor,
            maxArmor = 100
        }
    })
end

-- Mostrar aviso de morte
function ShowDeathNotice()
    SendNUIMessage({
        action = "playerDied"
    })
end
```

### Tela de Resultados

```lua
function ShowResults(victory, stats)
    SendNUIMessage({
        action = "showResults",
        data = {
            victory = victory, -- true = missão cumprida, false = falhou
            mvp = {
                name = "Player Um",
                kills = 5,
                damage = 2500
            },
            players = {
                { name = "Player Um", kills = 5, damage = 2500, xp = 1200 },
                { name = "Player Dois", kills = 3, damage = 1800, xp = 800 },
                { name = "Player Três", kills = 1, damage = 600, xp = 400 }
            },
            totalReward = "R$ 500.000"
        }
    })
end
```

---

## Callbacks da UI → Cliente (React → Lua)

Use `RegisterNUICallback` para receber eventos da UI no cliente Lua.

### Registrar Callbacks

```lua
-- Jogador clicou em "Iniciar Operação"
RegisterNUICallback('startRobbery', function(data, cb)
    print("Jogador iniciou o roubo!")
    
    -- Verificar requisitos no servidor
    TriggerServerEvent('robbery:requestStart')
    
    cb('ok')
end)

-- Jogador fechou a UI (ESC ou botão fechar)
RegisterNUICallback('closeUI', function(data, cb)
    CloseRobberyUI()
    cb('ok')
end)

-- Jogador mudou de alvo no modo espectador
RegisterNUICallback('spectatorNavigate', function(data, cb)
    local direction = data.direction -- 'prev' ou 'next'
    
    if direction == 'next' then
        SpectateNextPlayer()
    else
        SpectatePreviousPlayer()
    end
    
    cb('ok')
end)

-- Jogador clicou em "Fechar" na tela de resultados
RegisterNUICallback('exitResults', function(data, cb)
    CloseRobberyUI()
    TriggerServerEvent('robbery:playerExited')
    cb('ok')
end)
```

---

## Implementação no React

Adicione este hook no seu código React para comunicação com FiveM:

### Hook: `useFiveM.ts`

```typescript
import { useEffect, useCallback } from 'react';

// Tipagem das mensagens recebidas do Lua
interface NUIMessage {
  action: string;
  [key: string]: any;
}

// Hook para escutar mensagens do FiveM
export function useFiveMListener(callback: (data: NUIMessage) => void) {
  useEffect(() => {
    const handler = (event: MessageEvent<NUIMessage>) => {
      callback(event.data);
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [callback]);
}

// Função para enviar callbacks para o Lua
export function sendCallback(name: string, data: object = {}) {
  // Em produção (FiveM)
  if (typeof (window as any).GetParentResourceName === 'function') {
    fetch(`https://${(window as any).GetParentResourceName()}/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } else {
    // Em desenvolvimento (browser)
    console.log(`[NUI Callback] ${name}:`, data);
  }
}

// Hook combinado
export function useFiveM() {
  const send = useCallback((name: string, data?: object) => {
    sendCallback(name, data);
  }, []);

  return { send };
}
```

### Uso no Componente Principal

```typescript
import { useState, useCallback } from 'react';
import { useFiveMListener, sendCallback } from '@/hooks/useFiveM';

export default function Index() {
  const [currentScreen, setCurrentScreen] = useState<'lobby' | 'hud' | 'spectator' | 'result'>('lobby');
  const [isVisible, setIsVisible] = useState(false);
  const [lobbyData, setLobbyData] = useState(/* ... */);

  // Escutar mensagens do Lua
  useFiveMListener(useCallback((data) => {
    switch (data.action) {
      case 'setVisible':
        setIsVisible(data.visible);
        break;
      case 'setScreen':
        setCurrentScreen(data.screen);
        break;
      case 'updateLobby':
        setLobbyData(data.data);
        break;
      case 'updateTimer':
        // Atualizar timer...
        break;
      case 'addKill':
        // Adicionar kill ao feed...
        break;
      // ... outros casos
    }
  }, []));

  // Exemplo de callback para Lua
  const handleStartRobbery = () => {
    sendCallback('startRobbery', { timestamp: Date.now() });
  };

  // ...
}
```

---

## Keybinds (Teclas)

### Fechar UI com ESC

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      sendCallback('closeUI');
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

### Navegação no Modo Espectador

```typescript
useEffect(() => {
  if (currentScreen !== 'spectator') return;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'q' || e.key === 'Q') {
      sendCallback('spectatorNavigate', { direction: 'prev' });
    }
    if (e.key === 'e' || e.key === 'E') {
      sendCallback('spectatorNavigate', { direction: 'next' });
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [currentScreen]);
```

---

## Exemplo Completo de Fluxo

### 1. Jogador chega no local do roubo (Lua)

```lua
-- Trigger zone ou marker
CreateThread(function()
    while true do
        Wait(500)
        local playerCoords = GetEntityCoords(PlayerPedId())
        local distance = #(playerCoords - vector3(bankX, bankY, bankZ))
        
        if distance < 3.0 and not isRobberyActive then
            -- Mostrar prompt "E - Iniciar Roubo"
            if IsControlJustPressed(0, 38) then -- E
                OpenRobberyUI()
                UpdateLobbyData(GetRobberyInfo())
            end
        end
    end
end)
```

### 2. Jogador inicia roubo

```lua
RegisterNUICallback('startRobbery', function(data, cb)
    TriggerServerEvent('robbery:start')
    cb('ok')
end)

RegisterNetEvent('robbery:started')
AddEventHandler('robbery:started', function()
    SetScreen('hud')
    SetNuiFocus(false, false) -- Libera mouse para jogar
    StartRobberyTimer()
end)
```

### 3. Durante o roubo

```lua
-- Atualizar HUD periodicamente
CreateThread(function()
    while isRobberyActive do
        UpdateSquad(GetSquadMembers())
        Wait(1000)
    end
end)

-- Quando alguém morre
AddEventHandler('robbery:playerKilled', function(killer, victim)
    AddKillFeed(killer, victim, IsPlayerInSquad(killer))
    
    if victim == PlayerId() then
        SetScreen('spectator')
        ShowDeathNotice()
    end
end)
```

### 4. Fim do roubo

```lua
RegisterNetEvent('robbery:finished')
AddEventHandler('robbery:finished', function(victory, stats)
    SetNuiFocus(true, true)
    ShowResults(victory, stats)
end)
```

---

## Dicas de Performance

1. **Minimize `SendNUIMessage`**: Agrupe atualizações quando possível
2. **Use debounce no timer**: Atualize a cada 1s, não a cada frame
3. **Kill feed**: Limite a 5-6 kills visíveis, remova os antigos
4. **Squad updates**: Só envie quando houver mudança real

---

## Estrutura de Arquivos Recomendada

```
robbery-system/
├── fxmanifest.lua
├── client/
│   ├── main.lua
│   ├── nui.lua        # Todas funções de NUI
│   └── robbery.lua    # Lógica do roubo
├── server/
│   └── main.lua
└── web/
    └── dist/          # Build do React (npm run build)
        ├── index.html
        └── assets/
```

---

## Comandos de Teste (Dev)

Adicione estes comandos para testar sem a UI completa:

```lua
RegisterCommand('testlobby', function()
    OpenRobberyUI()
    SetScreen('lobby')
end, false)

RegisterCommand('testhud', function()
    SetScreen('hud')
    SetNuiFocus(false, false)
end, false)

RegisterCommand('testspec', function()
    SetScreen('spectator')
end, false)

RegisterCommand('testwin', function()
    ShowResults(true, mockStats)
end, false)

RegisterCommand('testlose', function()
    ShowResults(false, mockStats)
end, false)
```
