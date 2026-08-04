// 晨諾創意 官網 · 共用輪播 + 內容讀取程式
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

      // 文字欄位（標籤／標題／描述）維持原本方式
      const tagEl = document.getElementById('slot-' + key + '-tag');
      if(tagEl && d.tag) tagEl.textContent = d.tag;
      const titleEl = document.getElementById('slot-' + key + '-title');
      if(titleEl && d.title) titleEl.textContent = d.title;
      const descEl = document.getElementById('slot-' + key + '-desc');
      if(descEl && d.desc) descEl.innerHTML = d.desc;

      if(!slot) return;
      const images = (d.images || []).filter(Boolean).map(p => base + p);
      if(images.length === 0) return; // 沒有上傳過圖片，維持原本內建畫面

      buildCarousel(slot, images);
    });
  }catch(e){ /* 沒有資料時，網站維持原本內建內容 */ }
})();

function buildCarousel(slot, images){
  slot.style.position = 'relative';
  slot.style.overflow = 'hidden';

  // 清掉原本示意用的裝飾內容（保留文字圖層，例如 card-shine-content）
  const keepChildren = Array.from(slot.children).filter(c =>
    c.classList.contains('card-shine-content') ||
    c.classList.contains('card-particle-content') ||
    c.classList.contains('card-shine-corner') ||
    c.classList.contains('extend-inner') ||
    c.classList.contains('extend-desc-white') ||
    c.classList.contains('extend-desc-dark')
  );

  const imgLayer = document.createElement('div');
  imgLayer.className = 'sd-carousel-imgs';
  imgLayer.style.cssText = 'position:absolute;inset:0;z-index:0;';
  images.forEach((src, i)=>{
    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = `position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:${i===0?1:0};transition:opacity .6s ease;`;
    img.dataset.idx = i;
    imgLayer.appendChild(img);
  });
  slot.insertBefore(imgLayer, slot.firstChild);

  // 保留原本文字圖層在最上層
  keepChildren.forEach(c => { c.style.position='relative'; c.style.zIndex='2'; });

  if(images.length > 1){
    const dots = document.createElement('div');
    dots.className = 'sd-carousel-dots';
    dots.style.cssText = 'position:absolute;bottom:14px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:3;';
    images.forEach((_, i)=>{
      const dot = document.createElement('span');
      dot.style.cssText = `width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,${i===0?'0.95':'0.4'});cursor:pointer;transition:background .3s;`;
      dot.onclick = ()=> goTo(i);
      dots.appendChild(dot);
    });
    slot.appendChild(dots);

    const mkArrow = (dir, symbol)=>{
      const a = document.createElement('button');
      a.textContent = symbol;
      a.style.cssText = `position:absolute;top:50%;${dir}:10px;transform:translateY(-50%);z-index:3;background:rgba(0,0,0,0.35);color:#fff;border:none;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px;line-height:1;`;
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
      imgs[current].style.opacity = 0;
      dotEls[current].style.background = 'rgba(255,255,255,0.4)';
      current = (i + images.length) % images.length;
      imgs[current].style.opacity = 1;
      dotEls[current].style.background = 'rgba(255,255,255,0.95)';
    }

    prevBtn.onclick = ()=> { goTo(current - 1); resetTimer(); };
    nextBtn.onclick = ()=> { goTo(current + 1); resetTimer(); };

    let timer = setInterval(()=> goTo(current + 1), 4000);
    function resetTimer(){ clearInterval(timer); timer = setInterval(()=> goTo(current + 1), 4000); }
  }
}
