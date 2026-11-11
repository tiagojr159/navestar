# Central de comunicações

O botão **COMUNICAÇÕES** abre conversas privadas com amigos e o canal de texto do compartimento atual da estação. No celular, ele aparece como um ícone de conversa. Os atalhos de chamada na lista de amigos e na barra lateral usam a mesma central de chamadas privadas.

## Conversas

- Busca de contatos, presença online e contagem de mensagens não lidas.
- Histórico paginado, horários locais e confirmação de leitura nas conversas privadas.
- Indicador de digitação e rascunho por conversa enquanto a página estiver aberta.
- Enter envia; Shift + Enter insere uma linha. A composição por IME não envia antes da confirmação do texto.
- Até 2.000 caracteres Unicode por mensagem, com limite de envio por usuário.
- Mensagens pendentes e falhas aparecem na conversa. **Reenviar** preserva o identificador original para não duplicar uma mensagem já recebida pelo servidor.
- As mensagens só são marcadas como lidas com a conversa aberta, janela em foco e histórico posicionado no final. O cursor de leitura acompanha o histórico efetivamente carregado.
- Conversas privadas exigem amizade. O canal da estação exige presença no compartimento correspondente. Ao mudar de sala, selecione o novo canal.

O texto é persistido no MySQL e exibido como texto escapado, sem interpretar HTML. O histórico não é criptografado de ponta a ponta. Não há exclusão automática das mensagens.

## Chamadas

- Áudio ou vídeo, com convite identificando o modo. Um convite de vídeo pode ser atendido apenas com áudio.
- O destinatário só autoriza os dispositivos depois de escolher atender. O remetente autoriza os dispositivos ao iniciar a chamada.
- Controles de microfone, câmera e saída de áudio, compartilhamento de tela e seleção de microfone/câmera. O compartilhamento depende do suporte do navegador.
- Prévia local e vídeo remoto ficam sem reprodução de áudio; apenas um elemento reproduz o áudio remoto, evitando duplicação.
- Duração começa quando o WebRTC confirma a conexão. A interface distingue permissão, chamada, conexão, reconexão e encerramento.
- Minimizar ou fechar a janela durante uma chamada privada mantém a chamada ativa. **Encerrar** libera imediatamente os dispositivos, mesmo sem resposta do servidor.
- Capturas autorizadas depois do cancelamento são interrompidas. A mesma proteção vale para a troca de dispositivos.
- Uma queda de conexão tenta reiniciar ICE; uma conexão que não retorna é encerrada. Chamadas não atendidas expiram em 35 segundos. Sessões abandonadas deixam de ocupar a linha após expirar a presença da chamada.

Chamadas individuais da estação e chamadas em grupo continuam disponíveis. Foram acrescentados controles de microfone/câmera, duração e participantes ao grupo, proteção contra chamadas simultâneas e liberação imediata de mídia na saída. A chamada privada não inicia enquanto outro canal de voz estiver em uso.

## Servidor

1. Inicie **Apache** e **MySQL** no XAMPP.
2. Abra o jogo com duas contas amigas, em navegadores ou dispositivos distintos.
3. Use **localhost** ou **HTTPS**. Para acesso de outro aparelho, use HTTPS no endereço servido à rede.

As novas tabelas são criadas automaticamente na primeira operação de comunicações. Em instalações com migração administrada, execute `database/migrations/20261111_communications.sql`. As tabelas anteriores de amigos, chamadas e sinais continuam necessárias; elas estão em `database/friends-upgrade.sql`.

A sinalização privada passa pela API e pelo banco. O cliente usa um cursor de sinais: uma resposta perdida pode ser recuperada na próxima consulta. O WebSocket acelera notificações e é opcional; sua indisponibilidade não impede o uso da API.

Para habilitá-lo, execute `php call-socket-server.php` como processo supervisionado. Configure `NAVE_CALL_SOCKET_PORT` para uma porta livre, diferente da porta HTTP do Apache. Em HTTPS, configure `NAVE_CALL_SOCKET_URL` com a URL `wss://` do proxy reverso. O segredo `NAVE_CALL_SOCKET_SECRET` precisa ser igual no PHP web e no processo do socket.

Para redes restritivas ou chamadas entre redes diferentes, configure um servidor TURN:

- `NAVE_TURN_URLS`: URLs TURN, separadas por vírgula.
- `NAVE_TURN_USERNAME`: usuário do serviço TURN.
- `NAVE_TURN_PASSWORD`: credencial do serviço TURN.

Essas variáveis devem estar disponíveis ao PHP web. As chamadas usam STUN por padrão e incluem TURN quando configurado. STUN sozinho não garante conectividade entre todas as redes, conforme a [documentação WebRTC](https://webrtc.org/getting-started/peer-connections). A negociação trata colisões de ofertas seguindo o padrão de [negociação WebRTC](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation).

## Verificação

```powershell
node --test tests/communications.test.cjs tests/communications-ui.test.cjs tests/flight-combat.test.cjs
C:/xampp/php/php.exe tests/communications-api.test.php
C:/xampp/php/php.exe -l communications-api.php
C:/xampp/php/php.exe -l multiplayer-api.php
C:/xampp/php/php.exe -l index.php
```

Os testes usam dispositivos, transporte e conexões simulados. Verificam autorização de conversas, limites de texto, formato dos sinais, confirmação/reenvio de mensagens, permissão antes do atendimento, ICE recebido antes do SDP, cancelamento, negociação simultânea, reconexão e encerramento sem rede. Chamadas reais e o layout em aparelhos físicos precisam ser verificados com o MySQL e os navegadores disponíveis.
