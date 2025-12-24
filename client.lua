local Tunnel = module("vrp","lib/Tunnel")
local Proxy = module("vrp","lib/Proxy")
vRP = Proxy.getInterface("vRP")
src = Tunnel.getInterface(GetCurrentResourceName(), src)

local isNuiVisible = false
local currentRobberyId = nil
local inSpectatorMode = false
local spectatorCam = nil
local spectatorTargetIndex = 1
local squadList = {}

-- =========================================================
-- CONTROLE DE UI
-- =========================================================

function OpenRobberyUI()
    SetNuiFocus(true, true)
    SendNUIMessage({ action = "setVisible", visible = true })
    isNuiVisible = true
end

function CloseRobberyUI()
    SetNuiFocus(false, false)
    SendNUIMessage({ action = "setVisible", visible = false })
    isNuiVisible = false
    inSpectatorMode = false
    if spectatorCam then
        RenderScriptCams(false, false, 0, 1, 0)
        DestroyCam(spectatorCam, false)
        spectatorCam = nil
    end
end

function SetScreen(screenName)
    SendNUIMessage({ action = "setScreen", screen = screenName })
end

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


function ShowDeathNotice()
    SendNUIMessage({
        action = "playerDied"
    })
end

-- =========================================================
-- INTERAÇÃO NO MAPA (DRAW MARKER)
-- =========================================================

Citizen.CreateThread(function()
    while true do
        local idle = 1000
        local ped = PlayerPedId()
        local coords = GetEntityCoords(ped)

        if not currentRobberyId then -- Só mostra marker se não estiver em roubo
            for id, data in pairs(Config.Roubos) do
                local dist = #(coords - data.coords)
                if dist < 10.0 then
                    idle = 5
                    DrawMarker(21, data.coords.x, data.coords.y, data.coords.z - 0.6, 0, 0, 0, 0, 180.0, 0, 1.0, 1.0, 1.0, 255, 0, 0, 100, true, true, 2, false, false, false, false)
                    
                    if dist < Config.MaxDistance then
                        if IsControlJustPressed(0, 38) then -- Tecla E
                            OpenLobby(id)
                        end
                    end
                end
            end
        end
        Citizen.Wait(idle)
    end
end)

function OpenLobby(robberyId)
    local config = Config.Roubos[robberyId]
    currentRobberyId = robberyId -- Seleciona provisoriamente
    
    -- Formata os dados para o React (LobbyScreen.tsx)
    local itemsData = {}
    for _, item in pairs(config.itemsRequired) do
        table.insert(itemsData, { id = item.item, name = item.name, owned = true }) -- Backend validará 'owned' real
    end

    SetScreen('lobby')
    SendNUIMessage({
        action = "updateLobby",
        data = {
            robbery = {
                name = config.name,
                image = config.urlImage, -- Coloque url real
                difficulty = "Médio",
                reward = "R$ " .. config.rewardMoney
            },
            police = { current = 0, required = config.policeRequired }, -- Atualizar via server callback se possivel
            items = itemsData,
            canStart = true
        }
    })
    OpenRobberyUI()
end

-- =========================================================
-- EVENTOS DO SERVIDOR
-- =========================================================

RegisterNetEvent('robbery:clientStart')
AddEventHandler('robbery:clientStart', function(robberyId, duration)
    currentRobberyId = robberyId
    SetScreen('hud')
    SetNuiFocus(false, false)
    AddKillFeed('Rogerio Martins', 'Albert', false)
    UpdateSquad()
end)

RegisterNetEvent('robbery:syncTimer')
AddEventHandler('robbery:syncTimer', function(secondsRemaining, totalTime)
    local minutes = math.floor(secondsRemaining / 60)
    local seconds = secondsRemaining % 60
    
    SendNUIMessage({
        action = "updateTimer",
        time = string.format("%02d:%02d", minutes, seconds),
        progress = (secondsRemaining / totalTime) * 100 -- React espera 0-100 ou 0-1 dependendo do componente
    })
end)

