const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';
const PRICES_STORAGE_KEY = 'salaoedmais-precos';

const priceGroups = [
  {
    title: 'Manicure e pedicure',
    fields: [
      { path: ['services', 'nails', 'hand'], label: 'Mão' },
      { path: ['services', 'nails', 'foot'], label: 'Pé' },
      { path: ['services', 'nails', 'handsAndFeet'], label: 'Mão + pé' }
    ]
  },
  {
    title: 'Sobrancelhas',
    fields: [
      { path: ['services', 'eyebrows', 'withHenna'], label: 'Com henna ou tinta' },
      { path: ['services', 'eyebrows', 'withoutHenna'], label: 'Sem henna' }
    ]
  },
  {
    title: 'Cabelos',
    fields: [
      { path: ['services', 'hair', 'maleCut'], label: 'Corte masculino' },
      { path: ['services', 'hair', 'femaleCut'], label: 'Corte feminino' },
      { path: ['services', 'hair', 'progressiveFrom'], label: 'Progressiva (valor inicial)' },
      { path: ['services', 'hair', 'pregnancyBrushFrom'], label: 'Escova de grávida (valor inicial)' }
    ]
  },
  {
    title: 'Maquiagem',
    fields: [{ path: ['services', 'makeup', 'from'], label: 'Preço inicial' }]
  },
  {
    title: 'Depilação',
    fields: [
      { path: ['services', 'depilation', 'groin'], label: 'Virilha' },
      { path: ['services', 'depilation', 'fullLeg'], label: 'Perna inteira' },
      { path: ['services', 'depilation', 'halfLeg'], label: 'Meia perna' },
      { path: ['services', 'depilation', 'underarms'], label: 'Axilas' }
    ]
  },
  {
    title: 'Combo 01 · Mãos e olhar',
    fields: [
      { path: ['combos', 'handsAndLook', 'price'], label: 'Preço' },
      { path: ['combos', 'handsAndLook', 'savings'], label: 'Economia' }
    ]
  },
  {
    title: 'Combo 02 · Depilação básica',
    fields: [
      { path: ['combos', 'basicDepilation', 'price'], label: 'Preço' },
      { path: ['combos', 'basicDepilation', 'savings'], label: 'Economia' }
    ]
  },
  {
    title: 'Combo 03 · Dia de cuidado',
    fields: [
      { path: ['combos', 'careDay', 'price'], label: 'Preço' },
      { path: ['combos', 'careDay', 'savings'], label: 'Economia' }
    ]
  },
  {
    title: 'Formas de pagamento',
    fields: [{ path: ['paymentMethods'], label: 'Separe as opções por vírgula', type: 'list' }]
  }
];

const loginForm = document.querySelector('#admin-login-form');
const loginPanel = document.querySelector('#admin-login-panel');
const usernameInput = document.querySelector('#admin-username');
const passwordInput = document.querySelector('#admin-password');
const loginStatus = document.querySelector('#login-status');
const dashboard = document.querySelector('#admin-dashboard');
const priceForm = document.querySelector('#prices-form');
const priceFields = document.querySelector('#price-fields');
const saveButton = document.querySelector('#save-prices-button');
const saveStatus = document.querySelector('#save-status');
const logoutButton = document.querySelector('#logout-button');

let currentPrices = null;

function setStatus(element, message, state = '') {
  element.textContent = message;
  if (state) element.dataset.state = state;
  else delete element.dataset.state;
}

function getValueAtPath(object, path) {
  return path.reduce((value, key) => value?.[key], object);
}

function setValueAtPath(object, path, value) {
  const lastKey = path[path.length - 1];
  const parent = path.slice(0, -1).reduce((current, key) => current[key], object);
  parent[lastKey] = value;
}

async function loadCurrentPrices() {
  const savedInThisBrowser = localStorage.getItem(PRICES_STORAGE_KEY);
  if (savedInThisBrowser) return JSON.parse(savedInThisBrowser);

  const response = await fetch('./precos.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Não foi possível carregar precos.json.');
  return response.json();
}

