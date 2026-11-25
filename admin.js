const REPOSITORY_OWNER = 'italogomes345';
const REPOSITORY_NAME = 'salao-edmais';
const PUBLISH_BRANCH = 'main';
const DATA_FILE_PATH = 'precos.json';
const CONTENTS_API_URL = `https://api.github.com/repos/${REPOSITORY_OWNER}/${REPOSITORY_NAME}/contents/${DATA_FILE_PATH}`;
const API_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28'
};

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
    fields: [
      { path: ['services', 'makeup', 'from'], label: 'Preço inicial' }
    ]
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
    fields: [
      { path: ['paymentMethods'], label: 'Separe as opções por vírgula', type: 'list' }
    ]
  }
];

const loginPanel = document.querySelector('#admin-login-panel');
const loginForm = document.querySelector('#github-login-form');
const tokenInput = document.querySelector('#github-token');
const loginStatus = document.querySelector('#login-status');
const dashboard = document.querySelector('#admin-dashboard');
const priceForm = document.querySelector('#prices-form');
const priceFields = document.querySelector('#price-fields');
const saveButton = document.querySelector('#save-prices-button');
const saveStatus = document.querySelector('#save-status');
const logoutButton = document.querySelector('#logout-button');

let accessToken = '';
let fileSha = '';
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

function bytesToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToText(content) {
  const binary = atob(content.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function requestHeaders() {
  return { ...API_HEADERS, Authorization: `Bearer ${accessToken}` };
}

async function getPriceFile() {
  const response = await fetch(`${CONTENTS_API_URL}?ref=${PUBLISH_BRANCH}`, {
    headers: requestHeaders()
  });
  const result = await response.json();
  if (!response.ok) {
    const detail = response.status === 401
      ? 'Token inválido ou expirado.'
      : response.status === 403
        ? 'O token precisa de Contents: read and write no repositório salao-edmais.'
        : response.status === 404
          ? 'Arquivo não encontrado ou o token não tem acesso ao repositório.'
          : result.message || `Erro do GitHub (${response.status}).`;
    throw new Error(detail);
  }
  return result;
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
        input.setAttribute('aria-label', field.label);
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
  accessToken = tokenInput.value.trim();
  tokenInput.value = '';
  const submitButton = loginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  setStatus(loginStatus, 'Validando token e carregando preços…');

  try {
    const file = await getPriceFile();
    const prices = JSON.parse(base64ToText(file.content));
    fileSha = file.sha;
    currentPrices = prices;
    buildPriceInputs(currentPrices);
    loginPanel.hidden = true;
    dashboard.hidden = false;
    setStatus(saveStatus, 'Preços carregados. Nenhuma alteração pendente.');
  } catch (error) {
    accessToken = '';
    setStatus(loginStatus, error.message || 'Não foi possível acessar o repositório.', 'error');
    tokenInput.focus();
  } finally {
    submitButton.disabled = false;
  }
});

priceForm.addEventListener('input', () => {
  saveButton.disabled = false;
  setStatus(saveStatus, 'Há alterações sem salvar.');
});

priceForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const updatedPrices = JSON.parse(JSON.stringify(currentPrices));

  for (const input of priceFields.querySelectorAll('[data-path]')) {
    const path = JSON.parse(input.dataset.path);
    if (input.tagName === 'TEXTAREA') {
      const methods = input.value.split(',').map((method) => method.trim()).filter(Boolean);
      if (!methods.length) {
        setStatus(saveStatus, 'Informe pelo menos uma forma de pagamento.', 'error');
        input.focus();
        return;
      }
      setValueAtPath(updatedPrices, path, methods);
    } else {
      const amount = Number(input.value);
      if (!Number.isFinite(amount) || amount < 0) {
        setStatus(saveStatus, 'Confira os valores antes de salvar.', 'error');
        input.focus();
        return;
      }
      setValueAtPath(updatedPrices, path, amount);
    }
  }

  saveButton.disabled = true;
  setStatus(saveStatus, 'Salvando preços na branch main…');
  try {
    const response = await fetch(CONTENTS_API_URL, {
      method: 'PUT',
      headers: { ...requestHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Atualiza preços pelo painel administrativo',
        content: bytesToBase64(`${JSON.stringify(updatedPrices, null, 2)}\n`),
        sha: fileSha,
        branch: PUBLISH_BRANCH
      })
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 409 || response.status === 422) {
        throw new Error('O arquivo mudou desde que você abriu o painel. Saia, entre novamente e tente de novo.');
      }
      throw new Error(result.message || `O GitHub recusou a gravação (${response.status}).`);
    }

    currentPrices = updatedPrices;
    fileSha = result.content.sha;
    setStatus(saveStatus, `Salvo no commit ${result.commit.sha.slice(0, 7)}. O GitHub Pages atualizará o site após a publicação.`, 'success');
  } catch (error) {
    saveButton.disabled = false;
    setStatus(saveStatus, error.message || 'Não foi possível salvar os preços.', 'error');
  }
});

logoutButton.addEventListener('click', () => {
  accessToken = '';
  fileSha = '';
  currentPrices = null;
  priceFields.replaceChildren();
  loginPanel.hidden = false;
  dashboard.hidden = true;
  setStatus(loginStatus, '');
  setStatus(saveStatus, 'Nenhuma alteração pendente.');
  saveButton.disabled = true;
  tokenInput.focus();
});
