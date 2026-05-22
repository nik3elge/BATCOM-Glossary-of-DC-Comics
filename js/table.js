// =======================
// Конфигурации таблиц
// =======================
const TABS_CONFIG = {
  main: {
    csv: 'data/BATCOM-Glossary-of-DC-Comics-Main-Terms.csv',
    columns: ['Категория','Оригинал','Перевод','Пояснение','Смотри_также','Комментарий'],
    searchCols: ['Оригинал', 'Перевод', 'Смотри_также'],
    colgroup: `
      <col style="width:15%; min-width:100px;">
      <col style="width:15%; min-width:100px;">
      <col style="width:15%; min-width:100px;">
      <col style="width:39%; min-width:100px;">
      <col style="width:15%; min-width:100px;">
      <col style="width:1%; min-width:40px;">
    `,
    headers: `
      <th data-key="Категория">Категория</th>
      <th data-key="Оригинал">Оригинал</th>
      <th data-key="Перевод">Перевод</th>
      <th data-key="Пояснение">Пояснение</th>
      <th data-key="Смотри_также">Смотри также</th>
      <th data-key="Комментарий"></th>
    `
  },
  authors: {
    csv: 'data/BATCOM-Glossary-of-DC-Comics-Authors.csv',
    columns: ['Категория','Оригинал','Перевод','Проверка','Комментарий'],
    searchCols: ['Оригинал', 'Перевод'],
    colgroup: `
      <col style="width:28%; min-width:100px;">
      <col style="width:28%; min-width:100px;">
      <col style="width:28%; min-width:100px;">
      <col style="width:8%; min-width:40px;">
      <col style="width:8%; min-width:40px;">
    `,
    headers: `
      <th data-key="Категория">Категория</th>
      <th data-key="Оригинал">Оригинал</th>
      <th data-key="Перевод">Перевод</th>
      <th data-key="Проверка"></th>
      <th data-key="Комментарий"></th>
    `
  },
  phrases: {
    csv: 'data/BATCOM-Glossary-of-DC-Comics-Phrases.csv',
    columns: ['Суть','Оригинал','Перевод','Комментарий'],
    searchCols: ['Суть', 'Оригинал', 'Перевод'],
    colgroup: `
      <col style="width:29%; min-width:100px;">
      <col style="width:35%; min-width:100px;">
      <col style="width:35%; min-width:100px;">
      <col style="width:1%; min-width:40px;">
    `,
    headers: `
      <th data-key="Суть">Суть</th>
      <th data-key="Оригинал">Оригинал</th>
      <th data-key="Перевод">Перевод</th>
      <th data-key="Комментарий"></th>
    `
  }
};

let currentListObj = null;

// =======================
// Утилиты
// =======================
function normalize(str) {
  return (str || "").toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[-‐-‒–—―]/g, " ")
    .replace(/[^\p{L}\p{N}\s,]/gu, " ")
    .replace(/\s+/g, " ").trim();
}

function tokenize(str) {
  return normalize(str).split(" ").filter(Boolean);
}

function splitCategories(str) {
  return (str || "").split(",").map(s => s.trim()).filter(Boolean);
}

async function loadCSV(url, columns) {
  const response = await fetch(url);
  let text = await response.text();
  text = text.replace(/\r/g, "");

  return text.split("\n").slice(1).filter(line => line.trim() !== "").map(line => {
    const cols = line.split(";");
    const row = {};
    columns.forEach((colName, i) => { row[colName] = cols[i] || ""; });
    return row;
  });
}

