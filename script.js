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
    const response = await fetch('./precos.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const formatPrice = (value) => {
      const amount = Number(value);
      if (!Number.isFinite(amount) || amount < 0) throw new Error('Valor inválido em precos.json');
      return `R$ ${amount.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
    };
    const setLines = (selector, lines) => {
      const element = document.querySelector(selector);
      if (!element) return;
      const nodes = lines.flatMap((line, index) => index
        ? [document.createElement('br'), document.createTextNode(line)]
        : [document.createTextNode(line)]);
      element.replaceChildren(...nodes);
    };

    setLines('[data-price-id="nails"]', [
      `Mão ${formatPrice(data.services.nails.hand)}`,
      `Pé ${formatPrice(data.services.nails.foot)}`,
      `Mão + pé ${formatPrice(data.services.nails.handsAndFeet)}`
    ]);
    setLines('[data-price-id="eyebrows"]', [
      `Com henna ou tinta: ${formatPrice(data.services.eyebrows.withHenna)}`,
      `Sem henna: ${formatPrice(data.services.eyebrows.withoutHenna)}`
    ]);
    setLines('[data-price-id="hair"]', [
      `Corte masculino: ${formatPrice(data.services.hair.maleCut)}`,
      `Corte feminino: ${formatPrice(data.services.hair.femaleCut)}`,
      `Progressiva: a partir de ${formatPrice(data.services.hair.progressiveFrom)}`,
      `Escova de grávida: a partir de ${formatPrice(data.services.hair.pregnancyBrushFrom)}`,
      'Progressiva e escova: valor varia conforme o tamanho e a quantidade de cabelo.'
    ]);
    setLines('[data-price-id="makeup"]', [`a partir de ${formatPrice(data.services.makeup.from)}`]);
    setLines('[data-price-id="depilation"]', [
      `Virilha: ${formatPrice(data.services.depilation.groin)}`,
      `Perna inteira: ${formatPrice(data.services.depilation.fullLeg)}`,
      `Meia perna: ${formatPrice(data.services.depilation.halfLeg)}`,
      `Axilas: ${formatPrice(data.services.depilation.underarms)}`
    ]);

    for (const [id, combo] of Object.entries(data.combos)) {
      const element = document.querySelector(`[data-combo-price-id="${id}"]`);
      if (element) element.textContent = `${formatPrice(combo.price)} · economize ${formatPrice(combo.savings)}`;
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
