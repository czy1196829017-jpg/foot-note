const byId = id => document.getElementById(id);
const viewport = byId('map-viewport');
const names = ['City Scale', 'Street Scale', 'Architectural axonometric'];
const layerNames = ['city', 'street', 'architecture'];
let depth = 0, tier = 0, pan = {x: 0, y: 0}, selectedPlace = 'The Bund';
let savedPlaces = [], notes = '';
try { const saved = JSON.parse(localStorage.getItem('foot-note-places') || '[]'); if (Array.isArray(saved)) savedPlaces = saved.filter(v => typeof v === 'string'); notes = localStorage.getItem('foot-note-notes') || ''; } catch {}
const announce = text => { byId('map-announcement').textContent = text; };
const localScale = () => 1 + (depth - [0, 36, 72][tier]) * .024;
function render() {
  const nextTier = depth < 36 ? 0 : depth < 72 ? 1 : 2;
  if (tier !== nextTier) { tier = nextTier; pan = {x: 0, y: 0}; announce(`${names[tier]} view`); }
  layerNames.forEach((name, index) => {
    byId(`${name}-layer`).hidden = index !== tier;
    byId(`${name}-world`).style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${localScale()})`;
  });
  document.querySelector('.map-app').dataset.tier = String(tier);
  byId('scale-title').textContent = names[tier];
  byId('scale-caption').textContent = ['Shanghai · Find your next walk', `${selectedPlace} · Streets & stories`, `${selectedPlace} · Building study`][tier];
  byId('map-distance').textContent = tier === 0 ? `${Math.round(20 / localScale())} km` : tier === 1 ? `${Math.round(200 / localScale())} m` : `${Math.round(25 / localScale())} m`;
  byId('map-hint').textContent = ['Scroll or pinch to discover more', 'Keep zooming to explore a building', 'Tap a building to discover its details'][tier];
  byId('detail-disclaimer').hidden = tier === 0;
  byId('zoom-in').disabled = depth >= 100;
  byId('zoom-out').disabled = depth <= 0;
  document.querySelectorAll('[data-depth]').forEach((button, i) => button.setAttribute('aria-pressed', String(i === tier)));
}
function setDepth(value) { depth = Math.max(0, Math.min(100, value)); render(); }
byId('zoom-in').addEventListener('click', () => setDepth(depth + 12));
byId('zoom-out').addEventListener('click', () => setDepth(depth - 12));
byId('recenter').addEventListener('click', () => { pan = {x: 0, y: 0}; render(); announce('Map centered'); });
document.querySelectorAll('[data-depth]').forEach(button => button.addEventListener('click', () => { pan = {x: 0, y: 0}; setDepth(Number(button.dataset.depth)); }));
viewport.addEventListener('wheel', event => { event.preventDefault(); setDepth(depth - Math.max(-12, Math.min(12, event.deltaY * .055))); }, {passive: false});
viewport.addEventListener('dblclick', event => { if (!event.target.closest('button,[data-building]')) setDepth(depth + 24); });
viewport.addEventListener('keydown', event => {
  if (event.target !== viewport) return;
  const movements = {ArrowLeft: [30, 0], ArrowRight: [-30, 0], ArrowUp: [0, 30], ArrowDown: [0, -30]};
  if (movements[event.key]) { event.preventDefault(); pan.x += movements[event.key][0]; pan.y += movements[event.key][1]; render(); }
  if (['+', '=','-'].includes(event.key)) { event.preventDefault(); setDepth(depth + (event.key === '-' ? -12 : 12)); }
  if (event.key === 'Home') { event.preventDefault(); pan = {x: 0, y: 0}; setDepth(0); }
});
const pointers = new Map(); let pinchDistance = 0;
const distance = () => { const values = [...pointers.values()]; return values.length < 2 ? 0 : Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y); };
viewport.addEventListener('pointerdown', event => {
  if (event.target.closest('button,[data-building]')) return;
  pointers.set(event.pointerId, {x: event.clientX, y: event.clientY}); viewport.setPointerCapture(event.pointerId);
  viewport.classList.add('dragging'); pinchDistance = distance();
});
viewport.addEventListener('pointermove', event => {
  if (!pointers.has(event.pointerId)) return;
  const previous = pointers.get(event.pointerId); pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
  if (pointers.size > 1) { const nextDistance = distance(); if (pinchDistance > 0 && nextDistance > 0) setDepth(depth + Math.log2(nextDistance / pinchDistance) * 40); pinchDistance = nextDistance; }
  else { pan.x = Math.max(-300 * localScale(), Math.min(300 * localScale(), pan.x + event.clientX - previous.x)); pan.y = Math.max(-450 * localScale(), Math.min(450 * localScale(), pan.y + event.clientY - previous.y)); render(); }
});
function endPointer(event) { pointers.delete(event.pointerId); pinchDistance = distance(); if (!pointers.size) viewport.classList.remove('dragging'); }
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => viewport.addEventListener(name, endPointer));
document.querySelectorAll('[data-place]').forEach(button => button.addEventListener('click', () => { selectedPlace = button.dataset.place; pan = {x: 0, y: 0}; setDepth(tier === 0 ? 48 : 84); }));

// Native vector illustrations are provisional detail views, not surveyed geography.
function drawStreets() {
  let svg = '<rect width="600" height="1000" fill="#dcd5c8"/><path d="M460 -20C386 165 510 270 443 457S446 780 600 1020H700V-20Z" fill="#a9a49b"/><path d="M445 -20C373 165 497 270 430 457S433 780 587 1020" fill="none" stroke="#f0eadf" stroke-width="12"/>';
  svg += '<g transform="rotate(-17 260 480)">';
  const colors = ['#c9c0ae', '#d4cbbb', '#c1b6a2', '#e3dccf'];
  for (let row = -1; row < 11; row++) for (let col = -1; col < 6; col++) {
    const x = col * 91 + 6, y = row * 100 + 7;
    svg += `<rect x="${x}" y="${y}" width="75" height="82" rx="2" fill="${colors[((row + col) % 4 + 4) % 4]}" stroke="#9c927f" stroke-width=".7"/>`;
    for (let i = 0; i < 3; i++) svg += `<rect x="${x + 7 + i * 22}" y="${y + 8}" width="15" height="${45 + (row % 3 + 3) * 3}" fill="#e9e1d3" stroke="#aaa08d" stroke-width=".6"/>`;
  }
  for (let i = -1; i < 12; i++) svg += `<path d="M-150 ${i * 100}H650" stroke="#f3eee5" stroke-width="12"/><path d="M-150 ${i * 100}H650" stroke="#bcb09a" stroke-width=".6"/>`;
  for (let i = -1; i < 7; i++) svg += `<path d="M${i * 91} -200V1200" stroke="#f3eee5" stroke-width="10"/>`;
  svg += '<path d="M-100 400H500" stroke="#f3eee5" stroke-width="22"/><path d="M-100 400H500" stroke="#9e917b" stroke-width=".6"/><text x="90" y="404" font-family="Arial" font-size="10" fill="#766951" letter-spacing="2">WALKING DISTRICT</text></g>';
  svg += '<path d="M172 615L238 540L259 430L340 354" fill="none" stroke="#a95e43" stroke-width="2" stroke-dasharray="5 6"/><circle cx="259" cy="430" r="6" fill="#a95e43" stroke="#fff1d8" stroke-width="3"/><text x="490" y="510" transform="rotate(79 490 510)" font-family="Georgia" font-size="16" fill="#e5e0d5" letter-spacing="4">HUANGPU RIVER</text>';
  byId('street-art').innerHTML = svg;
}
let orientation = 0;
function drawArchitecture() {
  const project = (x, y, z = 0) => { for (let i = 0; i < orientation; i++) [x, y] = [-y, x]; return [300 + (x - y) * .8, 520 + (x + y) * .40 - z]; };
  const pts = values => values.map(v => project(...v).map(n => n.toFixed(1)).join(',')).join(' ');
  let svg = '<rect width="600" height="1000" fill="#ded7c8"/>';
  svg += `<polygon points="${pts([[-245,-245,0],[245,-245,0],[245,245,0],[-245,245,0]])}" fill="#c6bead" stroke="#968a73" stroke-width="1"/>`;
  for (let i = -240; i <= 240; i += 80) svg += `<polyline points="${pts([[i,-240,1],[i,240,1]])}" stroke="#eee7d9" stroke-width="17"/><polyline points="${pts([[-240,i,1],[240,i,1]])}" stroke="#eee7d9" stroke-width="17"/>`;
  const blocks = [];
  for (let x = -200; x <= 120; x += 80) for (let y = -200; y <= 120; y += 80) blocks.push({x, y, height: 30 + ((x + y + 400) / 80 % 4) * 13, main: x === -40 && y === -40});
  blocks.sort((a, b) => a.x + a.y - b.x - b.y);
  blocks.forEach((block, i) => {
    const {x,y,main} = block, w = 53, h = main ? 172 : block.height;
    svg += `<g class="building-shape" data-building="${main ? 'Heritage tower' : 'Neighbourhood building ' + (i + 1)}" tabindex="0" role="button" aria-label="${main ? 'Explore heritage tower' : 'Explore neighbourhood building'}"><polygon points="${pts([[x,y,h],[x+w,y,h],[x+w,y+w,h],[x,y+w,h]])}" fill="${main ? '#c2a77f' : '#ece3cf'}" stroke="#83745a" stroke-width="1"/><polygon points="${pts([[x+w,y,0],[x+w,y+w,0],[x+w,y+w,h],[x+w,y,h]])}" fill="${main ? '#96734f' : '#ab9d82'}" stroke="#83745a" stroke-width="1"/><polygon points="${pts([[x,y+w,0],[x+w,y+w,0],[x+w,y+w,h],[x,y+w,h]])}" fill="${main ? '#b99368' : '#c6b89b'}" stroke="#83745a" stroke-width="1"/>`;
    for (let z = 12; z < h - 5; z += 14) for (let a = 8; a < 48; a += 12) svg += `<polyline points="${pts([[x+a,y+w,z],[x+a+5,y+w,z],[x+a+5,y+w,z+6],[x+a,y+w,z+6],[x+a,y+w,z]])}" fill="#6a604f" stroke="#e5d6b5" stroke-width=".4"/>`;
    if (main) svg += `<polygon points="${pts([[x+7,y+7,h+12],[x+46,y+7,h+12],[x+46,y+46,h+12],[x+7,y+46,h+12]])}" fill="#ead9b8" stroke="#83745a" stroke-width="1"/><polyline points="${pts([[x+26,y+26,h+12],[x+26,y+26,h+54]])}" stroke="#77654b" stroke-width="3"/>`;
    svg += '</g>';
  });
  svg += '<text x="300" y="765" text-anchor="middle" class="architecture-label">A CLOSER LOOK AT THE CITY</text><text x="300" y="790" text-anchor="middle" font-family="Georgia" font-size="13" fill="#81745e">Tap a building to open its study</text>';
  byId('architecture-art').innerHTML = svg;
}
drawStreets(); drawArchitecture();
function openPanel(title, content) { byId('panel-title').textContent = title; byId('panel-content').replaceChildren(); byId('panel-content').innerHTML = content; byId('info-panel').hidden = false; byId('search-results').hidden = true; byId('panel-close').focus(); }
function closePanel() { byId('info-panel').hidden = true; viewport.focus({preventScroll: true}); }
byId('panel-close').addEventListener('click', closePanel);
document.addEventListener('keydown', event => { if (event.key === 'Escape') { closePanel(); byId('search-results').hidden = true; } });
function showBuilding(name) {
  openPanel(name, '<p>An axonometric study of massing, rooflines and the surrounding streets.</p><p>This is an illustrative building, not a surveyed model.</p><button class="panel-texture" id="save-place"><span>Save to collection</span></button><button class="panel-action" id="rotate-building">Rotate view 90° ↗</button>');
  byId('save-place').addEventListener('click', () => { if (!savedPlaces.includes(name)) savedPlaces.push(name); try { localStorage.setItem('foot-note-places', JSON.stringify(savedPlaces)); } catch {} byId('save-place').querySelector('span').textContent = 'Saved to collection'; announce('Building saved'); });
  byId('rotate-building').addEventListener('click', () => { orientation = (orientation + 1) % 4; drawArchitecture(); closePanel(); });
}
byId('architecture-art').addEventListener('click', event => { const building = event.target.closest('[data-building]'); if (building) showBuilding(building.dataset.building); });
byId('architecture-art').addEventListener('keydown', event => { const building = event.target.closest('[data-building]'); if (building && ['Enter',' '].includes(event.key)) { event.preventDefault(); showBuilding(building.dataset.building); } });
document.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click', () => {
  const tab = button.dataset.panel;
  document.querySelectorAll('[data-panel]').forEach(item => item.removeAttribute('aria-current')); button.setAttribute('aria-current', 'page');
  if (tab === 'map') { closePanel(); return; }
  if (tab === 'notes') {
    openPanel('Field notes', '<p>Keep a thought from your walk. Notes are saved on this device.</p><label class="sr-only" for="field-note">Your field note</label><textarea id="field-note" placeholder="What did you notice today?"></textarea><button class="panel-texture" id="save-note"><span>Save note</span></button>');
    byId('field-note').value = notes; byId('save-note').addEventListener('click', () => { notes = byId('field-note').value; try { localStorage.setItem('foot-note-notes', notes); byId('save-note').querySelector('span').textContent = 'Note saved'; } catch { byId('save-note').querySelector('span').textContent = 'Storage unavailable'; } });
  }
  if (tab === 'collection') {
    openPanel('Your collection', '<p>Building studies you have saved on this device.</p><ul class="panel-list" id="saved-list"></ul>');
    if (!savedPlaces.length) { const p = document.createElement('p'); p.textContent = 'Zoom into a building and save it to start your collection.'; byId('saved-list').append(p); }
    savedPlaces.forEach(name => { const li = document.createElement('li'); li.textContent = name; byId('saved-list').append(li); });
  }
  if (tab === 'profile') openPanel('Your next city walk', '<p>Explore freely, or try the login prototype.</p><a class="panel-action" href="app.html?v=map-scales-1">Go to login ↗</a><p>City artwork supplied by the designer. Street and building views are illustrative prototypes.</p>');
}));
const places = ['The Bund', 'Nanjing Road', "People’s Square"];
byId('map-search').addEventListener('submit', event => {
  event.preventDefault(); const query = byId('map-query').value.trim().toLowerCase(); const matched = places.filter(place => place.toLowerCase().includes(query));
  const results = byId('search-results'); results.replaceChildren(); const description = document.createElement('p'); description.textContent = matched.length ? 'Choose a place to explore its detail view.' : 'Try one of the places in this prototype:'; results.append(description);
  (matched.length ? matched : places).forEach(place => { const button = document.createElement('button'); button.type = 'button'; button.textContent = place + ' ↗'; const detail = document.createElement('small'); detail.textContent = 'Open illustrative Street Scale'; button.append(detail); button.addEventListener('click', () => { selectedPlace = place; pan = {x: 0, y: 0}; setDepth(48); results.hidden = true; }); results.append(button); });
  results.hidden = false;
});
render();
