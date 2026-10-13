<?php
declare(strict_types=1);
session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
session_start();
require_once __DIR__ . '/database/connection.php';

if (empty($_SESSION['user_id'])) {
    header('Location: login.php?next=avatar.php');
    exit;
}

$avatars = [
    'captain' => ['name'=>'Capitão','role'=>'Comando da estação','gender'=>'Masculino','callsign'=>'01 · COMANDO','color'=>'#eab354','accent'=>'#e6b75a','hair'=>'#40404a','skin'=>'#c59276','bio'=>'Uniforme de comando orbital. Este é o personagem padrão da tripulação.'],
    'pilot' => ['name'=>'Piloto','role'=>'Navegação de voo','gender'=>'Feminino','callsign'=>'02 · PILOTAGEM','color'=>'#ff8a45','accent'=>'#ffc073','hair'=>'#201d27','skin'=>'#e6b29a','bio'=>'Traje de voo com visor e detalhes de pilotagem.'],
    'engineer' => ['name'=>'Engenheiro','role'=>'Sistemas e reparos','gender'=>'Masculino','callsign'=>'03 · ENGENHARIA','color'=>'#98bb73','accent'=>'#e6ba62','hair'=>'#593628','skin'=>'#ca956c','bio'=>'Equipamento reforçado para manutenção e reparos da estação.'],
    'medic' => ['name'=>'Médica','role'=>'Saúde da tripulação','gender'=>'Feminino','callsign'=>'04 · MEDICINA','color'=>'#ff6971','accent'=>'#d73c4c','hair'=>'#e4c17c','skin'=>'#f0c9b0','bio'=>'Uniforme médico com kit de atendimento e insígnia de resgate.'],
    'security' => ['name'=>'Segurança','role'=>'Proteção e vigilância','gender'=>'Masculino','callsign'=>'05 · SEGURANÇA','color'=>'#de686a','accent'=>'#db444a','hair'=>'#18161b','skin'=>'#784938','bio'=>'Traje tático para patrulha e proteção do habitat.'],
    'navigator' => ['name'=>'Navegadora','role'=>'Mapas e trajetórias','gender'=>'Feminino','callsign'=>'06 · NAVEGAÇÃO','color'=>'#ffc470','accent'=>'#e9b65f','hair'=>'#151927','skin'=>'#e5b59a','bio'=>'Uniforme de navegação com projeção holográfica de rotas.'],
    'scientist' => ['name'=>'Cientista','role'=>'Pesquisa orbital','gender'=>'Masculino','callsign'=>'07 · PESQUISA','color'=>'#c8ebff','accent'=>'#75c4df','hair'=>'#aab6bc','skin'=>'#c99076','bio'=>'Traje de laboratório com visor de dados e instrumentos de pesquisa.'],
    'comms' => ['name'=>'Comunicações','role'=>'Operação de sinais','gender'=>'Feminino','callsign'=>'08 · COMUNICAÇÕES','color'=>'#bb82ff','accent'=>'#bc6bfa','hair'=>'#8537a2','skin'=>'#d89b89','bio'=>'Especialista em comunicação, equipada com interface de rádio.'],
    'mechanic' => ['name'=>'Mecânico','role'=>'Manutenção pesada','gender'=>'Alienígena','callsign'=>'09 · MECÂNICA','color'=>'#e9b156','accent'=>'#f0ae4f','hair'=>'#3d4c63','skin'=>'#6d92c4','bio'=>'Mecânica alienígena com traje reforçado e ferramenta de grande porte.'],
    'cadet' => ['name'=>'Cadete','role'=>'Treinamento espacial','gender'=>'Jovem','callsign'=>'10 · CADETE','color'=>'#ffd27a','accent'=>'#eab046','hair'=>'#543322','skin'=>'#efbd9d','bio'=>'Cadete em treinamento, com uniforme de aprendizagem espacial.'],
];