function buildPriceInputs(prices) {
  priceFields.replaceChildren();

  priceGroups.forEach((group, groupIndex) => {
    const section = document.createElement('section');
    section.className = 'admin-price-group';
    const heading = document.createElement('h3');
    heading.textContent = group.title;
    const fields = document.createElement('div');
    fields.className = 'admin-price-fields';

    group.fields.forEach((field, fieldIndex) => {
      const label = document.createElement('label');
      label.className = 'admin-price-field';
      const inputId = `price-${groupIndex}-${fieldIndex}`;
      const caption = document.createElement('span');
      caption.textContent = field.label;
      const input = document.createElement(field.type === 'list' ? 'textarea' : 'input');
      input.id = inputId;
      input.dataset.path = JSON.stringify(field.path);
      input.required = true;

      if (field.type === 'list') {
        input.rows = 3;
        input.value = getValueAtPath(prices, field.path).join(', ');
      } else {
        input.type = 'number';
        input.min = '0';
        input.step = '0.01';
        input.inputMode = 'decimal';
        input.value = getValueAtPath(prices, field.path);
      }

      label.htmlFor = inputId;
      label.append(caption, input);
      fields.append(label);
    });

    section.append(heading, fields);
    priceFields.append(section);
  });
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const validLogin = usernameInput.value.trim() === ADMIN_USERNAME
    && passwordInput.value === ADMIN_PASSWORD;
  passwordInput.value = '';

  if (!validLogin) {
    setStatus(loginStatus, 'Login ou senha incorretos.', 'error');
    passwordInput.focus();
    return;
  }

  const submitButton = loginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  setStatus(loginStatus, 'Carregando preços…');
  try {
    currentPrices = await loadCurrentPrices();
    buildPriceInputs(currentPrices);
    loginPanel.hidden = true;
    dashboard.hidden = false;
    setStatus(saveStatus, 'Preços carregados. Nenhuma alteração pendente.');
  } catch (error) {
    setStatus(loginStatus, error.message || 'Não foi possível carregar os preços.', 'error');
    passwordInput.focus();
  } finally {
    submitButton.disabled = false;
  }
});

priceForm.addEventListener('input', () => {
  saveButton.disabled = false;
  setStatus(saveStatus, 'Há alterações sem salvar.');
});

function readEditedPrices() {
  const updatedPrices = JSON.parse(JSON.stringify(currentPrices));
  for (const input of priceFields.querySelectorAll('[data-path]')) {
    const path = JSON.parse(input.dataset.path);
    if (input.tagName === 'TEXTAREA') {
      const methods = input.value.split(',').map((method) => method.trim()).filter(Boolean);
      if (!methods.length) throw new Error('Informe pelo menos uma forma de pagamento.');
      setValueAtPath(updatedPrices, path, methods);
      continue;
    }

    const amount = Number(input.value);
    if (!Number.isFinite(amount) || amount < 0) throw new Error('Confira os valores antes de salvar.');
    setValueAtPath(updatedPrices, path, amount);
  }
  return updatedPrices;
}

priceForm.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    currentPrices = readEditedPrices();
    localStorage.setItem(PRICES_STORAGE_KEY, JSON.stringify(currentPrices));
    saveButton.disabled = true;
    setStatus(saveStatus, 'Preços salvos.', 'success');
  } catch (error) {
    saveButton.disabled = false;
    setStatus(saveStatus, error.message, 'error');
  }
});

logoutButton.addEventListener('click', () => {
  currentPrices = null;
  priceFields.replaceChildren();
  loginPanel.hidden = false;
  dashboard.hidden = true;
  saveButton.disabled = true;
  usernameInput.value = '';
  passwordInput.value = '';
  setStatus(loginStatus, '');
  setStatus(saveStatus, 'Nenhuma alteração pendente.');
  usernameInput.focus();
});
