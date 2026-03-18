// =======================
// Нормализация текста
// =======================
function normalize(str){
  return (str || "")
    .toLowerCase()
    .replace(/ё/g,"е")
    .replace(/[-‐-‒–—―]/g," ")
    .replace(/[^\p{L}\p{N}\s,]/gu," ")
    .replace(/\s+/g," ")
    .trim();
}

function tokenize(str){
  return normalize(str).split(" ").filter(Boolean);
}

// Разбивка категорий
function splitCategories(str){
  return (str || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

// =======================
// Загрузка CSV
// =======================
async function loadCSV(url){
  const response = await fetch(url);
  let text = await response.text();
  text = text.replace(/\r/g,"");

  return text.split("\n")
    .slice(1)
    .filter(line => line.trim() !== "")
    .map(line => {
      const cols = line.split(";");
      const row = {};
      TABLE_COLUMNS.forEach((colName,i)=>{
        row[colName] = cols[i] || "";
      });
      return row;
    });
}

// =======================
// Инициализация таблицы
// =======================
async function initTable(){
  const data = await loadCSV(CSV_FILE);
  const tbody = document.querySelector('#tableContainer tbody');
  const popup = document.getElementById('popup');
  let popupFixed=false;

  // =======================
  // Заполнение таблицы
  // =======================
  data.forEach(row=>{
  const tr=document.createElement('tr');
  const hasComment = row['Комментарий']?.trim() !== "";
  const commentHTML = hasComment
    ? `<div class="comment-cell" data-comment="${row['Комментарий']}">
        <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <line x1="8" y1="9" x2="16" y2="9"/>
          <line x1="8" y1="13" x2="16" y2="13"/>
        </svg>
      </div>`
    : "";

  tr.innerHTML = TABLE_COLUMNS.map(col=>{
    if(col==='Комментарий') return `<td class="Комментарий">${commentHTML}</td>`;

    // Новое поведение для колонки "Проверка"
    if(col==='Проверка' && row[col].trim() !== ""){
      return `<td class="Проверка">
                <a href="${row[col]}" target="_blank" rel="noopener noreferrer" class="check-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
				  <path d="m10 15 5-3-5-3z"/></svg>
                </a>
              </td>`;
    }

    return `<td class="${col}">${row[col]}</td>`;
  }).join('');

  tbody.appendChild(tr);
});

	// =======================
	// List.js
	// =======================
	const listObj = new List('tableContainer',{
	  valueNames: TABLE_COLUMNS,
	  page: 27,
	  pagination:{innerWindow:3,left:1,right:1}
	});

	// 👉 Сортировка по умолчанию
	listObj.sort('Оригинал', {
	  order: 'asc',
	  sortFunction: (a, b) =>
		(a.values()['Оригинал'] || "")
		  .toLowerCase()
		  .localeCompare(
			(b.values()['Оригинал'] || "").toLowerCase(),
			"ru"
		  )
	});

  // =======================
  // Индекс поиска
  // =======================
  const SEARCH_COLUMNS = ['Оригинал', 'Перевод', 'Смотри_также', 'Суть'];

  listObj.items.forEach(item=>{
    const v = item.values();

    item.searchIndex = SEARCH_COLUMNS.map(c => v[c] || "").join(" ");
    item.searchIndex = normalize(item.searchIndex);

    // добавляем массив категорий
    item.categories = splitCategories(v['Категория']);
  });

  // =======================
  // Поиск и фильтры
  // =======================
  const searchInput = document.getElementById("searchBox");
  const activeCategories = new Set();

  function applyFilters(){
    const tokens = tokenize(searchInput.value);

    listObj.filter(item=>{
      const categoryMatch = TABLE_COLUMNS.includes('Категория')
        ? (
            activeCategories.size === 0 ||
            item.categories.some(cat => activeCategories.has(cat))
          )
        : true;

      if(!categoryMatch) return false;
      if(tokens.length === 0) return true;

      return tokens.every(t => item.searchIndex.includes(t));
    });
  }

  searchInput.addEventListener("input", applyFilters);

  // =======================
  // Категории
  // =======================
  if(TABLE_COLUMNS.includes('Категория')){
    const allCategories = new Set();

    listObj.items.forEach(item=>{
      item.categories.forEach(cat => allCategories.add(cat));
    });

    const categories = [...allCategories].sort();
    const buttonsContainer = document.getElementById('categoryButtons');

    categories.forEach(cat=>{
      const btn = document.createElement('button');
      btn.className = 'category-btn';
      btn.textContent = cat;

      btn.onclick = () => {
        if(activeCategories.has(cat)){
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

  // =======================
  // Сортировка
  // =======================
  let currentSort={key:null,order:'asc'};

  document.querySelectorAll('th[data-key]').forEach(th=>{
    th.onclick = ()=>{
      const key=th.dataset.key;

      let order='asc';
      if(currentSort.key===key && currentSort.order==='asc') order='desc';

      currentSort={key,order};

      document.querySelectorAll('th').forEach(th2=>{
        th2.classList.remove('sorted-asc','sorted-desc');
      });

      th.classList.add(order==='asc'?'sorted-asc':'sorted-desc');

      listObj.sort(key,{
        order,
        sortFunction:(a,b)=>
          (a.values()[key]||"")
          .toLowerCase()
          .localeCompare((b.values()[key]||"").toLowerCase(),"ru")
      });
    };
  });

  // =======================
  // Popup комментариев
  // =======================
  document.addEventListener("mouseover",e=>{
    if(!popupFixed && e.target.classList.contains("comment-cell")){
      popup.innerText=e.target.dataset.comment;
      popup.style.display="block";

      const rect=e.target.getBoundingClientRect();
      popup.style.top=(rect.bottom+window.scrollY+8)+"px";
      popup.style.left=(rect.right+window.scrollX-popup.offsetWidth)+"px";
    }
  });

  document.addEventListener("mouseout",e=>{
    if(!popupFixed && e.target.classList.contains("comment-cell"))
      popup.style.display="none";
  });

  document.addEventListener("click",e=>{
    if(e.target.classList.contains("comment-cell")){
      popupFixed=true;
      popup.innerText=e.target.dataset.comment;
      popup.style.display="block";
      e.stopPropagation();
    }else if(popupFixed){
      popupFixed=false;
      popup.style.display="none";
    }
  });

  window.addEventListener("scroll",()=>{
    if(popupFixed){
      popupFixed=false;
      popup.style.display="none";
    }
  });

  // =======================
  // Текущий год
  // =======================
  document.getElementById('currentYear').textContent = new Date().getFullYear();
}

initTable();