/* Public Domain Day calendar. Life+70: works free on Jan 1 of death year + 71.
   Curated, high-confidence author list. Pure logic first (node-testable). */
"use strict";

// d: death year · name · work: one landmark work (original title) · c: country code
const AUTHORS = [
  { d: 1950, name: "George Orwell", work: "1984", c: "gb" },
  { d: 1950, name: "George Bernard Shaw", work: "Pygmalion", c: "ie" },
  { d: 1950, name: "Orhan Veli Kanık", work: "Garip", c: "tr" },
  { d: 1951, name: "André Gide", work: "Les Faux-monnayeurs", c: "fr" },
  { d: 1951, name: "Sinclair Lewis", work: "Babbitt", c: "us" },
  { d: 1952, name: "Knut Hamsun", work: "Sult", c: "no" },
  { d: 1952, name: "George Santayana", work: "The Life of Reason", c: "us" },
  { d: 1953, name: "Eugene O'Neill", work: "Long Day's Journey into Night", c: "us" },
  { d: 1953, name: "Dylan Thomas", work: "Under Milk Wood", c: "gb" },
  { d: 1954, name: "Colette", work: "Gigi", c: "fr" },
  { d: 1954, name: "Sait Faik Abasıyanık", work: "Semaver", c: "tr" },
  { d: 1954, name: "Henri Matisse", work: "La Danse", c: "fr" },
  { d: 1955, name: "Thomas Mann", work: "Der Zauberberg", c: "de" },
  { d: 1955, name: "Albert Einstein", work: "Relativity (yazıları/writings)", c: "de" },
  { d: 1955, name: "José Ortega y Gasset", work: "La rebelión de las masas", c: "es" },
  { d: 1955, name: "Paul Claudel", work: "L'Annonce faite à Marie", c: "fr" },
  { d: 1956, name: "Bertolt Brecht", work: "Die Dreigroschenoper", c: "de" },
  { d: 1956, name: "A. A. Milne", work: "Winnie-the-Pooh", c: "gb" },
  { d: 1956, name: "H. L. Mencken", work: "The American Language", c: "us" },
  { d: 1956, name: "Reşat Nuri Güntekin", work: "Çalıkuşu", c: "tr" },
  { d: 1957, name: "Nikos Kazantzakis", work: "Vios kai politeia tou Alexi Zorba", c: "gr" },
  { d: 1957, name: "Dorothy L. Sayers", work: "Gaudy Night", c: "gb" },
  { d: 1957, name: "Jean Sibelius", work: "Finlandia", c: "fi" },
  { d: 1957, name: "Malcolm Lowry", work: "Under the Volcano", c: "gb" },
  { d: 1958, name: "Juan Ramón Jiménez", work: "Platero y yo", c: "es" },
  { d: 1958, name: "Ralph Vaughan Williams", work: "The Lark Ascending", c: "gb" },
  { d: 1959, name: "Raymond Chandler", work: "The Big Sleep", c: "us" },
  { d: 1960, name: "Albert Camus", work: "L'Étranger", c: "fr" },
  { d: 1960, name: "Boris Pasternak", work: "Doktor Zhivago", c: "ru" },
  { d: 1961, name: "Ernest Hemingway", work: "The Old Man and the Sea", c: "us" },
  { d: 1961, name: "Carl Gustav Jung", work: "Psychologische Typen", c: "ch" },
  { d: 1961, name: "Peyami Safa", work: "Dokuzuncu Hariciye Koğuşu", c: "tr" },
  { d: 1962, name: "Hermann Hesse", work: "Siddhartha", c: "de" },
  { d: 1962, name: "William Faulkner", work: "The Sound and the Fury", c: "us" },
  { d: 1962, name: "E. E. Cummings", work: "Tulips and Chimneys", c: "us" },
  { d: 1962, name: "Karen Blixen", work: "Out of Africa", c: "dk" },
  { d: 1962, name: "Ahmet Hamdi Tanpınar", work: "Saatleri Ayarlama Enstitüsü", c: "tr" },
  { d: 1963, name: "Aldous Huxley", work: "Brave New World", c: "gb" },
  { d: 1963, name: "C. S. Lewis", work: "The Chronicles of Narnia", c: "gb" },
  { d: 1963, name: "Robert Frost", work: "The Road Not Taken", c: "us" },
  { d: 1963, name: "Sylvia Plath", work: "The Bell Jar", c: "us" },
  { d: 1963, name: "Nâzım Hikmet", work: "Memleketimden İnsan Manzaraları", c: "tr" },
  { d: 1964, name: "Ian Fleming", work: "Casino Royale", c: "gb" },
  { d: 1964, name: "Sean O'Casey", work: "Juno and the Paycock", c: "ie" },
  { d: 1964, name: "Halide Edib Adıvar", work: "Sinekli Bakkal", c: "tr" },
  { d: 1965, name: "T. S. Eliot", work: "The Waste Land", c: "gb" },
  { d: 1965, name: "W. Somerset Maugham", work: "Of Human Bondage", c: "gb" },
  { d: 1965, name: "Winston Churchill", work: "The Second World War", c: "gb" },
  { d: 1965, name: "Refik Halid Karay", work: "Memleket Hikâyeleri", c: "tr" },
];

const COUNTRY = {
  en: { tr: "Türkiye", gb: "UK", ie: "Ireland", fr: "France", us: "USA", no: "Norway",
        de: "Germany", es: "Spain", gr: "Greece", fi: "Finland", ru: "Russia",
        ch: "Switzerland", dk: "Denmark" },
  tr: { tr: "Türkiye", gb: "Birleşik Krallık", ie: "İrlanda", fr: "Fransa", us: "ABD",
        no: "Norveç", de: "Almanya", es: "İspanya", gr: "Yunanistan", fi: "Finlandiya",
        ru: "Rusya", ch: "İsviçre", dk: "Danimarka" },
};

function pdYear(deathYear) {
  return deathYear + 71; // protected through death+70; free Jan 1 of the next year
}

function forYear(year) {
  return AUTHORS.filter((a) => pdYear(a.d) === year)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function yearRange() {
  const years = AUTHORS.map((a) => pdYear(a.d));
  return { min: Math.min(...years), max: Math.max(...years) };
}

if (typeof module !== "undefined") {
  module.exports = { AUTHORS, pdYear, forYear, yearRange };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const lang = document.documentElement.lang || "en";
  const countries = COUNTRY[lang] || COUNTRY.en;
  const yearsBox = document.getElementById("years");
  const heading = document.getElementById("heading");
  const list = document.getElementById("list");
  const { min, max } = yearRange();
  const now = new Date().getFullYear();

  const render = (year) => {
    for (const b of yearsBox.children) b.classList.toggle("active", +b.textContent === year);
    heading.textContent = `${year <= now ? S.entered : S.enters} ${year}`;
    list.innerHTML = "";
    for (const a of forYear(year)) {
      const li = document.createElement("li");
      li.innerHTML = `<span><span class="who">${a.name}</span> — ` +
        `<span class="what">${a.work}</span></span>` +
        `<span class="meta">${countries[a.c] || a.c} · ${S.died} ${a.d}</span>`;
      list.appendChild(li);
    }
  };

  for (let y = min; y <= max; y++) {
    const b = document.createElement("button");
    b.className = "btn ghost";
    b.textContent = y;
    b.addEventListener("click", () => render(y));
    yearsBox.appendChild(b);
  }
  render(Math.min(Math.max(now, min), max));
}
