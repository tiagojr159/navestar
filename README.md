# Navestar

Aplicacao visual em 3D com um universo navegavel de 100000 x 100000 unidades, 9 planetas, o Sol fora da area de voo e 10 grandes luas do sistema solar.

## Estrutura

- `index.php`: entrada da aplicacao.
- `cadastro.php`: cadastro visual de usuario.
- `perfil.php`: perfil do usuario com nave ativa, amigos e premios.
- `naves.php`: tabelas de naves e armas.
- `amigos.php`: tela para amigos do usuario.
- `app/bootstrap.php`: carregamento inicial das configuracoes.
- `app/GameData.php`: dados locais usados enquanto o banco nao esta conectado.
- `config/database.php`: camada preparada para os dados de conexao com banco.
- `database/schema.sql`: tabelas de usuarios, naves, armas, amigos, premios, movimentos e combate.
- `public/assets/css/app.css`: estilos da interface.
- `public/assets/js/main.js`: inicializacao da experiencia.
- `public/assets/js/scene`: cena 3D, universo, planetas, luas e texturas.
- `public/assets/js/controls`: navegacao em primeira pessoa.
- `public/vendor`: bibliotecas locais usadas pela cena.

## Uso

Abra pelo XAMPP:

```text
http://127.0.0.1/navestar/
```

Na tela, clique no canvas ou no botao de entrada para capturar o mouse. Use `W`, `A`, `S`, `D` para mover, mouse ou setas para mirar, `R` ou `Espaco` para subir, `F`, `C` ou `Ctrl` para descer, `Shift` para acelerar e `E`, `Enter` ou clique esquerdo para atirar laser.

As paginas auxiliares estao disponiveis em:

```text
http://127.0.0.1/navestar/cadastro.php
http://127.0.0.1/navestar/perfil.php
http://127.0.0.1/navestar/naves.php
http://127.0.0.1/navestar/amigos.php
```
