/* Word/character/sentence/paragraph counter + reading time. Pure logic first. */
"use strict";

function countWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function countChars(text) {
  return Array.from(text).length;
}

function countCharsNoSpaces(text) {
  return Array.from(text.replace(/\s+/g, "")).length;
}

function countSentences(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const matches = trimmed.match(/[^.!?]*[.!?]+/g);
  if (matches && matches.length) {
    const nonEmpty = matches.filter((m) => m.replace(/[.!?]+$/, "").trim().length > 0 || m.trim().length > 0);
    return nonEmpty.length;
  }
  return 1;
}

function countParagraphs(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const parts = trimmed.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
  return parts.length || 1;
}

function readingTime(words, wpm) {
  const speed = wpm || 200;
  const totalSeconds = Math.round((words / speed) * 60);
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
  };
}

function analyzeText(text) {
  const words = countWords(text);
  return {
    words,
    chars: countChars(text),
    charsNoSpaces: countCharsNoSpaces(text),
    sentences: countSentences(text),
    paragraphs: countParagraphs(text),
    reading: readingTime(words),
  };
}

if (typeof module !== "undefined") {
  module.exports = {
    countWords,
    countChars,
    countCharsNoSpaces,
    countSentences,
    countParagraphs,
    readingTime,
    analyzeText,
  };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const input = document.getElementById("input");
  const clearBtn = document.getElementById("clear");
  const el = {
    words: document.getElementById("stat-words"),
    chars: document.getElementById("stat-chars"),
    charsNoSpace: document.getElementById("stat-chars-no-space"),
    sentences: document.getElementById("stat-sentences"),
    paragraphs: document.getElementById("stat-paragraphs"),
    reading: document.getElementById("stat-reading"),
  };

  const formatReading = (reading) => {
    if (reading.minutes > 0) {
      return S.reading_min_sec.replace("{m}", reading.minutes).replace("{s}", reading.seconds);
    }
    return S.reading_sec.replace("{s}", reading.seconds);
  };

  const run = () => {
    const stats = analyzeText(input.value);
    el.words.textContent = stats.words;
    el.chars.textContent = stats.chars;
    el.charsNoSpace.textContent = stats.charsNoSpaces;
    el.sentences.textContent = stats.sentences;
    el.paragraphs.textContent = stats.paragraphs;
    el.reading.textContent = formatReading(stats.reading);
  };

  input.addEventListener("input", run);
  clearBtn.addEventListener("click", () => {
    input.value = "";
    run();
    input.focus();
  });
  run();
}
