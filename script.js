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

    const hiddenServices = new Set(data.hiddenServices || []);
    const serviceOptions = {
      nails: 'Manicure e Pedicure',
      eyebrows: 'Design de Sobrancelhas',
      hair: 'Cortes e Progressivas',
      makeup: 'Maquiagem',
      depilation: 'Depilação',
      products: 'Produtos Natura e Avon'
    };
    for (const [id, optionLabel] of Object.entries(serviceOptions)) {
      if (!hiddenServices.has(id)) continue;
      const priceList = document.querySelector(`[data-price-id="${id}"]`);
      const serviceCard = priceList?.closest('.service-card')
        || document.querySelector(`[data-service-id="${id}"]`);
      if (serviceCard) serviceCard.hidden = true;
      const option = [...document.querySelectorAll('#booking-service option')]
        .find((entry) => entry.textContent === optionLabel);
      option?.remove();
    }

    const hiddenCombos = new Set(data.hiddenCombos || []);
    for (const id of hiddenCombos) {
      const comboPrice = document.querySelector(`[data-combo-price-id="${id}"]`);
      const comboCard = comboPrice?.closest('.combo-card');
      if (comboCard) comboCard.hidden = true;
    }

    const servicesGrid = document.querySelector('.services-grid');
    [...servicesGrid.children].filter((card) => !card.hidden).forEach((card, index) => {
      const number = card.querySelector('.service-number');
      if (number) number.textContent = String(index + 1).padStart(2, '0');
    });
    const bookingServiceSelect = document.querySelector('#booking-service');
    (data.customServices || []).forEach((service) => {
      if (bookingServiceSelect) {
        const option = document.createElement('option');
        option.textContent = service.name;
        bookingServiceSelect.append(option);
      }
      const card = document.createElement('article');
      card.className = 'service-card';
      const number = document.createElement('div');
      number.className = 'service-number';
      const visibleServiceCount = [...servicesGrid.children].filter((child) => !child.hidden).length;
      number.textContent = String(visibleServiceCount + 1).padStart(2, '0');
      const icon = document.createElement('div');
      icon.className = 'service-icon';
      icon.textContent = '✧';
      const category = document.createElement('small');
      category.className = 'service-category';
      category.textContent = service.category;
      const title = document.createElement('h3');
      title.textContent = service.name;
      card.append(number, icon, category, title);
      if (service.description) {
        const description = document.createElement('p');
        description.textContent = service.description;
        card.append(description);
      }
      const prices = document.createElement('ul');
      prices.className = 'precos';
      const row = document.createElement('li');
      const label = document.createElement('span');
      label.className = 'servico';
      label.textContent = 'Valor';
      const price = document.createElement('span');
      price.className = 'preco';
      if (service.from) {
        const note = document.createElement('small');
        note.textContent = 'a partir de';
        price.append(note, document.createTextNode(` ${formatPrice(service.price)}`));
      } else {
        price.textContent = formatPrice(service.price);
      }
      row.append(label, price);
      prices.append(row);
      card.append(prices);
      const link = document.createElement('a');
      const message = `Olá! Gostaria de agendar ${service.name} pelo SalãoEdmais.`;
      link.href = whatsappUrl(message);
      link.textContent = 'Agendar pelo WhatsApp';
      link.setAttribute('aria-label', `Agendar ${service.name} pelo WhatsApp`);
      card.append(link);
      servicesGrid.append(card);
    });

    const combosGrid = document.querySelector('.combos-grid');
    (data.customCombos || []).forEach((combo) => {
      const card = document.createElement('article');
      card.className = 'combo-card';
      const label = document.createElement('span');
      label.className = 'combo-label';
      label.textContent = 'Combo adicional';
      const title = document.createElement('h3');
      title.textContent = combo.name;
      const description = document.createElement('p');
      description.textContent = combo.description;
      const priceBadge = document.createElement('span');
      priceBadge.className = 'combo-condition';
      const price = document.createElement('span');
      price.className = 'preco-atual';
      price.textContent = formatPrice(combo.price);
      priceBadge.append(price);
      if (Number(combo.savings) > 0) {
        const savings = document.createElement('small');
        savings.className = 'economia';
        savings.textContent = `economize ${formatPrice(combo.savings)}`;
        priceBadge.append(savings);
      }
      const link = document.createElement('a');
      link.href = whatsappUrl(`Olá! Gostaria de agendar o combo ${combo.name} pelo SalãoEdmais.`);
      link.textContent = 'Agendar pelo WhatsApp';
      card.append(label, title, description, priceBadge, link);
      combosGrid.append(card);
    });

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
