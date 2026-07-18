"use strict";
const LANGS = ["English", "Türkçe", "Español", "Deutsch", "Français", "Italiano",
  "Português", "العربية", "Русский", "日本語", "한국어", "中文"];

const $ = (id) => document.getElementById(id);

async function init() {
  const sel = $("lang");
  for (const l of LANGS) sel.add(new Option(l, l));
  const cfg = await chrome.storage.local.get(["targetLang", "apiKey", "model"]);
  sel.value = cfg.targetLang || (navigator.language.startsWith("tr") ? "Türkçe" : "English");
  if (!cfg.apiKey) {
    $("status").innerHTML = "";
    $("status").className = "note err";
    $("status").textContent = "Set your free Gemini API key first (link below).";
  }
  $("opts").addEventListener("click", (e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); });
  $("go").addEventListener("click", run);
  $("copy").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("output").value);
    $("copy").textContent = "Copied!";
    setTimeout(() => ($("copy").textContent = "Copy"), 1200);
  });
}

async function run() {
  const text = $("input").value.trim();
  if (!text) return;
  const { apiKey, model } = await chrome.storage.local.get(["apiKey", "model"]);
  if (!apiKey) { chrome.runtime.openOptionsPage(); return; }
  const target = $("lang").value;
  await chrome.storage.local.set({ targetLang: target });
  $("go").disabled = true;
  $("status").className = "note";
  const kind = detectSubtitle(text);
  $("status").textContent = kind ? `Subtitle detected (${kind.toUpperCase()}) — translating cues...` : "Translating...";
  try {
    const result = await translate(text, target, apiKey, model || "gemini-2.5-flash");
    $("output").value = result;
    $("output").hidden = false;
    $("copy").hidden = false;
    $("status").textContent = "Done. Timing untouched — only text lines translated.";
  } catch (e) {
    $("status").className = "note err";
    $("status").textContent = String(e.message || e);
  } finally {
    $("go").disabled = false;
  }
}

init();