if (empty($_SESSION['csrf_token'])) $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
$userId = (int)$_SESSION['user_id'];
$error = '';
$saved = false;
$selected = 'captain';
try {
    $pdo = db();
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!hash_equals($_SESSION['csrf_token'], (string)($_POST['csrf_token'] ?? ''))) {
            $error = 'A sessão expirou. Atualize e tente novamente.';
        } else {
            $choice = (string)($_POST['avatar_code'] ?? '');
            if (!isset($avatars[$choice])) $error = 'Escolha um personagem válido.';
            else {
                $stmt = $pdo->prepare('UPDATE users SET avatar_code=? WHERE id=?');
                $stmt->execute([$choice, $userId]);
                $selected = $choice;
                $saved = true;
            }
        }
    }
    if (!$saved) {
        $stmt = $pdo->prepare('SELECT avatar_code FROM users WHERE id=?');
        $stmt->execute([$userId]);
        $stored = (string)$stmt->fetchColumn();
        if (isset($avatars[$stored])) $selected = $stored;
    }
} catch (Throwable $exception) {
    error_log('Avatar do piloto: ' . $exception->getMessage());
    $error = 'Não foi possível carregar os personagens. Verifique a migração do banco de dados.';
}
function h(string $value): string { return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
?>
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Escolher piloto · NAVE</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
:root{color-scheme:dark;--cyan:#83e7ea;--muted:#789aa6;--line:rgba(112,190,205,.22);--panel:rgba(5,17,28,.88)}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 76% 36%,rgba(19,87,116,.25),transparent 42%),radial-gradient(ellipse at 13% 80%,rgba(24,54,94,.24),transparent 38%),#030914;color:#e8f6f7;font-family:'Barlow Condensed',sans-serif}body:before{content:"";position:fixed;inset:0;pointer-events:none;background-image:radial-gradient(1px 1px at 10% 20%,#8ac6d3 90%,transparent),radial-gradient(1px 1px at 77% 29%,#b7dce3 90%,transparent),radial-gradient(1px 1px at 55% 77%,#6ca1ad 90%,transparent),radial-gradient(1px 1px at 91% 85%,#9cbec9 90%,transparent);background-size:240px 190px,330px 270px,290px 230px,410px 310px;opacity:.4}.top{height:64px;position:relative;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(16px,4vw,56px);border-bottom:1px solid var(--line);background:rgba(3,11,20,.78)}.brand{font:700 16px 'Space Mono';letter-spacing:.22em}.brand b{color:var(--cyan)}.brand small{font-size:8px;color:#7695a2;letter-spacing:.14em}.top a{color:#bde7eb;text-decoration:none;border:1px solid var(--line);padding:9px 12px;font:9px 'Space Mono';letter-spacing:.1em}.wrap{position:relative;width:min(1200px,94vw);margin:40px auto 56px}.eyebrow{font:9px 'Space Mono';letter-spacing:.2em;color:#75acba}.heading{display:flex;justify-content:space-between;align-items:end;gap:18px;margin-bottom:24px}.heading h1{margin:7px 0 2px;font-size:clamp(30px,5vw,48px);font-weight:500;letter-spacing:.02em}.heading p{margin:4px 0;color:#91aeb6;font-size:16px}.crew-count{font:9px 'Space Mono';color:#7fa6b0;border:1px solid var(--line);padding:10px 12px;white-space:nowrap}.layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:18px;align-items:start}.grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:11px}.card{position:relative;min-width:0;overflow:hidden;padding:0;text-align:left;color:inherit;background:linear-gradient(155deg,rgba(13,34,49,.95),rgba(5,14,24,.95));border:1px solid rgba(105,171,189,.2);cursor:pointer;transition:transform .2s,border-color .2s,box-shadow .2s}.card:hover{transform:translateY(-3px);border-color:rgba(117,224,229,.6)}.card.selected{border-color:var(--cyan);box-shadow:0 0 20px rgba(85,218,223,.16),inset 0 0 0 1px rgba(105,228,230,.3)}.portrait{display:block;width:100%;aspect-ratio:1/1.08;background:radial-gradient(ellipse at 50% 64%,rgba(53,120,139,.24),rgba(5,17,28,.1) 70%)}.card-meta{padding:10px 10px 12px;border-top:1px solid rgba(107,179,191,.12)}.card-meta strong,.card-meta small{display:block}.card-meta strong{font-size:17px;font-weight:600}.card-meta small{margin-top:3px;color:#7fa3ad;font:7px 'Space Mono';letter-spacing:.08em}.badge{position:absolute;top:8px;left:8px;padding:5px 6px;color:#c5eeee;background:rgba(4,16,26,.82);border:1px solid rgba(114,209,215,.23);font:7px 'Space Mono';letter-spacing:.07em}.check{position:absolute;top:8px;right:8px;width:20px;height:20px;display:grid;place-items:center;border-radius:50%;background:#76ded2;color:#041318;font:12px 'Space Mono';opacity:0;transform:scale(.7);transition:.2s}.card.selected .check{opacity:1;transform:scale(1)}.preview{position:sticky;top:18px;border:1px solid var(--line);background:linear-gradient(150deg,rgba(8,27,40,.96),rgba(4,13,23,.97));box-shadow:0 24px 70px rgba(0,0,0,.26)}.preview-image{display:block;width:100%;height:245px;background:radial-gradient(ellipse at center,rgba(42,112,128,.25),transparent 67%)}.preview-info{padding:16px 18px 18px;border-top:1px solid var(--line)}.preview-info h2{margin:5px 0 1px;font-size:29px;font-weight:500}.role{font:8px 'Space Mono';letter-spacing:.12em;color:var(--cyan)}.preview-info p{min-height:58px;margin:13px 0;color:#9ab5bd;font-size:15px;line-height:1.35}.detail{display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid rgba(107,179,191,.12);font:8px 'Space Mono';color:#a6c1c7}.detail span:first-child{color:#6f919e}.submit{width:100%;margin-top:15px;padding:12px;border:1px solid rgba(111,229,228,.55);background:linear-gradient(100deg,rgba(32,116,129,.4),rgba(17,48,69,.7));color:#cafffa;font:9px 'Space Mono';letter-spacing:.12em;cursor:pointer}.submit:hover{background:rgba(43,143,153,.4)}.message{margin:0 0 14px;padding:10px 12px;border:1px solid rgba(247,152,120,.35);background:rgba(110,38,34,.16);color:#ffc3a5;font-size:14px}.message.ok{border-color:rgba(112,227,180,.32);background:rgba(36,107,79,.13);color:#aaf3cd}.footnote{margin-top:16px;color:#648490;font:7px 'Space Mono';line-height:1.8}.mobile-submit{display:none}@media(max-width:920px){.layout{grid-template-columns:1fr 260px}.grid{grid-template-columns:repeat(3,minmax(0,1fr))}.preview-image{height:205px}}@media(max-width:640px){.top{height:56px;padding:0 14px}.wrap{margin:25px auto}.heading{align-items:start;flex-direction:column;margin-bottom:17px}.heading h1{font-size:34px}.layout{display:flex;flex-direction:column-reverse}.preview{position:static;width:100%;display:grid;grid-template-columns:125px 1fr}.preview-image{height:100%;min-height:205px}.preview-info{padding:12px}.preview-info h2{font-size:24px}.preview-info p{min-height:0;margin:8px 0;font-size:13px}.detail{padding:5px 0;font-size:7px}.preview .submit{margin-top:9px;padding:9px}.grid{grid-template-columns:repeat(2,minmax(0,1fr));width:100%}.card-meta{padding:8px}.card-meta strong{font-size:15px}.crew-count{padding:8px}}
</style>
</head>
<body>
<header class="top"><div class="brand">N<b>A</b>VE <small>· CENTRAL DE TRIPULAÇÃO</small></div><nav><a href="catélogo.php">CATALOGO DO SETOR</a> &nbsp; <a href="index.php">VOLTAR AO JOGO</a></nav></header>
<main class="wrap">
<div class="heading"><div><div class="eyebrow">PERSONALIZAÇÃO DE PILOTO</div><h1>Escolha quem vai ao comando</h1><p>Selecione seu avatar para representar você no setor.</p></div><div class="crew-count">10 PERSONAGENS · 10 TRAJES DE TRIPULAÇÃO</div></div>
<?php if ($error): ?><div class="message" role="alert"><?= h($error) ?></div><?php elseif ($saved): ?><div class="message ok" role="status">Avatar salvo no seu perfil. Ele já representa você no multiplayer.</div><?php endif; ?>
<form method="post" class="layout" id="avatarForm">
<input type="hidden" name="csrf_token" value="<?= h($_SESSION['csrf_token']) ?>"><input type="hidden" name="avatar_code" id="avatarCode" value="<?= h($selected) ?>">
<section class="grid" id="avatarGrid" aria-label="Personagens disponíveis"></section>
<aside class="preview" aria-live="polite"><svg class="preview-image" id="previewImage" viewBox="0 0 240 240" role="img" aria-label="Retrato do piloto selecionado"></svg><div class="preview-info"><div class="role" id="previewRole"></div><h2 id="previewName"></h2><p id="previewBio"></p><div class="detail"><span>CHAMADA</span><strong id="previewCallsign"></strong></div><div class="detail"><span>IDENTIDADE</span><strong id="previewGender"></strong></div><button class="submit" type="submit">CONFIRMAR AVATAR <span>→</span></button><div class="footnote">A ESCOLHA FICA VINCULADA À SUA CONTA E APARECE NO SEU PERFIL DE PILOTO.</div></div></aside>
</form>
</main>
<script>
const avatars=<?= json_encode($avatars, JSON_HEX_TAG|JSON_HEX_APOS|JSON_HEX_QUOT|JSON_HEX_AMP|JSON_UNESCAPED_UNICODE) ?>;
let selected=<?= json_encode($selected) ?>;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function portrait(a,large=false){const hairBack=a.gender==='Feminino'?`<path d="M53 108 Q41 38 119 34 Q191 35 180 116 L171 174 Q154 144 154 101 L77 95 Q76 140 61 165Z" fill="${a.hair}"/>`:`<path d="M57 102 Q51 38 119 39 Q182 40 180 103 L163 87 Q128 66 77 88Z" fill="${a.hair}"/>`;const hairFront=a.gender==='Feminino'?`<path d="M63 91 Q74 37 127 47 Q155 50 171 81 Q140 73 121 65 Q103 85 65 99Z" fill="${a.hair}"/>`:`<path d="M67 83 Q79 42 125 48 Q156 51 168 79 Q127 65 96 80 L77 91Z" fill="${a.hair}"/>`;return `<svg viewBox="0 0 240 240" role="img" aria-label="Retrato de ${esc(a.name)}"><defs><radialGradient id="bg-${esc(a.callsign)}"><stop stop-color="${a.color}" stop-opacity=".28"/><stop offset="1" stop-color="#071521" stop-opacity="0"/></radialGradient><linearGradient id="suit-${esc(a.callsign)}" x2="0" y2="1"><stop stop-color="#23465a"/><stop offset="1" stop-color="#0a1b29"/></linearGradient></defs><rect width="240" height="240" fill="url(#bg-${esc(a.callsign)})"/><circle cx="120" cy="112" r="85" fill="none" stroke="${a.color}" stroke-opacity=".18"/><circle cx="120" cy="112" r="72" fill="none" stroke="${a.accent}" stroke-opacity=".13" stroke-dasharray="2 6"/><path d="M35 240 Q42 184 79 168 L120 157 160 168 Q199 184 205 240Z" fill="url(#suit-${esc(a.callsign)})" stroke="${a.color}" stroke-opacity=".55" stroke-width="2"/>${hairBack}<path d="M100 151 L99 176 Q120 196 142 176 L139 149Z" fill="${a.skin}"/><path d="M82 99 Q82 70 120 68 Q158 70 158 99 L153 132 Q145 157 120 160 Q95 157 87 132Z" fill="${a.skin}" stroke="#f0c4a1" stroke-opacity=".2"/><path d="M83 112 Q72 102 77 122 Q80 133 89 133M157 112 Q168 102 163 122 Q160 133 151 133" fill="${a.skin}" stroke="#e2ad8e" stroke-width="3"/><path d="M94 111h14M132 111h14" stroke="#362d31" stroke-width="3" stroke-linecap="round"/><path d="M97 120h8M135 120h8" stroke="#e7f8ef" stroke-width="2" stroke-linecap="round"/><path d="M119 116l-3 17 8 2" fill="none" stroke="#8c5f54" stroke-width="2" stroke-linecap="round"/><path d="M106 143 Q120 149 134 142" fill="none" stroke="#7e4245" stroke-width="2" stroke-linecap="round"/>${hairFront}<path d="M74 178 94 166 120 188 146 166 166 178 155 240H85Z" fill="#122d3a" stroke="${a.color}" stroke-opacity=".45"/><path d="M110 181l10 8 10-8-4 31h-12Z" fill="${a.color}" fill-opacity=".72"/><path d="M89 196h-17v26h17M151 196h17v26h-17" fill="none" stroke="#7198a5" stroke-width="3"/><rect x="150" y="202" width="18" height="10" rx="2" fill="${a.accent}"/><circle cx="159" cy="207" r="2" fill="#10202a"/><path d="M36 224h39M166 224h38" stroke="${a.color}" stroke-opacity=".55"/><circle cx="50" cy="224" r="2" fill="${a.accent}"/><circle cx="192" cy="224" r="2" fill="${a.accent}"/></svg>`}
const grid=document.querySelector('#avatarGrid');grid.innerHTML=Object.entries(avatars).map(([code,a])=>`<button type="button" class="card ${code===selected?'selected':''}" data-avatar="${esc(code)}" aria-pressed="${code===selected}"><span class="badge">${esc(a.callsign)}</span><span class="check">✓</span><span class="portrait">${portrait(a)}</span><span class="card-meta"><strong>${esc(a.name)}</strong><small>${esc(a.role.toUpperCase())}</small></span></button>`).join('');
function selectAvatar(code){if(!avatars[code])return;selected=code;document.querySelector('#avatarCode').value=code;const a=avatars[code];document.querySelectorAll('.card').forEach(card=>{const active=card.dataset.avatar===code;card.classList.toggle('selected',active);card.setAttribute('aria-pressed',String(active))});document.querySelector('#previewImage').innerHTML=portrait(a);document.querySelector('#previewImage').setAttribute('aria-label','Retrato de '+a.name);document.querySelector('#previewName').textContent=a.name;document.querySelector('#previewRole').textContent=a.role.toUpperCase();document.querySelector('#previewBio').textContent=a.bio;document.querySelector('#previewCallsign').textContent=a.callsign;document.querySelector('#previewGender').textContent=a.gender}
grid.addEventListener('click',event=>{const card=event.target.closest('[data-avatar]');if(card)selectAvatar(card.dataset.avatar)});selectAvatar(selected);
</script>
</body></html>
