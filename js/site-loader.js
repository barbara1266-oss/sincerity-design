// 晨諾創意 官網 · 共用輪播 + 內容讀取程式 v9
// 修正：標題絕不留空白，一開始就先記住所有預設文字

(async function(){
  const base = window.SD_BASE || '';

  // === 第一步：先記住畫面上所有標題/描述的原始預設文字（在任何資料套用之前）===
  const defaultTexts = {};
  document.querySelectorAll('[id^="slot-"]').forEach(el=>{
    defaultTexts[el.id] = el.tagName === 'DIV' && el.classList.contains('sd-caption-title')
      ? el.textContent
      : (el.id.endsWith('-desc') ? el.innerHTML : el.textContent);
  });

  try{
    const res = await fetch(base + 'content/site-data.json', {cache:'no-store'});
    if(!res.ok) return;
    const data = await res.json();

    Object.keys(data).forEach(key=>{
      const d = data[key];
      const slot = document.getElementById('slot-' + key);

      const tagEl = document.getElementById('slot-' + key + '-tag');
      if(tagEl && d.tag) tagEl.textContent = d.tag;

      let items = d.items;
      if(!items && d.images){
        items = d.images.filter(Boolean).map((img,i)=>({
          image: img,
          title: i===0 ? (d.title||'') : '',
          desc: i===0 ? (d.desc||'') : ''
        }));
      }
      items = (items || []).filter(it => it && it.image);

      if(!slot) return;
      if(items.length === 0) return;

      buildCarousel(slot, items, base, defaultTexts);
    });

    applyLogo(data, base);
  }catch(e){ /* 沒有資料時，網站維持原本內建內容 */ }
})();

function buildCarousel(slot, items, base, defaultTexts){
  slot.style.position = 'relative';
  slot.style.overflow = 'hidden';

  slot.querySelectorAll('svg').forEach(svg => { svg.style.display = 'none'; });
  slot.querySelectorAll('.dot').forEach(dot => { dot.style.display = 'none'; });

  const caption = slot.querySelector('.sd-photo-caption');
  if(caption){ caption.style.zIndex = '5'; }
  slot.querySelectorAll('.extend-inner').forEach(el=>{ el.style.position='relative'; el.style.zIndex='4'; });

  const imgLayer = document.createElement('div');
  imgLayer.className = 'sd-carousel-imgs';
  imgLayer.style.cssText = 'position:absolute;inset:0;z-index:0;';

  items.forEach((item, i)=>{
    const img = document.createElement('img');
    img.style.cssText = `position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .6s ease;background:transparent;`;
    img.dataset.idx = i;
    img.onerror = function(){ this.style.display = 'none'; this.dataset.broken = '1'; };
    img.onload = function(){
      if(this.dataset.idx == '0' && !this.dataset.broken){ this.style.opacity = 1; }
    };
    img.src = base + item.image;
    imgLayer.appendChild(img);
  });
  slot.insertBefore(imgLayer, slot.firstChild);

  // 標題/描述套用：一律有值才換，沒值就用一開始記住的預設文字，絕不留空白
  function applyItemText(i){
    const item = items[i];
    if(!item) return;
    const titleId = slot.id + '-title';
    const descId = slot.id + '-desc';
    const tEl = document.getElementById(titleId);
    const dEl = document.getElementById(descId);
    const fallbackTitle = defaultTexts[titleId] || '';
    const fallbackDesc = defaultTexts[descId] || '';
    if(tEl) tEl.textContent = (item.title && item.title.trim().length > 0) ? item.title : fallbackTitle;
    if(dEl) dEl.innerHTML = (item.desc && item.desc.trim().length > 0) ? item.desc : fallbackDesc;
  }
  applyItemText(0);

  if(items.length > 1){
    const dots = document.createElement('div');
    dots.className = 'sd-carousel-dots';
    dots.style.cssText = 'position:absolute;bottom:14px;left:14px;display:flex;gap:6px;z-index:6;';
    items.forEach((_, i)=>{
      const dot = document.createElement('span');
      dot.style.cssText = `width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,${i===0?'0.95':'0.4'});cursor:pointer;transition:background .3s;`;
      dot.onclick = ()=> goTo(i);
      dots.appendChild(dot);
    });
    slot.appendChild(dots);

    const mkArrow = (dir, symbol)=>{
      const a = document.createElement('button');
      a.textContent = symbol;
      a.style.cssText = `position:absolute;top:50%;${dir}:10px;transform:translateY(-50%);z-index:6;background:rgba(0,0,0,0.35);color:#fff;border:none;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px;line-height:1;`;
      return a;
    };
    const prevBtn = mkArrow('left', '‹');
    const nextBtn = mkArrow('right', '›');
    slot.appendChild(prevBtn);
    slot.appendChild(nextBtn);

    let current = 0;
    const imgs = imgLayer.querySelectorAll('img');
    const dotEls = dots.querySelectorAll('span');

    function goTo(i){
      if(imgs[current]) imgs[current].style.opacity = 0;
      if(dotEls[current]) dotEls[current].style.background = 'rgba(255,255,255,0.4)';
      current = (i + items.length) % items.length;
      if(imgs[current] && imgs[current].dataset.broken !== '1') imgs[current].style.opacity = 1;
      if(dotEls[current]) dotEls[current].style.background = 'rgba(255,255,255,0.95)';
      applyItemText(current);
    }

    prevBtn.onclick = ()=> { goTo(current - 1); resetTimer(); };
    nextBtn.onclick = ()=> { goTo(current + 1); resetTimer(); };

    let timer = setInterval(()=> goTo(current + 1), 4000);
    function resetTimer(){ clearInterval(timer); timer = setInterval(()=> goTo(current + 1), 4000); }
  }
}

function applyLogo(data, base){
  const logoSlot = document.querySelector('.logo');
  if(!logoSlot) return;

  const getFirstImage = (key)=>{
    const d = data[key];
    if(!d) return null;
    if(d.items && d.items[0] && d.items[0].image) return d.items[0].image;
    if(d.images && d.images[0]) return d.images[0];
    return null;
  };

  const horizPath = getFirstImage('logo_horizontal');
  const roundPath = getFirstImage('logo_round');
  if(!horizPath && !roundPath) return;

  logoSlot.innerHTML = '';
  logoSlot.style.display = 'flex';
  logoSlot.style.alignItems = 'center';

  if(horizPath){
    const imgH = document.createElement('img');
    imgH.src = base + horizPath;
    imgH.className = 'sd-logo-horizontal';
    imgH.style.cssText = 'height:36px;width:auto;display:block;';
    logoSlot.appendChild(imgH);
  }
  if(roundPath){
    const imgR = document.createElement('img');
    imgR.src = base + roundPath;
    imgR.className = 'sd-logo-round';
    imgR.style.cssText = 'height:36px;width:36px;border-radius:50%;object-fit:cover;display:none;';
    logoSlot.appendChild(imgR);
  }

  if(horizPath && roundPath){
    const style = document.createElement('style');
    style.textContent = `
      @media(max-width:768px){
        .sd-logo-horizontal{display:none!important;}
        .sd-logo-round{display:block!important;}
      }
    `;
    document.head.appendChild(style);
  }
}
