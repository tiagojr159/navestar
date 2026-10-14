(() => {
  const style = document.createElement('style');
  style.textContent = `
    .mobile-cockpit{display:none}
    @media(max-width:767px), (max-width:1024px) and (pointer:coarse){
      html,body{width:100%;height:100%;height:100dvh;overflow:hidden;overscroll-behavior:none}
      #space{height:100dvh;inset:0;touch-action:none}
      .grain,.reticle,.labels{pointer-events:none}
      .top,.leftpanel,.bottomleft,.bottomright,.help,.control-sidebar,#leftControlDock{display:none!important}
      .mobile-cockpit.interior-mode{z-index:130!important}.mobile-cockpit.interior-mode .mc-hud,.mobile-cockpit.interior-mode .mc-pop,.mobile-cockpit.interior-mode .mc-context,.mobile-cockpit.interior-mode .mc-joystick,.mobile-cockpit.interior-mode .mc-actions{display:none!important}.mobile-cockpit.interior-mode .mc-menu-toggle{top:calc(env(safe-area-inset-top) + 62px);left:calc(env(safe-area-inset-left) + 10px);z-index:140}.mobile-cockpit.interior-mode .mc-menu{top:calc(env(safe-area-inset-top) + 112px);left:calc(env(safe-area-inset-left) + 10px);z-index:140;grid-template-columns:repeat(2,minmax(64px,1fr));width:min(224px,calc(100vw - 32px));box-sizing:border-box}.mc-menu .mc-icon[data-action="station"]{display:none}.mobile-cockpit.interior-mode .mc-menu .mc-icon[data-action="station-dashboard"]{display:grid;grid-template-columns:44px 1fr;align-items:center;width:auto;height:56px;padding:0 8px;text-align:left;font:10px "Space Mono";white-space:nowrap}.mobile-cockpit.interior-mode .mc-fullscreen{top:calc(env(safe-area-inset-top) + 62px);right:calc(env(safe-area-inset-right) + 10px);z-index:140}
      .mobile-cockpit.interior-mode .mc-menu{grid-template-columns:repeat(2,minmax(104px,1fr));width:min(320px,calc(100vw - 32px));max-height:calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 126px);overflow:auto}.mobile-cockpit.interior-mode .mc-menu .mc-icon:not([data-action="station-dashboard"]):not([data-station-action]):not([data-station-panel]){display:none!important}.mobile-cockpit.interior-mode .mc-menu [data-action="station-dashboard"]{grid-column:span 2}.mobile-cockpit.interior-mode .mc-menu [data-station-action],.mobile-cockpit.interior-mode .mc-menu [data-station-panel]{display:grid;grid-template-columns:44px 1fr;align-items:center;width:auto;height:56px;padding:0 8px;text-align:left;font:11px "Space Mono";white-space:nowrap}.mobile-cockpit.interior-mode .mc-menu .mc-station-item-icon{grid-column:1;grid-row:1;width:42px;height:42px;object-fit:contain;pointer-events:none}.mobile-cockpit.interior-mode .mc-menu .mc-icon small{display:inline;grid-column:2;color:#8bdde6;font-size:10px}.mobile-cockpit.interior-mode .mc-menu .mc-icon[hidden]{display:none!important}
      body.passenger-mode .passenger-cabin.open>header{display:none!important}
      body.passenger-mode .passenger-cabin.open>footer{position:absolute!important;inset:0!important;display:block!important;min-height:0!important;padding:0!important;border:0!important;background:transparent!important;pointer-events:none!important;z-index:10!important}
      body.passenger-mode .passenger-cabin.open>footer>div:not(.passenger-exit){display:none!important}
      body.passenger-mode .passenger-cabin.open .passenger-exit{position:fixed!important;top:calc(env(safe-area-inset-top) + 12px)!important;right:calc(env(safe-area-inset-right) + 12px)!important;z-index:155!important;display:block!important;width:44px;height:44px;min-width:44px;pointer-events:auto}
      body.passenger-mode #passengerDisembark{display:grid!important;place-items:center;width:44px!important;min-width:44px!important;height:44px!important;min-height:44px!important;padding:0;border:1px solid #68e7efaa;border-radius:13px;background:linear-gradient(145deg,#301b1bef,#1b1018ef);color:#ffd5c5;font-size:0}
      body.passenger-mode #passengerDisembark svg{display:none!important}body.passenger-mode #passengerDisembark:before{content:"×";font:24px "Space Mono"}body.passenger-mode .passenger-exit small{display:none!important}
      body.passenger-mode .mobile-cockpit.interior-mode{z-index:150!important}
      body.passenger-mode .mobile-cockpit.interior-mode .mc-hud,body.passenger-mode .mobile-cockpit.interior-mode .mc-fullscreen,body.passenger-mode .mobile-cockpit.interior-mode .mc-pop,body.passenger-mode .mobile-cockpit.interior-mode .mc-context,body.passenger-mode .mobile-cockpit.interior-mode .mc-joystick,body.passenger-mode .mobile-cockpit.interior-mode .mc-actions{display:none!important}
      body.passenger-mode .mobile-cockpit.interior-mode .mc-menu-toggle{top:calc(env(safe-area-inset-top) + 12px);left:calc(env(safe-area-inset-left) + 12px);z-index:150}
      body.passenger-mode .mobile-cockpit.interior-mode .mc-menu{top:calc(env(safe-area-inset-top) + 64px);left:calc(env(safe-area-inset-left) + 12px);z-index:150;grid-template-columns:repeat(2,minmax(112px,1fr));width:min(280px,calc(100vw - 24px));max-height:calc(100dvh - 80px);overflow:auto}
      body.passenger-mode .mobile-cockpit.interior-mode .mc-menu .mc-icon:not([data-action="friends"]):not([data-station-action="av"]){display:none!important}
      body.passenger-mode .mobile-cockpit.interior-mode .mc-menu .mc-icon[data-action="friends"]:not([data-station-action]):not([data-station-panel]):not([data-action="station-dashboard"]){display:grid!important}
      body.passenger-mode .mobile-cockpit.interior-mode .mc-menu [data-action="friends"],body.passenger-mode .mobile-cockpit.interior-mode .mc-menu [data-station-action="av"]{display:grid;grid-template-columns:40px 1fr;align-items:center;width:auto;height:54px;padding:5px;text-align:left;font:9px "Space Mono"}
      body.passenger-mode .mobile-cockpit.interior-mode .mc-menu .mc-station-item-icon{grid-column:1;grid-row:1;width:36px;height:36px;object-fit:contain}
      body.passenger-mode .mobile-cockpit.interior-mode .mc-menu .mc-icon small{display:inline;grid-column:2;color:#8bdde6;font-size:9px}
      body.passenger-mode #friendsPanel.open{z-index:190!important;inset:auto 10px 10px!important;transform:none!important;width:min(460px,calc(100vw - 20px))!important;height:min(70dvh,620px)!important;border-radius:14px!important}
      .crew-interior.open .crew-side.mobile-menu-collapsed{display:none!important}.crew-interior.open .crew-side.mobile-menu-open{position:fixed!important;z-index:145!important;inset:calc(env(safe-area-inset-top) + 112px) 10px auto!important;width:min(340px,calc(100vw - 20px))!important;max-height:calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 126px)!important;overflow:auto!important;padding:12px!important;border:1px solid #54c9dcaa!important;border-radius:12px!important;background:#061521f5!important;box-shadow:0 10px 32px #000c!important}.crew-interior.open .crew-layout:has(.crew-side.mobile-menu-collapsed){grid-template-rows:minmax(0,1fr) 0!important}.crew-interior.open .crew-layout:has(.crew-side.mobile-menu-open){grid-template-rows:minmax(0,1fr) 0!important}

      .mobile-cockpit{position:fixed;inset:0;z-index:35;display:block;height:100dvh;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);pointer-events:none;font-family:'Space Mono',monospace;color:#e9fbff;touch-action:none;user-select:none;-webkit-user-select:none}
      .mc-hud{position:absolute;top:calc(env(safe-area-inset-top) + 8px);left:50%;transform:translateX(-50%);display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;width:min(360px,calc(100vw - 112px));padding:6px;border:1px solid #55d8eb55;border-radius:13px;background:linear-gradient(135deg,#061521df,#071b28c9);box-shadow:0 0 20px #20cde41c;backdrop-filter:blur(10px)}
      .mc-stat{min-width:0;text-align:center}.mc-stat b{display:block;font-size:11px;line-height:1.2;font-weight:500;color:#dcfaff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mc-stat small{display:block;margin-top:3px;font-size:7px;letter-spacing:.1em;color:#71b9c8}.mc-integrity{grid-column:span 2}.mc-target{grid-column:span 3;text-align:left;padding-left:4px}.mc-target b{font-size:9px}.mc-target small{text-align:left}.mc-target .mc-loc{display:block;margin-top:2px;font-size:6px;color:#6699a7}.mc-bar{height:2px;margin-top:4px;background:#123340}.mc-bar i{display:block;width:100%;height:100%;background:#57dfe8;box-shadow:0 0 7px #57dfe8}
      .mc-menu-toggle{position:absolute;top:calc(env(safe-area-inset-top) + 8px);left:calc(env(safe-area-inset-left) + 8px);z-index:4;width:44px;height:44px;border:1px solid #68e7efaa;border-radius:13px;background:linear-gradient(145deg,#0b3040f2,#061622f2);color:#bdfcff;font:24px 'Space Mono';box-shadow:0 0 18px #26cde433;pointer-events:auto;touch-action:manipulation}.mc-menu-toggle:active,.mc-menu-toggle[aria-expanded="true"]{background:#0c5363;color:#fff;box-shadow:0 0 16px #26cde477}.mc-fullscreen{position:absolute;top:calc(env(safe-area-inset-top) + 8px);right:calc(env(safe-area-inset-right) + 8px);z-index:4;width:44px;height:44px;border:1px solid #68e7efaa;border-radius:13px;background:linear-gradient(145deg,#0b3040f2,#061622f2);color:#bdfcff;font:21px 'Space Mono';box-shadow:0 0 18px #26cde433;pointer-events:auto;touch-action:manipulation}.mc-fullscreen.active{background:#0c5363;color:#fff;box-shadow:0 0 16px #26cde477}.mc-menu{position:absolute;top:calc(env(safe-area-inset-top) + 60px);left:calc(env(safe-area-inset-left) + 8px);z-index:4;display:none;grid-template-columns:repeat(4,42px);gap:7px;padding:8px;border:1px solid #54c9dc70;border-radius:14px;background:#04121eeF;box-shadow:0 8px 24px #0009;backdrop-filter:blur(12px);pointer-events:auto}.mc-menu.open{display:grid}.mc-menu .mc-icon{width:42px;height:42px;border:1px solid #54c9dc70;border-radius:11px;background:#061b29;color:#9af4ff;font-size:19px;touch-action:manipulation}.mc-menu .mc-icon:active,.mc-menu .mc-icon.active{background:#0c5363;color:#fff;border-color:#7af6ff;box-shadow:0 0 14px #26cde477}.mc-menu .mc-icon small{display:none}
      .mc-joystick{position:absolute;left:calc(env(safe-area-inset-left) + 18px);bottom:calc(env(safe-area-inset-bottom) + 20px);width:142px;height:142px;border:1px solid #5cd7e55e;border-radius:50%;background:radial-gradient(circle,#1a60715c,#061724b8 68%);box-shadow:inset 0 0 28px #41d0e91c,0 6px 24px #0008;pointer-events:auto;touch-action:none}
      .mc-joystick:before,.mc-joystick:after{content:'';position:absolute;background:#67cbd633}.mc-joystick:before{width:1px;height:100%;left:50%}.mc-joystick:after{height:1px;width:100%;top:50%}
      .mc-stick{position:absolute;left:50%;top:50%;width:54px;height:54px;transform:translate(-50%,-50%);border:1px solid #7ce7f4;border-radius:50%;background:radial-gradient(circle at 35% 30%,#3191a4,#0a3041 78%);box-shadow:0 0 18px #37d5eb55;pointer-events:none}
      .mc-actions{position:absolute;right:calc(env(safe-area-inset-right) + 16px);bottom:calc(env(safe-area-inset-bottom) + 20px);display:grid;grid-template-columns:58px 58px;grid-template-rows:58px 48px;gap:8px;align-items:center;pointer-events:auto}
      .mc-action{border:1px solid #5cd5e577;border-radius:18px;background:linear-gradient(145deg,#0b3040e8,#061622ed);color:#bffaff;font:8px 'Space Mono';letter-spacing:.06em;box-shadow:0 4px 18px #0008;touch-action:none}.mc-action:active,.mc-action.pressed{transform:scale(.95);background:#126175;color:white;box-shadow:0 0 18px #3be4ee66}.mc-fire{grid-column:2;grid-row:1;width:66px;height:66px;margin-left:-4px;border-radius:50%;border-color:#ff6f7180;color:#ffaaaa;background:radial-gradient(circle,#6e242a,#1e101b)}.mc-fire:active,.mc-fire.pressed{background:#a8343b}.mc-boost{grid-column:1;grid-row:1;width:56px;height:56px;border-color:#ffb34f70;color:#ffd58d}.mc-brake{grid-column:1;grid-row:2}.mc-thrust{grid-column:2;grid-row:2}
      .mc-pop{position:absolute;z-index:2;display:none;left:auto;right:calc(env(safe-area-inset-right) + 10px);top:calc(env(safe-area-inset-top) + 60px);width:min(255px,calc(100vw - 82px));max-height:min(43dvh,calc(100dvh - 220px));overflow:auto;padding:11px;border:1px solid #59d8e67a;border-radius:14px;background:#04121eeF;box-shadow:0 10px 35px #000a,0 0 20px #1dbbce20;backdrop-filter:blur(14px);pointer-events:auto;overscroll-behavior:contain}.mc-pop.open{display:block}.mc-pop h3{margin:0 0 8px;font:9px 'Space Mono';letter-spacing:.14em;color:#7feaf1}.mc-pop .mapbox,.mc-pop .navbox,.mc-pop .route-panel,.mc-pop .cargo-bay{display:block!important;position:static!important;inset:auto!important;width:100%!important;min-width:0!important;max-width:none!important;max-height:none!important;margin:0!important;padding:8px!important;overflow:visible!important;box-sizing:border-box;background:#071b28!important;border:1px solid #3e9ba633!important;box-shadow:none!important}
      .mc-pop .map{height:110px}.mc-pop .maphead{font-size:8px}.mc-pop .navbox{max-height:32dvh!important;overflow:auto!important}.mc-pop .route-content{display:block!important}.mc-pop .route-content select,.mc-pop .route-content button{width:100%;margin-top:7px;padding:9px}.mc-pop .cargo-bay{max-height:35dvh!important;overflow:auto!important}.mc-pop .route-head{font-size:8px}.mc-pop .route-toggle,.mc-pop .cargo-fold{display:none!important}
      .mc-pop .mapbox .eyebrow,.mc-pop .mapbox .maphead span{font-size:7px}.mc-pop .targetbox{margin:0}.mc-context{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom) + 178px);transform:translateX(-50%);display:none;gap:6px;pointer-events:auto}.mc-context.visible{display:flex}.mc-context button{padding:8px 10px;border:1px solid #64d8df88;border-radius:10px;background:#06202cdb;color:#b9f9ef;font:7px 'Space Mono';touch-action:manipulation}.mc-context button:disabled{opacity:.35}
      .station-overlay.open{inset:auto 0 0!important;height:min(72dvh,650px)!important;padding:0!important;display:block!important;background:#020912eF!important;backdrop-filter:blur(12px)!important;z-index:80!important}.station-overlay.crew-market-open.open{z-index:125!important}.station-shell{width:100%!important;height:100%!important;max-height:100%!important;border-radius:18px 18px 0 0!important;border-bottom:0!important;overflow:hidden}.station-top{height:46px!important;padding:0 12px!important}.station-layout{height:calc(100% - 46px);overflow:auto!important}.station-market{padding:10px!important}.station-market .shipyard{margin:8px 0;padding:8px}.station-market .armory-grid{grid-template-columns:1fr 1fr!important;gap:6px}.station-market .shop-item{min-height:160px!important;padding:9px!important}.station-market .shop-item p{display:none}.station-market .resource-wallet{grid-template-columns:repeat(2,1fr)!important;margin:8px 0}.station-market .market-heading h1{font-size:17px!important}.station-market .market-heading p,.station-market .market-live{display:none}
      #friendsPanel.open{position:fixed!important;inset:auto 0 0!important;width:100%!important;max-width:none!important;height:min(70dvh,620px)!important;border-radius:18px 18px 0 0!important;z-index:80!important;overflow:auto!important}
    }
  `;
  style.textContent += '.mc-menu a.mc-icon{display:grid;place-items:center;text-decoration:none}';
  style.textContent += `
    @media(max-width:767px),(max-width:1024px) and (pointer:coarse){
      .mc-pop{position:fixed!important;left:50%!important;right:auto!important;top:50%!important;bottom:auto!important;transform:translate(-50%,-50%);width:min(360px,calc(100vw - 24px))!important;max-height:min(78dvh,calc(100dvh - 24px))!important;z-index:155!important;box-sizing:border-box}
      .mc-pop .mc-window-head,.mc-station-window-head{position:sticky;top:0;z-index:6;display:flex;align-items:center;justify-content:space-between;gap:10px;margin:-3px -3px 9px;padding:7px 8px;border:1px solid #347181;border-radius:8px;background:#0a2635;color:#93eaf0;font:9px 'Space Mono';letter-spacing:.08em;cursor:move;touch-action:none;user-select:none}
      .mc-pop .mc-window-head h3{margin:0;font:9px 'Space Mono';color:#93eaf0}
      .mc-window-close{flex:none;min-width:30px;height:28px;border:1px solid #5ab7c5;border-radius:6px;background:#09202c;color:#d7fbff;font:17px 'Space Mono';cursor:pointer;touch-action:manipulation}
      .mc-av-modal{position:fixed;z-index:170;top:50%;left:50%;width:min(340px,calc(100vw - 24px));max-height:min(78dvh,560px);overflow:auto;transform:translate(-50%,-50%);border:1px solid #56cfdf;border-radius:12px;background:linear-gradient(145deg,#09202dF5,#04111cf7);box-shadow:0 16px 48px #000c;color:#dcfaff;font:10px 'Space Mono',monospace;pointer-events:auto;touch-action:pan-y}.mc-av-modal[hidden]{display:none}.mc-av-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:7px;padding:8px 9px;border-bottom:1px solid #3d8493;background:#09202d;cursor:move;touch-action:none;user-select:none}.mc-av-head strong{margin-right:auto;color:#a8f3f0;font-size:10px;letter-spacing:.08em}.mc-av-head button,.mc-av-toggle{min-height:30px;padding:5px 9px;border:1px solid #4b9baa;border-radius:6px;background:#0a2936;color:#d4fcff;font:9px 'Space Mono';cursor:pointer;touch-action:manipulation}.mc-av-content{display:grid;gap:10px;padding:10px}.mc-av-modal.minimized .mc-av-content{display:none}.mc-av-group{display:grid;gap:5px;padding:8px;border:1px solid #245365;border-radius:8px;background:#061924}.mc-av-group label{color:#86cbd6;font-size:8px;letter-spacing:.06em}.mc-av-group select{width:100%;min-height:32px;padding:5px;background:#07131d;color:#e4fcff;border:1px solid #3c7785;border-radius:5px;font:9px 'Space Mono'}.mc-av-row{display:flex;align-items:center;gap:7px}.mc-av-row input[type=range]{flex:1;accent-color:#58d9df}.mc-av-state{min-height:14px;color:#91bcc4;font-size:8px}.crew-side .crew-dashboard-actions.mc-av-unified #crewIntercom,.crew-side .crew-dashboard-actions.mc-av-unified #crewRoomVideoCall{display:none!important}.crew-side .crew-dashboard-actions .crew-av-settings{display:grid;place-items:center;width:46px!important;height:46px!important;min-width:46px!important;margin:0!important;padding:5px!important;border:1px solid #4c9eae;border-radius:7px;background:linear-gradient(145deg,#103a4a,#091923);color:#aaf8ff;cursor:pointer}.crew-side .crew-dashboard-actions .crew-av-settings img{width:32px;height:32px;object-fit:contain}
      .crew-interior.open .crew-side.mobile-menu-open{left:10px!important;right:10px!important;top:calc(env(safe-area-inset-top) + 68px)!important;bottom:auto!important;inset:auto!important;width:min(420px,calc(100vw - 20px))!important;max-height:calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 82px)!important;z-index:150!important}
      .crew-side .mc-station-window-head{margin:0 0 8px}
      .station-overlay.mc-floating-window.open{inset:0!important;width:100vw!important;height:100dvh!important;max-height:none!important;padding:10px!important;display:grid!important;place-items:center!important;background:#020912aa!important;backdrop-filter:blur(5px)!important;z-index:150!important;pointer-events:auto!important}
      .station-overlay.mc-floating-window.open .station-shell{position:relative!important;width:min(680px,calc(100vw - 20px))!important;height:min(80dvh,700px)!important;max-height:calc(100dvh - 20px)!important;border-radius:14px!important}
      .station-overlay.mc-floating-window .station-top{cursor:move;touch-action:none;user-select:none}
      .friends-panel.mc-floating-window.open{position:fixed!important;left:50%!important;right:auto!important;top:50%!important;bottom:auto!important;transform:translate(-50%,-50%);width:min(520px,calc(100vw - 24px))!important;max-width:none!important;height:min(78dvh,680px)!important;z-index:155!important;overflow:auto!important}
      .friends-panel.mc-floating-window .social-head{cursor:move;touch-action:none;user-select:none}
      #stationCall.mc-floating-window.open:not(.video),#stationRoomCall.mc-floating-window.open:not(.video){inset:0!important;display:grid!important;place-items:center!important;padding:10px!important;z-index:155!important;pointer-events:auto!important}
      #stationCall.mc-floating-window .call-card,#stationRoomCall.mc-floating-window .room-call-card{position:relative!important;width:min(560px,calc(100vw - 20px))!important;max-height:82dvh!important;overflow:auto!important}
      #stationCall.mc-floating-window .call-head,#stationRoomCall.mc-floating-window header{cursor:move;touch-action:none;user-select:none}
      #callOverlay.mc-floating-window.open,#pilotOverlay.mc-floating-window.open{z-index:155!important}
      #callOverlay.mc-floating-window .call-card,#pilotOverlay.mc-floating-window .pilot-card{position:relative;cursor:default}
      #callOverlay.mc-floating-window #callTitle,#pilotOverlay.mc-floating-window .pilot-titlebar{cursor:move;touch-action:none;user-select:none}
    }
  `;
  document.head.appendChild(style);

  const ui = document.createElement('div');
  ui.className = 'mobile-cockpit';
  ui.innerHTML = `
    <div class="mc-hud" aria-label="Estado da nave">
      <div class="mc-stat mc-integrity"><b id="mcHull">100%</b><small>INTEGRIDADE</small><div class="mc-bar"><i id="mcHullBar"></i></div></div>
      <div class="mc-stat"><b id="mcFuel">—</b><small>COMBUSTÍVEL</small></div>
      <div class="mc-stat"><b id="mcSpeed">0</b><small>KM/S</small></div>
      <div class="mc-stat"><b id="mcCredits">—</b><small>CRÉDITOS</small></div>
      <div class="mc-stat mc-target"><b id="mcTarget">ALVO</b><small id="mcDistance">— KM</small><small class="mc-loc" id="mcLocation">SETOR —</small></div>
    </div>
    <button class="mc-menu-toggle" id="mcMenuToggle" type="button" aria-label="Abrir menu de sistemas" aria-expanded="false">☰</button>
    <button class="mc-fullscreen" id="mcFullscreen" type="button" aria-label="Entrar em tela cheia" title="Tela cheia">⛶</button>
    <nav class="mc-menu" id="mcMenu" aria-label="Abas da nave">
      <button class="mc-icon" data-panel="map" aria-label="Mapa" title="Mapa">⌖<small>MAPA</small></button>
      <button class="mc-icon" data-panel="route" aria-label="Navegação" title="Navegação">➤<small>ROTA</small></button>
      <button class="mc-icon" data-panel="cargo" aria-label="Inventário e carga" title="Inventário">▤<small>CARGA</small></button>
      <button class="mc-icon" data-panel="weapons" aria-label="Armas" title="Armas">✦<small>ARMAS</small></button>
      <button class="mc-icon" data-action="friends" aria-label="Amigos" title="Amigos">♧<small>AMIGOS</small></button>
      <button class="mc-icon" data-action="market" aria-label="Mercado" title="Mercado">◇<small>MERCADO</small></button>
      <button class="mc-icon" data-action="hangar" aria-label="Hangar" title="Hangar">▱<small>HANGAR</small></button>
      <button class="mc-icon" data-action="station" aria-label="Estação" title="Estação">⌂<small>ESTAÇÃO</small></button>
      <button class="mc-icon" data-action="station-dashboard" aria-label="Porto Aurora" title="Porto Aurora"><img class="mc-station-item-icon" src="midia/015_porto_aurora.png" alt=""><small>PORTO AURORA</small></button>
      <button class="mc-icon" data-station-action="market" aria-label="Mercado da estação" title="Mercado"><img class="mc-station-item-icon" src="midia/014_mercado.png" alt=""><small>MERCADO</small></button>
      <button class="mc-icon" data-station-action="av" aria-label="Áudio e vídeo" title="Áudio e vídeo"><img class="mc-station-item-icon" src="midia/084_iniciar_chamada_de_video.png" alt=""><small>ÁUDIO / VÍDEO</small></button>
      <button class="mc-icon" data-station-panel="ships" aria-label="Naves atracadas" title="Naves atracadas"><img class="mc-station-item-icon" src="midia/017_naves_atracadas.png" alt=""><small>NAVES</small></button>
      <button class="mc-icon" data-station-panel="users" aria-label="Usuários na estação" title="Usuários"><img class="mc-station-item-icon" src="midia/016_usuarios_da_estacao.png" alt=""><small>USUÁRIOS</small></button>
      <button class="mc-icon" data-station-panel="inventory" aria-label="Itens da nave" title="Itens da nave"><img class="mc-station-item-icon" src="midia/018_itens_da_nave.png" alt=""><small>ITENS</small></button>
      <button class="mc-icon" data-station-panel="events" aria-label="Eventos da estação" title="Eventos"><img class="mc-station-item-icon" src="midia/019_eventos_da_estacao.png" alt=""><small>EVENTOS</small></button>
      <button class="mc-icon" data-station-action="leave" aria-label="Sair da nave" title="Sair da nave" hidden><img class="mc-station-item-icon" src="midia/073_partir_da_estacao.png" alt=""><small>SAIR DA NAVE</small></button>
      <button class="mc-icon" data-station-action="alert" aria-label="Ver alerta de ataque" title="Alerta de ataque" hidden><img class="mc-station-item-icon" src="midia/58_alerta.png" alt=""><small>ALERTA</small></button>
      <button class="mc-icon" data-station-action="depart" aria-label="Partir da estação" title="Partir"><img class="mc-station-item-icon" src="midia/073_partir_da_estacao.png" alt=""><small>PARTIR</small></button>
      <a class="mc-icon" data-login-link href="login.php" aria-label="Entrar ou criar conta" title="Entrar">&#10148;<small>ENTRAR</small></a>
    </nav>
    <div class="mc-pop" id="mcPop" aria-live="polite"></div>
    <div class="mc-context" id="mcContext">
      <button data-click="#orbit">◉ ÓRBITA</button><button data-click="#dockButton">⚓ ACOPLAR</button><button data-click="#stationMarketButton">◇ MERCADO</button><button data-click="#stationAttackButton">✦ ATACAR ESTAÇÃO</button>
    </div>
    <div class="mc-joystick" id="mcJoystick" aria-label="Joystick de direção"><div class="mc-stick"></div></div>
    <div class="mc-actions" aria-label="Pilotagem">
      <button class="mc-action mc-boost" data-hold="w" aria-label="Aceleração contínua">▲<br>IMPULSO</button>
      <button class="mc-action mc-fire" id="mcFire" aria-label="Disparar">✦<br>FOGO</button>
      <button class="mc-action mc-brake" data-hold="s" aria-label="Frear">▼<br>FREIO</button>
      <button class="mc-action mc-thrust" data-action="autopilot" aria-label="Iniciar ou interromper a rota">➤<br>ROTA</button>
    </div>`;
  document.body.appendChild(ui);
  const avModal=document.createElement('section');avModal.className='mc-av-modal';avModal.hidden=true;avModal.setAttribute('role','dialog');avModal.setAttribute('aria-label','Controles de áudio e vídeo');avModal.innerHTML='<header class="mc-av-head"><strong>ÁUDIO E VÍDEO</strong><button type="button" id="mcAVMinimize" aria-label="Minimizar controles">−</button><button type="button" id="mcAVClose" aria-label="Fechar controles">×</button></header><div class="mc-av-content"><section class="mc-av-group"><label for="mcAVMicrophone">MICROFONE</label><select id="mcAVMicrophone"><option value="">Microfone padrão</option></select><div class="mc-av-row"><label for="mcAVGain">NÍVEL DO MICROFONE <span id="mcAVGainValue">100%</span></label><input id="mcAVGain" type="range" min="0" max="100" value="100" step="5"></div><button type="button" id="mcAVMicToggle" class="mc-av-toggle">LIGAR MICROFONE</button></section><section class="mc-av-group"><label for="mcAVCamera">CÂMERA</label><select id="mcAVCamera"><option value="">Câmera padrão</option></select><button type="button" id="mcAVCameraToggle" class="mc-av-toggle">LIGAR CÂMERA</button></section><div id="mcAVState" class="mc-av-state" role="status">Selecione os dispositivos e ligue cada um quando desejar.</div></div>';document.body.appendChild(avModal);
  const passengerCameraPreview=document.createElement('section');passengerCameraPreview.className='mc-passenger-camera';passengerCameraPreview.hidden=true;passengerCameraPreview.setAttribute('aria-label','Câmeras dos jogadores');passengerCameraPreview.innerHTML='<header class="mc-passenger-camera-head"><b>CÂMERAS · CABINE</b><button type="button" id="mcPassengerCameraMinimize" aria-label="Minimizar câmeras">−</button><button type="button" id="mcPassengerCameraClose" aria-label="Fechar câmeras">×</button></header><div class="mc-passenger-camera-feeds"></div>';document.body.appendChild(passengerCameraPreview);
  const avLayerStyle=document.createElement('style');avLayerStyle.textContent=`.mc-av-modal{max-height:min(92dvh,560px)}@media(max-width:550px){.mc-av-modal{top:calc(env(safe-area-inset-top) + 64px);left:12px;transform:none;max-height:calc(100dvh - 76px);width:min(340px,calc(100vw - 24px))}}.passenger-cabin .passenger-displays{top:66px!important;z-index:20!important;max-height:calc(100dvh - 78px);overflow:auto}.mc-passenger-camera{position:fixed;z-index:153;top:calc(env(safe-area-inset-top) + 66px);right:calc(env(safe-area-inset-right) + 12px);width:min(260px,48vw);max-height:calc(100dvh - 90px);overflow:hidden;border:1px solid #53c8d8;border-radius:10px;background:#061521f2;color:#c9f6f7;box-shadow:0 10px 30px #000b;font:8px 'Space Mono';touch-action:none}.mc-passenger-camera[hidden]{display:none}.mc-passenger-camera-head{display:flex;align-items:center;min-height:29px;padding:0 8px;border-bottom:1px solid #326879;background:#09202d;cursor:move;touch-action:none;user-select:none}.mc-passenger-camera-head b{margin-right:auto;font-size:7px;letter-spacing:.08em}.mc-passenger-camera-head button{width:22px;height:22px;margin-left:4px;border:1px solid #438d9a;border-radius:5px;background:#071923;color:#b9faff;font:13px 'Space Mono'}.mc-passenger-camera-feeds{max-height:calc(100dvh - 126px);overflow:auto}.mc-passenger-camera-feed{margin:6px;border:1px solid #285669;background:#081a27}.mc-passenger-camera-feed b{display:block;padding:5px 7px;color:#9beaf0;font-size:7px}.mc-passenger-camera video{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;background:#02080d}.mc-passenger-camera.minimized .mc-passenger-camera-feeds{display:none}`;document.head.appendChild(avLayerStyle);

  const media = matchMedia('(max-width:767px), (max-width:1024px) and (pointer:coarse)');
  const menu = ui.querySelector('#mcMenu');
  const menuToggle = ui.querySelector('#mcMenuToggle');
  const loginLink=ui.querySelector('[data-login-link]');
  if(loginLink)loginLink.hidden=typeof multiplayerEnabled!=='undefined'&&multiplayerEnabled;
  function setMenuOpen(open) {
    menu.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu de sistemas' : 'Abrir menu de sistemas');
    menuToggle.textContent = open ? '×' : '☰';
  }
  menuToggle.addEventListener('click', () => {
    const opening=!menu.classList.contains('open');
    if(opening)closeStationMarket();
    setMenuOpen(opening);
  });
  const fullscreenToggle = ui.querySelector('#mcFullscreen');
  function syncFullscreenButton() { const active=Boolean(document.fullscreenElement); fullscreenToggle.classList.toggle('active',active); fullscreenToggle.setAttribute('aria-label',active?'Sair da tela cheia':'Entrar em tela cheia'); }
  fullscreenToggle.addEventListener('click', async event => { event.preventDefault(); try { if(document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen({navigationUI:'hide'}); } catch {} syncFullscreenButton(); });
  document.addEventListener('fullscreenchange',syncFullscreenButton);
  menu.addEventListener('click', event => { if (event.target.closest('.mc-icon') && !event.target.closest('[data-station-panel]')) setMenuOpen(false); });
  const pop = ui.querySelector('#mcPop');
  const panelSlots = {};
  const panelSources = {
    map: ['.mapbox'], route: ['#routePanel'], cargo: ['#cargoBay'], weapons: ['.navbox']
  };
  function makeDraggable(target,handle){
    if(!target||!handle||target.dataset.mcDragReady)return;
    target.dataset.mcDragReady='1';handle.classList.add('mc-window-drag-handle');
    handle.addEventListener('pointerdown',event=>{
      if(event.target.closest('button,a,input,select,textarea')||!media.matches)return;
      event.preventDefault();const rect=target.getBoundingClientRect(),offsetX=event.clientX-rect.left,offsetY=event.clientY-rect.top;
      target.style.setProperty('position','fixed','important');target.style.setProperty('left',rect.left+'px','important');target.style.setProperty('top',rect.top+'px','important');target.style.setProperty('right','auto','important');target.style.setProperty('bottom','auto','important');target.style.setProperty('transform','none','important');target.style.setProperty('margin','0','important');
      handle.setPointerCapture?.(event.pointerId);
      const move=next=>{const maxX=Math.max(8,innerWidth-target.offsetWidth-8),maxY=Math.max(8,innerHeight-target.offsetHeight-8);target.style.setProperty('left',Math.min(maxX,Math.max(8,next.clientX-offsetX))+'px','important');target.style.setProperty('top',Math.min(maxY,Math.max(8,next.clientY-offsetY))+'px','important')};
      const stop=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',stop);handle.removeEventListener('pointercancel',stop)};
      handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',stop,{once:true});handle.addEventListener('pointercancel',stop,{once:true});
    });
  }
  let avAudioDevice=localStorage.getItem('navestar.av.audioDevice')||'',avVideoDevice=localStorage.getItem('navestar.av.videoDevice')||'',avMicGain=Math.max(0,Math.min(100,Number(localStorage.getItem('navestar.av.micGain')||100)));
  makeDraggable(avModal,avModal.querySelector('.mc-av-head'));
  makeDraggable(passengerCameraPreview,passengerCameraPreview.querySelector('.mc-passenger-camera-head'));
  const passengerDisplays=document.querySelector('.passenger-cabin .passenger-displays');
  if(passengerDisplays)makeDraggable(passengerDisplays,passengerDisplays.querySelector('.passenger-toolbar-head'));
  let passengerCameraStream=null;
  const cameraFeeds=passengerCameraPreview.querySelector('.mc-passenger-camera-feeds');
  let cameraPanelDismissed=false;
  function renderPassengerCamera(id,name,stream,enabled=true){let tile=cameraFeeds.querySelector('[data-peer-id="'+id+'"]');if(!enabled||!stream?.getVideoTracks().some(track=>track.readyState==='live'&&track.enabled)){tile?.remove();if(!cameraFeeds.children.length){passengerCameraPreview.hidden=true;cameraPanelDismissed=false}return}if(!tile){tile=document.createElement('div');tile.className='mc-passenger-camera-feed';tile.dataset.peerId=String(id);tile.innerHTML='<b></b><video autoplay playsinline muted></video>';cameraFeeds.appendChild(tile)}tile.querySelector('b').textContent=name||'Jogador';const video=tile.querySelector('video');if(video.srcObject!==stream)video.srcObject=stream;video.play?.().catch(()=>{});if(!cameraPanelDismissed){passengerCameraPreview.hidden=false;passengerCameraPreview.classList.remove('minimized')}}
  window.addEventListener('crew-remote-camera',event=>{const {id,name,stream,enabled}=event.detail||{};if(id!=null)renderPassengerCamera(id,name,stream,enabled)});
  function isPassengerCabin(){return Boolean(document.body.classList.contains('passenger-mode')&&document.querySelector('.passenger-cabin.open'))}
  function avMediaState(){const state=window.stationRoomCalls?.getMediaState?.()||{audio:false,video:false};return{...state,video:isPassengerCabin()?Boolean(passengerCameraStream?.getVideoTracks().some(track=>track.enabled)):Boolean(state.video)}}
  async function setPassengerCamera(enabled,deviceId=avVideoDevice){if(!enabled){passengerCameraStream?.getTracks().forEach(track=>track.stop());passengerCameraStream=null;window.passengerCabinCameraStream=null;window.dispatchEvent(new CustomEvent('passenger-camera-track',{detail:{stream:null}}));cameraFeeds.querySelector('[data-peer-id="local"]')?.remove();if(!cameraFeeds.children.length)passengerCameraPreview.hidden=true;return false}passengerCameraStream?.getTracks().forEach(track=>track.stop());passengerCameraStream=null;const constraints={audio:false,video:{width:{ideal:640},height:{ideal:480},...(deviceId?{deviceId:{exact:deviceId}}:{facingMode:'user'})}};const stream=await navigator.mediaDevices.getUserMedia(constraints);const track=stream.getVideoTracks()[0];if(!track){stream.getTracks().forEach(item=>item.stop());throw new Error('Não foi possível abrir a câmera selecionada.')}passengerCameraStream=stream;window.passengerCabinCameraStream=stream;renderPassengerCamera('local','VOCÊ',stream,true);window.dispatchEvent(new CustomEvent('passenger-camera-track',{detail:{stream}}));stream.getVideoTracks().forEach(item=>{item.addEventListener('ended',()=>{window.passengerCabinCameraStream=null;window.dispatchEvent(new CustomEvent('passenger-camera-track',{detail:{stream:null}}));renderPassengerCamera('local','VOCÊ',stream,false)},{once:true})});return true}
  passengerCameraPreview.querySelector('#mcPassengerCameraMinimize').addEventListener('click',event=>{const minimized=passengerCameraPreview.classList.toggle('minimized');event.currentTarget.textContent=minimized?'+':'−';event.currentTarget.setAttribute('aria-label',minimized?'Restaurar câmeras':'Minimizar câmeras')});
  passengerCameraPreview.querySelector('#mcPassengerCameraClose').addEventListener('click',()=>{cameraPanelDismissed=true;passengerCameraPreview.hidden=true});
  passengerCameraPreview.querySelector('.mc-passenger-camera-head').addEventListener('click',event=>{if(event.target.closest('button')||!passengerCameraPreview.classList.contains('minimized'))return;passengerCameraPreview.classList.remove('minimized');passengerCameraPreview.querySelector('#mcPassengerCameraMinimize').textContent='−'});  function persistAV(){localStorage.setItem('navestar.av.audioDevice',avAudioDevice);localStorage.setItem('navestar.av.videoDevice',avVideoDevice);localStorage.setItem('navestar.av.micGain',String(avMicGain))}
  async function refreshAVDevices(){const audio=avModal.querySelector('#mcAVMicrophone'),video=avModal.querySelector('#mcAVCamera');try{const devices=await navigator.mediaDevices?.enumerateDevices?.()||[];for(const [select,kind,selected,label] of [[audio,'audioinput',avAudioDevice,'Microfone'],[video,'videoinput',avVideoDevice,'Câmera']]){const found=devices.filter(device=>device.kind===kind);select.replaceChildren(new Option(label+' padrão',''));found.forEach((device,index)=>select.add(new Option(device.label||label+' '+(index+1),device.deviceId)));select.value=found.some(device=>device.deviceId===selected)?selected:''}}catch(error){avModal.querySelector('#mcAVState').textContent='Não foi possível listar os dispositivos neste navegador.'}}
  function updateAVState(){const state=avMediaState();avModal.querySelector('#mcAVMicToggle').textContent=state.audio?'DESLIGAR MICROFONE':'LIGAR MICROFONE';avModal.querySelector('#mcAVCameraToggle').textContent=state.video?'DESLIGAR CÂMERA':'LIGAR CÂMERA';avModal.querySelector('#mcAVGain').value=String(avMicGain);avModal.querySelector('#mcAVGainValue').textContent=avMicGain+'%'}
  async function openAVModal(){avModal.hidden=false;avModal.classList.remove('minimized');avModal.querySelector('#mcAVMinimize').textContent='−';await refreshAVDevices();updateAVState();const state=avMediaState();if(state.audio||state.video)avModal.querySelector('#mcAVState').textContent='Microfone '+(state.audio?'ativo':'desligado')+' · câmera '+(state.video?'ativa':'desligada')+'. Fechar esta janela mantém o estado.'}
  function ensureStationAVButton(dashboard){const actions=dashboard?.querySelector('.crew-dashboard-actions'),mic=actions?.querySelector('#crewIntercom'),camera=actions?.querySelector('#crewRoomVideoCall');if(!actions||!mic||!camera)return;let button=actions.querySelector('.crew-av-settings');if(!button){button=document.createElement('button');button.type='button';button.className='crew-av-settings';button.setAttribute('aria-label','Abrir controles de áudio e vídeo');button.title='Áudio e vídeo';button.innerHTML='<img src="midia/084_iniciar_chamada_de_video.png" alt="">';button.addEventListener('click',openAVModal);actions.appendChild(button)}actions.classList.toggle('mc-av-unified',media.matches);button.style.display=media.matches?'grid':'none';actions.style.gridTemplateColumns=media.matches?'repeat(2,46px)':''}
  avModal.querySelector('#mcAVClose').addEventListener('click',()=>{avModal.hidden=true});
  avModal.querySelector('#mcAVMinimize').addEventListener('click',event=>{const minimized=avModal.classList.toggle('minimized');event.currentTarget.textContent=minimized?'+':'−';event.currentTarget.setAttribute('aria-label',minimized?'Restaurar controles':'Minimizar controles')});
  avModal.querySelector('.mc-av-head').addEventListener('click',event=>{if(event.target.closest('button')||!avModal.classList.contains('minimized'))return;avModal.classList.remove('minimized');avModal.querySelector('#mcAVMinimize').textContent='−';avModal.querySelector('#mcAVMinimize').setAttribute('aria-label','Minimizar controles')});
  avModal.querySelector('#mcAVMicrophone').addEventListener('change',async event=>{avAudioDevice=event.target.value;persistAV();if(window.stationRoomCalls?.getMediaState?.().audio){try{await window.stationRoomCalls.setMediaEnabled('audio',true,avAudioDevice);avModal.querySelector('#mcAVState').textContent='Microfone alterado.'}catch(error){avModal.querySelector('#mcAVState').textContent=error.message}}updateAVState()});
  avModal.querySelector('#mcAVCamera').addEventListener('change',async event=>{avVideoDevice=event.target.value;persistAV();if(avMediaState().video){try{if(isPassengerCabin())await setPassengerCamera(true,avVideoDevice);else await window.stationRoomCalls.setMediaEnabled('video',true,avVideoDevice);avModal.querySelector('#mcAVState').textContent='Câmera alterada.'}catch(error){avModal.querySelector('#mcAVState').textContent=error.message}}updateAVState()});
  avModal.querySelector('#mcAVGain').addEventListener('input',event=>{avMicGain=Number(event.target.value);persistAV();updateAVState();window.stationRoomCalls?.setMicrophoneGain?.(avMicGain/100);avModal.querySelector('#mcAVState').textContent='Nível do microfone: '+avMicGain+'%.'});
  avModal.querySelector('#mcAVMicToggle').addEventListener('click',async()=>{const api=window.stationRoomCalls;if(!api?.setMediaEnabled)return;const enabled=!api.getMediaState().audio;avModal.querySelector('#mcAVState').textContent=enabled?'Solicitando acesso ao microfone…':'Desligando microfone…';try{await api.setMediaEnabled('audio',enabled,avAudioDevice);api.setMicrophoneGain?.(avMicGain/100);api.hideWindow?.();await refreshAVDevices();updateAVState();avModal.querySelector('#mcAVState').textContent=enabled?'Microfone ativo. Fechar esta janela mantém a transmissão.':'Microfone desligado.'}catch(error){avModal.querySelector('#mcAVState').textContent=error.message}});
  avModal.querySelector('#mcAVCameraToggle').addEventListener('click',async()=>{const api=window.stationRoomCalls,enabled=!avMediaState().video;avModal.querySelector('#mcAVState').textContent=enabled?'Solicitando acesso à câmera…':'Desligando câmera…';try{if(isPassengerCabin()){await setPassengerCamera(enabled,avVideoDevice)}else{if(!api?.setMediaEnabled)throw new Error('Controles de câmera indisponíveis.');await api.setMediaEnabled('video',enabled,avVideoDevice);api.hideWindow?.()}await refreshAVDevices();updateAVState();avModal.querySelector('#mcAVState').textContent=enabled?'Câmera ativa. A prévia pode ser movida e minimizada.':'Câmera desligada.'}catch(error){avModal.querySelector('#mcAVState').textContent=error.message}});
  setInterval(()=>{if(!avModal.hidden)updateAVState()},800);
  function stationWindow(dashboard,title='PORTO AURORA'){
    if(!dashboard)return;let head=dashboard.querySelector(':scope > .mc-station-window-head');
    if(!head){head=document.createElement('div');head.className='mc-station-window-head';head.innerHTML='<span></span><button type="button" class="mc-window-close" aria-label="Fechar janela">×</button>';dashboard.prepend(head);head.querySelector('button').addEventListener('click',()=>{dashboard.classList.remove('mobile-menu-open');dashboard.classList.add('mobile-menu-collapsed')});makeDraggable(dashboard,head)}
    head.querySelector('span').textContent=title;
  }
  function decorateFloatingWindows(){
    const market=document.querySelector('#stationScreen.open');if(market){market.classList.add('mc-floating-window');const close=market.querySelector('#stationClose');if(close){close.setAttribute('aria-label','Fechar janela');close.title='Fechar janela'}makeDraggable(market.querySelector('.station-shell'),market.querySelector('.station-top'))}
    const friends=document.querySelector('#friendsPanel');if(friends){friends.classList.add('mc-floating-window');const close=friends.querySelector('#friendsClose');if(close){close.classList.add('mc-window-close');close.setAttribute('aria-label','Fechar janela');close.title='Fechar janela';close.textContent='×'}makeDraggable(friends,friends.querySelector('.social-head'))}
    for(const [selector,handle] of [['#stationCall','.call-head'],['#stationRoomCall','header'],['#callOverlay .call-card','#callTitle'],['#pilotOverlay .pilot-card','.pilot-titlebar']]){const target=document.querySelector(selector);if(target){const root=target.matches('#stationCall,#stationRoomCall')?target:target.closest('.call-overlay,.pilot-overlay')||target;root.classList.add('mc-floating-window');if(!((target.id==='stationCall'||target.id==='stationRoomCall')&&target.classList.contains('video')))makeDraggable(target,target.querySelector(handle))}}
  }
  document.addEventListener('click',()=>requestAnimationFrame(decorateFloatingWindows),true);decorateFloatingWindows();
  let lastInteriorMode = '';
  function setMobileEnabled() {
    const interior = document.querySelector('.crew-interior.open, .passenger-cabin.open');
    const stationPanel = document.querySelector('#stationScreen.open');
    const flightSuspended = Boolean(stationPanel || interior);
    ui.style.display = media.matches && (!stationPanel || interior) ? 'block' : 'none';
    ui.style.zIndex = interior ? '130' : '';
    ui.classList.toggle('interior-mode', Boolean(interior));
    const interiorMode = interior?.classList.contains('passenger-cabin') ? 'passenger' : interior ? 'station' : '';
    const stationDashboard=interior?.classList.contains('crew-interior')?interior.querySelector('.crew-side'):null;
    if(stationDashboard)ensureStationAVButton(stationDashboard);
    if(interiorMode==='station'&&lastInteriorMode!=='station')stationDashboard?.classList.add('mobile-menu-collapsed');
    const stationLeave=stationDashboard?.querySelector('#crewLeave'),stationDepart=stationDashboard?.querySelector('#crewUndock'),stationAlert=stationDashboard?.querySelector('#crewAttackAlert');
    const leaveMenu=ui.querySelector('[data-station-action="leave"]'),departMenu=ui.querySelector('[data-station-action="depart"]'),alertMenu=ui.querySelector('[data-station-action="alert"]');
    if(leaveMenu)leaveMenu.hidden=!stationLeave||stationLeave.hidden;
    if(departMenu)departMenu.disabled=!stationDepart||stationDepart.disabled||stationDepart.hidden;
    if(alertMenu)alertMenu.hidden=!stationAlert||stationAlert.hidden;
    if(interiorMode!=='station')stationDashboard?.classList.remove('mobile-menu-collapsed','mobile-menu-open');
    if (interiorMode === 'passenger' && lastInteriorMode !== 'passenger') {
      const displays = document.querySelector('.passenger-displays');
      displays?.classList.add('collapsed');
      displays?.querySelector('.passenger-fold-all')?.setAttribute('aria-expanded', 'false');
    }
    lastInteriorMode = interiorMode;
    if (flightSuspended || !media.matches) closePop();
    ui.querySelectorAll('.mc-action,[data-hold]').forEach(button => { if (flightSuspended || !media.matches) releaseButton(button); });
  }
  function releaseButton(button) {
    for (const id of [...heldPointers.keys()]) if (heldPointers.get(id) === button) heldPointers.delete(id);
    button.classList.remove('pressed');
    syncKeys();
  }
  function dispatchKey(key, type) {
    const arrow = key.startsWith('Arrow');
    const letter = key.length === 1;
    window.dispatchEvent(new KeyboardEvent(type, {key: arrow ? key : key.toLowerCase(), code: arrow ? key : `Key${key.toUpperCase()}`, bubbles:true, cancelable:true}));
  }
  const heldPointers = new Map();
  function syncKeys() {
    const keys = new Set();
    heldPointers.forEach(button => { if (button.dataset.hold) keys.add(button.dataset.hold); });
    const joy = ui.querySelector('#mcJoystick');
    if (joy.dataset.pointer) {
      const x = Number(joy.dataset.x || 0), y = Number(joy.dataset.y || 0);
      if (x < -.24) keys.add('a'); if (x > .24) keys.add('d');
      if (y < -.24) keys.add('w'); if (y > .24) keys.add('s');
    }
    const prior = new Set((ui.dataset.keys || '').split('|').filter(Boolean));
    prior.forEach(key => { if (!keys.has(key)) dispatchKey(key, 'keyup'); });
    keys.forEach(key => { if (!prior.has(key)) dispatchKey(key, 'keydown'); });
    ui.dataset.keys = [...keys].join('|');
  }
  ui.querySelectorAll('[data-hold]').forEach(button => {
    button.addEventListener('pointerdown', event => { event.preventDefault(); heldPointers.set(event.pointerId, button); button.classList.add('pressed'); button.setPointerCapture(event.pointerId); syncKeys(); });
    ['pointerup','pointercancel','lostpointercapture'].forEach(type => button.addEventListener(type, event => { heldPointers.delete(event.pointerId); button.classList.remove('pressed'); syncKeys(); }));
  });
  const joystick = ui.querySelector('#mcJoystick'), stick = joystick.querySelector('.mc-stick');
  function moveStick(event) {
    const rect = joystick.getBoundingClientRect(), radius = rect.width * .34;
    const dx = event.clientX - (rect.left + rect.width/2), dy = event.clientY - (rect.top + rect.height/2), len = Math.hypot(dx,dy), scale = len > radius ? radius/len : 1;
    const x = dx*scale, y = dy*scale;
    stick.style.left = `calc(50% + ${x}px)`; stick.style.top = `calc(50% + ${y}px)`;
    joystick.dataset.x = String(x/radius); joystick.dataset.y = String(y/radius); syncKeys();
  }
  joystick.addEventListener('pointerdown', event => { event.preventDefault(); joystick.dataset.pointer = String(event.pointerId); joystick.setPointerCapture(event.pointerId); moveStick(event); });
  joystick.addEventListener('pointermove', event => { if (joystick.dataset.pointer === String(event.pointerId)) { event.preventDefault(); moveStick(event); } });
  ['pointerup','pointercancel','lostpointercapture'].forEach(type => joystick.addEventListener(type, event => { if (joystick.dataset.pointer !== String(event.pointerId)) return; delete joystick.dataset.pointer; delete joystick.dataset.x; delete joystick.dataset.y; stick.style.left='50%';stick.style.top='50%';syncKeys(); }));

  function closePop() {
    pop.classList.remove('open');
    Object.entries(panelSlots).forEach(([selector, marker]) => {
      const source = document.querySelector(selector);
      if (source && marker.parentNode) marker.parentNode.insertBefore(source, marker.nextSibling);
    });
    pop.replaceChildren(); ui.querySelectorAll('[data-panel]').forEach(button => button.classList.remove('active'));
  }
  function showPanel(name) {
    if (pop.classList.contains('open') && pop.dataset.panel === name) { closePop(); return; }
    closePop(); pop.dataset.panel = name;
    const title = document.createElement('h3'); title.textContent = ({map:'MAPA TÁTICO',route:'NAVEGAÇÃO',cargo:'INVENTÁRIO / CARGA',weapons:'SISTEMAS'})[name] || name.toUpperCase(); pop.appendChild(title);
    const head=document.createElement('div');head.className='mc-window-head';pop.insertBefore(head,title);head.appendChild(title);const close=document.createElement('button');close.type='button';close.className='mc-window-close';close.setAttribute('aria-label','Fechar janela');close.textContent='×';close.addEventListener('click',closePop);head.appendChild(close);makeDraggable(pop,head);
    (panelSources[name] || []).forEach(selector => {
      const source = document.querySelector(selector); if (!source) return;
      if (!panelSlots[selector]) { const marker = document.createComment(`mobile-panel:${selector}`); source.parentNode.insertBefore(marker, source); panelSlots[selector] = marker; }
      pop.appendChild(source);
    });
    if (name === 'weapons') {
      const rows = ['#weaponReadout','#ammoReadout','#hullReadout','#fuelReadout','#energyReadout','#combatStatus'];
      rows.forEach(selector => { const source=document.querySelector(selector); if(source){const row=document.createElement('div');row.className='row';row.innerHTML=`<span>${selector.slice(1).replace('Readout','').replace('Status','').toUpperCase()}</span><span>${source.textContent}</span>`;pop.appendChild(row);} });
      const scan=document.querySelector('#scan'); if(scan){const button=document.createElement('button');button.className='ctrl';button.textContent='VARREDURA';button.addEventListener('click',()=>scan.click());pop.appendChild(button);}
    }
    pop.classList.add('open'); ui.querySelector(`[data-panel="${name}"]`)?.classList.add('active');
  }
  ui.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click', () => showPanel(button.dataset.panel)));
  ui.querySelector('#mcFire').addEventListener('pointerdown', event => {event.preventDefault();event.currentTarget.classList.add('pressed'); document.querySelector('#fireWeapon')?.click();});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type => ui.querySelector('#mcFire').addEventListener(type,event=>event.currentTarget.classList.remove('pressed')));
  ui.querySelectorAll('[data-click]').forEach(button => button.addEventListener('click', () => document.querySelector(button.dataset.click)?.click()));
  ui.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
    const action=button.dataset.action;
    if(action==='autopilot'){ document.querySelector('#routeGo')?.click(); return; }
    if(action==='friends'){ document.querySelector('#friendsToggle')?.click(); return; }
    const stationOpen=document.querySelector('#stationScreen')?.classList.contains('open');
    if(action==='market'){ if(stationOpen){document.querySelector('#stationMarketButton')?.click();return;}document.querySelector('#stationAccess button:nth-child(2),#stationMarketButton')?.click();return; }
    if(action==='hangar'){ if(stationOpen){document.querySelector('[data-station-tab="shipyard"],#shipyardTab')?.click();return;} document.querySelector('#stationMarketButton')?.click();return; }
    if(action==='station'){ document.querySelector('#dockButton')?.click(); return; }
    if(action==='station-dashboard'){
      const dashboard=document.querySelector('.crew-interior.open .crew-side');
      if(!dashboard){
        const stationId=(window.stationIds||[])[0];
        if(stationId===undefined)return;
        if(window.crewDocked){document.querySelector('#dockButton')?.click();return;}
        const dockButton=document.querySelector('#dockButton');
        if(dockButton&&!dockButton.disabled){dockButton.click();setMenuOpen(false);return;}
        const select=document.querySelector('#bodySelect');
        const stationOption=select&&[...select.options].find(option=>option.value===String(stationId));
        if(stationOption){select.value=String(stationId);select.dispatchEvent(new Event('change',{bubbles:true}));}
        document.querySelector('#routeGo')?.click();
        const dockStatus=document.querySelector('#dockStatus');
        if(dockStatus)dockStatus.textContent='Rota para '+(stationOption?.textContent||'a estação')+' iniciada. Ao chegar, use ACOPLAR para entrar.';
        setMenuOpen(false);
        return;
      }
      stationWindow(dashboard,'PORTO AURORA');
      const expand=dashboard.classList.contains('mobile-menu-collapsed');
      if(expand)closeStationMarket();
      dashboard.classList.toggle('mobile-menu-collapsed',!expand);
      dashboard.classList.toggle('mobile-menu-open',expand);
      setMenuOpen(false);
    }
  }));
  function openStationDashboard(selector,title='PORTO AURORA') {
    const dashboard=document.querySelector('.crew-interior.open .crew-side');
    if(!dashboard)return;
    closeStationMarket();
    stationWindow(dashboard,title);
    dashboard.classList.remove('mobile-menu-collapsed');dashboard.classList.add('mobile-menu-open');
    setMenuOpen(false);
    if(selector)requestAnimationFrame(()=>{const target=dashboard.querySelector(selector),panel=target?.closest('[data-crew-panel]');if(panel?.classList.contains('collapsed'))panel.querySelector('.crew-panel-toggle')?.click();target?.scrollIntoView({behavior:'smooth',block:'start'})});
  }
  ui.querySelectorAll('[data-station-action]').forEach(button=>button.addEventListener('click',()=>{
    const action=button.dataset.stationAction;
    if(action==='market'){document.querySelector('#crewOpenMarket')?.click();setMenuOpen(false);return;}
    if(action==='av'){closeStationMarket();openAVModal();setMenuOpen(false);return;}
    if(action==='leave'){closeStationMarket();document.querySelector('#crewLeave')?.click();setMenuOpen(false);return;}
    if(action==='alert'){closeStationMarket();openStationDashboard(null,'ALERTA DE ATAQUE');document.querySelector('#crewAttackAlert')?.click();setMenuOpen(false);return;}
    if(action==='depart'){closeStationMarket();document.querySelector('#crewUndock')?.click();setMenuOpen(false);return;}
  }));
  function closeStationMarket(){document.querySelector('#stationScreen.open #stationClose')?.click()}
  ui.querySelectorAll('[data-station-panel]').forEach(button=>button.addEventListener('click',()=>{
    const panel=button.dataset.stationPanel;
    openStationDashboard(panel==='ships'?'.crew-panel-dock [data-crew-panel="ships"]':`#crewPanelDock [data-crew-panel="${panel}"]`,button.getAttribute('aria-label')||button.textContent.trim());
  }));

  function updateHud() {
    if (!media.matches) return;
    const value = selector => document.querySelector(selector)?.textContent?.trim() || '—';
    const hull=value('#hullReadout'), fuel=value('#fuelReadout'), speed=value('#speed'), target=value('#targetname'), distance=value('#targetdist');
    ui.querySelector('#mcHull').textContent=hull; ui.querySelector('#mcFuel').textContent=fuel.split('/')[0].trim(); ui.querySelector('#mcSpeed').textContent=speed; ui.querySelector('#mcTarget').textContent=target; ui.querySelector('#mcDistance').textContent=distance.toUpperCase(); ui.querySelector('#mcLocation').textContent=value('#coordz').toUpperCase();
    const pct=Math.max(0,Math.min(100,parseFloat(hull)||0));ui.querySelector('#mcHullBar').style.width=pct+'%';ui.querySelector('#mcHullBar').style.background=pct<35?'#ff737b':'#57dfe8';
    const credits=value('#bayCredits');ui.querySelector('#mcCredits').textContent=credits.replace(/\s*CR/i,'');
    const stationButton=document.querySelector('#stationMarketButton'),dockButton=document.querySelector('#dockButton'),attack=document.querySelector('#stationAttackButton');
    const orbit=document.querySelector('#orbit');
    ui.querySelector('#mcContext').classList.toggle('visible',!!(stationButton&&!stationButton.disabled||dockButton&&!dockButton.disabled||attack&&!attack.disabled||orbit&&!orbit.disabled));
    ui.querySelectorAll('#mcContext [data-click="#orbit"]').forEach(b=>b.disabled=!orbit||orbit.disabled);
    ui.querySelectorAll('#mcContext [data-click="#stationMarketButton"]').forEach(b=>b.disabled=!stationButton||stationButton.disabled);
    ui.querySelectorAll('#mcContext [data-click="#dockButton"]').forEach(b=>b.disabled=!dockButton||dockButton.disabled);
    ui.querySelectorAll('#mcContext [data-click="#stationAttackButton"]').forEach(b=>b.disabled=!attack||attack.disabled);
  }
  const timer=setInterval(() => { setMobileEnabled(); updateHud(); },500); updateHud();
  media.addEventListener?.('change',setMobileEnabled);
  addEventListener('resize',updateHud); addEventListener('pagehide',()=>clearInterval(timer),{once:true});
  setMobileEnabled();
})();
