local Tunnel = module("vrp","lib/Tunnel")
local Proxy = module("vrp","lib/Proxy")
local Tools = module("vrp","lib/Tools")

vRP = Proxy.getInterface("vRP")
vRPclient = Tunnel.getInterface("vRP")

src = {}
Tunnel.bindInterface(GetCurrentResourceName(), src)
local vCLIENT = Tunnel.getInterface(GetCurrentResourceName())

-- Variáveis de Estado
local activeRobberies = {} -- Armazena roubos em andamento
local robberyCooldowns = {} -- Armazena tempo de espera

-- Funções Auxiliares de XP (Salvo no vRP UData)
function AddPlayerXP(user_id, amount)
    local currentXP = vRP.getUData(user_id, "vRP:RobberyRankXP")
    currentXP = tonumber(currentXP) or 0
    vRP.setUData(user_id, "vRP:RobberyRankXP", currentXP + amount)
end


src.requestStart = function(robberyId)
    local source = source
    local user_id = vRP.getUserId(source)
    local config = Config.Roubos[robberyId]

    if not config then return end

    -- 1. Verificar Cooldown
    if robberyCooldowns[robberyId] and os.time() < robberyCooldowns[robberyId] then
        TriggerClientEvent("Notify", source, "negado", "Este local foi roubado recentemente. Aguarde.")
        return false
    end

    -- 2. Verificar Policia
    local policeUsers = vRP.getUsersByPermission(Config.PolicePermission)
    if #policeUsers < config.policeRequired then
        TriggerClientEvent("Notify", source, "negado", "Número insuficiente de policiais: " .. #policeUsers .. "/" .. config.policeRequired)
        return false
    end

    -- 3. Verificar Itens
    for _, req in pairs(config.itemsRequired) do
        if vRP.getInventoryItemAmount(user_id, req.item) < req.amount then
            TriggerClientEvent("Notify", source, "negado", "Você precisa de: " .. req.name)
            return false
        end
    end

    -- Consumir itens (opcional, remova se não quiser gastar)
    for _, req in pairs(config.itemsRequired) do
        vRP.tryGetInventoryItem(user_id, req.item, req.amount)
    end

    -- INICIAR ROUBO
    StartRobbery(robberyId, source, policeUsers)

    return true
end


function StartRobbery(robberyId, robberSource, policeUsers)
    local config = Config.Roubos[robberyId]
    

    local user_id = vRP.getUserId(robberSource)
    local fullName = 'Lider'
    if user_id then
        local identity = vRP.getUserIdentity(user_id)
        if identity then
            fullName = '#'..user_id..' '..identity.name..' '..identity.firstname
        end
    end
    activeRobberies[robberyId] = {
        timeRemaining = config.duration,
        robberSource = robberSource,
        active = true,
        squad = { -- Lista de bandidos (pode expandir se for grupo)
            [robberSource] = { name = fullName, health = 100, kills = 0, active = true }
        }
    }

    -- Notificar Policiais
    for _, pId in pairs(policeUsers) do
        local player = vRP.getUserSource(pId)
        if player then
            TriggerClientEvent("Notify", player, "aviso", "Roubo em andamento: " .. config.name)
            vRPclient.setGPS(player, config.coords.x, config.coords.y)
        end
    end

    -- Iniciar HUD no Cliente
    TriggerClientEvent('robbery:clientStart', robberSource, robberyId, config.duration)

    -- Loop do Timer
    Citizen.CreateThread(function()
        while activeRobberies[robberyId] and activeRobberies[robberyId].timeRemaining > 0 do
            Citizen.Wait(1000)
            activeRobberies[robberyId].timeRemaining = activeRobberies[robberyId].timeRemaining - 1
            
            -- Sincronizar timer com quem está no roubo
            if activeRobberies[robberyId].active then
                TriggerClientEvent('robbery:syncTimer', robberSource, activeRobberies[robberyId].timeRemaining, config.duration)
            end
        end

        -- Fim do Timer
        if activeRobberies[robberyId] and activeRobberies[robberyId].active then
            FinishRobbery(robberyId, true)
        end
    end)
end

function FinishRobbery(robberyId, victory)
    local data = activeRobberies[robberyId]
    if not data then return end

    local config = Config.Roubos[robberyId]
    activeRobberies[robberyId].active = false 
    robberyCooldowns[robberyId] = os.time() + config.cooldown

    -- Prepara a lista de estatísticas para o NUI
    local statsList = {}
    
    -- Coleta stats dos criminosos (você pode incluir policiais se quiser)
    if data.teams and data.teams.criminals then
        for source, info in pairs(data.teams.criminals) do
            local playerSource = tonumber(source)
            local user_id = vRP.getUserId(playerSource)

            -- Adiciona à lista de stats
            table.insert(statsList, {
                name = info.name or "Desconhecido",
                kills = info.kills or 0,
                damage = info.damage or 0,
                xp = victory and Config.WinXP or 0 -- Mostra quanto XP ganhou
            })

            if user_id then
                if victory then
                    if config.rewardMoney > 0 then
                        vRP.giveInventoryItem(user_id, "dinheiro_sujo", config.rewardMoney)
                    end
                    AddPlayerXP(user_id, Config.WinXP)
                end
                
                -- Envia o evento de finalização COM a lista de stats
                TriggerClientEvent('robbery:finish', playerSource, victory, "R$ "..config.rewardMoney, statsList)
            end
        end
    end

    activeRobberies[robberyId] = nil
end

-- Callback para sair da UI (Cancelar roubo se sair antes)
RegisterServerEvent('robbery:playerExited')
AddEventHandler('robbery:playerExited', function(robberyId)
    local source = source
    for rId, rData in pairs(activeRobberies) do
        if rData.robberSource == source then
            activeRobberies[robberyId] = nil -- Cancela o roubo
            TriggerClientEvent("Notify", source, "aviso", "Você abandonou o roubo.")
        end
    end
end)

-- Estrutura de dados atualizada
-- activeRobberies[id] = {
--     teams = {
--         criminals = { [source] = { info } },
--         police = { [source] = { info } }
--     },
--     state = "waiting", -- "waiting", "active", "finished"
--     ...
-- }

-- Evento disparado quando o cliente entra/sai da PolyZone
RegisterNetEvent("robbery:updateZoneState")
AddEventHandler("robbery:updateZoneState", function(robberyId, isInside)
    local source = source
    local user_id = vRP.getUserId(source)

    print(robberyId, isInside)
    
    if not activeRobberies[robberyId] then return end
    
    local robbery = activeRobberies[robberyId]
    
    if isInside then


        
        -- Define o time baseado na permissão
        local isPolice = vRP.hasPermission(user_id, Config.PolicePermission)
        local team = isPolice and "police" or "criminals"
        
        local fullName = "ID: "..user_id 
        local identity = vRP.getUserIdentity(user_id)
        if identity then
            fullName = fullName..' '..identity.name..' '..identity.firstname
        end

        robbery.teams[team][source] = {
            name = fullName,
            health = GetEntityHealth(GetPlayerPed(source)),
            active = true,
            kills = 0,    -- ADICIONADO
            damage = 0    -- ADICIONADO
        }
        
        -- Notifica que entrou no combate
        TriggerClientEvent("Notify", source, "aviso", "Você entrou na zona de conflito ("..team..")")
    else
        -- Remove o jogador dos times se sair da zona
        if robbery.teams["police"][source] then robbery.teams["police"][source] = nil end
        if robbery.teams["criminals"][source] then robbery.teams["criminals"][source] = nil end
    end
end)

src.requestStart = function(robberyId)
    local source = source
    local user_id = vRP.getUserId(source)
    local config = Config.Roubos[robberyId]

    -- (Verificações de cooldown e itens originais aqui...)

    -- Inicia o roubo
    StartRobbery(robberyId, source)
    return true
end

function StartRobbery(robberyId, initiatorSource)
    local config = Config.Roubos[robberyId]
    
    activeRobberies[robberyId] = {
        timeRemaining = config.duration,
        active = true,
        teams = {
            criminals = {}, -- Será preenchido via PolyZone
            police = {}     -- Será preenchido via PolyZone
        }
    }
    
    -- Força a adição do iniciador (caso o evento da polyzone demore)
    -- ... dentro de activeRobberies[robberyId].teams.criminals[initiatorSource] ... 

    local user_id = vRP.getUserId(initiatorSource)
    local fullName = 'Lider'
    if user_id then
        local identity = vRP.getUserIdentity(user_id)
        if identity then
            fullName = '#'..user_id..' '..identity.name..' '..identity.firstname
        end
    end
    activeRobberies[robberyId].teams.criminals[initiatorSource] = {
        name = fullName,
        health = 200,
        active = true,
        kills = 0,    -- ADICIONADO
        damage = 0    -- ADICIONADO
    }

    -- Notifica Policiais Globalmente
    local policeUsers = vRP.getUsersByPermission(Config.PolicePermission)
    for _, pId in pairs(policeUsers) do
        local player = vRP.getUserSource(pId)
        if player then
            TriggerClientEvent("Notify", player, "importante", "Roubo iniciado no " .. config.name)
            vRPclient.setGPS(player, config.coords.x, config.coords.y)
        end
    end

    -- Inicia Timer no Cliente do iniciador
    TriggerClientEvent('robbery:clientStart', initiatorSource, robberyId, config.duration)

    -- Thread principal do roubo
    Citizen.CreateThread(function()
        while activeRobberies[robberyId] and activeRobberies[robberyId].timeRemaining > 0 do
            Citizen.Wait(1000)
            local rData = activeRobberies[robberyId]
            
            if not rData then break end -- Segurança

            rData.timeRemaining = rData.timeRemaining - 1
            
            -- Sincroniza timer com TODOS os criminosos na zona
            for src, _ in pairs(rData.teams.criminals) do
                TriggerClientEvent('robbery:syncTimer', src, rData.timeRemaining, config.duration)
            end
            
            -- Se o tempo acabar, criminosos "ganham" o dinheiro e começa a fuga/tiroteio livre
            if rData.timeRemaining == 0 then
                 -- Lógica de entregar dinheiro ou liberar itens
                 -- O roubo tecnicamente continua até um time ser eliminado ou fugirem
            end
        end
    end)
end

RegisterServerEvent('robbery:recordDamage')
AddEventHandler('robbery:recordDamage', function(robberyId, damageAmount)
    local source = source
    local rData = activeRobberies[robberyId]

    if rData then
        -- Verifica se o jogador está em algum time
        local team = nil
        if rData.teams.criminals[source] then team = "criminals" end
        if rData.teams.police[source] then team = "police" end

        if team then
            rData.teams[team][source].damage = rData.teams[team][source].damage + damageAmount
        end
    end
end)

RegisterServerEvent('diedplayer')
AddEventHandler('diedplayer',function(killer,reason)
    local source = source
	local user_id = vRP.getUserId(source)
    for rId, rData in pairs(activeRobberies) do
        -- Verifica se a vítima estava em algum time
        local team = nil
        if rData.teams.criminals[source] then team = "criminals" end
        if rData.teams.police[source] then team = "police" end

        if team then
            -- Marca como morto/inativo
            rData.teams[team][source].active = false
            
            local teammates = {}
            for src, data in pairs(rData.teams[team]) do
                if data.active and src ~= source then
                    table.insert(teammates, { src = src, name = data.name })
                end
            end

            -- Se ainda houver aliados vivos, ativa espectador 
            if #teammates > 0 then
                TriggerClientEvent('robbery:startSpectator', source, teammates)
            else
                print('Chegou!')
                TriggerClientEvent("Notify", source, "aviso", "Seu time foi eliminado.")
                -- Lógica de fim de roubo: Polícia Venceu
                print(json.encode(activeRobberies[rId]))
                FinishRobbery(rId, team == "police") -- Se police morreu, criminosos ganham, e vice-versa
            end
            
            -- Envia Killfeed para todos na zona
            local allPlayers = {}
            for k,v in pairs(rData.teams.criminals) do table.insert(allPlayers, k) end
            for k,v in pairs(rData.teams.police) do table.insert(allPlayers, k) end
            

            print('Chegou!')
            if killer == "**Invalid**" or killer == nil or killer == source then
                local identity = vRP.getUserIdentity(user_id)
                if identity then                        
                    local fullName = identity.name..' '..identity.firstname
                    for _, playerSrc in pairs(allPlayers) do
                        print(playerSrc)
                        TriggerClientEvent('robbery:updateKillFeed', playerSrc, {
                            killer = fullName or "Inimigo",
                            victim = rData.teams[team][source].name,
                            isTeamKill = true
                        })
                    end
                end
            else 
                if reason == 1 then
                    local killer_id = vRP.getUserId(killer)
                    if killer_id then
                        local identity = vRP.getUserIdentity(killer_id)
                        if identity then                        
                            local fullName = identity.name..' '..identity.firstname
                            for _, playerSrc in pairs(allPlayers) do
                                TriggerClientEvent('robbery:updateKillFeed', playerSrc, {
                                    killer = fullName or "Inimigo",
                                    victim = rData.teams[team][source].name,
                                    isTeamKill = false
                                })
                            end
                        end


                        local killerSource = killer -- O 'killer' que vem do evento diedplayer geralmente é o source do assassino
    
    -- Verifica se o assassino está no roubo (pode ser polícia ou bandido)
                        local kTeam = nil
                        if rData.teams.criminals[killerSource] then kTeam = "criminals" end
                        if rData.teams.police[killerSource] then kTeam = "police" end

                        if kTeam then
                            rData.teams[kTeam][killerSource].kills = rData.teams[kTeam][killerSource].kills + 1
                        end
                    end
                end
            end
        end
    end
end)
