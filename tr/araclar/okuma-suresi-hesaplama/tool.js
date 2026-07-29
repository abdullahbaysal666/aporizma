/* Reading time / speaking time estimator. Pure logic first. */
"use strict";

const RATES = {
  en: { reading: 200, speaking: 130 },
  tr: { reading: 180, speaking: 120 },
};

function countWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function ratesFor(lang) {
  return RATES[lang] || RATES.en;
}

function estimateTime(words, wpm) {
  const totalSeconds = Math.round((words / wpm) * 60);
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
  };
}

function analyzeText(text, lang) {
  const words = countWords(text);
  const rates = ratesFor(lang);
  return {
    words,
    lang: RATES[lang] ? lang : "en",
    reading: estimateTime(words, rates.reading),
    speaking: estimateTime(words, rates.speaking),
    rates,
  };
}

if (typeof module !== "undefined") {
  module.exports = {
    countWords,
    ratesFor,
    estimateTime,
    analyzeText,
    RATES,
  };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const input = document.getElementById("input");
  const langSelect = document.getElementById("lang");
  const clearBtn = document.getElementById("clear");
  const el = {
    words: document.getElementById("stat-words"),
    reading: document.getElementById("stat-reading"),
    speaking: document.getElementById("stat-speaking"),
    note: document.getElementById("rate-note"),
  };

  const formatTime = (t) => {
    if (t.minutes > 0) {
      return S.min_sec.replace("{m}", t.minutes).replace("{s}", t.seconds);
    }
    return S.sec_only.replace("{s}", t.seconds);
  };

  const run = () => {
    const lang = langSelect.value;
    const stats = analyzeText(input.value, lang);
    el.words.textContent = stats.words;
    el.reading.textContent = formatTime(stats.reading);
    el.speaking.textContent = formatTime(stats.speaking);
    const langLabel = stats.lang === "tr" ? S.lang_tr : S.lang_en;
    el.note.textContent = S.rate_note
      .replace("{rwpm}", stats.rates.reading)
      .replace("{swpm}", stats.rates.speaking)
      .replace("{lang}", langLabel);
  };

  input.addEventListener("input", run);
  langSelect.addEventListener("change", run);
  clearBtn.addEventListener("click", () => {
    input.value = "";
    run();
    input.focus();
  });
  run();
}
