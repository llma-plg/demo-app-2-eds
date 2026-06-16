// Sample data for standalone/preview mode - matches outputSchema structure
const SAMPLE_DATA = {
  name: 'Beautyrest',
  description: 'Beautyrest has been a leader in luxury sleep for over 150 years, combining innovative technology with premium materials. Known for pioneering the first pocketed coil mattress, Beautyrest continues to deliver exceptional comfort and support for discerning sleepers worldwide.',
  category: 'Premium Mattress Brand',
  website_url: 'https://www.beautyrest.com',
  international_presence: true
};

// Brand palette from BuildWidgetRequest
const PALETTE = ['#ffd400','#3860be','#555555','#346e4a','#696969'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#','');
  if(hex.length===3)hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if(hex.length!==6)return null;
  let [r,g,b]=[parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)];
  if(isNaN(r)||isNaN(g)||isNaN(b))return null;
  const lum=(c)=>{const s=c/255;return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4);};
  const relLum=(r,g,b)=>0.2126*lum(r)+0.7152*lum(g)+0.0722*lum(b);
  if(relLum(r,g,b)<=0.12)return{bg:`#${hex}`,fg:'#ffffff'};
  let lo=0,hi=1;
  for(let i=0;i<20;i++){const m=(lo+hi)/2;if(relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m))>0.12)hi=m;else lo=m;}
  const dr=Math.round(r*lo),dg=Math.round(g*lo),db=Math.round(b*lo);
  return{bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`,fg:'#ffffff'};
}

const theme = getThemedCardBg(PALETTE);
const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

export default async function decorate(block, bridge) {
  let brand;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      brand = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      brand = structuredContent || {};
    }
  } else {
    brand = SAMPLE_DATA;
  }

  block.textContent = '';
  renderBrand(block, brand, bridge);

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

function renderBrand(block, brand, bridge) {
  const card = document.createElement('div');
  card.className = 'brand-card';

  // Hero image section
  const imageSection = document.createElement('div');
  imageSection.className = 'brand-hero';

  // Use colored fallback since no image_url in schema
  const colorDiv = document.createElement('div');
  colorDiv.className = 'brand-hero-fallback';
  colorDiv.style.cssText = `width:100%;height:100%;background-color:${CARD_COLORS[0]};position:relative;`;

  // CTA button on image
  const ctaOnImage = document.createElement('button');
  ctaOnImage.className = 'cta-on-image';
  ctaOnImage.textContent = 'Visit Brand Site';
  ctaOnImage.setAttribute('aria-label', `Visit ${brand.name || 'brand'} website`);
  if (bridge && brand.website_url) {
    ctaOnImage.addEventListener('click', () => {
      bridge.sendMessage(`Take me to ${brand.name || 'the brand'} website: ${brand.website_url}`);
    });
  }
  colorDiv.appendChild(ctaOnImage);

  imageSection.appendChild(colorDiv);
  card.appendChild(imageSection);

  // Content section with darkened palette bg
  const content = document.createElement('div');
  content.className = 'brand-content';
  content.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  // Brand name
  if (brand.name) {
    const nameEl = document.createElement('h2');
    nameEl.className = 'brand-name';
    nameEl.textContent = brand.name;
    content.appendChild(nameEl);
  }

  // Category badge
  if (brand.category) {
    const badgeEl = document.createElement('span');
    badgeEl.className = 'brand-badge';
    badgeEl.textContent = brand.category;
    content.appendChild(badgeEl);
  }

  // Description
  if (brand.description) {
    const descEl = document.createElement('p');
    descEl.className = 'brand-description';
    descEl.textContent = brand.description;
    content.appendChild(descEl);
  }

  // International presence indicator
  if (brand.international_presence) {
    const intlEl = document.createElement('div');
    intlEl.className = 'brand-intl';
    intlEl.innerHTML = '<span class="intl-icon">🌍</span> Available Internationally';
    content.appendChild(intlEl);
  }

  card.appendChild(content);
  block.appendChild(card);
}
