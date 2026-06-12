// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'Bigster', description: "Dacia's flagship SUV with hybrid and GPL powertrain, 150 CP, 4x4, and automatic transmission.", image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/bigster-db3l1-ph1/herozone/dacia-bigster-db3l1-ph1-hero-zone-background-desktop-001.jpg.ximg.large.jpg/7caee35b86.jpg', price: 'from 20,490 EUR', category: 'SUV' },
  { name: 'Duster', description: 'Versatile SUV with hybrid and GPL engine, 150 CP, available in 4x4 with automatic gearbox.', image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/duster-p1310/hero-zone/dacia-duster-p1310-hero-zone-background-desktop-003.jpg.ximg.large.jpg/310f84027e.jpg', price: 'from 17,100 EUR', category: 'SUV' },
  { name: 'Logan', description: 'Practical sedan with 120 CP GPL engine and automatic transmission for everyday commuting.', image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/logan/logan-li1-ph2/herozone-banners/dacia-logan-li1-ph2-herozone-background-001-desktop.jpg.ximg.large.jpg/f7b183dd4d.jpg', price: 'from 12,741 EUR', category: 'Sedan' },
  { name: 'Jogger', description: 'Family-oriented vehicle with 5 or 7 seats, hybrid 155 powertrain for versatile use.', image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/rji/jogger-ri1-ph2/herozone-banners/jogger-ri1-ph2-herozone-background-001-desktop.jpg.ximg.large.jpg/5224fc9270.jpg', price: 'from 16,741 EUR', category: 'Family' },
  { name: 'Sandero Stepway', description: 'Compact crossover with raised ground clearance, 120 CP GPL engine, and automatic transmission.', image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/sandero-stepway/sandero-stepway-bi1-ph2/herozone-banners/sandero-stepway-bi1-ph2-herozone-background-desktop-001.jpg.ximg.large.jpg/48eb89e802.jpg', price: 'from 13,650 EUR', category: 'Crossover' },
  { name: 'Spring', description: 'Fully electric city car with 100 CP motor and 225 km range for urban mobility.', image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/dacia-bbg/spring-s2e-ph2-my26/overview/editorial/dacia-spring-s2e-ph2-hero-zone-background-desktop-001.jpg.ximg.large.jpg/1f111e4936.jpg', price: '', category: 'Electric' }
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

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let dealers;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      dealers = [];
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.dealers — bare array outputSchema; key derived from actionName "find_dealer"
      dealers = structuredContent?.dealers || [];
    }
  } else {
    dealers = [];
  }

  block.textContent = '';
  renderWidget(block, dealers, bridge);

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

function renderWidget(block, dealers, bridge) {
  const container = document.createElement('div');
  container.className = 'find-dealer-container';

  if (dealers.length === 0) {
    // Empty state: search card
    const searchCard = document.createElement('div');
    searchCard.className = 'search-card';
    searchCard.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    const pinIcon = document.createElement('div');
    pinIcon.className = 'pin-icon';
    pinIcon.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    searchCard.appendChild(pinIcon);

    const heading = document.createElement('h2');
    heading.textContent = 'Find a Dacia dealer near you';
    searchCard.appendChild(heading);

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter city or region...';
    input.className = 'search-input';
    searchCard.appendChild(input);

    const button = document.createElement('button');
    button.className = 'search-button';
    button.textContent = 'Find Dealer';
    button.style.cssText = `background:#646b52;color:#fff`;
    if (bridge) {
      button.addEventListener('click', () => {
        const city = input.value.trim();
        if (city) {
          bridge.sendMessage(`Find dealers in ${city}`);
        }
      });
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const city = input.value.trim();
          if (city) {
            bridge.sendMessage(`Find dealers in ${city}`);
          }
        }
      });
    }
    searchCard.appendChild(button);

    container.appendChild(searchCard);
  } else {
    // Results state: dealer cards
    const resultsRow = document.createElement('div');
    resultsRow.className = 'dealers-row';

    dealers.slice(0, 2).forEach(dealer => {
      const card = document.createElement('div');
      card.className = 'dealer-card';
      card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

      const pinCircle = document.createElement('div');
      pinCircle.className = 'pin-circle';
      pinCircle.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
      card.appendChild(pinCircle);

      const name = document.createElement('div');
      name.className = 'dealer-name';
      name.textContent = dealer.name || '';
      card.appendChild(name);

      const address = document.createElement('div');
      address.className = 'dealer-address';
      address.textContent = dealer.address || '';
      card.appendChild(address);

      if (dealer.phone) {
        const phone = document.createElement('div');
        phone.className = 'dealer-phone';
        phone.textContent = dealer.phone;
        card.appendChild(phone);
      }

      if (dealer.services) {
        const services = document.createElement('div');
        services.className = 'dealer-services';
        services.textContent = dealer.services;
        card.appendChild(services);
      }

      resultsRow.appendChild(card);
    });

    container.appendChild(resultsRow);
  }

  block.appendChild(container);
}
