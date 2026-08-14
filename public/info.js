let currentLang = localStorage.getItem('lang') || 'pl';
let translations = {};

async function loadLanguage(lang) {
  try {
    const response = await fetch(`/locales/${lang}.info.json`);  // ← ważne: .info.json
    if (!response.ok) throw new Error('Nie znaleziono pliku');
    
    translations = await response.json();
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    
    applyTranslations();
    
  } catch (error) {
    console.error('Błąd ładowania języka:', error);
    if (lang !== 'pl') loadLanguage('pl');
  }
}

function t(key) {
  return translations[key] || key;
}

function applyTranslations() {
  // Zwykłe teksty
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.innerHTML = t(el.getAttribute('data-i18n'));   // ← innerHTML zamiast textContent
  });

  // Placeholdery (jak będą)
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });

  // Title (dymki)
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadLanguage(currentLang);
});
