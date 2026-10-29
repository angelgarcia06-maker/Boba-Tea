import {DEFAULT_CONTENT} from './content.js';
import {PUBLIC_CONFIG} from './config.js';
import {validCtaUrl,validSocialUrl,validHttpUrl,validateComment,publicPageUrl,cleanText} from './utils.js';

const $ = (selector, root = document) => root.querySelector(selector);
const byId = id => document.getElementById(id);
const slug = PUBLIC_CONFIG.articleSlug;
const LOCAL_CONTENT_KEY = `marketing-blog-content-${slug}`;
const LOCAL_COMMENTS_KEY = `marketing-blog-comments-${slug}`;
const isPublic = Boolean(PUBLIC_CONFIG.supabaseUrl.trim() && PUBLIC_CONFIG.supabasePublishableKey.trim());
const wantsAdmin = new URLSearchParams(location.search).get('admin') === '1';
let backend = null;
let content = structuredClone(DEFAULT_CONTENT);
let editorDraft = null;
let comments = [];
let adminAllowed = false;
let lastCommentAt = 0;
let toastTimer;
const DEMO_HERO = DEFAULT_CONTENT.hero.src;

function safeLocalRead(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
}
function showFeedback(id, text, isError=false) { const node=byId(id); node.textContent=text; node.classList.toggle('error',isError); }
function showToast(message) {const node=byId('toast'); node.textContent=message; node.classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>node.classList.remove('visible'),3200);}
function assignText(id,value){byId(id).textContent=String(value??'');}
function ensureContent(raw){
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return structuredClone(DEFAULT_CONTENT);
  const base = structuredClone(DEFAULT_CONTENT);
  for (const name of ['brand','category','title','subtitle','intro','author','datePublished','leadHeading','leadParagraph']) if (typeof raw[name]==='string') base[name]=raw[name];
  if(Array.isArray(raw.benefits)) base.benefits=raw.benefits.filter(x=>typeof x==='string').slice(0,8);
  if(Array.isArray(raw.sections)) base.sections=raw.sections.filter(x=>x && typeof x.heading==='string' && typeof x.text==='string').slice(0,30);
  if(Array.isArray(raw.gallery)) base.gallery=raw.gallery.filter(x=>x && typeof x.src==='string').slice(0,6).map(x=>({src:x.src,alt:cleanText(x.alt,180),caption:cleanText(x.caption,180)}));
  for(const name of ['hero','cta','social','appearance','seo']) if(raw[name] && typeof raw[name]==='object' && !Array.isArray(raw[name])) Object.assign(base[name],raw[name]);
  return base;
}
function safeImageSrc(src) {
  const s=String(src??'').trim();
  if(s===DEMO_HERO) return s;
  if(/^data:image\/(webp|png|jpeg);base64,/i.test(s)) return s;
  if(validHttpUrl(s)) return s;
  return DEMO_HERO;
}
function renderArticle() {
  assignText('brand-name',content.brand);
  assignText('footer-brand',content.brand+'.');
  assignText('article-category',content.category);
  assignText('article-title',content.title);
  assignText('article-subtitle',content.subtitle);
  assignText('article-intro',content.intro);
  assignText('article-author',content.author||'Boba Tea Piura');
  assignText('article-date',content.datePublished ? new Date(content.datePublished+'T12:00:00').toLocaleDateString('es-PE',{day:'numeric',month:'long',year:'numeric'}):'Frescura en cada sorbo');
  assignText('lead-heading',content.leadHeading);
  assignText('lead-paragraph',content.leadParagraph);
  const benefits=byId('lead-benefits');benefits.replaceChildren();
  content.benefits.forEach(text=>{const li=document.createElement('li');li.textContent=text;benefits.append(li);});
  const hero=byId('hero-image'); hero.src=safeImageSrc(content.hero.src);hero.alt=content.hero.alt||'';
  assignText('hero-caption',content.hero.caption);
  const sections=byId('article-sections'); sections.replaceChildren();
  content.sections.forEach(item=>{
    const node=document.createElement('section');node.className='tip-item';
    const heading=document.createElement('h3');heading.textContent=item.heading;
    const paragraph=document.createElement('p');paragraph.textContent=item.text;
    node.append(heading,paragraph);sections.append(node);
  });
  const gallery=byId('article-gallery');gallery.replaceChildren();
  content.gallery.forEach(item=>{
    const fig=document.createElement('figure');fig.className='gallery-item';
    const img=document.createElement('img'); img.src=safeImageSrc(item.src);img.alt=item.alt||'';img.loading='lazy';img.decoding='async';img.width=800;img.height=600;
    const caption=document.createElement('figcaption');caption.textContent=item.caption||'';
    fig.append(img,caption);gallery.append(fig);
  });
  assignText('cta-kicker',content.cta.kicker);assignText('cta-heading',content.cta.heading);assignText('cta-description',content.cta.description);
  const cta=byId('cta-link');cta.firstChild.textContent=content.cta.button+' ';
  const ctaDestination=validCtaUrl(content.cta.url)?content.cta.url:'#comentarios';cta.href=ctaDestination;
  if(!ctaDestination.startsWith('#')){cta.target='_blank';cta.rel='noopener noreferrer';}else{cta.removeAttribute('target');cta.removeAttribute('rel');}
  for(const platform of ['instagram','tiktok','maps']) {
    const link=byId('social-'+platform);const valid=validSocialUrl(platform,content.social[platform]);
    link.href=valid?content.social[platform]:'#enlaces';link.classList.toggle('is-disabled',!valid);
    link.setAttribute('aria-disabled',String(!valid));
    link.tabIndex=valid?0:-1;
    if(valid){link.target='_blank';link.rel='noopener noreferrer';}
    else{link.removeAttribute('target');link.removeAttribute('rel');}
  }
  byId('social-demo-note').hidden=['instagram','tiktok','maps'].every(platform=>validSocialUrl(platform,content.social[platform]));
  const root=document.documentElement;
  if(/^#[\da-f]{6}$/i.test(content.appearance.primary)) root.style.setProperty('--green',content.appearance.primary);
  if(/^#[\da-f]{6}$/i.test(content.appearance.accent)) root.style.setProperty('--accent',content.appearance.accent);
  applySeo();
}

function applySeo(){
  // ESTRATEGIA SEO 01 y 02: title, keywords y description coherentes con el H1.
  document.title=content.seo.metaTitle;
  $('meta[name="description"]').content=content.seo.metaDescription;
  $('meta[name="keywords"]').content=[content.seo.keyword,content.seo.secondaryKeywords].filter(Boolean).join(', ');
  $('meta[property="og:title"]').content=content.seo.metaTitle;
  $('meta[property="og:description"]').content=content.seo.metaDescription;
  const url=publicPageUrl(location);
  const isDeployed=/^https?:$/.test(location.protocol) && !['localhost','127.0.0.1'].includes(location.hostname);
  byId('canonical-url').href=isDeployed?url:'';
  let image='';
  try { const absolute=new URL(content.hero.src,url); if(['http:','https:'].includes(absolute.protocol) && !content.hero.src.startsWith('data:')) image=absolute.href; }
  catch { /* Imagen sin URL pública. */ }
  $('meta[property="og:image"]').content=isDeployed?image:'';
  // ESTRATEGIA SEO 07: BlogPosting JSON-LD; autor/fecha solo si fueron proporcionados de forma real.
  const schema={'@context':'https://schema.org','@type':'BlogPosting',headline:content.title,description:content.seo.metaDescription,inLanguage:'es-PE'};
  if(isDeployed) {schema.mainEntityOfPage=url;if(image) schema.image=image;}
  if(content.author.trim()) schema.author={'@type':'Person',name:content.author.trim()};
  if(/^\d{4}-\d{2}-\d{2}$/.test(content.datePublished)) schema.datePublished=content.datePublished;
  byId('structured-data').textContent=JSON.stringify(schema).replace(/</g,'\\u003c');
}

function renderComments() {
  const approved=comments.filter(c=>c.status!=='hidden');
  assignText('comment-count',`${approved.length} comentario${approved.length===1?'':'s'}`);
  const list=byId('comment-list');list.replaceChildren();
  if(!approved.length){const p=document.createElement('p');p.className='empty-comments';p.textContent='Sé la primera persona en participar.';list.append(p);return;}
  approved.forEach(item=>{
    const article=document.createElement('article');article.className='comment-item';
    const person=document.createElement('div');person.className='comment-person';
    const avatar=document.createElement('span');avatar.className='avatar';avatar.textContent=(item.author_name||'?').slice(0,1).toUpperCase();
    const detail=document.createElement('div');const name=document.createElement('strong');name.textContent=item.author_name;
    const date=document.createElement('time');const dateObj=new Date(item.created_at);date.textContent=Number.isNaN(dateObj.getTime())?'Fecha no disponible':dateObj.toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric'});date.dateTime=item.created_at;
    detail.append(name,date);person.append(avatar,detail);
    const body=document.createElement('p');body.textContent=item.body; // No innerHTML: prevención de XSS.
    article.append(person,body);list.append(article);
  });
}
async function loadComments() {
  try { comments=isPublic?await backend.readComments():safeLocalRead(LOCAL_COMMENTS_KEY,[]);renderComments(); }
  catch(error){showFeedback('comment-feedback',`No se pudieron cargar los comentarios: ${error.message}`,true);}
}
async function submitComment(event){
  event.preventDefault();showFeedback('comment-feedback','');
  const name=byId('comment-name').value.trim(), body=byId('comment-body').value.trim();
  if(byId('comment-website').value) return; // Honeypot básico antispam.
  const error=validateComment(name,body);
  if(error){showFeedback('comment-feedback',error,true);return;}
  if(Date.now()-lastCommentAt<45000){showFeedback('comment-feedback','Espera un momento antes de publicar otro comentario.',true);return;}
  const button=byId('comment-submit');button.disabled=true;
  try{
    if(isPublic) await backend.writeComment(name,body);
    else {
      const item={id:crypto.randomUUID(),author_name:name,body,created_at:new Date().toISOString(),status:'approved'};
      const next=[item,...comments];localStorage.setItem(LOCAL_COMMENTS_KEY,JSON.stringify(next));
    }
    lastCommentAt=Date.now();event.target.reset();await loadComments();
    showFeedback('comment-feedback','Tu comentario se publicó correctamente. ¡Gracias por participar!');showToast('Comentario publicado');
  }catch(error){showFeedback('comment-feedback',`No se pudo publicar: ${error.message}`,true);}
  finally {button.disabled=false;}
}
function renderModeration(){
  const list=byId('moderation-list');list.replaceChildren();
  if(!comments.length){list.textContent='Todavía no hay comentarios para moderar.';return;}
  comments.forEach(item=>{
    const row=document.createElement('div');row.className='moderation-item';
    const info=document.createElement('div');const heading=document.createElement('strong');heading.textContent=item.author_name;
    const body=document.createElement('p');body.textContent=item.body;
    const status=document.createElement('small');status.textContent=item.status==='hidden'?'Oculto':'Visible';info.append(heading,body,status);
    const button=document.createElement('button');button.type='button';button.textContent=item.status==='hidden'?'Restaurar':'Ocultar';
    button.addEventListener('click',async()=>{
      button.disabled=true;
      try {
        const next=item.status==='hidden'?'approved':'hidden';
        if(isPublic) await backend.moderateComment(item.id,next);
        else {item.status=next;localStorage.setItem(LOCAL_COMMENTS_KEY,JSON.stringify(comments));}
        await loadComments();renderModeration();
      }catch(error){showToast(`Error: ${error.message}`);button.disabled=false;}
    });
    row.append(info,button);list.append(row);
  });
}

// ESTRATEGIA SEO 04: exportar fotografías comprimidas a WebP (máx. 1600 px) para mejorar la carga.
async function compressImage(file) {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Solo se admiten fotografías JPG, PNG o WebP.');
  if(file.size>8*1024*1024)throw new Error('La fotografía supera el máximo de 8 MB.');
  const image=new Image();const temp=URL.createObjectURL(file);
  try {
    await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('No se pudo leer la fotografía.'));image.src=temp;});
    const factor=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*factor));canvas.height=Math.max(1,Math.round(image.naturalHeight*factor));
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
    const result=canvas.toDataURL('image/webp',.8);
    if(!result.startsWith('data:image/webp;'))throw new Error('El navegador no pudo comprimir a WebP.');
    if(result.length>3_000_000)throw new Error('La fotografía sigue siendo demasiado grande. Prueba con otra imagen.');
    return result;
  }finally{URL.revokeObjectURL(temp);}
}
function formField(name){return $(`[name="${name}"]`,byId('editor-form'));}
function setField(name,value){formField(name).value=value??'';}
function buildSectionRow(item){
  const wrapper=document.createElement('div');wrapper.className='section-editor-row';
  const header=document.createElement('div');header.className='repeater-row-header';
  const title=document.createElement('span');title.textContent='Sección del artículo';
  const remove=document.createElement('button');remove.type='button';remove.className='row-remove';remove.textContent='Eliminar sección';remove.addEventListener('click',()=>wrapper.remove());
  header.append(title,remove);
  const heading=document.createElement('input');heading.type='text';heading.required=true;heading.maxLength=160;heading.value=item.heading||'';heading.placeholder='Subtítulo H3';heading.setAttribute('aria-label','Subtítulo de la sección');heading.className='section-heading-input';
  const text=document.createElement('textarea');text.required=true;text.rows=3;text.value=item.text||'';text.placeholder='Párrafo de la sección';text.setAttribute('aria-label','Contenido de la sección');text.className='section-text-input';
  wrapper.append(header,heading,text);byId('editor-sections').append(wrapper);
}
function buildGalleryRow(item){
  const wrapper=document.createElement('div');wrapper.className='gallery-editor-row';
  const image=document.createElement('img');image.src=safeImageSrc(item.src);image.alt='Vista previa de galería';
  const fields=document.createElement('div');const remove=document.createElement('button');remove.type='button';remove.className='row-remove';remove.textContent='Eliminar fotografía';remove.addEventListener('click',()=>wrapper.remove());
  const alt=document.createElement('input');alt.value=item.alt||'';alt.maxLength=180;alt.placeholder='Texto ALT descriptivo';alt.setAttribute('aria-label','Texto alternativo de fotografía');alt.required=true;alt.className='gallery-alt';
  const caption=document.createElement('input');caption.value=item.caption||'';caption.maxLength=180;caption.placeholder='Pie de foto (opcional)';caption.setAttribute('aria-label','Pie de foto');caption.className='gallery-caption';
  const file=document.createElement('input');file.type='file';file.accept='image/jpeg,image/png,image/webp';file.setAttribute('aria-label','Reemplazar fotografía');file.addEventListener('change',async()=>{
    if(!file.files[0])return;
    try{item.src=await compressImage(file.files[0]);image.src=item.src;showToast('Foto reemplazada en la vista previa');}catch(error){showToast(error.message);file.value='';}
  });
  fields.append(remove,alt,caption,file);wrapper.append(image,fields);wrapper.dataset.imageIndex=String(editorDraft.gallery.indexOf(item));byId('editor-gallery').append(wrapper);
  wrapper._item=item; // Referencia local temporal, nunca serializada.
}
function openEditor(){
  if(!adminAllowed)return;
  editorDraft=structuredClone(content);
  for(const field of ['brand','category','title','subtitle','intro','author','datePublished','leadHeading','leadParagraph'])setField(field,editorDraft[field]);
  setField('benefits',editorDraft.benefits.join('\n'));setField('heroAlt',editorDraft.hero.alt);setField('heroCaption',editorDraft.hero.caption);
  setField('ctaKicker',editorDraft.cta.kicker);setField('ctaHeading',editorDraft.cta.heading);setField('ctaDescription',editorDraft.cta.description);setField('ctaButton',editorDraft.cta.button);setField('ctaUrl',editorDraft.cta.url);
  for(const name of ['instagram','tiktok','maps'])setField(name,editorDraft.social[name]);
  setField('keyword',editorDraft.seo.keyword);setField('secondaryKeywords',editorDraft.seo.secondaryKeywords);setField('metaTitle',editorDraft.seo.metaTitle);setField('metaDescription',editorDraft.seo.metaDescription);
  setField('primaryColor',editorDraft.appearance.primary);setField('accentColor',editorDraft.appearance.accent);
  byId('editor-hero-preview').src=safeImageSrc(editorDraft.hero.src);byId('editor-hero-file').value='';byId('gallery-file').value='';
  byId('editor-sections').replaceChildren();editorDraft.sections.forEach(buildSectionRow);
  byId('editor-gallery').replaceChildren();editorDraft.gallery.forEach(buildGalleryRow);
  showFeedback('editor-feedback','');byId('editor-dialog').showModal();
}
function collectEditor(){
  const draft=structuredClone(editorDraft);
  for(const field of ['brand','category','title','subtitle','intro','author','datePublished','leadHeading','leadParagraph'])draft[field]=formField(field).value.trim();
  draft.benefits=formField('benefits').value.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,8);
  draft.hero.alt=formField('heroAlt').value.trim();draft.hero.caption=formField('heroCaption').value.trim();
  draft.sections=[...byId('editor-sections').children].map(row=>({heading:$('.section-heading-input',row).value.trim(),text:$('.section-text-input',row).value.trim()}));
  draft.gallery=[...byId('editor-gallery').children].map(row=>({src:row._item.src,alt:$('.gallery-alt',row).value.trim(),caption:$('.gallery-caption',row).value.trim()}));
  for(const [field,key] of [['ctaKicker','kicker'],['ctaHeading','heading'],['ctaDescription','description'],['ctaButton','button'],['ctaUrl','url']])draft.cta[key]=formField(field).value.trim();
  for(const name of ['instagram','tiktok','maps'])draft.social[name]=formField(name).value.trim();
  for(const [field,key] of [['keyword','keyword'],['secondaryKeywords','secondaryKeywords'],['metaTitle','metaTitle'],['metaDescription','metaDescription']])draft.seo[key]=formField(field).value.trim();
  draft.appearance.primary=formField('primaryColor').value;draft.appearance.accent=formField('accentColor').value;
  return draft;
}
function validateEditor(draft){
  if(!draft.sections.length)return 'Incluye al menos una sección de contenido.';
  if(!validCtaUrl(draft.cta.url))return 'El enlace del CTA debe ser https://... o una referencia interna como #comentarios.';
  for(const platform of ['instagram','tiktok','maps'])if(draft.social[platform]&&!validSocialUrl(platform,draft.social[platform]))return `La dirección de ${platform} no corresponde a ese servicio.`;
  if(!draft.hero.alt.trim())return 'La imagen principal necesita un texto ALT.';
  if(draft.gallery.some(item=>!item.alt))return 'Todas las fotografías de la galería necesitan un texto ALT.';
  return '';
}
function imageDataToBlob(dataUri){
  const [head,base64]=dataUri.split(',');const mime=head.match(/^data:([^;]+);base64$/)?.[1];
  if(mime!=='image/webp')throw new Error('Formato de imagen no válido.');
  const binary=atob(base64);const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return new Blob([bytes],{type:mime});
}
async function publishImages(draft){
  const upload=async src=>src.startsWith('data:image/webp;base64,')?await backend.uploadImage(imageDataToBlob(src)):src;
  draft.hero.src=await upload(draft.hero.src);
  for(const image of draft.gallery)image.src=await upload(image.src);
}
async function saveEditor(event){
  event.preventDefault();if(!adminAllowed)return;
  const draft=collectEditor();const error=validateEditor(draft);if(error){showFeedback('editor-feedback',error,true);return;}
  const btn=byId('save-editor');btn.disabled=true;btn.textContent='Guardando...';showFeedback('editor-feedback','');
  try{
    if(isPublic){await publishImages(draft);await backend.writeArticle(draft);}
    else localStorage.setItem(LOCAL_CONTENT_KEY,JSON.stringify(draft));
    content=draft;renderArticle();byId('editor-dialog').close();showToast('Cambios guardados correctamente');
  }catch(error){showFeedback('editor-feedback',`No se pudo guardar: ${error.message}`,true);}
  finally{btn.disabled=false;btn.textContent='Guardar cambios ✓';}
}
function setAdminStatus(allowed){
  adminAllowed=allowed;byId('admin-toolbar').hidden=!allowed;
  if(allowed)assignText('admin-mode-label',isPublic?'Conectado · Supabase':'Edición local · sin autenticación');
}
async function beginAdmin(){
  if(!wantsAdmin)return;
  if(!isPublic){setAdminStatus(true);showToast('Modo demostración: los cambios solo se ven en este navegador');return;}
  try{if(await backend.isAdmin()){setAdminStatus(true);return;}}
  catch(error){showToast(`No se pudo comprobar la cuenta: ${error.message}`);}
  byId('login-dialog').showModal();
}
function wireEvents(){
  byId('comment-form').addEventListener('submit',submitComment);
  byId('refresh-comments').addEventListener('click',loadComments);
  byId('share-button').addEventListener('click',async()=>{
    const url=publicPageUrl(location);
    if(navigator.share){try{await navigator.share({title:content.title,text:content.seo.metaDescription,url});showFeedback('share-notice','Compartido correctamente.');}catch(error){if(error.name!=='AbortError')showFeedback('share-notice','No se pudo abrir el menú de compartir.',true);}}
    else await copyShareUrl();
  });
  byId('copy-button').addEventListener('click',copyShareUrl);
  byId('open-editor').addEventListener('click',openEditor);
  byId('open-moderation').addEventListener('click',()=>{if(!adminAllowed)return;renderModeration();byId('moderation-dialog').showModal();});
  byId('logout-admin').addEventListener('click',async()=>{
    if(isPublic && backend){try{await backend.signOut();}catch(error){showToast(error.message);return;}}
    location.href=publicPageUrl(location);
  });
  byId('login-form').addEventListener('submit',async event=>{
    event.preventDefault();const button=$('button[type="submit"]',event.target);button.disabled=true;showFeedback('login-feedback','');
    try{const allowed=await backend.signIn(byId('admin-email').value,byId('admin-password').value);if(!allowed){await backend.signOut();throw new Error('Esta cuenta no aparece entre los administradores autorizados.');}setAdminStatus(true);byId('login-dialog').close();byId('admin-password').value='';showToast('Sesión administrativa iniciada');}
    catch(error){showFeedback('login-feedback',error.message,true);}
    finally{button.disabled=false;}
  });
  document.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click',()=>byId(btn.dataset.close).close()));
  byId('cancel-editor').addEventListener('click',()=>byId('editor-dialog').close());
  byId('editor-form').addEventListener('submit',saveEditor);
  byId('add-section').addEventListener('click',()=>{if(byId('editor-sections').children.length<30)buildSectionRow({heading:'',text:''});});
  byId('editor-hero-file').addEventListener('change',async event=>{
    const file=event.target.files?.[0];if(!file)return;
    try{const src=await compressImage(file);editorDraft.hero.src=src;byId('editor-hero-preview').src=src;showToast('Imagen lista para guardar');}
    catch(error){showFeedback('editor-feedback',error.message,true);event.target.value='';}
  });
  byId('remove-hero').addEventListener('click',()=>{editorDraft.hero.src=DEMO_HERO;byId('editor-hero-preview').src=DEMO_HERO;byId('editor-hero-file').value='';});
  byId('gallery-file').addEventListener('change',async event=>{
    const file=event.target.files?.[0];if(!file)return;
    if(byId('editor-gallery').children.length>=6){showToast('Máximo seis fotografías adicionales');return;}
    try{const src=await compressImage(file);const item={src,alt:'',caption:''};editorDraft.gallery.push(item);buildGalleryRow(item);showToast('Añade el texto ALT antes de guardar');}
    catch(error){showFeedback('editor-feedback',error.message,true);}
    finally{event.target.value='';}
  });
}
async function copyShareUrl(){
  const url=publicPageUrl(location);
  try{
    if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(url);
    else {const el=document.createElement('textarea');el.value=url;el.style.position='fixed';el.style.left='-9999px';document.body.append(el);el.select();if(!document.execCommand('copy'))throw new Error('No disponible');el.remove();}
    const local=location.hostname==='localhost'||location.hostname==='127.0.0.1';
    showFeedback('share-notice',local?'Enlace copiado. Recuerda publicarlo para que otras personas puedan abrirlo.':'¡Enlace copiado al portapapeles!');showToast('Enlace copiado');
  }catch{showFeedback('share-notice','No se pudo copiar automáticamente. Copia el enlace desde la barra de direcciones.',true);}
}
async function init(){
  wireEvents();
  if(isPublic){
    assignText('storage-mode','Modo público: los comentarios se comparten mediante Supabase y pueden moderarse.');
    byId('comment-submit').disabled=true;
    try{
      if(!validHttpUrl(PUBLIC_CONFIG.supabaseUrl))throw new Error('URL de Supabase inválida.');
      const module=await import('./services/public-backend.js');backend=await module.createPublicBackend(PUBLIC_CONFIG);
      const saved=await backend.readArticle();if(saved)content=ensureContent(saved);
      byId('comment-submit').disabled=false;
    }catch(error){showFeedback('comment-feedback',`Modo público no disponible: ${error.message}. Revisa config.js y la configuración de Supabase.`,true);byId('refresh-comments').disabled=true;renderArticle();return;}
  }else content=ensureContent(safeLocalRead(LOCAL_CONTENT_KEY,DEFAULT_CONTENT));
  renderArticle();await loadComments();await beginAdmin();
}
init();
