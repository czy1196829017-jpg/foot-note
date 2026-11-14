const $ = id => document.getElementById(id);
const viewport = $('map-viewport');
if(window.footNoteArchitectureArt){
  const sheet=$('architecture-sheet'),holder=document.createElement('div');holder.innerHTML=window.footNoteArchitectureArt;
  const art=document.createElement('div');art.style.cssText='position:absolute;inset:0;width:393px;height:852px;pointer-events:none';art.setAttribute('aria-label','Latest Figma Bund axonometric map');
  const ids=['3309:5998','2964:6391','2964:6392','2964:6393','2964:6394','2964:6395','2964:6396','2964:6401','2964:6402','2964:6403','2964:6404','2964:6409','2964:6410','2964:6411','2964:6412'];
  for(const id of ids){const node=holder.querySelector('[data-node-id="'+id+'"]');if(node)art.append(node);}
  const base=art.querySelector('[data-node-id="3309:5998"]');
  if(base){base.dataset.nodeId='3314:6001';base.style.cssText='position:absolute;left:-393px;top:-98px;width:848px;height:771px;overflow:hidden';const image=base.querySelector('img');image.src='assets/architecture-v48.png';image.style.cssText='position:absolute;left:0;top:-.02%;width:115.92%;height:100.04%;max-width:none;pointer-events:none';}
  sheet.querySelector('.architecture-art')?.remove();sheet.prepend(art);sheet.style.background='#a69e96';
  const pins=[[44,285],[96,303],[164,324],[232,348],[289,392],[320,419]];
  sheet.querySelectorAll('.building-spot').forEach((button,i)=>{if(pins[i]){button.style.left=pins[i][0]+'px';button.style.top=pins[i][1]+'px';}});
}
const figmaInitialPan = { district:{x:-47,y:-74}, street:{x:-37,y:-75} };
// Source: 1.qgz → buildings_points_amap_wgs84_for_versatiles_en.csv.
// Keeping these as geographic features, rather than pixels baked into an image,
// makes QGIS labels available for responsive positioning in the web app.
const qgisStreetPoints = window.footNoteQgisPoints || [
  ['China Pacific Insurance Shanghai',31.235429,121.486777],['Dongfeng Hotel',31.235762,121.486450],['Shanghai Pudong Development Bank',31.237621,121.485796],['Shanghai Customs',31.238660,121.485450],['Peace Hotel South Building',31.240757,121.485248],['Peace Hotel North Building',31.241108,121.485275],['Bank of China Shanghai Branch',31.241537,121.484554],['Shanghai Municipal Bureau of Foreign Trade',31.242361,121.485456],['Agricultural Bank of China Shanghai Branch',31.242018,121.485450],['Arts and Crafts Import and Export Company',31.239915,121.485378],['Silk Import and Export Shanghai Tonglian Industries',31.240148,121.485236],['Shanghai Home Textiles Import and Export Company',31.240406,121.485222],['ICBC and Textile Holding Group Company',31.241887,121.484989],['China Foreign Exchange Trade System',31.239635,121.485412]
];
let qgisStreetMap, qgisMapReady = false, qgisMapLoadStarted = false;
let depth = 28, view = 'district', pan = {...figmaInitialPan.district}, worldOnly = false, selectedDistrict = 'Shanghai', selectedPlace = 'The Bund', selectedBuilding = '', guideKey = '', contextTimer;
let cityWelcomeDismissed = false;
function dismissCityWelcome() {
  if (cityWelcomeDismissed) return;
  cityWelcomeDismissed = true;
  $('city-welcome')?.classList.add('is-hidden');
}
let saved = [], notes = '';
try { const value = JSON.parse(localStorage.getItem('foot-note-places') || '[]'); if (Array.isArray(value)) saved = value.filter(v => typeof v === 'string'); notes = localStorage.getItem('foot-note-notes') || ''; } catch {}
const introductions = {
  Shanghai: 'Shanghai sits where the Huangpu River meets the wider Yangtze delta. Its waterfront brings together historic buildings, neighbourhood streets and the skyline of Pudong.\n\nSwipe to explore the districts, or zoom in to discover the streets and waterfront buildings of the Bund.',
  Huangpu: 'Huangpu brings several layers of Shanghai together: the Bund waterfront, People’s Square and the old-city area around Yuyuan Garden. Zoom closer to follow the streets and discover their different urban stories.',
  Pudong: 'Across the Huangpu River from the Bund, Pudong presents another side of Shanghai. The high-rise skyline of Lujiazui contrasts with the historic waterfront on the west bank.',
  'Jing’an': 'Jing’an offers a different rhythm: shopping streets, neighbourhood lanes and the area around Jing’an Temple. Look at how busy avenues meet smaller residential streets.',
  Xuhui: 'Xuhui is a place to notice changes of scale, from tree-lined neighbourhood streets and historic houses to larger urban avenues. Its streets invite a slower reading of Shanghai.',
  Hongkou: 'Hongkou is part of Shanghai’s northern urban fabric. Look for the relationship between older neighbourhoods, waterfront edges and the city’s history of cultural exchange.',
  'The Bund': 'You are looking at a street-level view of central Shanghai. The red circles mark places to explore, while the dashed lines describe the connections between them.\n\nThe Bund follows the Huangpu waterfront. Zoom in again, or tap its red circle, to discover the buildings along the river.',
  'Yuyuan Garden': 'Yuyuan Garden belongs to the old-city story of Shanghai. Here the walking experience shifts toward gardens, courtyards and smaller streets. Compare this enclosed urban texture with the open waterfront of the Bund.',
  'Shanghai Xintiandi': 'Xintiandi is associated with Shanghai’s shikumen lane-house heritage and its adaptation to new uses. Look for the contrast between narrow lanes, masonry facades and contemporary public spaces.',
  'People’s Square': 'People’s Square is a major civic space in central Shanghai. It offers a different urban scale from the riverfront: broad public spaces and cultural institutions connect to the surrounding streets.',
  waterfront: 'The axonometric view reveals how waterfront buildings sit beside each other, with lanes and blocks extending behind them. Tap a building sticker to focus the conversation.\n\nHSBC’s Shanghai building opened in 1923. Sassoon House, now the north building of the Peace Hotel, opened as the Cathay Hotel in 1929.',
  'HSBC Building': 'HSBC’s new Shanghai building officially opened on 23 June 1923. In this waterfront study, look at the contrast between a monumental public facade and the smaller streets behind the riverfront.',
  'Peace Hotel': 'Sassoon House opened as the Cathay Hotel in 1929 and is now the north building of the Peace Hotel. Its Art Deco character is an important part of the Bund’s architectural story. Look at its vertical profile against the neighbouring buildings.',
  'Custom House': 'The Custom House is one of the Bund’s recognisable waterfront landmarks. Compare its strong vertical emphasis with the more horizontal facades nearby. The axonometric view helps you read each building as part of a continuous street edge.',
  'Riverside heritage': 'Look beyond the sticker to the building’s position in the block: its height, frontage and connection to the river. Together, the different facades create the layered character of the Bund.'
};
function worldContext() {
  const scale = worldScale(), lon = ((120 - pan.x / (4 * scale) + 540) % 360) - 180, lat = 31 + pan.y / (4 * scale);
  if (Math.abs(lon - 121) < 28 && Math.abs(lat - 31) < 24) return 'Shanghai';
  if (lon > 55) return 'Asia & the Pacific';
  if (lon > -25 && lat > 32) return 'Europe';
  if (lon > -25 && lat <= 32) return 'Africa';
  if (lon < -25 && lon > -150) return lat > 0 ? 'North America' : 'South America';
  return 'The Pacific';
}
function worldScale() { return 1.15 * Math.pow(2, Math.min(depth, 70) / 22); }
function localScale() { return view === 'world' ? worldScale() : 1 + (depth - ({district:28,street:56,architecture:80}[view] || 0)) * .022; }
function qgisFeatureCollection() {
  return {type:'FeatureCollection', features:qgisStreetPoints.map(([name,lat,lng]) => ({type:'Feature',properties:{name},geometry:{type:'Point',coordinates:[lng,lat]}}))};
}
function renderQgisStreetLabels() {
  const layer = $('qgis-street-label-layer');
  if (!layer || !qgisMapReady || view !== 'street') { layer?.replaceChildren(); return; }
  const width = viewport.clientWidth, height = viewport.clientHeight, placed = [];
  layer.replaceChildren();
  for (const [label,lat,lng] of qgisStreetPoints) {
    const point = qgisStreetMap.project([lng,lat]);
    // Labels only exist while their point is actually on this phone screen.
    // Horizontal clamping keeps a full, wrapped label inside the safe area.
    if (point.x < -12 || point.x > width + 12 || point.y < 54 || point.y > height - 210) continue;
    const node = document.createElement('span'); node.className = 'qgis-street-label';
    node.style.left = `${Math.round(Math.max(14, Math.min(width - 159, point.x + 8)))}px`;
    node.style.top = `${Math.round(Math.max(58, Math.min(height - 228, point.y - 4)))}px`;
    node.append(document.createTextNode(label)); layer.append(node);
    const w=node.offsetWidth,h=node.offsetHeight;
    const clampX=x=>Math.max(14,Math.min(width-14-w,x));
    const candidates=[];
    for(const dy of [0,-h-5,h+5,-2*(h+5),2*(h+5)])for(const x of [point.x+8,point.x-w-8])candidates.push({x:clampX(x),y:point.y-4+dy});
    const slot=candidates.find(r=>r.y>=58&&r.y+h<=height-210&&!placed.some(p=>r.x<p.x+p.w+5&&r.x+w+5>p.x&&r.y<p.y+p.h+4&&r.y+h+4>p.y));
    if(!slot){node.remove();continue;}
    node.style.left=Math.round(slot.x)+'px';node.style.top=Math.round(slot.y)+'px';placed.push({...slot,w,h});
  }
}
function initQgisStreetMap() {
  const container = $('qgis-street-map');
  if (!container || qgisMapLoadStarted) return;
  if (!window.maplibregl) { window.setTimeout(initQgisStreetMap, 180); return; }
  qgisMapLoadStarted = true; container.hidden = false; container.style.visibility = 'hidden';
  qgisStreetMap = new maplibregl.Map({
    container,
    style:{version:8,sources:{streets:{type:'vector',tiles:[new URL('assets/tiles/14-{x}-{y}.pbf',location.href).href.replace(/%7B/g,'{').replace(/%7D/g,'}')],minzoom:14,maxzoom:14,attribution:'© OpenStreetMap contributors · OpenFreeMap / OpenMapTiles'}},layers:[
      {id:'paper',type:'background',paint:{'background-color':'#bab2aa'}},
      {id:'water',type:'fill',source:'streets','source-layer':'water',paint:{'fill-color':'#a19b94'}},
      {id:'buildings',type:'fill',source:'streets','source-layer':'building',paint:{'fill-color':'#a39c94','fill-outline-color':'#a39c94'}},
      {id:'roads',type:'line',source:'streets','source-layer':'transportation',paint:{'line-color':'#d0c8bf','line-width':['interpolate',['linear'],['zoom'],14,2,18,18]}},
      {id:'paths',type:'line',source:'streets','source-layer':'transportation',paint:{'line-color':'#b45c4a','line-width':1,'line-dasharray':[2,5],'line-opacity':.75}}
    ]},
    center:[121.48535,31.24055], zoom:17.1, minZoom:15, maxZoom:18,
    maxBounds:[[121.464,31.215],[121.512,31.262]],
    attributionControl:false, renderWorldCopies:false, pitchWithRotate:false, dragRotate:false, touchPitch:false
  });
  qgisStreetMap.on('load', () => {
    qgisStreetMap.addSource('qgis-buildings',{type:'geojson',data:qgisFeatureCollection()});
    qgisStreetMap.addLayer({id:'qgis-building-points',type:'circle',source:'qgis-buildings',paint:{'circle-radius':6,'circle-color':'#c54d3c','circle-stroke-color':'#efe8de','circle-stroke-width':1.2}});
    qgisStreetMap.on('move', renderQgisStreetLabels);
    qgisStreetMap.on('zoom', renderQgisStreetLabels);
    qgisStreetMap.on('zoomend',()=>{if(view!=='street')return;if(qgisStreetMap.getZoom()>17.85)setDepth(84);else if(qgisStreetMap.getZoom()<15.15)setDepth(40);});
    qgisStreetMap.on('click','qgis-building-points', event => { selectedPlace='The Bund'; selectedBuilding=event.features?.[0]?.properties?.name || 'The Bund'; setDepth(84); });
    qgisStreetMap.on('mouseenter','qgis-building-points',() => { qgisStreetMap.getCanvas().style.cursor='pointer'; });
    qgisStreetMap.on('mouseleave','qgis-building-points',() => { qgisStreetMap.getCanvas().style.cursor=''; });
    qgisMapReady = true; container.style.visibility = 'visible'; container.classList.add('is-ready'); renderQgisStreetLabels();
  });
  // Tile, glyph or sprite requests may arrive at different speeds.  A single
  // optional resource error must never hide the interactive QGIS canvas.
  qgisStreetMap.on('error', () => { container.classList.add('has-load-warning'); });
}
function renderRaster() {
  const sheet = $(`${view}-sheet`), image = sheet.querySelector('img.raster-art');
  const width = viewport.clientWidth, height = viewport.clientHeight;
  const sourceWidth = image.naturalWidth || Number(image.getAttribute('width'));
  const sourceHeight = image.naturalHeight || Number(image.getAttribute('height'));
  const cover = Math.max(width / sourceWidth, height / sourceHeight);
  const figmaScale = view === 'district' ? 1.489 : 1.13;
  const baseWidth = sourceWidth * cover * figmaScale, baseHeight = sourceHeight * cover * figmaScale, zoom = localScale();
  const limitX = Math.max(0, (baseWidth * zoom - width) / 2);
  const limitY = Math.max(0, (baseHeight * zoom - height) / 2);
  pan.x = Math.max(-limitX, Math.min(limitX, pan.x));
  pan.y = Math.max(-limitY, Math.min(limitY, pan.y));
  sheet.style.width = `${baseWidth}px`; sheet.style.height = `${baseHeight}px`;
  const x = (width - baseWidth * zoom) / 2 + pan.x;
  const y = (height - baseHeight * zoom) / 2 + pan.y;
  sheet.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
  if (view === 'street') { initQgisStreetMap(); if (qgisStreetMap) qgisStreetMap.resize(); renderQgisStreetLabels(); }
}
function currentContext() { return view === 'world' ? worldContext() : view === 'district' ? selectedDistrict : view === 'street' ? selectedPlace : selectedBuilding || 'waterfront'; }
function currentTitle() { return view === 'world' || view === 'district' ? 'City Scale' : view === 'street' ? 'Street Scale' : 'Architectural axonometric'; }
function contextText() {
  const key = currentContext();
  return introductions[key] || `You are exploring ${key} on the world map. Notice the relationship between land, coastlines and neighbouring regions. Detailed walking and architectural views are currently available for Shanghai. Tap Shanghai to explore them.`;
}
function setAction() {
  const button = $('guide-action'); button.hidden = false;
  button.textContent = view === 'world' ? 'Explore Shanghai ↗' : view === 'district' ? 'Explore the streets ↗' : view === 'street' ? (selectedPlace === 'The Bund' ? 'Explore waterfront buildings ↗' : 'Return to The Bund ↗') : saved.includes(selectedBuilding || 'The Bund waterfront') ? 'Saved to collection' : 'Save to collection';
}
let typingTimer, typingGeneration = 0, typingQueue = [], activeTyping = null, followOutput = true;
const messages = $('guide-messages');
messages.addEventListener('scroll', () => { followOutput = messages.scrollHeight - messages.clientHeight - messages.scrollTop < 28; });
function followLatest() { if (followOutput) messages.scrollTop = messages.scrollHeight; }
function cancelTyping() {
  clearTimeout(typingTimer); typingGeneration++; typingQueue = []; activeTyping = null;
  messages.querySelectorAll('.typing').forEach(node => node.classList.remove('typing'));
  $('guide-card').dataset.typing = 'false'; messages.setAttribute('aria-busy', 'false');
}
function typeMessage(node, text) {
  node.textContent = ''; messages.append(node); followOutput = true;
  typingQueue.push({node, characters: Array.from(text), position: 0, generation: typingGeneration});
  if (!activeTyping) runTyping();
}
function runTyping() {
  activeTyping = typingQueue.shift();
  if (!activeTyping) {
    $('guide-card').dataset.typing = 'false'; messages.setAttribute('aria-busy', 'false'); followLatest(); return;
  }
  const task = activeTyping; task.node.classList.add('typing');
  $('guide-card').dataset.typing = 'true'; messages.setAttribute('aria-busy', 'true');
  function tick() {
    if (task.generation !== typingGeneration) return;
    const count = matchMedia('(prefers-reduced-motion: reduce)').matches ? task.characters.length : 2;
    task.position = Math.min(task.characters.length, task.position + count);
    task.node.textContent = task.characters.slice(0, task.position).join(''); followLatest();
    if (task.position < task.characters.length) typingTimer = setTimeout(tick, 22);
    else { task.node.classList.remove('typing'); activeTyping = null; runTyping(); }
  }
  tick();
}
function updateGuide(force = false) {
  window.footNoteChat?.refreshEntry?.();
  const key = `${view}/${currentContext()}`;
  if (!force && key === guideKey) return;
  guideKey = key;
  $('guide-context').textContent = `${currentContext() === 'waterfront' ? 'The Bund' : currentContext()} · ${currentTitle()}`;
  cancelTyping(); messages.replaceChildren(); messages.scrollTop = 0;
  const paragraph = document.createElement('p'); typeMessage(paragraph, contextText());
  $('guide-card').hidden = view !== 'architecture'; $('expand-guide').hidden = true; setAction();
  $('announcement').textContent = `${currentTitle()}. ${currentContext() === 'waterfront' ? 'The Bund' : currentContext()}. Introduction updated.`;
}
function render(update = false) {
  const next = depth < 56 ? 'district' : depth < 80 ? 'street' : 'architecture';
  const changed = next !== view;
  if (changed) { view = next; pan = figmaInitialPan[view] ? {...figmaInitialPan[view]} : {x:0,y:0}; selectedBuilding = ''; }
  document.querySelector('.map-app').dataset.view = view;
  if(view!=='district')dismissCityWelcome();
  ['world','district','street','architecture'].forEach(name => $(`${name}-layer`).hidden = name !== view);
  $('scale-title').textContent = currentTitle();
  if (view === 'district' || view === 'street') renderRaster();
  else if (view === 'world') $('atlas-sheet').style.transform = `translate(-50%,-50%) translate(${pan.x}px,${pan.y}px) scale(${worldScale()}) translate(-480px,124px)`;
  else {
    const scale=localScale(),width=viewport.clientWidth;
    // Figma's latest crop occupies x=-393..455 and y=-98..673. Keep its
    // top and side edges outside the phone at every supported zoom.
    pan.x=Math.max(width-455*scale,Math.min(393*scale,pan.x));
    pan.y=Math.max(-160*scale,Math.min(98*scale,pan.y));
    $(`${view}-sheet`).style.transform = `translate(${pan.x}px,${pan.y}px) scale(${scale})`;
  }
  if (changed || update) updateGuide();
}
function setDepth(value) { depth = Math.max(28, Math.min(100, value)); render(); }
function focusShanghai(value = 28) { worldOnly = false; pan = {...figmaInitialPan.district}; selectedDistrict = 'Shanghai'; depth = Math.max(28, value); render(true); }
$('shanghai-marker').addEventListener('click', () => focusShanghai());
$('guide-action').addEventListener('click', () => {
  dismissCityWelcome();
  if (view === 'world') focusShanghai();
  else if (view === 'district') { selectedPlace = 'The Bund'; setDepth(60); }
  else if (view === 'street') { selectedPlace = 'The Bund'; setDepth(84); }
  else { const name = selectedBuilding || 'The Bund waterfront'; if (!saved.includes(name)) saved.push(name); try { localStorage.setItem('foot-note-places', JSON.stringify(saved)); } catch {} setAction(); }
});
$('collapse-guide').addEventListener('click', () => { $('guide-card').hidden = true; $('expand-guide').hidden = false; });
$('expand-guide').addEventListener('click', () => { $('guide-card').hidden = false; $('expand-guide').hidden = true; });
viewport.addEventListener('wheel', event => { if (event.target.closest('#qgis-street-map')) return; event.preventDefault(); dismissCityWelcome(); setDepth(depth - Math.max(-10, Math.min(10, event.deltaY * .05))); }, {passive:false});
viewport.addEventListener('dblclick', event => { if (!event.target.closest('button, #qgis-street-map')) { dismissCityWelcome(); setDepth(depth + 18); } });
function panBy(x,y) {
  if (x || y) dismissCityWelcome();
  pan.x += x; pan.y += y;
  if (view !== 'district' && view !== 'street') {
    const limit = view === 'world' ? 1440 * localScale() : 290 * localScale();
    pan.x = Math.max(-limit, Math.min(limit,pan.x));
    pan.y = Math.max(-230 * localScale(), Math.min(230 * localScale(),pan.y));
  }
  render(); clearTimeout(contextTimer); contextTimer = setTimeout(() => {
    if (view === 'district') selectedDistrict = pan.x < -60 ? 'Pudong' : pan.x > 60 ? 'Jing’an' : pan.y > 60 ? 'Hongkou' : pan.y < -60 ? 'Xuhui' : 'Huangpu';
    updateGuide();
  }, 320);
}
viewport.addEventListener('keydown', event => {
  if (event.target !== viewport) return;
  const moves = {ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]};
  if (moves[event.key]) { event.preventDefault(); panBy(...moves[event.key]); }
  if (['+','=','-'].includes(event.key)) { event.preventDefault(); setDepth(depth + (event.key === '-' ? -10 : 10)); }
  if (event.key === 'Home') { event.preventDefault(); focusShanghai(0); }
});
const pointers = new Map(); let previousDistance = 0;
function pinchDistance() { const points = [...pointers.values()]; return points.length < 2 ? 0 : Math.hypot(points[0].x-points[1].x, points[0].y-points[1].y); }
viewport.addEventListener('pointerdown', event => { if (event.target.closest('button, #qgis-street-map')) return; dismissCityWelcome(); pointers.set(event.pointerId,{x:event.clientX,y:event.clientY}); viewport.setPointerCapture(event.pointerId); previousDistance = pinchDistance(); viewport.classList.add('dragging'); });
viewport.addEventListener('pointermove', event => {
  if (!pointers.has(event.pointerId)) return;
  const previous = pointers.get(event.pointerId); pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if (pointers.size > 1) { const current = pinchDistance(); if (previousDistance > 0 && current > 0) setDepth(depth + Math.log2(current/previousDistance)*40); previousDistance = current; }
  else panBy(event.clientX-previous.x,event.clientY-previous.y);
});
function endPointer(event) { pointers.delete(event.pointerId); previousDistance = pinchDistance(); if (!pointers.size) viewport.classList.remove('dragging'); }
['pointerup','pointercancel','lostpointercapture'].forEach(name => viewport.addEventListener(name,endPointer));
viewport.addEventListener('blur', () => { pointers.clear(); viewport.classList.remove('dragging'); });
window.addEventListener('blur', () => { pointers.clear(); viewport.classList.remove('dragging'); });
window.addEventListener('keydown', event => { if (event.key === 'Escape') $('info-panel').hidden = true; });
document.querySelectorAll('[data-district]').forEach(button => button.addEventListener('click', () => { dismissCityWelcome(); selectedDistrict = button.dataset.district; updateGuide(); }));
document.querySelectorAll('[data-place]').forEach(button => button.addEventListener('click', () => { selectedPlace = button.dataset.place; if (selectedPlace === 'The Bund') setDepth(84); else updateGuide(); }));
document.querySelectorAll('[data-building]').forEach(button => button.addEventListener('click', () => { selectedBuilding = button.dataset.building; updateGuide(); }));
function answer(question) {
  const q = question.toLowerCase();
  if (/hsbc|1923|bank/.test(q)) return introductions['HSBC Building'];
  if (/peace|sassoon|cathay|art deco|1929/.test(q)) return introductions['Peace Hotel'];
  if (/custom|clock/.test(q)) return introductions['Custom House'];
  for (const name of ['Huangpu','Pudong','Jing’an','Xuhui','Hongkou','Yuyuan Garden','Shanghai Xintiandi','People’s Square']) if (q.includes(name.toLowerCase().replace('shanghai ','')) || name === 'Jing’an' && /jing.?an/.test(q) || name === 'People’s Square' && /people.?s square/.test(q) || name === 'Yuyuan Garden' && /yuyuan|garden/.test(q)) return introductions[name];
  if (/bund|river|waterfront/.test(q)) return view === 'architecture' ? introductions.waterfront : introductions['The Bund'];
  if (/zoom|how|street|building|closer/.test(q)) return 'Drag to move around the map. Scroll, pinch with two fingers or double-click to zoom closer. Around Shanghai, the view moves from City Scale to Street Scale, then to Architectural axonometric. Pinch inward or scroll down to return. Tap a district, red landmark or building sticker to learn about it.';
  if (/history|architecture|tell|introduc|what|where|this|see|area|district/.test(q)) return contextText();
  return `I can introduce the places in this view. ${contextText()}\n\nYou can ask about a district, the Bund, HSBC Building or the Peace Hotel.`;
}
$('guide-query').addEventListener('input', () => $('guide-form').classList.toggle('has-value', Boolean($('guide-query').value)));
$('guide-form').addEventListener('submit', event => {
  event.preventDefault(); const text = $('guide-query').value.trim();
  $('guide-card').hidden = false; $('expand-guide').hidden = true;
  if (!text) { updateGuide(true); return; }
  const question = document.createElement('p'); question.className = 'question'; question.textContent = text;
  const response = document.createElement('p'); messages.append(question); typeMessage(response, answer(text)); followLatest();
  $('guide-query').value = ''; $('guide-query').blur(); $('guide-form').classList.remove('has-value');
});
function panel(title,html) { $('panel-title').textContent = title; $('panel-content').innerHTML = html; $('info-panel').hidden = false; $('panel-close').focus(); }
$('panel-close').addEventListener('click', () => { $('info-panel').hidden = true; viewport.focus({preventScroll:true}); });
document.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click', () => {
  const tab = button.dataset.panel;
  if (tab === 'map') { $('info-panel').hidden = true; return; }
  if (tab === 'notes') { panel('Field notes','<p>Keep a thought from your walk.</p><label class="sr-only" for="field-note">Your note</label><textarea id="field-note" placeholder="What did you notice?"></textarea><button id="save-note" class="paper-action"><span>Save note</span></button>'); $('field-note').value=notes; $('save-note').addEventListener('click',()=>{notes=$('field-note').value;try{localStorage.setItem('foot-note-notes',notes);$('save-note').querySelector('span').textContent='Note saved';}catch{$('save-note').querySelector('span').textContent='Storage unavailable';}}); }
  if (tab === 'collection') { panel('Your collection','<p id="saved-places"></p>'); $('saved-places').textContent = saved.length ? saved.join(' · ') : 'Tap a building sticker, then save it from the guide.'; }
  if (tab === 'profile') panel('FOOT NOTE','<p>A closer reading of the city.</p><a class="panel-action" href="app.html?v=visible-edges-4">Go to login ↗</a><p>The guide currently uses curated place descriptions and local topic matching. A generative AI service is not connected.</p><a class="panel-action" target="_blank" rel="noopener" href="https://history.hsbc.com/collections/snapshots/housing-the-bank/a-shanghai-landmark">HSBC historical archive ↗</a><a class="panel-action" target="_blank" rel="noopener" href="https://service.shanghai.gov.cn/sheninfo/specialdetail.aspx?Id=53fcda72-b6ba-4c67-8861-d567d0257cc8">Shanghai: Peace Hotel history ↗</a><a class="panel-action" target="_blank" rel="noopener" href="https://github.com/topojson/world-atlas">World geography: Natural Earth / World Atlas ↗</a>');
}));
new ResizeObserver(() => render()).observe(viewport);
document.querySelectorAll('img.raster-art').forEach(image => image.addEventListener('load', () => render()));
render(true);
