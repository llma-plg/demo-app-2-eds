// Sample data for standalone/preview mode
const SAMPLE_DATA = [
  {
    name: "Beautyrest",
    description: "Premium mattresses featuring advanced pocketed coil technology for exceptional support and motion isolation.",
    category: "Consumer",
    website_url: "https://www.beautyrest.com"
  },
  {
    name: "Serta",
    description: "America's #1 mattress brand offering comfort and support for every sleep preference.",
    category: "Consumer",
    website_url: "https://www.serta.com"
  },
  {
    name: "Simmons",
    description: "Innovative sleep solutions combining comfort and durability for over 150 years.",
    category: "Hospitality",
    website_url: "https://www.simmons.com"
  }
];

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

export default async function decorate(block, bridge) {
  let brands;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      brands = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.brands — bare array outputSchema; key derived from actionName "browse_brands"
      brands = structuredContent?.brands || [];
    }
  } else {
    brands = SAMPLE_DATA;
  }

  block.textContent = '';
  renderBrands(block, brands, bridge);
  
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

function renderBrands(block, brands, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'brands-wrapper';

  const carousel = document.createElement('div');
  carousel.className = 'brands-carousel';

  brands.forEach((brand, i) => {
    const card = document.createElement('div');
    card.className = 'brand-card';
    card.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const content = document.createElement('div');
    content.className = 'brand-content';

    const name = document.createElement('h3');
    name.className = 'brand-name';
    name.textContent = brand.name || '';
    content.appendChild(name);

    const description = document.createElement('p');
    description.className = 'brand-description';
    description.textContent = brand.description || '';
    content.appendChild(description);

    if (brand.category) {
      const badge = document.createElement('span');
      badge.className = 'brand-category';
      badge.textContent = brand.category;
      content.appendChild(badge);
    }

    card.appendChild(content);

    if (brand.website_url) {
      const btn = document.createElement('button');
      btn.className = 'brand-cta';
      btn.textContent = 'Visit Site';
      btn.setAttribute('aria-label', `Visit ${brand.name} website`);
      if (bridge) {
        btn.addEventListener('click', () => {
          bridge.openLink(brand.website_url);
        });
      } else {
        btn.addEventListener('click', () => {
          window.open(brand.website_url, '_blank', 'noopener,noreferrer');
        });
      }
      card.appendChild(btn);
    }

    carousel.appendChild(card);
  });

  wrapper.appendChild(carousel);

  // Navigation arrows
  const leftArrow = document.createElement('button');
  leftArrow.className = 'carousel-arrow carousel-arrow-left';
  leftArrow.setAttribute('aria-label', 'Scroll left');
  leftArrow.textContent = '◀';
  leftArrow.style.display = 'none';

  const rightArrow = document.createElement('button');
  rightArrow.className = 'carousel-arrow carousel-arrow-right';
  rightArrow.setAttribute('aria-label', 'Scroll right');
  rightArrow.textContent = '▶';

  const updateArrows = () => {
    const { scrollLeft, scrollWidth, clientWidth } = carousel;
    leftArrow.style.display = scrollLeft > 0 ? 'flex' : 'none';
    rightArrow.style.display = scrollLeft < scrollWidth - clientWidth - 1 ? 'flex' : 'none';
  };

  const scrollByCard = (direction) => {
    const cardWidth = 220 + 16; // card width + gap
    carousel.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  };

  leftArrow.addEventListener('click', () => scrollByCard(-1));
  rightArrow.addEventListener('click', () => scrollByCard(1));
  leftArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollByCard(-1);
    }
  });
  rightArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollByCard(1);
    }
  });

  carousel.addEventListener('scroll', updateArrows);
  setTimeout(updateArrows, 100);

  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  // Right fade gradient
  if (brands.length > 1) {
    const fade = document.createElement('div');
    fade.className = 'carousel-fade';
    fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
    wrapper.appendChild(fade);
  }

  block.appendChild(wrapper);
}