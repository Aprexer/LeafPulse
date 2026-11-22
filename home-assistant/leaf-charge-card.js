// LeafPulse Home Assistant card — Copyright (C) 2026 Aprexer
// SPDX-License-Identifier: GPL-3.0-or-later — https://github.com/Aprexer/LeafPulse
/* Leaf charge card — custom Lovelace card for a Nissan LEAF on a Wallbox.
   Reads the LeafPulse app sensors, the Wallbox integration and the
   charge-limit helpers. type: custom:leaf-charge-card  (optional: wallbox: <prefix>) */
(() => {
  const CSS = `
  :host{display:block}
  .card{position:relative;overflow:hidden;border-radius:26px;padding:20px 20px 18px;color:#e9f5f0;
    background:radial-gradient(120% 90% at 50% 0%,#12352d 0%,#0b1d19 55%,#081311 100%);
    box-shadow:0 10px 40px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.06);
    font-family:var(--paper-font-body1_-_font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
    animation:enter .7s cubic-bezier(.2,.8,.2,1) both}
  @keyframes enter{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
  .aurora{position:absolute;inset:-40%;pointer-events:none;opacity:.0;transition:opacity 1.2s;
    background:conic-gradient(from 0deg,transparent 0 20%,rgba(46,230,166,.14) 30%,transparent 45%,rgba(0,190,255,.10) 65%,transparent 80%);
    animation:spin 14s linear infinite}
  .charging .aurora{opacity:1}
  .bypass .aurora{opacity:1;background:conic-gradient(from 0deg,transparent 0 20%,rgba(255,170,40,.16) 30%,transparent 45%,rgba(255,90,60,.10) 65%,transparent 80%)}
  @keyframes spin{to{transform:rotate(360deg)}}
  .top{position:relative;display:flex;align-items:center;gap:10px}
  .car{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:rgba(46,230,166,.12);color:#2ee6a6}
  .name{font-weight:700;font-size:17px;letter-spacing:.2px}
  .sub{font-size:12px;opacity:.6}
  .pill{margin-left:auto;display:flex;align-items:center;gap:7px;padding:6px 12px;border-radius:999px;font-size:13px;font-weight:600;
    background:rgba(255,255,255,.07);transition:background .4s,color .4s}
  .dot{width:8px;height:8px;border-radius:50%;background:currentColor;box-shadow:0 0 0 0 currentColor}
  .pill.go{color:#2ee6a6;background:rgba(46,230,166,.12)} .pill.go .dot{animation:ping 1.6s infinite}
  .pill.hold{color:#7cc8ff;background:rgba(124,200,255,.12)}
  .pill.warn{color:#ffb547;background:rgba(255,181,71,.13)} .pill.warn .dot{animation:ping 1.6s infinite}
  .pill.idle{color:#a9b8b3}
  @keyframes ping{0%{box-shadow:0 0 0 0 currentColor}70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}
  .ringwrap{position:relative;width:min(250px,72%);margin:14px auto 4px;aspect-ratio:1}
  svg.ring{width:100%;height:100%;transform:rotate(-90deg);overflow:visible}
  .track{fill:none;stroke:rgba(255,255,255,.07);stroke-width:14}
  .arc{fill:none;stroke:url(#lcGrad);stroke-width:14;stroke-linecap:round;transition:stroke-dasharray 1.2s cubic-bezier(.2,.8,.2,1)}
  .bypass .arc{stroke:url(#lcGradB)}
  .charging .arc{animation:glow 2.4s ease-in-out infinite}
  @keyframes glow{0%,100%{filter:drop-shadow(0 0 3px rgba(46,230,166,.35))}50%{filter:drop-shadow(0 0 12px rgba(46,230,166,.85))}}
  .bypass.charging .arc{animation-name:glowB}
  @keyframes glowB{0%,100%{filter:drop-shadow(0 0 3px rgba(255,170,40,.35))}50%{filter:drop-shadow(0 0 14px rgba(255,150,40,.9))}}
  .flow{fill:none;stroke:rgba(255,255,255,.55);stroke-width:3;stroke-linecap:round;stroke-dasharray:2 16;opacity:0;transition:opacity .6s}
  .charging .flow{opacity:.7;animation:flow 1.1s linear infinite}
  @keyframes flow{to{stroke-dashoffset:-18}}
  .tick{stroke:#fff;stroke-width:3;stroke-linecap:round;opacity:.85;transition:transform 1s cubic-bezier(.2,.8,.2,1)}
  .spark{fill:#fff;opacity:0;transition:opacity .4s}
  .charging .spark{opacity:1;animation:sparkle 1.2s ease-in-out infinite}
  @keyframes sparkle{0%,100%{r:4}50%{r:7}}
  .center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
  .bolt{height:22px;color:#2ee6a6;opacity:0;transform:translateY(4px);transition:opacity .4s,transform .4s}
  .bypass .bolt{color:#ffb547}
  .charging .bolt{opacity:1;transform:none;animation:float 2s ease-in-out infinite}
  @keyframes float{50%{transform:translateY(-4px)}}
  .soc{font-size:56px;font-weight:800;line-height:1;letter-spacing:-2px;font-variant-numeric:tabular-nums}
  .soc small{font-size:22px;font-weight:600;opacity:.7;letter-spacing:0;margin-left:2px}
  .socsub{margin-top:6px;font-size:13px;opacity:.65}
  .tag{display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;background:rgba(255,255,255,.08);color:#a9b8b3}
  .tag:empty{display:none}
  .tag.live{color:#2ee6a6;background:rgba(46,230,166,.14)}
  .tag.live:before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor;animation:ping 1.6s infinite}
  .tag.est{color:#7cc8ff;background:rgba(124,200,255,.13)}
  .tag.old{color:#ffb547;background:rgba(255,181,71,.15)}
  .stale svg.ring{filter:saturate(.3) brightness(.8)}
  .stale .soc{opacity:.6}
  .foot.old{color:#ffb547;opacity:.95}
  .cost{position:relative;display:flex;align-items:baseline;flex-wrap:wrap;gap:8px;justify-content:center;margin:-6px 0 14px;font-variant-numeric:tabular-nums}
  .cost:empty{display:none}
  .cost .cl{font-size:12px;opacity:.6;text-transform:uppercase;letter-spacing:.6px}
  .cost .cv{font-size:22px;font-weight:800;color:#ffe08a}
  .cost .cs{font-size:12px;opacity:.6}
  .cbar{flex-basis:100%;height:4px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden;margin:2px 30px 0}
  .cbar i{display:block;height:100%;background:linear-gradient(90deg,#ffd27a,#ffb547);border-radius:4px}
  .eta{position:relative;text-align:center;font-size:15px;margin:2px 0 14px;min-height:20px}
  .eta b{color:#2ee6a6} .bypass .eta b{color:#ffb547}
  .grid{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .tile{background:rgba(255,255,255,.05);border-radius:16px;padding:10px 12px;transition:transform .2s,background .2s}
  .tile:hover{transform:translateY(-2px);background:rgba(255,255,255,.08)}
  .tl{font-size:11px;opacity:.6;text-transform:uppercase;letter-spacing:.6px}
  .tv{font-size:19px;font-weight:700;margin-top:3px;font-variant-numeric:tabular-nums}
  .tv small{font-size:12px;font-weight:600;opacity:.6;margin-left:2px}
  .row{position:relative;display:flex;align-items:center;gap:8px;margin-top:14px}
  .label{font-size:13px;opacity:.7;margin-right:auto}
  .chip{border:0;cursor:pointer;padding:8px 14px;border-radius:12px;font-weight:700;font-size:14px;color:#cfe;background:rgba(255,255,255,.06);transition:all .25s}
  .chip:hover{background:rgba(255,255,255,.12)}
  .chip.on{background:#2ee6a6;color:#05261c;box-shadow:0 4px 18px rgba(46,230,166,.35)}
  .bypass .chip{opacity:.4}
  .btn{border:0;cursor:pointer;padding:8px 14px;border-radius:12px;font-weight:600;font-size:13px;color:#e9f5f0;background:rgba(255,255,255,.08);transition:background .2s}
  .btn:hover{background:rgba(255,255,255,.15)} .btn[hidden]{display:none}
  .big{position:relative;width:100%;margin-top:14px;border:0;cursor:pointer;border-radius:20px;padding:16px 18px;display:flex;align-items:center;gap:14px;text-align:left;
    color:#ffd79a;background:rgba(255,170,40,.08);box-shadow:inset 0 0 0 1.5px rgba(255,170,40,.45);transition:transform .15s,box-shadow .3s,background .3s;overflow:hidden}
  .big:active{transform:scale(.98)}
  .big:hover{background:rgba(255,170,40,.13)}
  .big .bi{width:44px;height:44px;flex:none;border-radius:14px;display:grid;place-items:center;background:rgba(255,170,40,.16)}
  .big .bt{font-size:17px;font-weight:800} .big .bs{font-size:12.5px;opacity:.75;margin-top:2px}
  .big.on{color:#2a1500;background:repeating-linear-gradient(-45deg,#ffb547 0 18px,#ff9a2e 18px 36px);background-size:51px 51px;
    box-shadow:0 8px 30px rgba(255,150,40,.45);animation:stripes 1s linear infinite}
  .big.on .bi{background:rgba(0,0,0,.14)}
  @keyframes stripes{to{background-position:51px 0}}
  .big.on .bi svg{animation:launch 1.4s ease-in-out infinite}
  @keyframes launch{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px) rotate(-6deg)}}
  .veh{position:relative;margin-top:12px}
  .veh[hidden]{display:none}
  .vh{font-size:11px;opacity:.6;text-transform:uppercase;letter-spacing:.6px;margin:0 2px 6px}
  .vgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
  .vgrid .tile[hidden]{display:none}
  .vgrid .tile:first-child{grid-column:1/-1}
  .vs{font-size:11px;opacity:.65;margin-top:2px}
  .vs.ok{color:#2ee6a6;opacity:.9}.vs.warn{color:#ffc247;opacity:1}.vs.bad{color:#ff6a3d;opacity:1}
  .foot{position:relative;margin-top:12px;font-size:11.5px;opacity:.5;text-align:center}
  .peak{position:relative;display:flex;align-items:center;gap:12px;margin:0 0 14px;padding:11px 12px 11px 14px;border-radius:16px;font-size:13px;line-height:1.35;
    color:#cfe9ff;background:rgba(124,200,255,.09);box-shadow:inset 0 0 0 1px rgba(124,200,255,.28);animation:enter .5s both}
  .peak[hidden]{display:none}
  .peak.warn{color:#ffe2b0;background:rgba(255,181,71,.10);box-shadow:inset 0 0 0 1px rgba(255,181,71,.38)}
  .peak .pi{flex:none;width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.08)}
  .peak .pt{flex:1} .peak .pt b{font-weight:700}
  .peak .btn{flex:none;white-space:nowrap}
  .row[hidden]{display:none}
  .bypass .chip.pk{opacity:1}
  .chip.pk{padding:8px 11px}
  `;
  const BOLT = '<svg viewBox="0 0 24 24" height="100%"><path fill="currentColor" d="M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z"/></svg>';
  const CAR = '<svg viewBox="0 0 24 24" width="22"><path fill="currentColor" d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>';
  const ROCKET = '<svg viewBox="0 0 24 24" width="24"><path fill="currentColor" d="M13.13 22.19l-1.63-3.83c1.57-.58 3.04-1.36 4.4-2.27l-2.77 6.1M5.64 12.5l-3.83-1.63 6.1-2.77C7 9.46 6.22 10.93 5.64 12.5M21.61 2.39S16.66.269 11 5.93c-2.19 2.19-3.5 4.6-4.35 6.71-.28.75-.09 1.57.46 2.13l2.13 2.12c.55.56 1.37.74 2.12.46 2.11-.84 4.52-2.17 6.71-4.35 5.66-5.66 3.54-10.61 3.54-10.61m-7.07 7.07c-.78-.78-.78-2.05 0-2.83s2.05-.78 2.83 0c.77.78.78 2.05 0 2.83-.78.78-2.05.78-2.83 0M8.88 16.53l-1.41-1.41 1.41 1.41M6.24 22l3.64-3.64c-.34-.09-.67-.24-.97-.45L4.83 22h1.41M2 22h1.41l4.77-4.76-1.42-1.41L2 20.59V22m0-2.83l4.09-4.08c-.21-.3-.36-.62-.45-.97L2 17.76v1.41z"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" width="18"><path fill="currentColor" d="M12 2a9.9 9.9 0 0 0-3 .5 10 10 0 0 1 0 19A10 10 0 1 0 12 2z"/></svg>';
  // Rocky Mountain Power (Utah) time-of-use: 6-10pm weekdays except holidays. The window itself comes from
  // sensor.leaf_next_peak_start; these rates are only used for the wording.
  const PEAK_MODES = [['Off', 'Off'], ['Warn only', 'Warn'], ['Pause for peak', 'Avoid']];
  const R = 92, C = 2 * Math.PI * R;

  class LeafChargeCard extends HTMLElement {
    setConfig(config) {
      this._cfg = Object.assign({ wallbox: 'wallbox_pulsar_plus_sn_000000', title: 'Nissan LEAF S+' }, config || {});
      this._shown = null;
    }
    getCardSize() { return 9; }
    getGridOptions() { return { columns: 12, rows: 'auto', min_columns: 6 }; }

    set hass(hass) {
      this._hass = hass;
      if (!this._root) this._build();
      this._update();
    }

    _build() {
      this._root = this.attachShadow({ mode: 'open' });
      this._root.innerHTML = `<style>${CSS}</style>
      <div class="card"><div class="aurora"></div>
        <div class="top"><div class="car">${CAR}</div>
          <div><div class="name"></div><div class="sub" id="sub"></div></div>
          <div class="pill idle" id="pill"><span class="dot"></span><span id="pilltext"></span></div></div>
        <div class="ringwrap">
          <svg class="ring" viewBox="0 0 220 220">
            <defs>
              <linearGradient id="lcGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00c2ff"/><stop offset="1" stop-color="#2ee6a6"/></linearGradient>
              <linearGradient id="lcGradB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6a3d"/><stop offset="1" stop-color="#ffc247"/></linearGradient>
            </defs>
            <circle class="track" cx="110" cy="110" r="${R}"/>
            <circle class="arc" id="arc" cx="110" cy="110" r="${R}" stroke-dasharray="0 ${C}"/>
            <circle class="flow" id="flow" cx="110" cy="110" r="${R}"/>
            <g id="tickg"><line class="tick" x1="${110 + R - 12}" y1="110" x2="${110 + R + 12}" y2="110"/></g>
            <circle class="spark" id="spark" cx="${110 + R}" cy="110" r="5"/>
          </svg>
          <div class="center"><div class="bolt">${BOLT}</div>
            <div class="soc" id="soc">—</div><div class="socsub" id="socsub"></div><div class="tag" id="tag"></div></div>
        </div>
        <div class="eta" id="eta"></div><div class="cost" id="cost"></div>
        <div class="peak" id="peak" hidden><div class="pi">${MOON}</div><div class="pt" id="peakt"></div><button class="btn" id="peakb" hidden></button></div>
        <div class="grid">
          ${['power:Power', 'added:Added', 'left:Time left', 'soh:Health', 'gap:Cell gap', 'temp:Pack temp']
            .map(t => `<div class="tile"><div class="tl">${t.split(':')[1]}</div><div class="tv" id="t_${t.split(':')[0]}">—</div></div>`).join('')}
        </div>
        <div class="veh" id="veh"><div class="vh">Vehicle</div><div class="vgrid">
          ${['v12:12V battery', 'qc:Quick charges', 'l2:L1/L2 charges']
            .map(t => `<div class="tile" id="w_${t.split(':')[0]}"><div class="tl">${t.split(':')[1]}</div><div class="tv" id="t_${t.split(':')[0]}">—</div><div class="vs" id="s_${t.split(':')[0]}"></div></div>`).join('')}
        </div></div>
        <div class="row"><span class="label">Charge limit</span>
          ${[70, 80, 90].map(v => `<button class="chip" data-v="${v}">${v}%</button>`).join('')}</div>
        <div class="row" id="peakrow" hidden><span class="label">Peak rate 6–10pm</span>
          ${PEAK_MODES.map(([v, l]) => `<button class="chip pk" data-m="${v}">${l}</button>`).join('')}</div>
        <button class="big" id="bypass"><div class="bi">${ROCKET}</div>
          <div><div class="bt" id="bt"></div><div class="bs" id="bs"></div></div></button>
        <div class="row"><span class="label" id="wbtext"></span><button class="btn" id="pause"></button></div>
        <div class="foot" id="foot"></div>
      </div>`;
      const $ = id => this._root.getElementById(id);
      this._el = { card: this._root.querySelector('.card'), name: this._root.querySelector('.name') };
      ['peak', 'peakt', 'peakb', 'peakrow', 'sub', 'pill', 'pilltext', 'arc', 'flow', 'tickg', 'spark', 'soc', 'socsub', 'tag', 'eta', 'cost', 'bypass', 'bt', 'bs', 'wbtext', 'pause', 'foot',
        't_power', 't_added', 't_left', 't_soh', 't_gap', 't_temp', 'veh',
        'w_v12', 'w_qc', 'w_l2', 't_v12', 't_qc', 't_l2', 's_v12', 's_qc', 's_l2'].forEach(k => this._el[k] = $(k));
      this._root.querySelectorAll('.chip:not(.pk)').forEach(b => b.addEventListener('click', () => {
        this._haptic('selection');
        this._call('input_number', 'set_value', { entity_id: 'input_number.leaf_charge_target', value: Number(b.dataset.v) });
      }));
      this._root.querySelectorAll('.chip.pk').forEach(b => b.addEventListener('click', () => {
        this._haptic('selection');
        this._call('input_select', 'select_option', { entity_id: 'input_select.leaf_peak_mode', option: b.dataset.m });
      }));
      this._el.peakb.addEventListener('click', () => { this._haptic('medium'); this._peakAction(this._el.peakb.dataset.act); });
      this._el.bypass.addEventListener('click', () => {
        this._haptic('heavy');
        this._call('input_boolean', 'toggle', { entity_id: 'input_boolean.leaf_charge_bypass' });
      });
      this._el.pause.addEventListener('click', () => {
        const sw = `switch.${this._cfg.wallbox}_pause_resume`;
        this._haptic('medium');
        if (this._st('input_boolean.leaf_peak_paused') === 'on') { this._peakAction('now'); return; }
        this._call('switch', this._st(sw) === 'on' ? 'turn_off' : 'turn_on', { entity_id: sw });
      });
      setInterval(() => this._update(), 30000);
    }

    _peakAction(act) {
      // 'now' = charge through peak hours for this plug-in; 'pause' = hold until peak ends.
      if (act === 'now') this._call('input_boolean', 'turn_on', { entity_id: 'input_boolean.leaf_peak_override' });
      else if (act === 'pause') {
        this._call('input_boolean', 'turn_on', { entity_id: 'input_boolean.leaf_peak_paused' });
        this._call('switch', 'turn_off', { entity_id: `switch.${this._cfg.wallbox}_pause_resume` });
      }
    }
    _call(domain, service, data) { this._hass && this._hass.callService(domain, service, data); }
    _haptic(type) { this.dispatchEvent(new CustomEvent('haptic', { detail: type, bubbles: true, composed: true })); }
    _st(id) { const s = this._hass && this._hass.states[id]; return s ? s.state : undefined; }
    // Seconds since an entity's value was read (the app's updated_at, else HA's own time).
    _age(id) {
      const ent = this._hass && this._hass.states[id];
      if (!ent) return Infinity;
      const t = new Date((ent.attributes && ent.attributes.updated_at) || ent.last_updated).getTime();
      return Number.isFinite(t) ? Math.max(0, (Date.now() - t) / 1000) : Infinity;
    }

    _num(id) { const v = parseFloat(this._st(id)); return Number.isFinite(v) ? v : null; }

    _update() {
      const h = this._hass; if (!h || !this._el) return;
      const wb = `sensor.${this._cfg.wallbox}_`, e = this._el;
      const status = this._st(wb + 'status_description') || 'unknown';
      const power = this._num(wb + 'charging_power') || 0;
      const added = this._num(wb + 'added_energy');
      const bypass = this._st('input_boolean.leaf_charge_bypass') === 'on';
      const limit = this._num('input_number.leaf_charge_target') || 80;
      const target = bypass ? 100 : limit;
      const left = this._num('sensor.leaf_charge_time_remaining');
      const socEnt = h.states['sensor.leaf_state_of_charge'];
      const estEnt = h.states['sensor.leaf_estimated_state_of_charge'];
      const measured = this._num('sensor.leaf_state_of_charge');
      const estimate = this._num('sensor.leaf_estimated_state_of_charge');
      // Use the reading's own time (sent by the app) so late-delivered data never looks live.
      const age = this._age('sensor.leaf_state_of_charge');
      const live = age < 300;
      const unplugged = ['Ready', 'Disconnected', 'unknown', 'unavailable'].includes(status);
      const charging = status === 'Charging' && power > 0.1;
      // Value, source and time are chosen together: a fresh measured SOC wins; an
      // estimate is used only while charging or when it is newer than the last reading.
      const estAge = estEnt ? (Date.now() - new Date(estEnt.last_changed).getTime()) / 1000 : Infinity;
      let soc = measured, source = measured == null ? null : 'reading';
      if (measured != null && live) source = 'live';
      else if (estimate != null && (charging || measured == null || estAge + 60 < age)) { soc = estimate; source = 'estimate'; }
      const paused = /paus/i.test(status);
      const reached = soc != null && soc >= target - 0.5;
      const pk = this._peakInfo();

      e.card.classList.toggle('charging', charging);
      e.card.classList.toggle('bypass', bypass);
      e.card.classList.toggle('plugged', !unplugged);
      e.card.classList.toggle('awake', live || charging);
      e.card.classList.toggle('moving', live && unplugged);
      const lit = soc == null ? 0 : Math.round(Math.max(0, Math.min(100, soc)) / 100 * 12);
      this._root.querySelectorAll('.cell').forEach((c, i) => { c.classList.toggle('on', i < lit); c.classList.toggle('tip', i === lit - 1); });
      e.name.textContent = this._cfg.title;
      e.sub.textContent = unplugged ? (live ? 'Car on · LeafPulse connected' : 'Not plugged in') : `Wallbox · ${status}`;

      let pill = 'idle', text = 'Unplugged';
      if (charging) { pill = bypass ? 'warn' : 'go'; text = bypass ? 'Charging to 100%' : 'Charging'; }
      else if (pk && pk.held && !unplugged) { pill = 'hold'; text = `Waiting till ${pk.endTxt}`; }
      else if (paused && reached) { pill = 'hold'; text = `Holding at ${Math.round(target)}%`; }
      else if (paused) { pill = 'hold'; text = 'Paused'; }
      else if (!unplugged) { pill = 'hold'; text = 'Plugged in'; }
      else if (live) { pill = 'go'; text = 'Car on'; }
      e.pill.className = 'pill ' + pill; e.pilltext.textContent = text;

      // Ring
      const pct = soc == null ? 0 : Math.max(0, Math.min(100, soc));
      e.arc.setAttribute('stroke-dasharray', `${(C * pct) / 100} ${C}`);
      e.arc.style.opacity = pct > 0 ? 1 : 0;
      // moving dots only along the filled part of the ring
      e.flow.style.display = charging ? '' : 'none';
      e.flow.style.strokeDasharray = this._dots(pct);
      e.tickg.style.transformOrigin = '110px 110px';
      e.tickg.style.transform = `rotate(${(target / 100) * 360}deg)`;
      const a = (pct / 100) * 2 * Math.PI;
      e.spark.setAttribute('cx', 110 + R * Math.cos(a)); e.spark.setAttribute('cy', 110 + R * Math.sin(a));
      this._tween(soc);
      e.socsub.textContent = soc == null ? 'Waiting for the car' : `Limit ${Math.round(target)}%`;
      this._tag(socEnt, source === 'estimate' ? estAge : age, source, charging, soc);
      this._cost(h, wb, power, added, unplugged, charging, paused, reached, left);

      // ETA
      if (charging && left != null && left > 0) {
        const done = new Date(Date.now() + left * 60000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        e.eta.innerHTML = `<b>${Math.round(target)}%</b> by <b>${done}</b> · ${this._dur(left)} left`;
      } else if (pk && pk.held && !unplugged) e.eta.innerHTML = `Carries on at <b>${pk.endTxt}</b> to <b>${Math.round(target)}%</b>`;
      else if (paused && reached) e.eta.innerHTML = `Stopped at your <b>${Math.round(target)}%</b> limit`;
      else if (!unplugged && reached) e.eta.innerHTML = `Already at <b>${Math.round(target)}%</b>`;
      else if (unplugged && soc != null) e.eta.innerHTML = `Plug in to charge to <b>${Math.round(target)}%</b>`;
      else e.eta.textContent = '';

      // Tiles
      const tempC = this._num('sensor.leaf_battery_temperature_max');
      const f = h.config && h.config.unit_system && h.config.unit_system.temperature === '°F';
      const set = (k, v, u) => { e['t_' + k].innerHTML = v == null ? '—' : `${v}<small>${u}</small>`; };
      set('power', charging ? power.toFixed(1) : (unplugged ? null : '0.0'), 'kW');
      set('added', added == null || unplugged ? null : added.toFixed(1), 'kWh');
      set('left', charging && left != null ? this._dur(left) : null, '');
      set('soh', this._num('sensor.leaf_battery_health')?.toFixed(1) ?? null, '%');
      set('gap', this._num('sensor.leaf_cell_difference')?.toFixed(0) ?? null, 'mV');
      set('temp', tempC == null ? null : (f ? (tempC * 1.8 + 32).toFixed(0) : tempC.toFixed(0)), f ? '°F' : '°C');

      this._vehicle();
      this._peak(pk, { charging, unplugged, reached, left });

      this._root.querySelectorAll('.chip:not(.pk)').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === Math.round(limit)));
      e.bypass.classList.toggle('on', bypass);
      e.bt.textContent = bypass ? 'Bypass on — charging to 100%' : 'Need the full range?';
      e.bs.textContent = bypass ? `Tap to go back to ${Math.round(limit)}%. Resets when you unplug.` : 'Tap to charge to 100% for this trip';

      const swState = this._st(`switch.${this._cfg.wallbox}_pause_resume`);
      e.pause.hidden = !swState || swState === 'unavailable';
      e.pause.textContent = pk && pk.held ? 'Charge now' : (swState === 'on' ? 'Pause charging' : 'Resume charging');
      e.wbtext.textContent = unplugged ? '' : `Wallbox: ${status}`;
      e.foot.textContent = socEnt
        ? (live ? 'Live from LeafPulse' : `Not live · last update from LeafPulse ${this._ago(age)}`)
        : 'Waiting for the first reading from the LeafPulse app';
      e.foot.title = 'LeafPulse by Aprexer · github.com/Aprexer/LeafPulse';
    }

    _peakInfo() {
      const h = this._hass, modeEnt = h.states['input_select.leaf_peak_mode'];
      if (!modeEnt) return null;
      const startEnt = h.states['sensor.leaf_next_peak_start'];
      const start = startEnt ? new Date(startEnt.state) : null, ok = start && Number.isFinite(start.getTime());
      const end = ok ? new Date(start.getTime() + 4 * 3600e3) : null, now = Date.now();
      const t = d => d.toLocaleTimeString([], d.getMinutes() ? { hour: 'numeric', minute: '2-digit' } : { hour: 'numeric' });
      const summer = [5, 6, 7, 8].includes(new Date().getMonth());
      return {
        mode: modeEnt.state, start: ok ? start : null, end,
        on: this._st('binary_sensor.leaf_peak_hours') === 'on' || (ok && start.getTime() <= now && now < end.getTime()),
        held: this._st('input_boolean.leaf_peak_paused') === 'on',
        override: this._st('input_boolean.leaf_peak_override') === 'on',
        startTxt: ok ? t(start) : '6 PM', endTxt: ok ? t(end) : '10 PM',
        rate: summer ? 34 : 30, offRate: summer ? 7.5 : 6.6,
      };
    }

    _peak(pk, s) {
      const e = this._el;
      e.peakrow.hidden = !pk;
      if (!pk) { e.peak.hidden = true; return; }
      this._root.querySelectorAll('.chip.pk').forEach(b => b.classList.toggle('on', b.dataset.m === pk.mode));
      const avoid = pk.mode === 'Pause for peak', warn = pk.mode === 'Warn only';
      let html = '', cls = '', btn = '', act = '';
      const soon = pk.start && !pk.on && s.charging && s.left != null &&
        Date.now() + s.left * 60000 > pk.start.getTime() && pk.start.getTime() - Date.now() < 12 * 3600e3;
      if (pk.held && !s.unplugged) {
        html = `<b>Waiting for cheaper power</b> · peak rate until ${pk.endTxt}, then it carries on`; btn = 'Charge now'; act = 'now';
      } else if (pk.on && s.charging && pk.override) {
        cls = 'warn'; html = `<b>Charging at the peak rate</b> · about ${pk.rate}¢/kWh until ${pk.endTxt}`;
      } else if (pk.on && s.charging && warn) {
        cls = 'warn'; html = `<b>Peak rate now</b> · about ${pk.rate}¢/kWh until ${pk.endTxt}, ${pk.offRate}¢ after`; btn = `Pause till ${pk.endTxt}`; act = 'pause';
      } else if (soon && !pk.override && (avoid || warn)) {
        cls = 'warn';
        html = avoid ? `<b>Peak rate from ${pk.startTxt}</b> · this charge pauses then and finishes after ${pk.endTxt}`
          : `<b>Peak rate from ${pk.startTxt}</b> · the rest of this charge would cost about ${pk.rate}¢/kWh`;
        if (avoid) { btn = 'Keep charging'; act = 'now'; }
      } else if (pk.on && avoid && !pk.override && (s.unplugged || (!s.charging && !s.reached))) {
        html = `<b>Peak rate until ${pk.endTxt}</b> · ${s.unplugged ? 'plug in any time, charging waits until then' : 'charging starts then'}`;
      }
      e.peak.hidden = !html;
      e.peak.className = 'peak' + (cls ? ' ' + cls : '');
      e.peakt.innerHTML = html;
      e.peakb.hidden = !btn; e.peakb.textContent = btn; e.peakb.dataset.act = act;
    }

    _vehicle() {
      // 12V battery, charge counts and cell balancing from the LeafPulse app. Tiles hide until their sensor exists.
      const e = this._el;
      const v = this._num('sensor.leaf_12v_battery_voltage');
      const qc = this._num('sensor.leaf_quick_charges'), l2 = this._num('sensor.leaf_slow_charges');
      const show = (k, value, unit, note, cls) => {
        e['w_' + k].hidden = value == null;
        e['t_' + k].innerHTML = value == null ? '—' : `${value}<small>${unit}</small>`;
        e['s_' + k].textContent = note || '';
        e['s_' + k].className = 'vs' + (cls ? ' ' + cls : '');
      };
      const fresh = id => this._age(id) < 900;
      const asOf = id => 'Read ' + this._ago(this._age(id));
      let note = '', cls = '';
      if (v != null && !fresh('sensor.leaf_12v_battery_voltage')) {
        note = 'Last read ' + this._ago(this._age('sensor.leaf_12v_battery_voltage'));
      } else if (v != null) {
        // Read while the car is on, so 13.5 V+ means the DC-DC converter is topping it up.
        if (v >= 13.2) { note = 'Being charged'; cls = 'ok'; }
        else if (v >= 12.4) { note = 'Good'; cls = 'ok'; }
        else if (v >= 12.0) { note = 'Getting low'; cls = 'warn'; }
        else { note = 'Low — check it'; cls = 'bad'; }
      }
      show('v12', v == null ? null : v.toFixed(1), 'V', note, cls);
      const total = qc != null && l2 != null ? qc + l2 : null;
      show('qc', qc == null ? null : qc.toLocaleString(), '', total ? `${Math.round(qc / total * 100)}% of all charges` : 'CHAdeMO');
      show('l2', l2 == null ? null : l2.toLocaleString(), '', 'Home & public AC');
      e.veh.hidden = [v, qc, l2].every(x => x == null);
    }

    _cost(hs, wb, power, added, unplugged, charging, paused, reached, left) {
      // Live cost: energy added × Wallbox price, ticking up every second between Wallbox updates.
      const el = this._el.cost; if (!el) return;
      const price = this._num(wb + 'energy_price'), cur = (hs.config && hs.config.currency) || 'USD';
      const fmt = (v, d) => new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
      clearInterval(this._costTimer);
      if (price == null || added == null || added <= 0) { el.innerHTML = ''; return; }
      if (unplugged) { el.innerHTML = `<span class="cl">Last charge</span><span class="cv">${fmt(added * price, 2)}</span><span class="cs">${added.toFixed(1)} kWh</span>`; return; }
      const kw = power > 1 ? power : 6.4, rem = charging && left != null ? left / 60 * kw : 0, final = (added + rem) * price;
      const ent = hs.states[wb + 'added_energy'], t0 = ent ? new Date(ent.last_updated).getTime() : Date.now();
      const draw = () => {
        let v = added * price;
        if (charging) { v += power * Math.max(0, Date.now() - t0) / 36e5 * price; v = Math.min(v, Math.max(final, added * price)); }
        const pct = final > 0 ? Math.min(100, v / final * 100) : 100;
        el.innerHTML = charging
          ? `<span class="cl">Cost so far</span><span class="cv">${fmt(v, 3)}</span><span class="cs">of about ${fmt(final, 2)}</span><div class="cbar"><i style="width:${pct}%"></i></div>`
          : `<span class="cl">${paused && reached ? 'This charge cost' : 'Cost so far'}</span><span class="cv">${fmt(v, 2)}</span><span class="cs">${added.toFixed(1)} kWh</span>`;
      };
      draw(); if (charging) this._costTimer = setInterval(draw, 1000);
    }
    _tag(ent, age, source, charging, soc) {
      // Make it obvious when the numbers are not live: >12 h old turns amber and dims the ring.
      const old = source !== 'live' && !charging && soc != null && age > 43200;
      let cls = '', txt = '';
      if (source === 'live') { cls = 'live'; txt = 'Live'; }
      else if (source === 'estimate' && charging) { cls = 'est'; txt = 'Estimated · charging'; }
      else if (old) { cls = 'old'; txt = (source === 'estimate' ? 'Old estimate · ' : 'Old data · ') + this._ago(age); }
      else if (source === 'estimate') { cls = 'est'; txt = 'Estimated · ' + this._ago(age); }
      else if (ent) txt = 'Last seen ' + this._ago(age);
      this._el.tag.className = 'tag ' + cls; this._el.tag.textContent = txt;
      this._el.card.classList.toggle('stale', old); this._el.foot.classList.toggle('old', old);
    }
    _dots(pct) {
      // dashes only along the filled arc, then a gap for the rest
      const filled = (C * pct) / 100, n = Math.max(0, Math.floor(filled / 18));
      return n ? Array(n).fill('2 16').join(' ') + ` 0 ${C}` : `0 ${C}`;
    }
    _tween(target) {
      const el = this._el.soc;
      if (target == null) { el.innerHTML = '—'; this._shown = null; return; }
      const from = this._shown == null ? Math.max(0, target - 15) : this._shown;
      const t0 = performance.now(), dur = 1100;
      cancelAnimationFrame(this._raf);
      const step = now => {
        const k = Math.min(1, (now - t0) / dur), ease = 1 - Math.pow(1 - k, 3);
        const v = from + (target - from) * ease;
        el.innerHTML = `${v.toFixed(target >= 100 ? 0 : 1)}<small>%</small>`;
        if (k < 1) this._raf = requestAnimationFrame(step); else this._shown = target;
      };
      this._raf = requestAnimationFrame(step);
    }
    _dur(min) { min = Math.round(min); const hh = Math.floor(min / 60), mm = min % 60; return hh ? `${hh} h ${mm} min` : `${mm} min`; }
    _ago(s) { if (!Number.isFinite(s)) return ''; if (s < 90) return 'just now'; if (s < 3600) return `${Math.round(s / 60)} min ago`;
      if (s < 86400) return `${Math.round(s / 3600)} h ago`; { const d = Math.round(s / 86400); return `${d} day${d === 1 ? '' : 's'} ago`; } }
  }

  if (!customElements.get('leaf-charge-card')) customElements.define('leaf-charge-card', LeafChargeCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: 'leaf-charge-card', name: 'Leaf charge card', description: 'LEAF battery + Wallbox charge limit with bypass' });
})();