// =======================
// Инициализация таблицы
// =======================
async function renderTab(tabId) {
  const config = TABS_CONFIG[tabId];
  const container = document.getElementById('tableContainer');

  // Очищаем старый List.js, если есть
  if (currentListObj) {
    currentListObj.clear();
    currentListObj = null;
  }

  // Перестраиваем базовый HTML для выбранной вкладки
  container.innerHTML = `
    <input id="searchBox" placeholder="Поиск..." aria-label="Поиск по глоссарию" />
    <div id="categoryButtons"></div>
	<table>
      <colgroup>${config.colgroup}</colgroup>
      <thead><tr>${config.headers}</tr></thead>
      <tbody class="list"></tbody>
    </table>
    <ul class="pagination"></ul>
  `;

  // Загружаем данные
  const data = await loadCSV(config.csv, config.columns);
  const tbody = document.querySelector('#tableContainer tbody');

  // Отрисовка строк
  data.forEach(row => {
    const tr = document.createElement('tr');
    const hasComment = row['Комментарий']?.trim() !== "";
    const commentHTML = hasComment
      ? `<div class="comment-cell" data-comment="${row['Комментарий'].replace(/"/g, '&quot;')}">
          <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <line x1="8" y1="9" x2="16" y2="9"/>
            <line x1="8" y1="13" x2="16" y2="13"/>
          </svg>
        </div>`
      : "";

    tr.innerHTML = config.columns.map(col => {
      if (col === 'Комментарий') return `<td class="Комментарий">${commentHTML}</td>`;
      if (col === 'Проверка' && row[col].trim() !== "") {
        return `<td class="Проверка">
                  <a href="${row[col]}" target="_blank" rel="noopener noreferrer" class="check-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
                      <path d="m10 15 5-3-5-3z"/>
                    </svg>
                  </a>
                </td>`;
      }
      return `<td class="${col}" data-label="${col}">${row[col]}</td>`;
    }).join('');
    
    tbody.appendChild(tr);
  });

  // Инициализация List.js
  currentListObj = new List('tableContainer', {
    valueNames: config.columns,
    page: 27,
    pagination: { innerWindow: 3, left: 1, right: 1 }
  });

  // Сортировка по умолчанию (по Оригиналу, если он есть)
  if (config.columns.includes('Оригинал')) {
    currentListObj.sort('Оригинал', {
      order: 'asc',
      sortFunction: (a, b) => (a.values()['Оригинал'] || "").toLowerCase().localeCompare((b.values()['Оригинал'] || "").toLowerCase(), "ru")
    });
    document.querySelector('th[data-key="Оригинал"]')?.classList.add('sorted-asc');
  }

  // Индексация для поиска
  currentListObj.items.forEach(item => {
    const v = item.values();
    item.searchIndex = normalize(config.searchCols.map(c => v[c] || "").join(" "));
    item.categories = config.columns.includes('Категория') ? splitCategories(v['Категория']) : [];
  });

  // Логика фильтров и поиска
  const searchInput = document.getElementById("searchBox");
  const activeCategories = new Set();

  function applyFilters() {
    const tokens = tokenize(searchInput.value);
    currentListObj.filter(item => {
      const categoryMatch = config.columns.includes('Категория')
        ? (activeCategories.size === 0 || item.categories.some(cat => activeCategories.has(cat)))
        : true;
      if (!categoryMatch) return false;
      if (tokens.length === 0) return true;
      return tokens.every(t => item.searchIndex.includes(t));
    });
  }

  searchInput.addEventListener("input", applyFilters);

  // Кнопки категорий (если есть)
  if (config.columns.includes('Категория')) {
    const allCategories = new Set();
    currentListObj.items.forEach(item => item.categories.forEach(cat => allCategories.add(cat)));
    
    const buttonsContainer = document.getElementById('categoryButtons');
    [...allCategories].sort().forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'category-btn';
      btn.textContent = cat;
      btn.onclick = () => {
        if (activeCategories.has(cat)) {
          activeCategories.delete(cat);
          btn.classList.remove('active');
        } else {
          activeCategories.add(cat);
          btn.classList.add('active');
        }
        applyFilters();
      };
      buttonsContainer.appendChild(btn);
    });
  }

  // Сортировка по заголовкам
  let currentSort = { key: 'Оригинал', order: 'asc' };
  document.querySelectorAll('th[data-key]').forEach(th => {
    th.onclick = () => {
      const key = th.dataset.key;
      // Отключаем сортировку по комментариям и ссылкам
      if (key === 'Комментарий' || key === 'Проверка') return; 

      let order = 'asc';
      if (currentSort.key === key && currentSort.order === 'asc') order = 'desc';
      currentSort = { key, order };

      document.querySelectorAll('th').forEach(t => t.classList.remove('sorted-asc', 'sorted-desc'));
      th.classList.add(order === 'asc' ? 'sorted-asc' : 'sorted-desc');

      currentListObj.sort(key, {
        order,
        sortFunction: (a, b) => (a.values()[key] || "").toLowerCase().localeCompare((b.values()[key] || "").toLowerCase(), "ru")
      });
    };
  });
}

