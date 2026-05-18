<?php
// planeta.php — Planeta com textura contínua e polos preenchidos
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Planeta Girando — Completo</title>
<style>
  html, body {
    margin: 0;
    height: 100%;
    background: #000;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* Máscara circular */
  .planet-container {
    position: relative;
    width: 850px;
    height: 850px;
    border-radius: 50%;
    overflow: hidden;
    background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.08), rgba(0,0,0,0.9));
  }

  /* Camada principal (faixa central + leve expansão vertical) */
  .planet-layer {
    position: absolute;
    top: -20%;
    left: 0;
    width: 400%;
    height: 140%;
    background: url('marte.png') repeat-x center center;
    background-size: 200% 80%; /* cobre um pouco acima e abaixo */
    animation: moveLayer 40s linear infinite;
    filter: brightness(1.15) contrast(1.2) saturate(1.1);
  }

  /* Camada de mistura (para suavizar a junção) */
  .planet-blend {
    position: absolute;
    top: -35%;
    left: 0;
    width: 400%;
    height: 140%;
    background: url('marte.png') repeat-x center center;
    background-size: 200% 80%;
    animation: moveLayer 41s linear infinite;
    opacity: 15.35;
    mix-blend-mode: lighten;
    mask-image: linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%);
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%);
    filter: brightness(1.1) contrast(1.1) blur(1.2px);
  }

  /* Gradiente para preencher os polos (sutil e natural) */
  .planet-poles {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 0%, rgba(255, 150, 60, 0.1), transparent 60%),
                radial-gradient(circle at 50% 100%, rgba(255, 100, 40, 0.1), transparent 60%);
    pointer-events: none;
    z-index: 1;
  }

  /* Halo externo */
  .planet-container::before {
    content: "";
    position: absolute;
    inset: -140px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,120,40,0.18), transparent 70%);
    filter: blur(120px);
    z-index: -1;
  }

  /* Luz e sombra globais */
  .planet-container::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: radial-gradient(circle at 25% 25%, rgba(255,255,255,0.08), rgba(0,0,0,0.9) 80%);
    pointer-events: none;
  }

  /* Movimento de rotação */
  @keyframes moveLayer {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  /* Sombra interna */
  .inner-shadow {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    box-shadow: inset 0 0 90px 60px rgba(0,0,0,0.7);
    pointer-events: none;
    z-index: 3;
  }
</style>
</head>
<body>

  <div class="planet-container">
    <div class="planet-layer"></div>
    <div class="planet-blend"></div>
    <div class="planet-poles"></div>
    <div class="inner-shadow"></div>
  </div>

<script>
  // Efeito de respiração (zoom orgânico)
  const layers = document.querySelectorAll('.planet-layer, .planet-blend');
  let zoom = 1, dir = 1;

  function animateZoom() {
    zoom += dir * 0.0006;
    if (zoom > 1.04 || zoom < 0.96) dir *= -1;
    layers.forEach(l => l.style.transform = `scale(${zoom})`);
    requestAnimationFrame(animateZoom);
  }
  animateZoom();
</script>

</body>
</html>
