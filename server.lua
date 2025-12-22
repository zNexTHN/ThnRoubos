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
    
    -- Configurar estado
    activeRobberies[robberyId] = {
        timeRemaining = config.duration,
        robberSource = robberSource,
        active = true,
        squad = { -- Lista de bandidos (pode expandir se for grupo)
            [robberSource] = { name = "Líder", health = 100, kills = 0, active = true }
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

    if victory then
        local user_id = vRP.getUserId(data.robberSource)
        
        -- Pagamento
        if config.rewardMoney > 0 then
            vRP.giveInventoryItem(user_id, "dinheiro_sujo", config.rewardMoney)
        end
        
        -- Dar XP
        AddPlayerXP(user_id, Config.WinXP)

        TriggerClientEvent('robbery:finish', data.robberSource, true, "R$ "..config.rewardMoney)
    else
        TriggerClientEvent('robbery:finish', data.robberSource, false, "0")
    end

    activeRobberies[robberyId] = nil
end

-- Sistema de Kills e Spectator
AddEventHandler('baseevents:onPlayerDied', function(killerType, coords)
    local victimSource = source
    -- Verificar se o jogador estava em algum roubo ativo
    for rId, rData in pairs(activeRobberies) do
        if rData.squad[victimSource] then
            rData.squad[victimSource].active = false
            
            -- Notificar HUD sobre morte
            TriggerClientEvent('robbery:updateKillFeed', rData.robberSource, {
                killer = "Desconhecido", victim = "Aliado", isTeamKill = false
            })
            
            -- Ativar modo espectador para quem morreu
            TriggerClientEvent('robbery:startSpectator', victimSource, rData.squad)
            break
        end
    end
end)

-- Callback para sair da UI (Cancelar roubo se sair antes)
RegisterServerEvent('robbery:playerExited')
AddEventHandler('robbery:playerExited', function()
    local source = source
    for rId, rData in pairs(activeRobberies) do
        if rData.robberSource == source then
            activeRobberies[robberyId] = nil -- Cancela o roubo
            TriggerClientEvent("Notify", source, "aviso", "Você abandonou o roubo.")
        end
    end
end)