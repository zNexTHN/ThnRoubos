Config = {}

Config.MaxDistance = 2.0 -- Distancia para acessar o marker
Config.PolicePermission = "policia.permissao" -- Permissão dos policiais

-- Configuração dos Ranks e XP
Config.WinXP = 100 -- XP por vitória
Config.KillXP = 10 -- XP por kill

Config.Roubos = {
    ["bancocentral"] = {
        name = "Banco Central",
        type = "banco",
        coords = vector3(116.07, 762.13, 210.56),
        zoneRadius = 50.0, -- ADICIONADO: Tamanho da area do roubo (PolyZone)
        urlImage = 'https://criticalhits.com.br/wp-content/uploads/2022/03/gta-online-bancos-2-910x512.jpg',

        policeRequired = 0, -- Teste com 0 para facilitar
        itemsRequired = {},
        
        duration = 30,
        cooldown = 1800,
        
        rewardMoney = 500000,
        rewardItems = {}
    },
    -- ... outros roubos
}