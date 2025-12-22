Config = {}

Config.MaxDistance = 2.0 -- Distancia para acessar o marker
Config.PolicePermission = "policia.permissao" -- Permissão dos policiais

-- Configuração dos Ranks e XP
Config.WinXP = 100 -- XP por vitória
Config.KillXP = 10 -- XP por kill

Config.Roubos = {
    ["bancocentral"] = {
        name = "Banco Central",
        type = "banco", -- usado para definir icone ou estilo
        coords = vector3(116.07, 762.13, 210.56),
        urlImage = 'https://criticalhits.com.br/wp-content/uploads/2022/03/gta-online-bancos-2-910x512.jpg',

        -- Requisitos
        policeRequired = 0,
        itemsRequired = {
            -- { item = "c4", amount = 1, name = "Explosivo C4" },
            -- { item = "cartao_acesso", amount = 1, name = "Cartão de Acesso" }
        },
        
        duration = 30,
        cooldown = 1800,
        
        rewardMoney = 500000,
        rewardItems = {
            --{ item = "barra_ouro", min = 5, max = 10 }
        }
    },
    ["loja_departamento"] = {
        name = "Loja de Departamento",
        type = "loja",
        coords = vector3(25.72, -1346.96, 29.49),
        policeRequired = 2,
        itemsRequired = {},
        duration = 120,
        cooldown = 600,
        rewardMoney = 5000,
        rewardItems = {}
    }
}