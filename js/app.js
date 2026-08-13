(() => {
  'use strict';

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

  const $ = sel => document.querySelector(sel);

  const state = {
    user: null,
    perfil: null,
    view: 'login',
    adminTab: 'jugadores',
    scanner: null,
    scanLock: false,
  };

  const COMIDAS = ['desayuno', 'comida', 'cena'];
  const etiqueta = n => String(n || '').charAt(0).toUpperCase() + String(n || '').slice(1);

  const app = $('#app');
  const printRoot = $('#print-root');

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let toastTimer;
  const toast = msg => {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
  };

  const todayLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const addDays = (iso, n) => {
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const fmtDT = iso => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const fmtDia = iso => new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtDiaLargo = iso => new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  const makeQR = (text, size) => {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createDataURL(8, 2);
  };

  const icon = (path) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;

  const NAV = {
    jugador: [
      { id: 'credencial', label: 'Credencial', icon: 'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm2 3h12v2H6V7Zm0 4h8v2H6v-2Zm0 4h5v2H6v-2Z' },
      { id: 'escaneo', label: 'Escanear', icon: 'M3 7V4a1 1 0 0 1 1-1h3m10 0h3a1 1 0 0 1 1 1v3m0 10v3a1 1 0 0 1-1 1h-3M7 21H4a1 1 0 0 1-1-1v-3m5-9v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2Zm2 8h6' },
      { id: 'misdatos', label: 'Mis comidas', icon: 'M12 3a9 9 0 1 0 9 9h-9V3Zm0 0v9h9A9 9 0 0 0 12 3Z' },
    ],
    cocinera: [
      { id: 'escaneo', label: 'Escanear', icon: 'M3 7V4a1 1 0 0 1 1-1h3m10 0h3a1 1 0 0 1 1 1v3m0 10v3a1 1 0 0 1-1 1h-3M7 21H4a1 1 0 0 1-1-1v-3m5-9v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2Zm2 8h6' },
      { id: 'hoy', label: 'Registros hoy', icon: 'M7 3v3m10-3v3M4 9h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Zm4 5h8' },
    ],
    administrador: [
      { id: 'escaneo', label: 'Escanear', icon: 'M3 7V4a1 1 0 0 1 1-1h3m10 0h3a1 1 0 0 1 1 1v3m0 10v3a1 1 0 0 1-1 1h-3M7 21H4a1 1 0 0 1-1-1v-3m5-9v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2Zm2 8h6' },
      { id: 'admin', label: 'Panel', icon: 'M5 9V7a7 7 0 0 1 14 0v2m-12 0h10a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z' },
    ],
  };

  // ---------------------------------------------------------------- login

  function renderLogin() {
    state.view = 'login';
    app.innerHTML = `
      <div class="login">
        <div class="login-brand">
          <img src="assets/Alebrijes Teotihuacan.png" alt="Alebrijes Teotihuacán">
          <div class="eyebrow">Casa Club</div>
          <h2>Alebrijes<br><span>Teotihuacán</span></h2>
          <p>Control del comedor</p>
        </div>
        <form class="login-card" id="login-form">
          <div class="field">
            <label for="login-user">Usuario</label>
            <input id="login-user" type="text" autocomplete="username" placeholder="tu@correo.club" required>
          </div>
          <div class="field">
            <label for="login-pass">Contraseña</label>
            <input id="login-pass" type="password" autocomplete="current-password" placeholder="••••••••" required>
          </div>
          <div id="login-err" class="login-err hidden"></div>
          <button class="btn btn-primary btn-block" type="submit">Entrar</button>
        </form>
      </div>`;

    $('#login-form').addEventListener('submit', async e => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type=submit]');
      btn.disabled = true;
      btn.textContent = 'Entrando…';
      const errEl = $('#login-err');
      errEl.classList.add('hidden');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: $('#login-user').value.trim().toLowerCase(),
        password: $('#login-pass').value,
      });
      if (error) {
        errEl.textContent = 'Usuario o contraseña incorrectos.';
        errEl.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'Entrar';
        return;
      }
      await enterApp(data.session);
    });
  }

  async function enterApp(session) {
    state.user = session.user;
    const { data, error } = await supabase.from('perfiles').select('*').eq('id', session.user.id).single();
    if (error || !data) {
      await supabase.auth.signOut();
      toast('Tu cuenta no tiene perfil asignado.');
      renderLogin();
      return;
    }
    state.perfil = data;
    state.view = data.rol === 'jugador' ? 'credencial' : 'escaneo';
    renderShell();
  }

  // ---------------------------------------------------------------- shell

  function renderShell() {
    stopScanner();
    const rol = state.perfil.rol;
    const items = NAV[rol] || [];
    app.innerHTML = `
      <header class="app-header">
        <img src="assets/Alebrijes Teotihuacan.png" alt="Logo">
        <div class="header-titles">
          <h1>Casa Club Alebrijes Teotihuacán</h1>
          <p>${rol}</p>
        </div>
        <button class="btn-icon" id="btn-logout" title="Cerrar sesión">Salir</button>
      </header>
      <main id="main"></main>
      <nav class="bottom-nav">
        ${items.map(i => `
          <button class="nav-item ${state.view === i.id ? 'active' : ''}" data-nav="${i.id}">
            ${icon(i.icon)}<span>${i.label}</span>
          </button>`).join('')}
      </nav>`;

    $('#btn-logout').addEventListener('click', async () => {
      await supabase.auth.signOut();
      state.user = null; state.perfil = null;
      renderLogin();
    });

    document.querySelectorAll('.nav-item').forEach(b => {
      b.addEventListener('click', () => {
        state.view = b.dataset.nav;
        renderShell();
      });
    });

    go(state.view);
  }

  function go(view) {
    const main = $('#main');
    if (!main) return;
    if (view === 'credencial') renderCredencial(main);
    else if (view === 'misdatos') renderMisDatos(main);
    else if (view === 'escaneo') renderEscaneo(main);
    else if (view === 'hoy') renderHoy(main);
    else if (view === 'admin') renderAdmin(main);
  }

  // ---------------------------------------------------------------- credencial (jugador)

  function renderCredencial(main) {
    const p = state.perfil;
    const qr = makeQR(p.folio, 150);
    main.innerHTML = `
      <div class="view">
        <div class="view-title">Mi credencial</div>
        <div class="credencial">
          <div class="credencial-top">
            <img src="assets/Alebrijes Teotihuacan.png" alt="Alebrijes Teotihuacán">
            <div>
              <h3>Casa Club Alebrijes Teotihuacán</h3>
              <p>Credencial de jugador</p>
            </div>
          </div>
          <div class="credencial-body">
            <div class="foto-box">
              ${p.foto_url
                ? `<img class="foto" src="${esc(p.foto_url)}" alt="Foto de ${esc(p.nombre)}">`
                : `<div class="foto foto-empty">Sin foto</div>`}
            </div>
            <div class="credencial-info">
              <div class="name">${esc(p.nombre)}</div>
              <div class="rol-tag">Jugador</div>
              <div class="folio-label">Folio</div>
              <div class="folio">${esc(p.folio)}</div>
            </div>
          </div>
          <div class="credencial-qr"><img src="${qr}" alt="Código QR" width="150" height="150"></div>
          <div class="credencial-foot">
            <span>Escanea tu QR al pasar al comedor</span>
            <span class="seal">● ${new Date().getFullYear()}</span>
          </div>
        </div>
        <button class="btn btn-ghost btn-block" id="btn-foto">${p.foto_url ? 'Cambiar foto de perfil' : 'Subir foto de perfil'}</button>
        <input type="file" id="input-foto" accept="image/*" hidden>
        <button class="btn btn-primary btn-block" id="btn-print" style="margin-top:10px">Imprimir / Guardar PDF</button>
      </div>`;

    $('#btn-foto').addEventListener('click', () => $('#input-foto').click());
    $('#input-foto').addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (file) subirFoto(file);
    });
    $('#btn-print').addEventListener('click', () => printCredencial(p, qr));
  }

  async function subirFoto(file) {
    if (!file.type.startsWith('image/')) { toast('Elige un archivo de imagen.'); return; }
    const btn = $('#btn-foto');
    const txtAnt = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Subiendo…'; }
    try {
      const blob = await leerImagenReducida(file, 400);
      const ruta = `${state.perfil.id}.jpg`;
      const { error: upErr } = await supabase.storage.from('fotos').upload(ruta, blob, { contentType: 'image/jpeg', upsert: true });
      if (upErr) { toast('No se pudo subir la foto: ' + upErr.message); return; }
      const url = supabase.storage.from('fotos').getPublicUrl(ruta).data.publicUrl;
      const { error } = await supabase.rpc('actualizar_foto', { p_url: url });
      if (error) { toast(error.message); return; }
      state.perfil.foto_url = url;
      toast('Foto actualizada.');
      renderCredencial($('#main'));
    } catch (err) {
      toast('No se pudo procesar la imagen.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = txtAnt; }
    }
  }

  function leerImagenReducida(file, maxDim) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const escala = Math.min(1, maxDim / Math.max(img.width, img.height));
          const w = Math.round(img.width * escala);
          const h = Math.round(img.height * escala);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob')), 'image/jpeg', 0.85);
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function printCredencial(p, qr) {
    printRoot.innerHTML = `
      <div class="print-card">
        <img class="pc-logo" src="assets/Alebrijes Teotihuacan.png" alt="">
        <h1>CASA CLUB ALEBRIJES TEOTIHUACÁN</h1>
        <p class="pc-sub">Credencial de acceso al comedor</p>
        ${p.foto_url ? `<img class="pc-foto" src="${esc(p.foto_url)}" alt="Foto">` : '<div class="pc-foto pc-foto-empty"></div>'}
        <img class="pc-qr" src="${qr}" alt="QR">
        <p class="pc-name">${esc(p.nombre)}</p>
        <p class="pc-folio">FOLIO ${esc(p.folio)}</p>
        <p class="pc-note">Presenta este código en el comedor para registrar tu comida.</p>
      </div>`;
    window.print();
  }

  // ---------------------------------------------------------------- mis datos (jugador)

  async function renderMisDatos(main) {
    main.innerHTML = `<div class="view"><div class="view-title">Mis comidas</div><div class="empty">Cargando…</div></div>`;
    const desde = addDays(todayLocal(), -6);
    const hasta = todayLocal();

    const [asis, faltasAuto] = await Promise.all([
      supabase.from('asistencias').select('*').eq('perfil_id', state.perfil.id).gte('dia', desde).lte('dia', hasta).order('dia', { ascending: false }).order('hora', { ascending: false }),
      supabase.rpc('faltas_automaticas', { p_desde: desde, p_hasta: hasta }),
    ]);

    const registros = [...(asis.data || []).map(a => ({ dia: a.dia, comida: a.comida, hora: a.hora, tipo: 'asis' }))];
    (faltasAuto.data || []).filter(f => f.perfil_id === state.perfil.id).forEach(f => registros.push({ dia: f.dia, comida: f.comida, hora: null, tipo: 'auto' }));
    registros.sort((a, b) => b.dia.localeCompare(a.dia) || (b.hora || '').localeCompare(a.hora || ''));

    main.innerHTML = `
      <div class="view">
        <div class="view-title"><span>Mis comidas</span><span class="small">últimos 7 días</span></div>
        ${registros.length === 0
          ? `<div class="empty">Aún no tienes registros esta semana.</div>`
          : `<div class="list">
              ${registros.map(r => {
                const esAsis = r.tipo === 'asis';
                return `
                <div class="list-row">
                  <div class="row-main">
                    <div class="row-name">${esc(fmtDiaLargo(r.dia))}</div>
                    <div class="row-sub">${esc(etiqueta(r.comida))}${r.hora ? ' · ' + fmtDT(r.hora) : ''}</div>
                  </div>
                  ${esAsis
                    ? '<span class="badge badge-ok">Comida registrada</span>'
                    : r.tipo === 'justificada'
                      ? '<span class="badge badge-warn">Falta justificada</span>'
                      : '<span class="badge badge-bad">Falta</span>'}
                </div>`;
              }).join('')}
            </div>`}
      </div>`;
  }

  // ---------------------------------------------------------------- escáner (cocinera/admin)

  function renderEscaneo(main) {
    main.innerHTML = `
      <div class="view">
        <div class="view-title"><span>Escanear credencial</span></div>

        <div class="card">
          <div class="card-title">Comida a registrar</div>
          <div class="meal-picker" id="meal-picker">
            ${COMIDAS.map(n => `
              <button class="meal-btn ${n === (state.mealSel || 'desayuno') ? 'active' : ''}" data-meal="${n}">
                <span class="m-name">${etiqueta(n)}</span>
              </button>`).join('')}
          </div>
        </div>

        <div class="scanner-wrap">
          <div id="scanner-frame" class="scanner-frame">
            <div class="scanner-off">
              <p>Pulsa para encender la cámara</p>
              <button class="btn btn-primary" id="btn-camera">Encender cámara</button>
            </div>
          </div>
        </div>

        <div class="manual-input">
          <input id="manual-folio" placeholder="FOLIO (4 dígitos)" maxlength="4" inputmode="numeric">
          <button class="btn btn-ghost" id="btn-manual">Buscar</button>
        </div>

        <div id="scan-result"></div>

        <div class="card">
          <div class="card-title"><span>Registrados hoy</span><span class="badge badge-flame" id="today-count">0</span></div>
          <div id="today-list"><div class="empty">Cargando…</div></div>
        </div>
      </div>`;

    state.mealSel = state.mealSel || 'desayuno';

    $('#meal-picker').addEventListener('click', e => {
      const btn = e.target.closest('.meal-btn');
      if (!btn) return;
      state.mealSel = btn.dataset.meal;
      document.querySelectorAll('.meal-btn').forEach(b => b.classList.toggle('active', b === btn));
    });

    $('#btn-camera').addEventListener('click', startScanner);
    $('#btn-manual').addEventListener('click', () => {
      const folio = $('#manual-folio').value.trim().toUpperCase();
      if (folio) registrarScan(folio);
    });
    $('#manual-folio').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const folio = e.target.value.trim().toUpperCase();
        if (folio) registrarScan(folio);
      }
    });

    cargarHoy();
  }

  async function startScanner() {
    const frame = $('#scanner-frame');
    if (!frame) return;
    if (typeof Html5Qrcode === 'undefined') {
      frame.innerHTML = '<div class="scanner-off"><p>Este navegador no soporta el escáner. Escribe el folio a mano.</p></div>';
      return;
    }

    const configs = [{ facingMode: 'environment' }, { facingMode: 'user' }];
    try {
      const cams = await Html5Qrcode.getCameras();
      (cams || []).forEach(c => configs.push({ deviceId: { exact: c.id } }));
    } catch {}

    let ultimoError = 'No se pudo acceder a la cámara';
    for (const cfg of configs) {
      if (state.scanner) { try { state.scanner.stop().catch(() => {}); } catch {} state.scanner = null; }
      frame.innerHTML = '<div class="scanner-off"><p>Iniciando cámara…</p></div>';
      try {
        state.scanner = new Html5Qrcode('scanner-frame');
        await state.scanner.start(cfg, { fps: 8, qrbox: { width: 230, height: 230 } }, text => {
          registrarScan(String(text).trim().toUpperCase()).then(ok => { if (ok) stopScanner(); });
        }, () => {});
        return;
      } catch (err) {
        ultimoError = err && err.name ? err.name : String(err && err.message || '');
      }
    }

    frame.innerHTML = `
      <div class="scanner-off">
        <p>No se pudo acceder a la cámara (${esc(ultimoError)}).</p>
        <p class="chip">Escribe el folio a mano en el campo de abajo.</p>
      </div>`;
  }

  function stopScanner() {
    if (state.scanner) {
      try {
        state.scanner.stop().then(() => {
          state.scanner = null;
          restaurarBotonesCamara();
        }).catch(() => { state.scanner = null; });
      } catch { state.scanner = null; }
    }
  }

  function restaurarBotonesCamara() {
    const frame = $('#scanner-frame');
    if (!frame) return;
    frame.innerHTML = `
      <div class="scanner-off">
        <p>Pulsa para encender la cámara</p>
        <button class="btn btn-primary" id="btn-camera">Encender cámara</button>
      </div>`;
    const b = $('#btn-camera');
    if (b) b.addEventListener('click', startScanner);
  }

  async function registrarScan(folio) {
    if (state.scanLock) return false;
    const comidaSel = state.mealSel || 'desayuno';
    state.scanLock = true;
    try {
      const { data: perfil } = await supabase.from('perfiles').select('*').eq('folio', folio).maybeSingle();
      if (!perfil) {
        mostrarResultado('err', `Folio ${esc(folio)} no encontrado`, 'Verifica que la credencial sea de este club.');
        return false;
      }
      if (perfil.rol !== 'jugador') {
        mostrarResultado('err', `${esc(perfil.nombre)} no es jugador`, 'Solo las credenciales de jugador se registran en el comedor.');
        return false;
      }
      if (!perfil.activo) {
        mostrarResultado('err', `${esc(perfil.nombre)} está bloqueado`, 'Hable con el administrador para reactivar su cuenta.');
        return false;
      }

      const { data: dup } = await supabase.from('asistencias').select('id, hora')
        .eq('perfil_id', perfil.id).eq('comida', comidaSel).eq('dia', todayLocal()).maybeSingle();
      if (dup) {
        mostrarResultado('warn', `${esc(perfil.nombre)} ya está registrado`, `En ${etiqueta(comidaSel)} a las ${fmtDT(dup.hora)}. No se duplica.`);
        return false;
      }

      return await registrarAsistencia(perfil, comidaSel);
    } finally {
      setTimeout(() => state.scanLock = false, 1500);
    }
  }

  async function registrarAsistencia(perfil, comidaSel) {
    const { error } = await supabase.from('asistencias').insert({
      perfil_id: perfil.id,
      comida: comidaSel,
      dia: todayLocal(),
      registrado_por: state.perfil.id,
    });
    if (error) {
      if (error.code === '23505') {
        mostrarResultado('warn', `${esc(perfil.nombre)} ya está registrado`, 'No se registra dos veces la misma comida.');
      } else {
        mostrarResultado('err', 'No se pudo registrar', error.message);
      }
      return false;
    }
    mostrarResultado('ok', `${esc(perfil.nombre)} registrado`, `${etiqueta(comidaSel)} a las ${fmtDT(new Date().toISOString())}.`);
    cargarHoy();
    return true;
  }

  function mostrarResultado(tipo, titulo, sub, acciones) {
    const el = $('#scan-result');
    if (!el) return;
    const icono = tipo === 'ok' ? '✓' : tipo === 'warn' ? '!' : '✕';
    el.innerHTML = `
      <div class="result result-${tipo}">
        <div class="r-icon">${icono}</div>
        <div style="flex:1;min-width:0">
          <div class="r-name">${esc(titulo)}</div>
          <div class="r-sub">${esc(sub)}</div>
          ${acciones ? `<div class="dialog-actions" style="margin-top:12px">${acciones.map(a => `<button class="btn ${a.clase || 'btn-ghost'}" data-acc>${a.label}</button>`).join('')}</div>` : ''}
        </div>
      </div>`;
    if (acciones) {
      el.querySelectorAll('[data-acc]').forEach((b, i) => b.addEventListener('click', acciones[i].fn));
    }
  }

  async function cargarHoy() {
    const box = $('#today-list');
    const countEl = $('#today-count');
    if (!box) return;
    const { data } = await supabase.from('asistencias')
      .select('id, comida, hora, perfil:perfiles!asistencias_perfil_id_fkey(folio, nombre)')
      .eq('dia', todayLocal())
      .order('hora', { ascending: false });
    if (countEl) countEl.textContent = String(data?.length || 0);
    if (!data || data.length === 0) {
      box.innerHTML = '<div class="empty">Aún nadie ha registrado comida hoy.</div>';
      return;
    }
    box.innerHTML = `<div class="list">
      ${data.map(a => `
        <div class="list-row">
          <div class="row-main">
            <div class="row-name">${esc(a.perfil?.nombre || '—')}</div>
            <div class="row-sub">${esc(a.perfil?.folio || '')} · ${esc(etiqueta(a.comida))}</div>
          </div>
          <span class="chip">${fmtDT(a.hora)}</span>
          ${state.perfil.rol === 'administrador' ? `<button class="btn-icon" data-del="${a.id}" title="Eliminar">✕</button>` : ''}
        </div>`).join('')}
    </div>`;
    if (state.perfil.rol === 'administrador') {
      box.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
        await supabase.from('asistencias').delete().eq('id', b.dataset.del);
        toast('Registro eliminado.');
        cargarHoy();
      }));
    }
  }

  // ---------------------------------------------------------------- hoy (cocinera)

  async function renderHoy(main) {
    main.innerHTML = `<div class="view"><div class="view-title">Registros de hoy</div><div class="empty">Cargando…</div></div>`;

    const { data } = await supabase.from('asistencias')
      .select('id, comida, hora, perfil:perfiles!asistencias_perfil_id_fkey(folio, nombre)')
      .eq('dia', todayLocal()).order('hora', { ascending: false });

    const asisList = data || [];

    main.innerHTML = `
      <div class="view">
        <div class="view-title"><span>Registros de hoy</span><span class="small">${esc(fmtDiaLargo(todayLocal()))}</span></div>
        <div class="stats">
          <div class="stat"><div class="n ok">${asisList.length}</div><div class="l">Comidas</div></div>
          <div class="stat"><div class="n">${COMIDAS.length}</div><div class="l">Servicios</div></div>
        </div>

        <div class="card">
          <div class="card-title">Comidas registradas</div>
          ${asisList.length === 0
            ? '<div class="empty">Aún no hay registros hoy.</div>'
            : `<div class="list">${asisList.map(a => `
                <div class="list-row">
                  <div class="row-main">
                    <div class="row-name">${esc(a.perfil?.nombre || '—')}</div>
                    <div class="row-sub">${esc(a.perfil?.folio || '')}</div>
                  </div>
                  <span class="badge badge-ok">${esc(etiqueta(a.comida))}</span>
                  <span class="chip">${fmtDT(a.hora)}</span>
                </div>`).join('')}</div>`}
        </div>
      </div>`;
  }

  // ---------------------------------------------------------------- admin

  function renderAdmin(main) {
    main.innerHTML = `
      <div class="view">
        <div class="view-title">Panel de administración</div>
        <div class="tabs">
          ${['jugadores', 'reporte'].map(t =>
            `<button class="tab-btn ${state.adminTab === t ? 'active' : ''}" data-tab="${t}">${
              t === 'jugadores' ? 'Jugadores' : 'Reporte'}</button>`).join('')}
        </div>
        <div id="admin-body"></div>
      </div>`;

    document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => {
      state.adminTab = b.dataset.tab;
      renderAdmin(main);
    }));

    const body = $('#admin-body');
    if (state.adminTab === 'jugadores') renderAdminJugadores(body);
    else renderAdminReporte(body);
  }

  async function renderAdminJugadores(body) {
    body.innerHTML = '<div class="empty">Cargando…</div>';

    const { data: perfiles } = await supabase.from('perfiles').select('*').order('rol').order('folio');

    const jugadores = (perfiles || []).filter(p => p.rol === 'jugador');
    const personal = (perfiles || []).filter(p => p.rol !== 'jugador');

    body.innerHTML = `
      <div class="card">
        <div class="card-title">Crear usuario</div>
        <form class="form" id="form-crear">
          <div class="form-row">
            <div class="field"><label>Nombre completo</label><input id="c-nombre" required placeholder="Ej. Juan Pérez"></div>
            <div class="field"><label>Folio (4 dígitos)</label><input id="c-folio" required placeholder="Ej. 0012" maxlength="4" pattern="\d{4}" inputmode="numeric" title="Solo 4 números"></div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Rol</label>
              <select id="c-rol">
                <option value="jugador">Jugador</option>
                <option value="cocinera">Cocinera</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
            <div class="field">
              <label>Usuario (correo)</label>
              <input id="c-usuario" placeholder="auto: folio@alebrijes.club">
            </div>
          </div>
          <div class="field">
            <label>Contraseña</label>
            <input id="c-pass" required placeholder="Mínimo 6 caracteres" minlength="6">
          </div>
          <button class="btn btn-primary btn-block" type="submit">Crear usuario</button>
        </form>
      </div>

      <div class="card">
        <div class="card-title">Jugadores (${jugadores.length})</div>
        ${jugadores.length === 0
          ? '<div class="empty">Aún no hay jugadores.</div>'
          : `<div class="list">${jugadores.map(p => rowUsuario(p)).join('')}</div>`}
      </div>

      ${personal.length ? `
      <div class="card">
        <div class="card-title">Personal (${personal.length})</div>
        <div class="list">${personal.map(p => rowUsuario(p)).join('')}</div>
      </div>` : ''}
    `;

    $('#form-crear').addEventListener('submit', async e => {
      e.preventDefault();
      const btn = e.target.querySelector('button');
      btn.disabled = true;
      const { data, error } = await supabase.rpc('crear_usuario', {
        p_nombre: $('#c-nombre').value.trim(),
        p_folio: $('#c-folio').value.trim().toUpperCase(),
        p_rol: $('#c-rol').value,
        p_usuario: $('#c-usuario').value.trim(),
        p_password: $('#c-pass').value,
      });
      btn.disabled = false;
      if (error) {
        toast(error.message.replace(/^P0001:\s*/, ''));
        return;
      }
      toast('Usuario creado. ¡Ya puede iniciar sesión!');
      e.target.reset();
      renderAdminJugadores(body);
    });

    wireUserActions(body);
  }

  function rowUsuario(p) {
    const etiquetaRol = { administrador: 'Admin', cocinera: 'Cocinera', jugador: 'Jugador' }[p.rol];
    return `
      <div class="list-row">
        ${p.foto_url ? `<img class="avatar" src="${esc(p.foto_url)}" alt="">` : '<div class="avatar avatar-empty"></div>'}
        <div class="row-main">
          <div class="row-name">${esc(p.nombre)}</div>
          <div class="row-sub"><span class="folio">${esc(p.folio)}</span> · ${etiquetaRol}</div>
        </div>
        <span class="badge ${p.activo ? 'badge-ok' : 'badge-muted'}">${p.activo ? 'Activo' : 'Inactivo'}</span>
        <button class="btn-icon" data-reset="${p.folio}" title="Cambiar contraseña">Clave</button>
        <button class="btn-icon" data-toggle="${p.id}" title="Activar/desactivar">${p.activo ? 'Bloquear' : 'Activar'}</button>
      </div>`;
  }

  function wireUserActions(body) {
    body.querySelectorAll('[data-reset]').forEach(b => b.addEventListener('click', () => {
      abrirDialogo(`
        <h3>Nueva contraseña · ${esc(b.dataset.reset)}</h3>
        <div class="field"><label>Contraseña nueva</label><input id="d-pass" type="password" minlength="6" required placeholder="Mínimo 6 caracteres"></div>
        <div class="dialog-actions">
          <button class="btn btn-ghost" data-cerrar>Cancelar</button>
          <button class="btn btn-primary" id="d-ok">Guardar</button>
        </div>`);
      $('#d-ok').addEventListener('click', async () => {
        const pass = $('#d-pass').value;
        if (pass.length < 6) { toast('La contraseña debe tener al menos 6 caracteres.'); return; }
        const { error } = await supabase.rpc('reiniciar_contrasena', { p_folio: b.dataset.reset, p_nueva: pass });
        cerrarDialogo();
        if (error) { toast(error.message.replace(/^P0001:\s*/, '')); return; }
        toast('Contraseña actualizada.');
      });
    }));

    body.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', async () => {
      const { data: p } = await supabase.from('perfiles').select('activo').eq('id', b.dataset.toggle).single();
      const { error } = await supabase.from('perfiles').update({ activo: !p.activo }).eq('id', b.dataset.toggle);
      if (error) { toast(error.message); return; }
      toast('Estado actualizado.');
      renderAdminJugadores(body);
    }));
  }

  async function renderAdminReporte(body) {
    body.innerHTML = '<div class="empty">Cargando…</div>';
    const hoy = todayLocal();
    body.innerHTML = `
      <div class="card">
        <div class="card-title">Reporte de faltas</div>
        <div class="form-row" style="margin-bottom:12px">
          <div class="field"><label>Desde</label><input type="date" id="r-desde" value="${addDays(hoy, -6)}"></div>
          <div class="field"><label>Hasta</label><input type="date" id="r-hasta" value="${hoy}"></div>
        </div>
        <button class="btn btn-primary btn-block" id="r-ver">Generar reporte</button>
      </div>
      <div id="r-resultado"></div>`;

    $('#r-ver').addEventListener('click', () => generarReporte($('#r-desde').value, $('#r-hasta').value, $('#r-resultado')));
  }

  async function generarReporte(desde, hasta, box) {
    if (!desde || !hasta || desde > hasta) { toast('Rango de fechas inválido.'); return; }
    box.innerHTML = '<div class="empty">Generando reporte…</div>';

    const [faltas, asis] = await Promise.all([
      supabase.rpc('faltas_automaticas', { p_desde: desde, p_hasta: hasta }),
      supabase.from('asistencias')
        .select('id, perfil_id, comida, dia, hora, perfil:perfiles!asistencias_perfil_id_fkey(folio, nombre, foto_url)')
        .gte('dia', desde).lte('dia', hasta).order('dia', { ascending: true }).order('hora', { ascending: true }),
    ]);

    const filas = faltas.data || [];
    filas.sort((a, b) => a.dia.localeCompare(b.dia) || a.nombre.localeCompare(b.nombre));

    const asisList = asis.data || [];
    const sinFaltas = filas.length === 0;

    box.innerHTML = `
      <div class="card">
        <div class="card-title"><span>Faltas (${filas.length})</span><span class="small">${desde} → ${hasta}</span></div>
        ${sinFaltas
          ? '<div class="empty">Sin faltas en el periodo. ¡Buen trabajo!</div>'
          : `<div class="list">
              ${filas.map(f => `
                <div class="list-row">
                  ${f.foto_url ? `<img class="avatar" src="${esc(f.foto_url)}" alt="">` : '<div class="avatar avatar-empty"></div>'}
                  <div class="row-main">
                    <div class="row-name">${esc(f.nombre || '—')}</div>
                    <div class="row-sub"><span class="folio">${esc(f.folio || '—')}</span> · ${esc(fmtDiaLargo(f.dia))} · ${esc(etiqueta(f.comida))}</div>
                  </div>
                  <span class="badge badge-bad">Falta</span>
                </div>`).join('')}
            </div>`}
      </div>

      <div class="card">
        <div class="card-title"><span>Asistencias (${asisList.length})</span></div>
        ${asisList.length === 0
          ? '<div class="empty">Sin asistencias en el periodo.</div>'
          : `<div class="table-wrap"><table>
              <thead><tr><th>Día</th><th>Jugador</th><th>Comida</th><th>Hora</th><th></th></tr></thead>
              <tbody>
                ${asisList.map(a => `
                  <tr>
                    <td>${esc(fmtDia(a.dia))}</td>
                    <td>${a.perfil?.foto_url ? `<img class="avatar avatar-sm" src="${esc(a.perfil.foto_url)}" alt="">` : ''}${esc(a.perfil?.nombre || '—')} <span class="folio">${esc(a.perfil?.folio || '')}</span></td>
                    <td>${esc(etiqueta(a.comida))}</td>
                    <td class="chip">${fmtDT(a.hora)}</td>
                    <td><button class="btn-icon" data-del="${a.id}" title="Eliminar registro">✕</button></td>
                  </tr>`).join('')}
              </tbody>
            </table></div>`}
      </div>`;

    box.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      await supabase.from('asistencias').delete().eq('id', b.dataset.del);
      toast('Registro eliminado.');
      generarReporte(desde, hasta, box);
    }));
  }

  // ---------------------------------------------------------------- diálogo

  function abrirDialogo(html) {
    const bd = document.createElement('div');
    bd.className = 'dialog-backdrop';
    bd.innerHTML = `<div class="dialog">${html}</div>`;
    bd.addEventListener('click', e => { if (e.target === bd) cerrarDialogo(); });
    bd.querySelectorAll('[data-cerrar]').forEach(b => b.addEventListener('click', cerrarDialogo));
    document.body.appendChild(bd);
  }

  function cerrarDialogo() {
    const bd = document.querySelector('.dialog-backdrop');
    if (bd) bd.remove();
  }

  // ---------------------------------------------------------------- init

  const splash = $('#splash');
  const hideSplash = () => {
    if (!splash) return;
    splash.classList.add('gone');
    setTimeout(() => splash.remove(), 400);
  };

  const showFatal = msg => {
    const el = $('#fatal');
    if (!el) return;
    const m = $('#fatal-msg');
    if (m) m.textContent = msg;
    el.classList.remove('hidden');
    hideSplash();
  };

  window.addEventListener('error', e => showFatal('Se produjo un error al cargar la aplicación. Revisa tu conexión e inténtalo de nuevo.'));
  window.addEventListener('unhandledrejection', e => showFatal('Se produjo un error al cargar la aplicación. Revisa tu conexión e inténtalo de nuevo.'));

  (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await enterApp(session);
      else renderLogin();
      hideSplash();

      supabase.auth.onAuthStateChange((ev, s) => {
        if (ev === 'SIGNED_OUT') {
          stopScanner();
          state.user = null;
          state.perfil = null;
          renderLogin();
        } else if (ev === 'SIGNED_IN' && s && !state.perfil) {
          enterApp(s);
        }
      });
    } catch (err) {
      showFatal(err && err.message ? err.message : 'Se produjo un error al cargar la aplicación. Revisa tu conexión e inténtalo de nuevo.');
    }
  })();
})();