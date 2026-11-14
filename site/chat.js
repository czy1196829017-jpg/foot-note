(() => {
  const C = id => document.getElementById(id);
  const A = {paper:'assets/chat/027f3.png',composer:'assets/chat/2f5fa.png',caption:'assets/chat/303ab.png',user:'assets/chat/7db1f.png',header:'assets/chat/75370.png',ticket:'assets/chat/13f69.png',taskHeader:'assets/chat/d697d.png',sticker:'assets/chat/a2de3.png',back:'assets/chat/144f6.png',send:'assets/chat/7c7b6.png',arrow:'assets/chat/c44d2.png',photo:'assets/chat/c709c.png',notebook:'assets/chat/0ae5f.png',sun:'assets/chat/2b3a5.png',angel:'assets/chat/3948a.png',wave:'assets/chat/ae783.png',blossoms:'assets/chat/1f337.png',elevator:'assets/chat/15405.png',dove:'assets/chat/48235.png',roof:'assets/chat/f981b.png',taskPaper:'assets/chat/2b259.png',taskElevator:'assets/chat/d4497.png',camera:'assets/chat/1a2b8.png',hudTop:'assets/chat/5f03b.png',hudBottom:'assets/chat/652e9.png',shutter:'assets/chat/96cb3.svg',navRight:'assets/chat/e4dfb.png',navBook:'assets/chat/e7f99.png',navMap:'assets/chat/66776.png',mapIcon:'assets/chat/68ed6.png',profileIcon:'assets/chat/4c56e.png',collectionIcon:'assets/chat/f9ca7.png',notesIcon:'assets/chat/1e7b6.png'};
  const films = [
    {id:'sun',title:'The Sun Also Rises',short:'The Sun…',subtitle:'The Sun Also Rises',text:'Explore this work through the visual stories and details of the city. Compare the mood of the images with the architecture around you.'},
    {id:'angel',title:'Street Angel',short:'Street Angel',subtitle:'Street Angel',text:'Follow the connections between a screen story and the city outside. Look closely at the streets, interiors and everyday details suggested by the images.'},
    {id:'wave',title:'The Eternal Wave',short:'The Eternal…',subtitle:'The Eternal Wave',text:'Look at how light, materials and interiors help create a screen world. Choose a visual task to explore an architectural detail for yourself.'},
    {id:'blossoms',title:'Blossoms',short:'Blossoms',subtitle:'Fanhua',text:'Jin Yucheng’s novel Blossoms follows three friends through Shanghai’s changing landscape from the 1950s to the early 2000s, capturing decades of urban life and social transformation.'}
  ];
  const tasks = [
    {id:'elevator',name:'Antique Elevator',image:'elevator',large:'taskElevator',text:'Search for the same iron-gated manual elevator as seen in the show.'},
    {id:'dove',name:'Dove of peace',image:'dove',large:'dove',text:'Look for the dove motif and notice how it changes the story of the place.'},
    {id:'roof',name:'Dark green roof',image:'roof',large:'roof',text:'Find the distinctive green pyramid roof and compare its silhouette with the surrounding buildings.'}
  ];
  let chatState='intro',place='Cathay Hotel',hotel=true,scopeText='',selectedFilm=films[3],selectedTask=tasks[0],filmOffset=0,expanded=false,epoch=0,referenceAdded=false,mediaStream=null,usingCamera=false,photoIndex=0,lastCapture="",extraMessages=[],toolsUnlocked=false,cameraEpoch=0,captureBusy=false,cameraMode='live',cameraTask=null;
  const typedTexts=new Set(),taskResults=new Map();let filmRound=0,profileOrigin=false;try{for(const [key,value] of JSON.parse(localStorage.getItem('foot-note-task-results')||'[]'))taskResults.set(key,value);}catch{}
  function syncTaskStickers(){body.querySelectorAll('[data-task]').forEach(button=>{const complete=taskResults.has(button.dataset.taskFilm+'/'+button.dataset.task);button.dataset.complete=String(complete);if(button.dataset.task==='elevator')button.querySelector('img').src=complete?A.taskElevator:A.elevator;button.setAttribute('aria-label','Choose '+(tasks.find(t=>t.id===button.dataset.task)?.name||'task')+(complete?' — completed':' — not completed'));});body.querySelectorAll('.chat-task-ticket').forEach(card=>card.dataset.complete=String(taskResults.has(card.dataset.ticketFilm+'/'+card.dataset.ticketTask)));}
  const body=C('chat-conversation');
  const navArt=document.createElement('span');navArt.className='chat-nav-art';navArt.setAttribute('aria-hidden','true');navArt.innerHTML=`<img class="chat-nav-paper nav-paper-1" src="${A.navRight}" width="99.753" height="73.558" alt=""><img class="chat-nav-paper nav-paper-2" src="${A.navRight}" width="99.753" height="73.558" alt=""><img class="chat-nav-paper nav-paper-3" src="${A.navBook}" width="99.536" height="74.769" alt=""><img class="chat-nav-paper nav-paper-4" src="${A.navMap}" width="161.288" height="88.701" alt=""><img class="chat-nav-map" src="${A.mapIcon}" alt=""><img class="chat-nav-profile" src="${A.profileIcon}" alt=""><img class="chat-nav-collection" src="${A.collectionIcon}" alt=""><img class="chat-nav-notes" src="${A.notesIcon}" alt="">`;document.querySelector('.bottom-nav').prepend(navArt);
  function escapeText(text){return String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
  function paper(className,inner){return `<section class="chat-paper ${className}" data-speaker="ai"><img class="chat-paper-art" src="${A.paper}" alt="">${inner}</section>`;}
  function photoCard(){return `<button class="chat-photo-card" data-chat-action="photo" aria-label="View Peace Hotel interior photo"><span class="chat-photo-stack"></span><span class="chat-photo-mount"></span><span class="chat-photo-window"><img src="${A.photo}" alt="Peace Hotel staircase interior"></span><span class="chat-photo-note"><img src="${A.caption}" alt=""><span>These are some photos of the Peace Hotel.</span></span></button>`;}
  function userBubble(text){return `<div class="chat-user-bubble" data-speaker="user"><img src="${A.composer}" alt=""><span>${escapeText(text)}</span></div>`;}
  function filmChoices(){return paper('chat-choices chat-film-choices',`<h3 data-type="Which work do you want to know about?"></h3><div class="chat-options" hidden>${Array.from({length:3},(_,i)=>[films[0],films[1],films[3],films[2]][(filmOffset+i)%films.length]).map(f=>`<button class="chat-option" data-film="${f.id}" aria-label="Explore ${f.title}"><img src="${A[f.id]}" alt="${f.title} poster"><span>${f.short}</span></button>`).join('')}<button class="chat-option-more texture-control" data-chat-action="next-films" aria-label="More works"><span>&gt;</span></button></div>`);}
  function taskChoices(){return paper('chat-choices chat-tasks',`<h3 data-type="Which task do you want to choose about?"></h3><div class="chat-options" hidden>${tasks.map(t=>`<button class="chat-option" data-task="${t.id}" data-task-film="${selectedFilm.id}" aria-label="Choose ${t.name}"><img src="${A[t.image]}" alt="${t.name} sticker"><span>${t.name}</span></button>`).join('')}<button class="chat-option-more texture-control" data-task-film="${selectedFilm.id}" data-chat-action="next-task" aria-label="Next task"><span>›</span></button></div>`);}
  function filmDetail(){return paper('chat-work',`<h2>${selectedFilm.subtitle}</h2><img class="work-poster" src="${A[selectedFilm.id]}" alt="${selectedFilm.title} poster"><p data-type="${escapeText(selectedFilm.text)}"></p>`);}
  function taskCard(){return `<section class="chat-task-ticket" aria-label="Task: ${selectedTask.name}"><img class="task-ticket-art" src="${A.taskPaper}" alt=""><img class="task-thumbnail" src="${A[selectedTask.large]}" alt="${lastCapture?'Your captured scene':selectedTask.name+' reference'}"><h3>Task_ ${selectedTask.name}</h3><p>${selectedTask.text}</p></section>`;}
  function typeText(node,text,currentEpoch){
    return new Promise(resolve=>{
      if(typedTexts.has(text)){node.textContent=text;resolve(true);return;}
      const letters=Array.from(text);let i=0;const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
      node.setAttribute('aria-busy','true');
      function tick(){
        if(currentEpoch!==epoch||C('chat-page').hidden){node.removeAttribute('aria-busy');resolve(false);return;}
        i=Math.min(letters.length,i+(reduce?letters.length:2));node.textContent=letters.slice(0,i).join('');
        if(i<letters.length)setTimeout(tick,22);
        else{typedTexts.add(text);node.removeAttribute('aria-busy');resolve(true);}
      }tick();
    });
  }
  const stageDelay=(ms,currentEpoch)=>new Promise(resolve=>setTimeout(()=>resolve(currentEpoch===epoch&&!C('chat-page').hidden),matchMedia('(prefers-reduced-motion: reduce)').matches?0:ms));
  async function revealConversation(currentEpoch){
    C('chat-page').dataset.phase='writing';
    for(const node of body.querySelectorAll('[data-type]')){
      if(!await typeText(node,node.dataset.type,currentEpoch))return;
      if(node.classList.contains('chat-prompt')){
        const topics=body.querySelector('.chat-topics');if(topics)topics.hidden=false;C('chat-page').dataset.phase='topics';
        if(!toolsUnlocked&&!await stageDelay(180,currentEpoch))return;
        const photo=body.querySelector('[data-sequence-photo]');if(photo){photo.hidden=false;C('chat-page').dataset.phase='photo';const image=photo.querySelector('.chat-photo-window img');if(image)await image.decode().catch(()=>{});}
        if(currentEpoch!==epoch||C('chat-page').hidden)return;
        if(!toolsUnlocked&&!await stageDelay(180,currentEpoch))return;
        toolsUnlocked=true;C('chat-add').hidden=false;
      }
      const chooser=node.closest('.chat-choices');if(chooser){const options=chooser.querySelector('.chat-options');if(options)options.hidden=false;}
      const generic=node.closest('.chat-generic');if(generic){const button=generic.querySelector('[data-after-text]');if(button)button.hidden=false;}
    }
    if(currentEpoch!==epoch||C('chat-page').hidden)return;
    body.querySelectorAll('[data-sequence-task]').forEach(ticket=>ticket.hidden=false);
    toolsUnlocked=true;C('chat-add').hidden=false;C('chat-page').dataset.phase='ready';
  }
  function renderHeader(){C('chat-header').classList.toggle('expanded',expanded);C('chat-page').classList.toggle('has-strip',expanded);C('chat-header-paper').src=expanded?(chatState==='task'?A.taskHeader:A.ticket):A.header;C('chat-place-title').textContent=place;C('chat-place-toggle').classList.toggle('no-sticker',!hotel);C('chat-place-sticker').hidden=!hotel;C('chat-place-toggle').setAttribute('aria-expanded',String(expanded));C('chat-film-strip').hidden=!expanded;C('chat-strip-next').hidden=!expanded;C('chat-film-strip').innerHTML=films.map(f=>`<button class="chat-film-tab" data-film="${f.id}" aria-label="Explore ${f.title}" aria-pressed="${selectedFilm.id===f.id}"><img src="${A[f.id]}" alt="${f.title} poster"><span>${f.short}</span></button>`).join('');}
  function renderConversation(){
    epoch++;renderHeader();C('chat-page').dataset.state=chatState;C('chat-add').hidden=!toolsUnlocked;
    let added=false;
    function append(key,html,refresh=false){
      const existing=Array.from(body.children).find(n=>n.dataset.messageKey===key);
      if(existing){if(refresh){const holder=document.createElement('div');holder.innerHTML=html;const next=holder.firstElementChild;next.dataset.messageKey=key;existing.replaceWith(next);}return;}
      const holder=document.createElement('div');holder.innerHTML=html;for(const node of Array.from(holder.children)){node.dataset.messageKey=key;body.append(node);}added=true;
    }
    if(!hotel)append('place:'+place,paper('chat-generic',`<p data-type="${escapeText(scopeText)}"></p>`));
    else {
      append('hotel-intro',paper('chat-intro',`<h2>Cathay Hotel</h2><p data-type="I am the &quot;Peace Hotel&quot;, just a stone’s throw away from the Bund. It is a legendary Art Deco building born in 1929 with a distinctive green pyramid top."></p><p class="chat-prompt" data-type="Do you want to explore further?"></p><div class="chat-topics" hidden><button class="chat-topic" data-chat-action="film">Film</button><button class="chat-topic" data-chat-action="television">Television</button><button class="chat-topic" data-chat-action="characters">Characters</button></div>`));
      append('hotel-photo',photoCard().replace('class="chat-photo-card"','class="chat-photo-card" data-sequence-photo hidden'));
      if(chatState!=='intro'){
        append('film-choices:'+filmRound,filmChoices(),chatState==='film');
      }
      if(chatState==='detail'||chatState==='task'){
        append('film:'+selectedFilm.id,filmDetail());
        append('tasks:'+selectedFilm.id,taskChoices());
      }
      if(chatState==='task')append('task:'+selectedFilm.id+':'+selectedTask.id,taskCard().replace('class="chat-task-ticket"',`class="chat-task-ticket" data-ticket-film="${selectedFilm.id}" data-ticket-task="${selectedTask.id}" data-sequence-task hidden`),true);
    }
    extraMessages.forEach((m,i)=>append('message:'+i,m.user?userBubble(m.text):paper('chat-generic',`<p data-type="${escapeText(m.text)}"></p>`)));
    syncTaskStickers();const renderEpoch=epoch;
    revealConversation(renderEpoch).then(()=>{if(renderEpoch===epoch&&added)requestAnimationFrame(()=>{body.scrollTop=body.scrollHeight;});});
    if(added)requestAnimationFrame(()=>{body.scrollTop=body.scrollHeight;});
  }
  function mapBuildingAllowed(){const app=document.querySelector('.map-app');return app.dataset.view==='architecture'&&!app.matches('.profile-open,.journal-open,.community-open')&&typeof selectedBuilding==='string'&&Boolean(selectedBuilding);}
  function refreshEntry(){const enabled=mapBuildingAllowed();C('guide-query').disabled=!enabled;C('guide-query').placeholder=enabled?'Ask anything…':'Choose a building…';C('guide-form').querySelector('button').disabled=!enabled;C('guide-card').setAttribute('aria-label',enabled?'Open building conversation':'Place introduction');}
  function open(initial='',building=''){if(!building&&!mapBuildingAllowed())return false;const context=building||selectedBuilding;if(body.dataset.origin!==context){body.dataset.origin=context;body.replaceChildren();extraMessages=[];toolsUnlocked=false;typedTexts.clear();hotel=/peace|cathay/i.test(context);place=hotel?'Cathay Hotel':context;scopeText=typeof introductions!=='undefined'&&introductions[context]?introductions[context]:'Explore the architecture and stories of '+context+'.';body.dataset.place=place;chatState='intro';expanded=false;referenceAdded=false;}C('chat-page').hidden=false;document.querySelector('.map-app').classList.add('chat-open');renderConversation();if(initial){C('chat-input').value=initial;send(initial);} }
  function close(restore=false){const returnToProfile=profileOrigin;profileOrigin=false;epoch++;stopCamera();C('chat-camera').hidden=true;C('chat-page').hidden=true;if(C('chat-lightbox').open)C('chat-lightbox').close();document.querySelector('.map-app').classList.remove('chat-open','camera-open');viewport.focus({preventScroll:true});if(restore===true&&returnToProfile)window.footNoteProfile?.resumeGallery();}
  function enterHotel(){hotel=true;place='Cathay Hotel';body.dataset.place=place;chatState='intro';expanded=false;renderConversation();}
  function selectFilm(id){selectedFilm=films.find(f=>f.id===id)||films[3];hotel=true;place='Cathay Hotel';chatState='detail';expanded=true;renderConversation();}
  function send(text){text=text.trim();if(!text)return;C('chat-input').value='';const index=extraMessages.length;extraMessages.push({user:true,text});const holder=document.createElement('div');holder.innerHTML=userBubble(text);const message=holder.firstElementChild;message.dataset.messageKey='message:'+index;body.append(message);body.scrollTop=body.scrollHeight;if(hotel&&/film|movie|cinema/i.test(text)){filmRound++;if(!hotel){hotel=true;place='Cathay Hotel';}chatState='film';expanded=false;renderConversation();return;}if(hotel&&/blossom|fanhua/i.test(text)){selectFilm('blossoms');return;}if(/task|elevator|dove|roof/i.test(text)&&hotel){chatState='task';selectedTask=/dove/i.test(text)?tasks[1]:/roof/i.test(text)?tasks[2]:tasks[0];const result=taskResults.get(selectedFilm.id+'/'+selectedTask.id);referenceAdded=Boolean(result);lastCapture=result?.photo||'';expanded=true;renderConversation();return;}extraMessages.push({user:false,text:hotel?'We can explore the Peace Hotel through its photographs, screen stories and architectural details. Choose Film to browse the works, or ask about a visual task.':scopeText});renderConversation();}
  function openPhoto(){photoIndex=0;galleryToken++;galleryAnimating=false;galleryDrag=null;galleryMoved=false;const dialog=C('chat-lightbox');dialog.classList.remove('gallery-snapping');dialog.style.setProperty('--gallery-x','0px');cyclePhoto(0);dialog.showModal();}
  function cyclePhoto(step){photoIndex=(photoIndex+step+2)%2;C('chat-photo-large').src=photoIndex?A.camera:A.photo;C('chat-photo-large').alt=photoIndex?'Antique elevator interior reference':'Peace Hotel staircase interior';C('chat-lightbox').dataset.photoIndex=String(photoIndex);C('chat-lightbox').setAttribute('aria-label','Photo '+(photoIndex+1)+' of 2. Swipe left or right to browse.');C('chat-lightbox').querySelectorAll('.chat-lightbox-peek img').forEach(image=>image.src=photoIndex?A.photo:A.camera);}
  let galleryDrag=null,galleryMoved=false,galleryAnimating=false,galleryToken=0;
  const gallery=C('chat-lightbox');
  function settleGallery(step){
    if(galleryAnimating)return;galleryAnimating=true;const token=galleryToken;gallery.classList.add('gallery-snapping');gallery.style.setProperty('--gallery-x',(step?-step*313:0)+'px');
    setTimeout(()=>{if(token!==galleryToken||!gallery.open)return;gallery.classList.remove('gallery-snapping');if(step)cyclePhoto(step);gallery.style.setProperty('--gallery-x','0px');galleryAnimating=false;},matchMedia('(prefers-reduced-motion: reduce)').matches?0:220);
  }
  gallery.addEventListener('pointerdown',event=>{if(galleryDrag||galleryAnimating||event.target.closest('button')||!event.target.closest('.chat-lightbox-photo,.chat-lightbox-peek'))return;galleryMoved=false;galleryDrag={id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now(),dx:0};gallery.setPointerCapture(event.pointerId);gallery.classList.add('gallery-dragging');});
  gallery.addEventListener('pointermove',event=>{if(!galleryDrag||galleryDrag.id!==event.pointerId)return;galleryDrag.dx=event.clientX-galleryDrag.x;if(Math.abs(galleryDrag.dx)>8)galleryMoved=true;gallery.style.setProperty('--gallery-x',Math.max(-313,Math.min(313,galleryDrag.dx))+'px');});
  function finishGalleryDrag(event,cancel=false){if(!galleryDrag||galleryDrag.id!==event.pointerId)return;const drag=galleryDrag;galleryDrag=null;gallery.classList.remove('gallery-dragging');const elapsed=Math.max(1,performance.now()-drag.time);const change=!cancel&&(Math.abs(drag.dx)>45||(Math.abs(drag.dx)>20&&Math.abs(drag.dx)/elapsed>.35));settleGallery(change?(drag.dx<0?1:-1):0);}
  gallery.addEventListener('pointerup',event=>finishGalleryDrag(event));gallery.addEventListener('pointercancel',event=>finishGalleryDrag(event,true));
  gallery.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();settleGallery(event.key==='ArrowRight'?1:-1);}});
  let wheelOffset=0;gallery.addEventListener('wheel',event=>{if(Math.abs(event.deltaX)<=Math.abs(event.deltaY))return;event.preventDefault();wheelOffset+=event.deltaX;if(Math.abs(wheelOffset)>60){settleGallery(wheelOffset>0?1:-1);wheelOffset=0;}},{passive:false});
  gallery.addEventListener('close',()=>{galleryToken++;galleryDrag=null;galleryAnimating=false;wheelOffset=0;gallery.classList.remove('gallery-dragging','gallery-snapping');gallery.style.setProperty('--gallery-x','0px');});
  const scanFrame=document.createElement('div');scanFrame.className='task-scan-frame';const scanLine=document.createElement('div');scanLine.className='task-scan-line';const scanSticker=document.createElement('img');scanSticker.className='task-scan-sticker';scanSticker.src=A.taskElevator;scanSticker.alt='Antique Elevator sticker';C('chat-camera').append(scanFrame,scanLine,scanSticker);
  C('chat-shutter').addEventListener('click',event=>{if(cameraMode!=='reference'||C('chat-camera').dataset.scan==='result')return;event.stopImmediatePropagation();if(C('chat-camera').dataset.scan)return;const token=cameraEpoch;C('chat-camera').dataset.scan='sweeping';C('camera-feedback').textContent='Scanning the elevator…';const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;setTimeout(()=>{if(token!==cameraEpoch)return;C('chat-camera').dataset.scan='focusing';C('camera-feedback').textContent='Framing the object…';},reduce?30:900);setTimeout(()=>{if(token!==cameraEpoch)return;C('chat-camera').dataset.scan='result';C('camera-feedback').textContent='Task complete. Returning to your conversation…';setTimeout(()=>{if(token===cameraEpoch&&!C('chat-camera').hidden)C('chat-shutter').click();},reduce?60:800);},reduce?60:1900);},true);
  function openCamera(){
    stopCamera();captureBusy=false;
    const ticket=body.querySelector('[data-ticket-film="'+selectedFilm.id+'"][data-ticket-task="'+selectedTask.id+'"]');
    cameraTask=chatState==='task'&&ticket&&!ticket.hidden?{...selectedTask,filmId:selectedFilm.id}:null;
    cameraMode=cameraTask?.id==='elevator'?'reference':'live';
    C('chat-camera').dataset.mode=cameraMode;C('camera-reference').hidden=cameraMode!=='reference';
    C('chat-shutter').disabled=cameraMode==='live';C('chat-shutter').setAttribute('aria-label',cameraMode==='reference'?'Save task reference':'Take photo');
    C('camera-retry').hidden=true;C('chat-camera').hidden=false;document.querySelector('.map-app').classList.add('camera-open');
    C('camera-feedback').textContent=cameraMode==='live'?'Opening camera…':'';C('chat-camera-back').focus();
    if(cameraMode==='live')activateCamera(cameraEpoch);
  }
  function cameraError(token,message){if(token!==cameraEpoch||C('chat-camera').hidden||cameraMode!=='live')return;C('camera-reference').hidden=true;C('camera-feedback').textContent=message;C('chat-shutter').disabled=true;C('camera-retry').hidden=false;}
  async function activateCamera(token){
    if(!navigator.mediaDevices?.getUserMedia){cameraError(token,'Camera access is unavailable in this browser.');return;}
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
      if(token!==cameraEpoch||C('chat-camera').hidden||cameraMode!=='live'){stream.getTracks().forEach(track=>track.stop());return;}
      mediaStream=stream;const video=C('chat-camera-video');video.srcObject=stream;await video.play();
      if(token!==cameraEpoch||C('chat-camera').hidden||cameraMode!=='live'){stream.getTracks().forEach(track=>track.stop());return;}
      video.hidden=false;C('camera-reference').hidden=true;usingCamera=true;C('chat-shutter').disabled=false;C('camera-feedback').textContent='';C('camera-retry').hidden=true;
    }catch(error){
      if(token!==cameraEpoch)return;
      if(mediaStream)mediaStream.getTracks().forEach(track=>track.stop());mediaStream=null;usingCamera=false;C('chat-camera-video').srcObject=null;C('chat-camera-video').hidden=true;
      const message=error.name==='NotAllowedError'?'Please allow camera access to continue.':error.name==='NotFoundError'?'No camera was found on this device.':error.name==='NotReadableError'?'The camera is in use. Close other camera apps and retry.':'Unable to open the camera. Please retry.';
      cameraError(token,message);
    }
  }
  function stopCamera(){cameraEpoch++;delete C('chat-camera').dataset.scan;if(mediaStream)mediaStream.getTracks().forEach(track=>track.stop());mediaStream=null;usingCamera=false;C('chat-camera-video').srcObject=null;C('chat-camera-video').hidden=true;C('camera-reference').hidden=true;C('camera-retry').hidden=true;document.querySelector('.map-app').classList.remove('camera-open');}
  function closeCamera(){stopCamera();captureBusy=false;C('chat-shutter').disabled=false;C('chat-camera').hidden=true;C('chat-input').focus({preventScroll:true});}
  C('chat-back').addEventListener('click',()=>close(true));C('chat-place-toggle').addEventListener('click',()=>{if(!hotel)return;expanded=!expanded;renderHeader();});C('chat-strip-next').addEventListener('click',()=>{if(chatState==='intro'){chatState='film';expanded=false;renderConversation();}else selectFilm(films[(films.indexOf(selectedFilm)+1)%films.length].id);});
  [body,C('chat-film-strip')].forEach(container=>container.addEventListener('click',event=>{const target=event.target.closest('[data-chat-action],[data-film],[data-task]');if(!target)return;if(target.dataset.film){selectFilm(target.dataset.film);return;}if(target.dataset.taskFilm)selectedFilm=films.find(f=>f.id===target.dataset.taskFilm)||selectedFilm;if(target.dataset.task){selectedTask=tasks.find(t=>t.id===target.dataset.task);const result=taskResults.get(selectedFilm.id+'/'+selectedTask.id);referenceAdded=Boolean(result);lastCapture=result?.photo||'';chatState='task';expanded=true;renderConversation();return;}const action=target.dataset.chatAction;if(action==='photo')openPhoto();if(action==='film')send('I want to know more about film');if(action==='hotel')enterHotel();if(action==='next-films'){filmOffset=(filmOffset+1)%films.length;renderConversation();}if(action==='camera'){selectedFilm=films.find(f=>f.id===target.dataset.ticketFilm)||selectedFilm;selectedTask=tasks.find(t=>t.id===target.dataset.ticketTask)||selectedTask;chatState='task';openCamera();}if(action==='next-task'){selectedTask=tasks[(tasks.indexOf(selectedTask)+1)%tasks.length];const result=taskResults.get(selectedFilm.id+'/'+selectedTask.id);referenceAdded=Boolean(result);lastCapture=result?.photo||'';chatState='task';renderConversation();}if(action==='television'||action==='characters'){extraMessages.push({user:true,text:action==='television'?'I want to explore television stories.':'I want to explore the characters.'},{user:false,text:'The supplied story collection begins with Blossoms. Choose Film to browse the works and continue into a visual task.'});renderConversation();}}));
  C('chat-composer').addEventListener('submit',event=>{event.preventDefault();send(C('chat-input').value);});C('chat-notebook').addEventListener('click',()=>document.querySelector('[data-panel="notes"]').click());C('chat-add').addEventListener('click',openCamera);C('chat-photo-close').addEventListener('click',()=>C('chat-lightbox').close());C('chat-lightbox').addEventListener('click',event=>{if(event.target!==C('chat-lightbox')||galleryMoved)return;const r=C('chat-photo-large').parentElement.getBoundingClientRect();if(event.clientY<r.top||event.clientY>r.bottom)C('chat-lightbox').close();});
  C('chat-camera-back').addEventListener('click',closeCamera);
  C('camera-retry').addEventListener('click',()=>{if(cameraMode!=='live')return;stopCamera();document.querySelector('.map-app').classList.add('camera-open');C('chat-shutter').disabled=true;C('camera-feedback').textContent='Opening camera…';activateCamera(cameraEpoch);});
  C('chat-shutter').addEventListener('click',()=>{
    if(captureBusy||(cameraMode==='live'&&!usingCamera))return;
    const captureEpoch=cameraEpoch,task=cameraTask;let photo='';
    if(cameraMode==='live'){
      const video=C('chat-camera-video');if(video.readyState<2){C('camera-feedback').textContent='Camera is getting ready…';return;}
      const canvas=document.createElement('canvas'),ratio=Math.min(1,1280/(video.videoWidth||1280));canvas.width=Math.round((video.videoWidth||1280)*ratio);canvas.height=Math.round((video.videoHeight||720)*ratio);canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);photo=canvas.toDataURL('image/jpeg',.85);
      try{localStorage.setItem('foot-note-last-photo',photo);}catch{}
    }
    captureBusy=true;C('chat-shutter').disabled=true;
    if(task&&cameraMode==='reference'){try{localStorage.setItem('foot-note-earned-elevator','true');}catch{}}if(task){taskResults.set(task.filmId+'/'+task.id,{photo,captureType:photo?'photo':'reference'});try{localStorage.setItem('foot-note-task-results',JSON.stringify([...taskResults]));}catch{}if(selectedFilm.id===task.filmId&&selectedTask.id===task.id){lastCapture=photo;referenceAdded=true;}}
    const text=(photo?'Photo captured':'Reference saved')+(task?' for '+task.name:'');C('camera-feedback').textContent=text;
    try{const previous=localStorage.getItem('foot-note-notes')||'';localStorage.setItem('foot-note-notes',[previous,text].filter(Boolean).join('\n'));if(typeof notes!=='undefined')notes=[previous,text].filter(Boolean).join('\n');}catch{}
    setTimeout(()=>{if(captureEpoch!==cameraEpoch)return;closeCamera();if(task&&hotel&&chatState==='task'){renderConversation();const completedEpoch=epoch;const showCompleted=()=>{if(completedEpoch!==epoch)return;if(C('chat-page').dataset.phase!=='ready'){requestAnimationFrame(showCompleted);return;}const card=body.querySelector('[data-ticket-film="'+task.filmId+'"][data-ticket-task="'+task.id+'"]');if(card){card.scrollIntoView({block:'end'});card.classList.add('task-just-completed');}};requestAnimationFrame(showCompleted);}},800);
  });

  document.querySelectorAll('[data-panel="map"]').forEach(button=>button.addEventListener('click',()=>{if(!C('chat-page').hidden)close();}));C('guide-query').addEventListener('focus',()=>{if(C('chat-page').hidden&&mapBuildingAllowed()){open();C('chat-input').focus({preventScroll:true});}});C('guide-form').addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();if(mapBuildingAllowed())open(C('guide-query').value);C('guide-query').value='';},{capture:true});C('guide-card').addEventListener('click',event=>{if(!event.target.closest('button,a')&&!window.getSelection()?.toString())open();});C('guide-card').setAttribute('tabindex','0');C('guide-card').addEventListener('keydown',event=>{if(event.target===C('guide-card')&&['Enter',' '].includes(event.key)){event.preventDefault();open();}});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!C('chat-lightbox').open){if(!C('chat-camera').hidden)closeCamera();else if(!C('chat-page').hidden)close(true);}});
  C('guide-form').addEventListener('click',event=>{if(C('chat-page').hidden&&mapBuildingAllowed()&&!event.target.closest('button,input'))open();});
  window.footNoteChat={open,close,refreshEntry,openBuilding:name=>{if(!name)return;window.footNoteProfile?.close();window.footNoteJournal?.close();window.footNoteCommunity?.close();open('',name);}};refreshEntry();
})();
