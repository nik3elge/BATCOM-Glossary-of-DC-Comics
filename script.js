async function loadTerms() {

const categories = await fetch("data/categories.json")
.then(r => r.json());

const characters = await fetch("data/characters.json")
.then(r => r.json());

const terms = [
...characters
];

renderTerms(terms);

}

function renderTerms(terms) {

const table = document.getElementById("termsBody");

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
