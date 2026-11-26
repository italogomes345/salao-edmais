// Configuração de contato
const WHATSAPP_NUMBER = '5531982954114';
const DEFAULT_WHATSAPP_MESSAGE = 'Olá! Gostaria de saber mais sobre os serviços do SalãoEdmais e agendar um horário.';

function whatsappUrl(message = DEFAULT_WHATSAPP_MESSAGE) {
  const encoded = encodeURIComponent(message);
  return WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}` : '#contato';
}

document.querySelectorAll('[data-whatsapp-link]').forEach((link) => {
  link.href = whatsappUrl(link.dataset.whatsappMessage || DEFAULT_WHATSAPP_MESSAGE);
});

// Menu responsivo
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
function closeMenu() {
  nav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}

menuToggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

// Os preços públicos são lidos do arquivo editável pelo painel administrativo.
async function updateSitePrices() {
  try {
    const locallySavedPrices = localStorage.getItem('salaoedmais-precos');
    let data = locallySavedPrices ? JSON.parse(locallySavedPrices) : null;
    if (!data) {
      const response = await fetch('./precos.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
    }
    const formatPrice = (value) => {
      const amount = Number(value);
      if (!Number.isFinite(amount) || amount < 0) throw new Error('Valor inválido em precos.json');
      return `R$ ${amount.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
    };
    const setItems = (selector, items) => {
      const list = document.querySelector(selector);
      if (!list) return;
      list.replaceChildren(...items.map(({ service, value, from = false }) => {
        const item = document.createElement('li');
        const serviceLabel = document.createElement('span');
        serviceLabel.className = 'servico';
        serviceLabel.textContent = service;
        const price = document.createElement('span');
        price.className = 'preco';
        if (from) {
          const note = document.createElement('small');
          note.textContent = 'a partir de';
          price.append(note, document.createTextNode(` ${formatPrice(value)}`));
        } else {
          price.textContent = typeof value === 'number' ? formatPrice(value) : value;
        }
        item.append(serviceLabel, price);
        return item;
      }));
    };

    setItems('[data-price-id="nails"]', [
      { service: 'Mão', value: data.services.nails.hand },
      { service: 'Pé', value: data.services.nails.foot },
      { service: 'Mão + pé', value: data.services.nails.handsAndFeet }
    ]);
    setItems('[data-price-id="eyebrows"]', [
      { service: 'Com henna ou tinta:', value: data.services.eyebrows.withHenna },
      { service: 'Sem henna:', value: data.services.eyebrows.withoutHenna }
    ]);
    setItems('[data-price-id="hair"]', [
      { service: 'Corte masculino:', value: data.services.hair.maleCut },
      { service: 'Corte feminino:', value: data.services.hair.femaleCut },
      { service: 'Progressiva:', value: data.services.hair.progressiveFrom, from: true },
      { service: 'Escova de grávida:', value: data.services.hair.pregnancyBrushFrom, from: true },
      { service: 'Progressiva e escova:', value: 'valor varia conforme o tamanho e a quantidade de cabelo.' }
    ]);
    setItems('[data-price-id="makeup"]', [
      { service: '', value: data.services.makeup.from, from: true }
    ]);
    setItems('[data-price-id="depilation"]', [
      { service: 'Virilha:', value: data.services.depilation.groin },
      { service: 'Perna inteira:', value: data.services.depilation.fullLeg },
      { service: 'Meia perna:', value: data.services.depilation.halfLeg },
      { service: 'Axilas:', value: data.services.depilation.underarms }
    ]);

    for (const [id, combo] of Object.entries(data.combos)) {
      const element = document.querySelector(`[data-combo-price-id="${id}"]`);
      if (!element) continue;
      const price = element.querySelector('.preco-atual');
      const savings = element.querySelector('.economia');
      if (price) price.textContent = formatPrice(combo.price);
      if (savings) savings.textContent = `economize ${formatPrice(combo.savings)}`;
    }
    const paymentMethods = document.querySelector('[data-payment-methods]');
    if (paymentMethods && Array.isArray(data.paymentMethods)) {
      paymentMethods.textContent = `Pagamento: ${data.paymentMethods.join(', ')}. Valores sujeitos a alteração.`;
    }
  } catch (error) {
    console.error('Não foi possível carregar os preços do SalãoEdmais.', error);
  }
}

updateSitePrices();

// Formulário de agendamento
const bookingForm = document.querySelector('#booking-form');
bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(bookingForm);
  const message = [
    'Olá! Gostaria de solicitar um agendamento no SalãoEdmais.',
    `Nome: ${formData.get('name')}`,
    `Serviço: ${formData.get('service')}`,
    `Data: ${formData.get('date')}`,
    `Horário: ${formData.get('time')}`
  ].join('\n');
  window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer');
});

const lightbox = document.querySelector('#gallery-lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');
const lightboxOriginal = document.querySelector('#lightbox-original');

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxImage.src = '';
}

document.querySelectorAll('.gallery-grid a').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const image = link.querySelector('img');
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    lightboxCaption.textContent = image.alt;
    lightboxOriginal.href = link.href;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
  });
});

lightbox.querySelectorAll('[data-lightbox-close]').forEach((element) => {
  element.addEventListener('click', closeLightbox);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
});

const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.main-nav a:not(.nav-cta)');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    }
  });
}, { rootMargin: '-35% 0px -55% 0px' });
sections.forEach((section) => observer.observe(section));

let toastTimer;
function showToast(message) {
  const toast = document.querySelector('.toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4500);
}
