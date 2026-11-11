# Pilotagem e combate

## Computador

| Controle | Ação |
| --- | --- |
| W / S | Acelerar / reduzir velocidade |
| A / D | Deslocamento lateral para desviar |
| Setas | Virar, subir e descer |
| Botão direito + movimento do mouse | Pilotar em direção ao cursor |
| Botão esquerdo ou Espaço, segurando | Tiro contínuo com a primeira arma |
| F2 / F3 / F4, segurando | Disparar armas adicionais |
| Shift | Boost enquanto houver carga |
| X | Frear |
| T | Selecionar próximo contato do radar próximo |
| C | Centralizar a câmera |
| E | Iniciar / interromper mineração |

Clique em uma nave ou asteroide para selecionar. Selecionar um alvo informa distância e integridade; a nave ainda precisa apontar para ele. Os cliques nas estações e nos contêineres continuam disponíveis. O botão CONTROLES abre a ajuda dentro do jogo.

## Celular

O joystick esquerdo controla direção e altitude com intensidade analógica. A velocidade é independente: segure + ou − para ajustá-la, BOOST para acelerar temporariamente e FREAR para parar. Segure ATIRAR com um dedo enquanto manobra com o outro. Toque em um contato ou use ALVO para selecionar. Os controles respeitam as margens de segurança da tela.

## Regras

- Rotação amortecida e movimento calculado pelo tempo decorrido; velocidade de cruzeiro até 1.800 km/s e boost até 3.000 km/s. O boost precisa recuperar pelo menos 25% depois de esgotado.
- Alcance de 25.000 km. A assistência de mira permite pequenos desvios: raio do alvo mais 4,5% da profundidade. Alvos atrás da nave e fora do alcance não recebem dano.
- O contato mais próximo dentro do cone de tiro recebe o disparo. Selecionar outro contato não permite atravessar o primeiro.
- Cadência por arma: pulso 180 ms, íons 320 ms, plasma 650 ms e singularidade 1.100 ms. Uma requisição por arma fica em andamento de cada vez.
- O servidor desconta munição inclusive nos tiros livres ou errados. Contra jogadores, ele confirma alinhamento, distância em 3D, disponibilidade das naves, arma equipada e cadência por nave/arma, inclusive entre piloto e copiloto. A destruição mantém o fluxo existente de destroços e recuperação de carga.
- Recargas multiplayer também são confirmadas pelo servidor: até 30 projéteis por 30 CR, perto de uma estação operacional. Uma sincronização antiga não repõe munição que já foi disparada. A tabela de cadência é criada automaticamente; a migração opcional está em `database/migrations/20261111_flight_combat.sql`.
- Asteroides usam o estoque e a regeneração locais já existentes. Fragmentação remove colisão e marcador do radar; dano e fragmentos mantêm a integração com mineração e carga. A destruição dos asteroides não é sincronizada entre jogadores.
- Menus, interiores, perda de foco e mudança de aba suspendem os comandos e liberam o tiro. Passageiros não podem pilotar ou atirar. Copilotos mantêm acesso às armas.

## Verificação

```powershell
node --test tests/flight-combat.test.cjs
C:/xampp/php/php.exe tests/combat-rules.test.php
C:/xampp/php/php.exe -l index.php
C:/xampp/php/php.exe -l multiplayer-api.php
```

Os testes exercitam tempo de voo em diferentes taxas de quadros, direção analógica, frenagem, boost, mira em 3D, fragmentação, cadência, liberação de comandos e confirmação de dano pelo servidor com transporte simulado. O teste PHP verifica as regras de alinhamento e alcance usadas pelo endpoint real.

Referências de design: [Rebel Galaxy Outlaw](https://rebel-galaxy.com/choosing-a-playstyle-in-rebel-galaxy-outlaw/), pela assistência de mira e perseguição opcionais, e [Galaxy on Fire 2 — manual oficial](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/212010/manuals/Manual_GoF2FullHD_STEAM_ENG.pdf?t=1447355835), pela adaptação da pilotagem a diferentes dispositivos. A combinação de controles e os valores de balanceamento acima são específicos do NaveStar.
