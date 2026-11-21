const WHATSAPP_NUMBER = ''; // Informe o número com DDI e DDD, por exemplo: 5531999999999
const defaultMessage = 'Olá! Gostaria de saber mais sobre os serviços do SalãoEdmais e agendar um horário.';

function whatsappUrl(message = defaultMessage) {
  const encoded = encodeURIComponent(message);
  return WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;
}

document.querySelectorAll('[data-whatsapp-link]').forEach((link) => {
  link.href = whatsappUrl();
  link.addEventListener('click', () => {
    if (!WHATSAPP_NUMBER) {
      showToast('Adicione o número do WhatsApp no arquivo script.js para ativar o contato direto.');
    }
  });
});

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
menuToggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}));

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
