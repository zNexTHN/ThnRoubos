local Tunnel = module("vrp","lib/Tunnel")
local Proxy = module("vrp","lib/Proxy")
vRP = Proxy.getInterface("vRP")
src = Tunnel.getInterface(GetCurrentResourceName(),src)

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



-- Telas disponíveis: 'lobby', 'hud', 'spectator', 'result'
function SetScreen(screenName)
    SendNUIMessage({
        action = "setScreen",
        screen = screenName
    })
end

RegisterCommand('roubo', function(source,args,rawCommand)
    if args[1] then
        print('Argumento: '..args[1])
        SetScreen(args[1])
    end
    -- SetScreen('lobby')     -- Mostra tela de preparação
    -- SetScreen('hud')       -- Mostra HUD ativo (após iniciar roubo)
    -- SetScreen('spectator') -- Mostra modo espectador (jogador morreu)
    -- SetScreen('result')    -- Mostra resultados finais
end)

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


