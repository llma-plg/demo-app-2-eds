// Sample data for standalone/preview mode.
const SAMPLE_DATA = {
  name: 'Bigster',
  description: "Dacia's flagship SUV with hybrid and GPL powertrain, 150 CP, 4x4, and automatic transmission.",
  image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/bigster-db3l1-ph1/herozone/dacia-bigster-db3l1-ph1-hero-zone-background-desktop-001.jpg.ximg.large.jpg/7caee35b86.jpg',
  price: 'from 20,490 EUR',
  category: 'SUV'
};

const PALETTE = ['#646b52','#555555','#6699cc','#0000ee'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s=c/255; return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4); };
  const relLum = (r,g,b) => 0.2126*lum(r)+0.7152*lum(g)+0.0722*lum(b);
  if (relLum(r,g,b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo=0, hi=1;
  for (let i=0; i<20; i++) {
    const m=(lo+hi)/2;
    if (relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m)) > 0.12) hi=m; else lo=m;
  }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let modelData;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      modelData = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      modelData = structuredContent || {};
    }
  } else {
    modelData = SAMPLE_DATA;
  }

  block.textContent = '';
  renderModelDetail(block, modelData, bridge);
  
  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}

function renderModelDetail(block, model, bridge) {
  const card = document.createElement('div');
  card.className = 'model-card';

  // Image section (left)
  const imageSection = document.createElement('div');
  imageSection.className = 'model-image';
  
  if (model.image_url) {
    const img = document.createElement('img');
    img.src = model.image_url;
    img.alt = model.name || 'Vehicle model';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    
    // Fallback color if image fails to load
    const fallbackColor = '#378ef0';
    img.onerror = () => {
      const colorDiv = document.createElement('div');
      colorDiv.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      img.parentNode.replaceChild(colorDiv, img);
    };
    
    imageSection.appendChild(img);
  } else {
    // No image URL provided - use color fallback
    const colorDiv = document.createElement('div');
    colorDiv.style.cssText = 'width:100%;height:100%;background-color:#378ef0;';
    imageSection.appendChild(colorDiv);
  }

  // CTA button on image
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'cta-btn';
  ctaBtn.textContent = 'Configure';
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`I want to configure the ${model.name || 'this model'}`);
    });
  }
  imageSection.appendChild(ctaBtn);

  card.appendChild(imageSection);

  // Content section (right)
  const contentSection = document.createElement('div');
  contentSection.className = 'model-content';
  contentSection.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

  if (model.name) {
    const name = document.createElement('h2');
    name.className = 'model-name';
    name.textContent = model.name;
    name.style.color = theme?.fg ?? '#fff';
    contentSection.appendChild(name);
  }

  if (model.category) {
    const category = document.createElement('span');
    category.className = 'model-category';
    category.textContent = model.category;
    contentSection.appendChild(category);
  }

  if (model.description) {
    const description = document.createElement('p');
    description.className = 'model-description';
    description.textContent = model.description;
    description.style.color = theme?.fg ?? '#fff';
    contentSection.appendChild(description);
  }

  if (model.price) {
    const price = document.createElement('div');
    price.className = 'model-price';
    price.textContent = model.price;
    price.style.color = theme?.fg ?? '#fff';
    contentSection.appendChild(price);
  }

  card.appendChild(contentSection);
  block.appendChild(card);
}