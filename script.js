async function loadTerms() {
  const categories = await fetch("data/categories.json").then(r => r.json());

  // Список всех файлов с терминами
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

  let terms = [];

  // Загружаем все файлы терминов
  for (const file of files) {
  try {
    const res = await fetch(`data/${file}`);
    const data = await res.json();
    terms = terms.concat(data);
  } catch (err) {
    console.error(`Ошибка при загрузке ${file}:`, err);
  }
}

  // сортировка по английскому основному термину
  terms.sort((a, b) => (a.en[0] || "").localeCompare(b.en[0] || ""));

  renderTerms(terms);
}

function renderTerms(terms) {
  const table = document.getElementById("termsBody");
  table.innerHTML = ""; // очистка перед отрисовкой

  terms.forEach(term => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${term.category || ""}</td>
      <td>${(term.en || []).join(", ")}</td>
      <td>${(term.ru || []).join(", ")}</td>
      <td>${term.description || ""}</td>
      <td>${Array.isArray(term.see_also) ? term.see_also.join(", ") : ""}</td>
      <td>${term.translator_note ? "ⓘ" : ""}</td>
    `;

    table.appendChild(row);
  });
}

loadTerms();
