# Banco do Explorador Espacial

## Criar e popular o banco

1. Inicie **Apache** e **MySQL** no XAMPP.
2. Abra o phpMyAdmin em `http://localhost/phpmyadmin`.
3. Use **Importar** e selecione `database/schema.sql`.

O arquivo cria o banco `nave`, as tabelas de usuários, naves, equipamentos, planetas, luas, asteroides e estações, além do catálogo inicial. Ele também cadastra os corpos que já existem no jogo e os 200 asteroides distribuídos pelo mapa.

Se você já tinha importado uma versão anterior do esquema, importe também `database/multiplayer-upgrade.sql` uma vez para adicionar o campo de presença online.
If this database already exists, also import `database/friends-upgrade.sql` to create the friendship, voice call, and recorded voice message tables.

## Usar a conexão PDO

```php
require_once __DIR__ . '/database/connection.php';

$pdo = db();
$statement = $pdo->prepare('SELECT id, name FROM planets WHERE is_visible = ?');
$statement->execute([1]);
$planets = $statement->fetchAll();
```

As credenciais locais estão em `database/connection.php`: host `localhost`, banco `nave`, usuário `root` e senha vazia.

## Multiplayer

Abra `login.php` para criar uma conta ou entrar. Cada usuário recebe uma nave própria. Com duas contas abertas em navegadores ou sessões diferentes, a posição é sincronizada pelo `multiplayer-api.php`; os pilotos online são consultados a cada segundo e aparecem como naves âmbar no espaço e no minimapa. A presença expira após 20 segundos sem comunicação.
Amigos podem aceitar pedidos e iniciar chamadas de voz com pilotos online. O navegador solicita permissao para usar o microfone; a chamada requer localhost ou HTTPS.
Mensagens de áudio gravadas ficam em `data/voice-messages/AAAA-MM-DD/`; a tabela `voice_messages` guarda apenas o remetente, destinatário, data e caminho do arquivo. Pastas antigas podem ser apagadas manualmente. A caixa de entrada limpa arquivos e registros vencidos após 24 horas, no máximo uma vez por hora enquanto o jogo consulta mensagens. Para executar a limpeza manualmente no XAMPP, rode `C:\xampp\php\php.exe C:\xampp\htdocs\nave\cleanup-voice-messages.php` no Prompt de Comando. O amigo online recebe uma jánela azul com tentativa de reprodução automática e controles para ouvir ou fechar a mensagem.


## Combate e recuperação de destroços

Se a instalação já existia, importe `database/combat-upgrade.sql` uma vez. O arquivo adiciona integridade do casco e energia à nave e cria a tabela de destroços; os destroços expiram após 24 horas. Para atacar, equipe um canhão, selecione uma nave de outro piloto e use **SPACE**. Ao destruir a nave, aproxime-se do destroço, clique nele e recolha a carga. O piloto destruído pode reconstruir a nave no Porto Aurora.

## Banco das estácoes

Para bases já instaladas, importe `database/station-bank-upgrade.sql`. Cada estação mantem um cofre separado por piloto, com saldo de creditos e estoque mineral; depositos e saques exigem nave operacional a ate 2.200 km do terminal. O estoque usa itens por codigo para permitir adicionar outros minerios ao catélogo.

## Venda de minerios nas estácoes

Para instalacoes já existentes, importe `database/station-sale-upgrade.sql`. O catélogo define o preco-base por kg; a estação paga automaticamente 50% desse valor. Os precos iniciais sao 10 CR/kg para ferro, 20 CR/kg para niquel e 30 CR/kg para cobalto. E possivel vender tanto a carga da nave quanto o estoque do cofre da estação.

Para bases existentes, importe `database/weapon-siege-upgrade.sql` para adicionar custos minerais aos equipamentos e cadastrar o canhao de cerco de singularidade. Ele custa 50.000 CR, 1.000 kg de ferro, 700 kg de niquel e 300 kg de cobalto; causa 150 de dano e recebe 30 cargas.

Para ativar montagem/remoção de canhões e peso do armamento em bancos existentes, importe `database/weapon-mount-upgrade.sql`. Pesos: pulso 180 kg, íons 260 kg, plasma 420 kg e singularidade 700 kg.


## Canal aberto de audio

Para bancos existentes, execute `database/voice-open-channel-upgrade.sql` uma vez. O botao de transmissao aberta aparece no painel de amigos e envia o audio aos pilotos online com nave operacional em ate 5.000 km (limite de 32 destinatarios). O destinatario recebe um aviso e decide ouvir ou fechar; mensagens privadas continuam restritas a amigos. Os arquivos reaproveitam a limpeza automatica apos 24 horas.


## Acoplamento e tripulacao multiplayer

A migracao `database/crew-stations-upgrade.sql` prepara o acoplamento persistente, o interior da estação, convites e uma unica vaga de copiloto por nave. A nave acoplada sai do mapa de voo e fica guardada. Ambos os pilotos precisam estar no habitat da mesma estação; o comandante convida um piloto na lista do interior. O comandante controla navegacao, enquanto o copiloto nao consegue mover a nave e usa os sistemas disponíveis do painel. A integridade da estação tambem e persistida e pode ser reduzida por disparos de canhao a ate 25.000 km.

## Controles e intercom da tripulacao

Em uma nave com copiloto, os comandos de navegacao ficam azuis e continuam exclusivos do piloto; armas, mineracao e ataque ficam vermelhos. O piloto pode acionar ambos os grupos. O intercom em grupo entre piloto, copiloto e passageiros abre automaticamente quando estáo online, apos a permissao do microfone no navegador. Para bancos existentes, importe `database/crew-voice-upgrade.sql`; a migracao foi executada no banco local `nave` deste ambiente. O canal usa WebRTC com STUN. Para redes que exigem retransmissao, configure `NAVE_TURN_URLS`, `NAVE_TURN_USERNAME` e `NAVE_TURN_PASSWORD` no ambiente do PHP com os dados do seu servidor TURN. O jogo precisa estar em `localhost` ou HTTPS para acessar o microfone.

## Passageiros e viagens entre estácoes

Jogadores que estejam a pe dentro de uma estação podem selecionar uma nave ativa com piloto presente, escolher outra estação e comprar a passagem. A tarifa e calculada pela distancia e transferida ao piloto no embarque. A capacidade de passageiros e 4 assentos nas naves comuns, 2 nas naves de ataque e 12 nos cargueiros. O passageiro ve a cabine de carga, ouve e fala no intercom da nave, mas nao controla a nave. Ele desembarca automaticamente quando a nave atraca na estação escolhida. Para bancos existentes, importe `database/passenger-travel-upgrade.sql`.