// =======================
// Управление вкладками
// =======================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    // Меняем активный класс
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    
    // Загружаем нужную таблицу
    renderTab(e.target.dataset.tab);
  });
});

// =======================
// Всплывающее окно (Popups) - Глобальные слушатели
// =======================
const popup = document.getElementById('popup');
let popupFixed = false;

document.addEventListener("mouseover", e => {
  if (!popupFixed && e.target.closest(".comment-cell")) {
    const target = e.target.closest(".comment-cell");
    popup.innerText = target.dataset.comment;
    popup.style.display = "block";
    const rect = target.getBoundingClientRect();
    popup.style.top = (rect.bottom + window.scrollY + 8) + "px";
    popup.style.left = (rect.right + window.scrollX - popup.offsetWidth) + "px";
  }
});

document.addEventListener("mouseout", e => {
  if (!popupFixed && e.target.closest(".comment-cell")) popup.style.display = "none";
});

document.addEventListener("click", e => {
  const target = e.target.closest(".comment-cell");
  if (target) {
    popupFixed = true;
    popup.innerText = target.dataset.comment;
    popup.style.display = "block";
    e.stopPropagation();
  } else if (popupFixed) {
    popupFixed = false;
    popup.style.display = "none";
  }
});

window.addEventListener("scroll", () => {
  if (popupFixed) {
    popupFixed = false;
    popup.style.display = "none";
  }
});

// =======================
// Запуск
// =======================
document.getElementById('currentYear').textContent = new Date().getFullYear();

// Инициализируем вкладку по умолчанию (main)
renderTab('main');

// =======================
// Управление Темной/Светлой темой
// =======================
const themeToggleBtn = document.getElementById('themeToggle');

// Иконки SVG
const sunIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
`;

const moonIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
`;

// Проверяем сохраненную тему или системные настройки
const savedTheme = localStorage.getItem('theme');
const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;

if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
  document.body.classList.add('light-theme');
  themeToggleBtn.innerHTML = moonIcon; // Показываем луну, чтобы переключить на темную
} else {
  themeToggleBtn.innerHTML = sunIcon;  // Показываем солнце, чтобы переключить на светлую
}

// Обработчик клика
themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  
  if (document.body.classList.contains('light-theme')) {
    themeToggleBtn.innerHTML = moonIcon;
    localStorage.setItem('theme', 'light');
  } else {
    themeToggleBtn.innerHTML = sunIcon;
    localStorage.setItem('theme', 'dark');
  }
});

// ==========================================
// Скрытие/Показ описания с сохранением состояния
// ==========================================
const mainTitle = document.getElementById('mainTitle');
const description = document.getElementById('description');

if (mainTitle && description) {
  // 1. Проверяем сохранённое состояние при загрузке страницы
  // Если в localStorage записано 'hidden', скрываем описание
  const isDescriptionHidden = localStorage.getItem('descriptionHidden') === 'true';
  
  if (isDescriptionHidden) {
    description.classList.add('hidden');
  }

  // 2. Клик по описанию — скрывает его и сохраняет состояние
  description.addEventListener('click', () => {
    description.classList.add('hidden');
    localStorage.setItem('descriptionHidden', 'true');
  });

  // 3. Клик по заголовку — возвращает описание и обновляет состояние
  mainTitle.addEventListener('click', () => {
    description.classList.remove('hidden');
    localStorage.setItem('descriptionHidden', 'false');
  });
}
