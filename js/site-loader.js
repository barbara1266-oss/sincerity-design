// 晨諾創意 官網 · 共用輪播 + 內容讀取程式 v6
// 統一元件版：所有圖片文字都用 .sd-photo-caption 容器，固定右下角
// 每個頁面在 <script> 裡先設定 window.SD_BASE（相對路徑前綴），再引入這支檔案

(async function(){
  const base = window.SD_BASE || '';
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

      buildCarousel(slot, items, base);
    });

    applyLogo(data, base);
  }catch(e){ /* 沒有資料時，網站維持原本內建內容 */ }
})();

function buildCarousel(slot, items, base){
  slot.style.position = 'relative';
  slot.style.overflow = 'hidden';

  // 統一規則：隱藏所有裝飾用SVG線框與圓點，只保留 .sd-photo-caption 文字元件
  slot.querySelectorAll('svg').forEach(svg => { svg.style.display = 'none'; });
  slot.querySelectorAll('.dot').forEach(dot => { dot.style.display = 'none'; });

  // .sd-photo-caption 是唯一保留在照片上層的文字容器
  const caption = slot.querySelector('.sd-photo-caption');
  if(caption){ caption.style.zIndex = '5'; }
  // extend-inner 這種外層包裝，如果裡面只剩caption，也要保留顯示
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

  function applyItemText(i){
    const item = items[i];
    if(!item) return;
    const tEl = document.getElementById(slot.id + '-title');
    const dEl = document.getElementById(slot.id + '-desc');
    if(tEl && item.title) tEl.textContent = item.title;
    if(dEl && item.desc) dEl.innerHTML = item.desc;
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
