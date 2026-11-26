const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';
const PRICES_STORAGE_KEY = 'salaoedmais-precos';

const priceGroups = [
  {
    title: 'Manicure e pedicure',
    section: 'service',
    id: 'nails',
    fields: [
      { path: ['services', 'nails', 'hand'], label: 'Mão' },
      { path: ['services', 'nails', 'foot'], label: 'Pé' },
      { path: ['services', 'nails', 'handsAndFeet'], label: 'Mão + pé' }
    ]
  },
  {
    title: 'Sobrancelhas',
    section: 'service',
    id: 'eyebrows',
    fields: [
      { path: ['services', 'eyebrows', 'withHenna'], label: 'Com henna ou tinta' },
      { path: ['services', 'eyebrows', 'withoutHenna'], label: 'Sem henna' }
    ]
  },
  {
    title: 'Cabelos',
    section: 'service',
    id: 'hair',
    fields: [
      { path: ['services', 'hair', 'maleCut'], label: 'Corte masculino' },
      { path: ['services', 'hair', 'femaleCut'], label: 'Corte feminino' },
      { path: ['services', 'hair', 'progressiveFrom'], label: 'Progressiva (valor inicial)' },
      { path: ['services', 'hair', 'pregnancyBrushFrom'], label: 'Escova de grávida (valor inicial)' }
    ]
  },
  {
    title: 'Maquiagem',
    section: 'service',
    id: 'makeup',
    fields: [{ path: ['services', 'makeup', 'from'], label: 'Preço inicial' }]
  },
  {
    title: 'Depilação',
    section: 'service',
    id: 'depilation',
    fields: [
      { path: ['services', 'depilation', 'groin'], label: 'Virilha' },
      { path: ['services', 'depilation', 'fullLeg'], label: 'Perna inteira' },
      { path: ['services', 'depilation', 'halfLeg'], label: 'Meia perna' },
      { path: ['services', 'depilation', 'underarms'], label: 'Axilas' }
    ]
  },
  {
    title: 'Natura e Avon',
    section: 'service',
    id: 'products',
    fields: []
  },
  {
    title: 'Combo 01 · Mãos e olhar',
    section: 'combo',
    id: 'handsAndLook',
    fields: [
      { path: ['combos', 'handsAndLook', 'price'], label: 'Preço' },
      { path: ['combos', 'handsAndLook', 'savings'], label: 'Economia' }
    ]
  },
  {
    title: 'Combo 02 · Depilação básica',
    section: 'combo',
    id: 'basicDepilation',
    fields: [
      { path: ['combos', 'basicDepilation', 'price'], label: 'Preço' },
      { path: ['combos', 'basicDepilation', 'savings'], label: 'Economia' }
    ]
  },
  {
    title: 'Combo 03 · Dia de cuidado',
    section: 'combo',
    id: 'careDay',
    fields: [
      { path: ['combos', 'careDay', 'price'], label: 'Preço' },
      { path: ['combos', 'careDay', 'savings'], label: 'Economia' }
    ]
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
const createServiceForm = document.querySelector('#create-service-form');
const createComboForm = document.querySelector('#create-combo-form');
const addServiceButton = document.querySelector('#add-service-button');
const addComboButton = document.querySelector('#add-combo-button');
const serviceCount = document.querySelector('#service-count');
const comboCount = document.querySelector('#combo-count');

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
  if (savedInThisBrowser) {
    const prices = JSON.parse(savedInThisBrowser);
    prices.customServices ??= [];
    prices.customCombos ??= [];
    prices.hiddenServices ??= [];
    prices.hiddenCombos ??= [];
    return prices;
  }

  const response = await fetch('./precos.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Não foi possível carregar precos.json.');
  const prices = await response.json();
  prices.customServices ??= [];
  prices.customCombos ??= [];
  prices.hiddenServices ??= [];
  prices.hiddenCombos ??= [];
  return prices;
}

function createDeleteButton(label, onClick) {
  const button = document.createElement('button');
  button.className = 'admin-delete-button';
  button.type = 'button';
  button.setAttribute('aria-label', `Excluir ${label}`);
  button.title = `Excluir ${label}`;
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M9 7V4h6v3m3 0-.8 13H6.8L6 7m4 3v6m4-6v6" /></svg>';
  button.addEventListener('click', onClick);
  return button;
}

function buildPriceInputs(prices) {
  priceFields.replaceChildren();
  const hiddenServices = prices.hiddenServices || [];
  const hiddenCombos = prices.hiddenCombos || [];
  serviceCount.textContent = 6 - hiddenServices.length + (prices.customServices || []).length;
  comboCount.textContent = 3 - hiddenCombos.length + (prices.customCombos || []).length;

  priceGroups
    .filter((group) => !(group.section === 'service' && hiddenServices.includes(group.id)))
    .filter((group) => !(group.section === 'combo' && hiddenCombos.includes(group.id)))
    .forEach((group, groupIndex) => {
    const section = document.createElement('section');
    section.className = 'admin-price-group';
    const groupHeading = document.createElement('div');
    groupHeading.className = 'admin-price-group-heading';
    const heading = document.createElement('h3');
    heading.textContent = group.title;
    groupHeading.append(heading);
    if (group.section === 'service' || group.section === 'combo') {
      const itemType = group.section === 'service' ? 'serviço' : 'combo';
      groupHeading.append(createDeleteButton(`${itemType} ${group.title}`, () => removeCatalogItem(group)));
    }
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

    section.append(groupHeading, fields);
    priceFields.append(section);
  });

  const customGroups = [
    ...(prices.customServices || []).map((service, index) => ({
      title: `Serviço adicional: ${service.name}`,
      collection: 'customServices',
      itemIndex: index,
      itemType: 'serviço',
      fields: [
        { path: ['customServices', index, 'name'], label: 'Nome', type: 'text' },
        { path: ['customServices', index, 'category'], label: 'Categoria', type: 'text' },
        { path: ['customServices', index, 'description'], label: 'Descrição', type: 'text', optional: true },
        { path: ['customServices', index, 'price'], label: 'Preço', type: 'number' },
        { path: ['customServices', index, 'from'], label: 'A partir de', type: 'checkbox' }
      ]
    })),
    ...(prices.customCombos || []).map((combo, index) => ({
      title: `Combo adicional: ${combo.name}`,
      collection: 'customCombos',
      itemIndex: index,
      itemType: 'combo',
      fields: [
        { path: ['customCombos', index, 'name'], label: 'Nome', type: 'text' },
        { path: ['customCombos', index, 'description'], label: 'Descrição', type: 'text' },
        { path: ['customCombos', index, 'price'], label: 'Preço', type: 'number' },
        { path: ['customCombos', index, 'savings'], label: 'Economia', type: 'number', optional: true }
      ]
    }))
  ];

  customGroups.forEach((group, groupIndex) => {
    const section = document.createElement('section');
    section.className = 'admin-price-group';
    const groupHeading = document.createElement('div');
    groupHeading.className = 'admin-price-group-heading';
    const heading = document.createElement('h3');
    heading.textContent = group.title;
    groupHeading.append(heading);
    if (group.collection) {
      const name = group.title.replace(/^(Serviço adicional|Combo adicional):\s*/, '');
      groupHeading.append(createDeleteButton(`${group.itemType} ${name}`, () => removeCatalogItem(group)));
    }
    const fields = document.createElement('div');
    fields.className = 'admin-price-fields';

    group.fields.forEach((field, fieldIndex) => {
      const label = document.createElement('label');
      label.className = 'admin-price-field';
      const inputId = `custom-price-${groupIndex}-${fieldIndex}`;
      const caption = document.createElement('span');
      caption.textContent = field.label;
      const input = document.createElement('input');
      input.id = inputId;
      input.dataset.path = JSON.stringify(field.path);
      input.dataset.valueType = field.type;
      input.dataset.optional = String(Boolean(field.optional));
      input.required = !field.optional && field.type !== 'checkbox';

      if (field.type === 'checkbox') {
        input.type = 'checkbox';
        input.checked = Boolean(getValueAtPath(prices, field.path));
      } else {
        input.type = field.type;
        input.value = getValueAtPath(prices, field.path) ?? '';
        if (field.type === 'number') {
          input.min = '0';
          input.step = '0.01';
          input.inputMode = 'decimal';
        }
      }

      label.htmlFor = inputId;
      label.append(caption, input);
      fields.append(label);
    });

    section.append(groupHeading, fields);
    priceFields.append(section);
  });
}

function removeCatalogItem(group) {
  const itemType = group.itemType || (group.section === 'service' ? 'serviço' : 'combo');
  try {
    const updatedPrices = readEditedPrices();
    if (group.collection) {
      updatedPrices[group.collection].splice(group.itemIndex, 1);
    } else {
      const collection = group.section === 'service' ? 'hiddenServices' : 'hiddenCombos';
      updatedPrices[collection] ??= [];
      if (!updatedPrices[collection].includes(group.id)) updatedPrices[collection].push(group.id);
    }
    currentPrices = updatedPrices;
    buildPriceInputs(currentPrices);
    saveButton.disabled = false;
    setStatus(saveStatus, `${itemType[0].toUpperCase()}${itemType.slice(1)} removido. Salve para confirmar.`);
  } catch (error) {
    setStatus(saveStatus, error.message || `Não foi possível excluir este ${itemType}.`, 'error');
  }
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
    const valueType = input.dataset.valueType || (input.tagName === 'TEXTAREA' ? 'list' : 'number');
    if (valueType === 'list') {
      const methods = input.value.split(',').map((method) => method.trim()).filter(Boolean);
      if (!methods.length) throw new Error('Informe pelo menos uma forma de pagamento.');
      setValueAtPath(updatedPrices, path, methods);
      continue;
    }

    if (valueType === 'checkbox') {
      setValueAtPath(updatedPrices, path, input.checked);
      continue;
    }

    if (valueType === 'text') {
      const value = input.value.trim();
      if (input.required && !value) throw new Error('Preencha os campos de texto obrigatórios.');
      setValueAtPath(updatedPrices, path, value);
      continue;
    }

    if (input.required && input.value === '') throw new Error('Preencha todos os campos obrigatórios.');

    if (input.dataset.optional === 'true' && input.value === '') {
      setValueAtPath(updatedPrices, path, null);
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

function openCreateForm(form, button) {
  const otherForm = form === createServiceForm ? createComboForm : createServiceForm;
  const otherButton = form === createServiceForm ? addComboButton : addServiceButton;
  otherForm.hidden = true;
  otherButton.setAttribute('aria-expanded', 'false');
  form.hidden = false;
  button.setAttribute('aria-expanded', 'true');
  form.querySelector('input').focus();
}

function closeCreateForm(form) {
  form.hidden = true;
  form.reset();
  form.querySelector('[role="status"]').textContent = '';
  const button = form === createServiceForm ? addServiceButton : addComboButton;
  button.setAttribute('aria-expanded', 'false');
}

addServiceButton.addEventListener('click', () => openCreateForm(createServiceForm, addServiceButton));
addComboButton.addEventListener('click', () => openCreateForm(createComboForm, addComboButton));

document.querySelectorAll('[data-cancel-create]').forEach((button) => {
  button.addEventListener('click', () => closeCreateForm(button.closest('form')));
});

function addCatalogItem(form, collection, item) {
  const status = form.querySelector('[role="status"]');
  try {
    currentPrices = readEditedPrices();
    currentPrices[collection] ??= [];
    currentPrices[collection].push(item);
    buildPriceInputs(currentPrices);
    saveButton.disabled = false;
    setStatus(saveStatus, 'Item adicionado. Salve para guardar as alterações.');
    closeCreateForm(form);
  } catch (error) {
    setStatus(status, error.message || 'Não foi possível adicionar este item.', 'error');
  }
}

createServiceForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(createServiceForm);
  addCatalogItem(createServiceForm, 'customServices', {
    name: formData.get('name').trim(),
    category: formData.get('category').trim(),
    description: formData.get('description').trim(),
    price: Number(formData.get('price')),
    from: formData.has('from')
  });
});

createComboForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(createComboForm);
  const savingsValue = formData.get('savings');
  addCatalogItem(createComboForm, 'customCombos', {
    name: formData.get('name').trim(),
    description: formData.get('description').trim(),
    price: Number(formData.get('price')),
    savings: savingsValue === '' ? null : Number(savingsValue)
  });
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
  closeCreateForm(createServiceForm);
  closeCreateForm(createComboForm);
  usernameInput.focus();
});