-- Procure o evento robbery:finish e a função ShowResults e substitua-os por isto:

function ShowResults(victory, stats)
    -- ADICIONADO: Ativar foco para permitir clicar e usar ESC
    SetNuiFocus(true, true) 
    
    SendNUIMessage({
        action = "showResults",
        data = {
            victory = victory,
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

RegisterNetEvent('robbery:finish')
AddEventHandler('robbery:finish', function(victory, rewardText, statsList)
    SetScreen('result')
    SetNuiFocus(true, true)

    -- Define o MVP (quem teve mais kills ou dano)
    local mvpData = { name = "Ninguém", kills = 0, damage = 0 }
    
    if statsList and #statsList > 0 then
        -- Ordena ou acha o melhor (lógica simples aqui)
        for _, p in pairs(statsList) do
            if p.damage > mvpData.damage then
                mvpData = p
            end
        end
    else
        statsList = {} -- Garante que não quebre se vier nil
    end

    SendNUIMessage({
        action = "showResults",
        data = {
            victory = victory,
            mvp = { 
                name = mvpData.name, 
                kills = mvpData.kills, 
                damage = mvpData.damage 
            },
            players = statsList, -- Passa a lista real vinda do servidor
            totalReward = rewardText
        }
    })
    currentRobberyId = nil
end)

-- =========================================================
-- CALLBACKS DA NUI
-- =========================================================

RegisterNUICallback('startRobbery', function(data, cb)
    if currentRobberyId then
        local status = src.requestStart(currentRobberyId)
        if status then
            cb('ok')
            return;
        end
    end
    cb(nil) 
end)

RegisterNUICallback('closeUI', function(data, cb)
    CloseRobberyUI()
    if currentRobberyId then
        TriggerServerEvent('robbery:playerExited',currentRobberyId)
        currentRobberyId = nil
    end
    cb('ok')
end)

-- =========================================================
-- MODO ESPECTADOR
-- =========================================================

RegisterNetEvent('robbery:startSpectator')
AddEventHandler('robbery:startSpectator', function(squadData)
    inSpectatorMode = true
    squadList = {}
    
    -- Converter squadData (map) para lista indexada
    for src, data in pairs(squadData) do
        table.insert(squadList, { src = src, name = data.name })
    end

    SetScreen('spectator')
    spectatorTargetIndex = 1
    
    -- Configurar Câmera
    if not spectatorCam then
        spectatorCam = CreateCam("DEFAULT_SCRIPTED_CAMERA", true)
        SetCamActive(spectatorCam, true)
        RenderScriptCams(true, false, 0, true, true)
    end

    UpdateSpectatorCamera()
end)

function UpdateSpectatorCamera()
    if #squadList == 0 then return end
    
    local target = squadList[spectatorTargetIndex]
    local targetPed = GetPlayerPed(GetPlayerFromServerId(target.src))

    if DoesEntityExist(targetPed) then
        AttachCamToEntity(spectatorCam, targetPed, 0.0, -2.0, 1.0, true)
        SetCamRot(spectatorCam, -15.0, 0.0, GetEntityHeading(targetPed), 2)
        
        SendNUIMessage({
            action = "updateSpectatorTarget",
            target = {
                name = target.name,
                health = GetEntityHealth(targetPed) - 100,
                armor = GetPedArmour(targetPed)
            }
        })
    end
end

RegisterNUICallback('spectatorNavigate', function(data, cb)
    local direction = data.direction
    if direction == 'next' then
        spectatorTargetIndex = spectatorTargetIndex + 1
        if spectatorTargetIndex > #squadList then spectatorTargetIndex = 1 end
    else
        spectatorTargetIndex = spectatorTargetIndex - 1
        if spectatorTargetIndex < 1 then spectatorTargetIndex = #squadList end
    end
    UpdateSpectatorCamera()
    cb('ok')
end)



-- ... (manter imports iniciais) ...

-- =========================================================
-- POLYZONE E DETECÇÃO DE ÁREA
-- =========================================================
Citizen.CreateThread(function()
    for id, data in pairs(Config.Roubos) do
        -- Cria a zona de combate/interação
        local zone = CircleZone:Create(data.coords, data.zoneRadius, {
            name = "robbery_"..id,
            debugPoly = false,
            useZ = true
        })

        -- Evento ao entrar/sair da zona
        zone:onPlayerInOut(function(isPointInside)
            if currentRobberyId == id or not currentRobberyId then
                TriggerServerEvent("robbery:updateZoneState", id, isPointInside)
            end
        end)

        -- EXEMPLO DE TARGET (Substituindo o DrawMarker se usar ox_target)
        -- exports.ox_target:addSphereZone({
        --     coords = data.coords,
        --     radius = 1.0,
        --     options = {
        --         {
        --             name = 'start_robbery_'..id,
        --             icon = 'fa-solid fa-mask',
        --             label = 'Iniciar Roubo',
        --             onSelect = function()
        --                 OpenLobby(id)
        --             end
        --         }
        --     }
        -- })
    end
end)

-- =========================================================
-- GERENCIAMENTO DE ESPECTADOR (ATUALIZADO)
-- =========================================================

-- O servidor enviará a lista atualizada de aliados vivos
RegisterNetEvent('robbery:updateSpectatorList')
AddEventHandler('robbery:updateSpectatorList', function(newSquadList)
    squadList = newSquadList
    -- Se o alvo atual morreu ou saiu, reseta para o primeiro
    if spectatorTargetIndex > #squadList then 
        spectatorTargetIndex = 1 
    end
    UpdateSpectatorCamera()
end)



local alreadyDead = false
Citizen.CreateThread(function()
	while true do
		Citizen.Wait(20)
		if GetGameTimer() > 15000 then
			for k,v in pairs(GetActivePlayers()) do
				N_0x31698aa80e0223f8(v)
			end
			local playerPed = PlayerPedId()
			if IsEntityDead(playerPed) and alreadyDead == false then
				local killer = GetPedKiller(playerPed)
				local killerId = 0
				for k,v in pairs(GetActivePlayers()) do
					if killer == GetPlayerPed(v) then
						killerId = GetPlayerServerId(v)
						break
					end
				end
				if killer == playerPed then
					TriggerServerEvent('diedplayer',nil,nil)
					alreadyDead = true
				elseif killerId and killerId ~= 0 then
					TriggerServerEvent('diedplayer',tostring(killerId),1)
					alreadyDead = true
				else
					TriggerServerEvent('diedplayer',nil,nil)
					alreadyDead = true
				end
				alreadyDead = true
			end
			if not IsEntityDead(playerPed) and alreadyDead == true then
				alreadyDead = false
			end
		end
	end
end)

AddEventHandler('gameEventTriggered', function (name, args)
    if name == "CEventNetworkEntityDamage" then
        local victim = args[1]
        local attacker = args[2]
        local isFatal = args[4] == 1
        
        -- Verifica se o atacante sou EU e se estou em um roubo ativo
        if attacker == PlayerPedId() and currentRobberyId then
            if IsEntityAPed(victim) and IsPedAPlayer(victim) then
                -- Estimativa de dano baseada na arma (simplificado, pois o evento não dá o valor exato nativamente sem loop complexo)
                local weapon = GetSelectedPedWeapon(attacker)
                local damageAmt = GetWeaponDamage(weapon) 
                if damageAmt < 10 then damageAmt = 20 end -- Valor mínimo caso a arma retorne 0
                
                -- Envia para o servidor
                TriggerServerEvent('robbery:recordDamage', currentRobberyId, damageAmt)
            end
        end
    end
end)