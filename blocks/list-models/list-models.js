const SAMPLE_DATA = [
  {
    name: 'Bigster',
    description: "Dacia's flagship SUV with hybrid and GPL powertrain, 150 CP, 4x4, and automatic transmission.",
    image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/bigster-db3l1-ph1/herozone/dacia-bigster-db3l1-ph1-hero-zone-background-desktop-001.jpg.ximg.large.jpg/7caee35b86.jpg',
    price: 'from 20,490 EUR',
    category: 'SUV'
  },
  {
    name: 'Duster',
    description: 'Versatile SUV with hybrid and GPL engine, 150 CP, available in 4x4 with automatic gearbox.',
    image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/duster-p1310/hero-zone/dacia-duster-p1310-hero-zone-background-desktop-003.jpg.ximg.large.jpg/310f84027e.jpg',
    price: 'from 17,100 EUR',
    category: 'SUV'
  },
  {
    name: 'Logan',
    description: 'Practical sedan with 120 CP GPL engine and automatic transmission for everyday commuting.',
    image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/logan/logan-li1-ph2/herozone-banners/dacia-logan-li1-ph2-herozone-background-001-desktop.jpg.ximg.large.jpg/f7b183dd4d.jpg',
    price: 'from 12,741 EUR',
    category: 'Sedan'
  },
  {
    name: 'Jogger',
    description: 'Family-oriented vehicle with 5 or 7 seats, hybrid 155 powertrain for versatile use.',
    image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/rji/jogger-ri1-ph2/herozone-banners/jogger-ri1-ph2-herozone-background-001-desktop.jpg.ximg.large.jpg/5224fc9270.jpg',
    price: 'from 16,741 EUR',
    category: 'Family'
  },
  {
    name: 'Sandero Stepway',
    description: 'Compact crossover with raised ground clearance, 120 CP GPL engine, and automatic transmission.',
    image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/sandero-stepway/sandero-stepway-bi1-ph2/herozone-banners/sandero-stepway-bi1-ph2-herozone-background-desktop-001.jpg.ximg.large.jpg/48eb89e802.jpg',
    price: 'from 13,650 EUR',
    category: 'Crossover'
  },
  {
    name: 'Spring',
    description: 'Fully electric city car with 100 CP motor and 225 km range for urban mobility.',
    image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/dacia-bbg/spring-s2e-ph2-my26/overview/editorial/dacia-spring-s2e-ph2-hero-zone-background-desktop-001.jpg.ximg.large.jpg/1f111e4936.jpg',
    price: '',
    category: 'Electric'
  }
];

const PALETTE = ['#646b52','#555555','#6699cc','#0000ee'];

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

const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

export default async function decorate(block, bridge) {
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.models — bare array outputSchema; key derived from actionName "list_models"
      items = structuredContent?.models || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  const theme = getThemedCardBg(PALETTE);
  renderCarousel(block, items, bridge, theme);

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

function renderCarousel(block, items, bridge, theme) {
  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-wrapper';

  const container = document.createElement('div');
  container.className = 'carousel-container';

  items.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'model-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'card-image';

    const fallbackColor = CARD_COLORS[idx % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };

    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.loading = 'lazy';
      img.onerror = () => {
        if (img.parentNode) {
          img.parentNode.replaceChild(colorDiv(), img);
        }
      };
      imageContainer.appendChild(img);
    } else {
      imageContainer.appendChild(colorDiv());
    }

    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'cta-btn';
    ctaBtn.textContent = 'View Details';
    ctaBtn.setAttribute('aria-label', `View details for ${item.name || 'model'}`);
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${item.name}`);
      });
    }
    imageContainer.appendChild(ctaBtn);

    card.appendChild(imageContainer);

    const content = document.createElement('div');
    content.className = 'card-content';
    content.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const name = document.createElement('h3');
    name.className = 'model-name';
    name.textContent = item.name || '';
    content.appendChild(name);

    if (item.description) {
      const desc = document.createElement('p');
      desc.className = 'model-description';
      desc.textContent = item.description;
      content.appendChild(desc);
    }

    const footer = document.createElement('div');
    footer.className = 'card-footer';

    if (item.price) {
      const price = document.createElement('p');
      price.className = 'model-price';
      price.textContent = item.price;
      footer.appendChild(price);
    }

    if (item.category) {
      const category = document.createElement('span');
      category.className = 'model-category';
      category.textContent = item.category;
      footer.appendChild(category);
    }

    content.appendChild(footer);
    card.appendChild(content);
    container.appendChild(card);
  });

  wrapper.appendChild(container);

  const leftBtn = document.createElement('button');
  leftBtn.className = 'nav-btn nav-btn-left hidden';
  leftBtn.innerHTML = '◀';
  leftBtn.setAttribute('aria-label', 'Scroll left');
  wrapper.appendChild(leftBtn);

  const rightBtn = document.createElement('button');
  rightBtn.className = 'nav-btn nav-btn-right';
  rightBtn.innerHTML = '▶';
  rightBtn.setAttribute('aria-label', 'Scroll right');
  wrapper.appendChild(rightBtn);

  const fade = document.createElement('div');
  fade.className = 'fade-right';
  fade.style.cssText = `background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);`;
  wrapper.appendChild(fade);

  const updateNav = () => {
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    leftBtn.classList.toggle('hidden', scrollLeft <= 1);
    rightBtn.classList.toggle('hidden', scrollLeft >= maxScroll - 1);
    fade.style.opacity = scrollLeft >= maxScroll - 1 ? '0' : '1';
  };

  const scroll = (direction) => {
    const cardWidth = 220 + 16;
    container.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  };

  leftBtn.addEventListener('click', () => scroll(-1));
  rightBtn.addEventListener('click', () => scroll(1));
  leftBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scroll(-1);
    }
  });
  rightBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scroll(1);
    }
  });

  container.addEventListener('scroll', updateNav);
  updateNav();

  block.appendChild(wrapper);
}