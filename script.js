let allTerms = [];
let categoriesList = [];
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
let darkTheme = localStorage.getItem("theme") === "dark";

if(darkTheme) document.body.classList.add("dark");

// Тема
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  darkTheme = document.body.classList.contains("dark");
  localStorage.setItem("theme", darkTheme ? "dark" : "light");
});

async function loadTerms() {
  categoriesList = await fetch("data/categories.json").then(r => r.json());

  const files = [
    "characters.json",
    "aliases.json",
    "organizations.json",
    "locations.json",
    "concepts.json",
    "objects.json",
    "events.json",
    "creatures.json",
    "language.json",
    "authors.json",
    "phrases.json",
    "comics.json"
  ];

  allTerms = [];
  for (const file of files) {
    try {
      const res = await fetch(`data/${file}`);
      const data = await res.json();
      allTerms = allTerms.concat(data);
    } catch (err) {
      console.error(`Ошибка при загрузке ${file}:`, err);
    }
  }

  // сортировка по английскому основному термину
  allTerms.sort((a,b) => (a.en[0]||"").localeCompare(b.en[0]||""));

  renderCategories();
  renderAlphabet();
  renderTerms(allTerms);
  setupSearch();
}

function renderCategories() {
  const container = document.getElementById("categories");
  container.innerHTML = "";

  categoriesList.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat.icon + " " + cat.name;
    btn.dataset.id = cat.id;
    btn.dataset.active = "true";
    btn.addEventListener("click", () => {
      btn.dataset.active = btn.dataset.active === "true" ? "false" : "true";
      filterTerms();
    });
    container.appendChild(btn);
  });
}

function renderAlphabet() {
  const container = document.getElementById("alphabet");
  container.innerHTML = "";
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  letters.forEach(l => {
    const btn = document.createElement("button");
    btn.textContent = l;
    btn.addEventListener("click", () => scrollToLetter(l));
    container.appendChild(btn);
  });
}

function scrollToLetter(letter) {
  const row = allTerms.find(t => (t.en[0] || "").toUpperCase().startsWith(letter));
  if(row) {
    const index = allTerms.indexOf(row);
    const tableRow = document.getElementById("termsBody").children[index];
    if(tableRow) tableRow.scrollIntoView({behavior:"smooth", block:"start"});
  }
}

function setupSearch() {
  document.getElementById("search").addEventListener("input", filterTerms);
}

function filterTerms() {
  const activeCats = Array.from(document.querySelectorAll("#categories button"))
                          .filter(b => b.dataset.active==="true")
                          .map(b => b.dataset.id);
  const query = document.getElementById("search").value.toLowerCase();

  const filtered = allTerms.filter(term => {
    const inCategory = activeCats.includes(term.category);
    const matches = (term.en.join(" ") + " " + term.ru.join(" ")).toLowerCase().includes(query);
    return inCategory && matches;
  });

  renderTerms(filtered);
}

function renderTerms(terms) {
  const table = document.getElementById("termsBody");
  table.innerHTML = "";

  terms.forEach(term => {
    const row = document.createElement("tr");

    const favorite = favorites.includes(term.id);
    if(favorite) row.style.background = "#ffd";

    row.innerHTML = `
      <td>${term.category || ""}</td>
      <td class="en-term">${(term.en||[]).join(", ")}</td>
      <td class="ru-term">${(term.ru||[]).join(", ")}</td>
      <td>${term.description || ""}</td>
      <td>${Array.isArray(term.see_also) ? term.see_also.join(", ") : ""}</td>
      <td>${term.translator_note ? "ⓘ" : ""}</td>
    `;

    // клик по EN копирует в буфер
    row.querySelector(".en-term")?.addEventListener("click", () => {
      navigator.clipboard.writeText((term.en||[]).join(", "));
      alert("Скопировано: " + (term.en||[]).join(", "));
    });

    // клик по RU копирует в буфер
    row.querySelector(".ru-term")?.addEventListener("click", () => {
      navigator.clipboard.writeText((term.ru||[]).join(", "));
      alert("Скопировано: " + (term.ru||[]).join(", "));
    });

    // клик по иконке избранного
    row.addEventListener("dblclick", () => {
      if(favorites.includes(term.id)) {
        favorites = favorites.filter(f => f!==term.id);
      } else {
        favorites.push(term.id);
      }
      localStorage.setItem("favorites", JSON.stringify(favorites));
      filterTerms();
    });

    table.appendChild(row);
  });
}

loadTerms();
