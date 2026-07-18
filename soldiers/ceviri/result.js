"use strict";
const LANGS = ["English", "Türkçe", "Español", "Deutsch", "Français", "Italiano",
  "Português", "العربية", "Русский", "日本語", "한국어", "中文"];
const $ = (id) => document.getElementById(id);

async function init() {
  const sel = $("lang");
  for (const l of LANGS) sel.add(new Option(l, l));
  const cfg = await chrome.storage.local.get(["targetLang", "pendingText", "apiKey"]);
  sel.value = cfg.targetLang || (navigator.language.startsWith("tr") ? "Türkçe" : "English");
  $("input").value = cfg.pendingText || "";
  $("opts").addEventListener("click", (e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); });
  $("go").addEventListener("click", run);
  $("copy").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("output").value);
    $("copy").textContent = "Copied!";
    setTimeout(() => ($("copy").textContent = "Copy"), 1200);
  });
  if (cfg.pendingText && cfg.apiKey) run();
}

async function run() {
  const text = $("input").value.trim();
  if (!text) return;
  const { apiKey, model } = await chrome.storage.local.get(["apiKey", "model"]);
  if (!apiKey) {
    $("status").className = "note err";
    $("status").textContent = "Set your free Gemini API key first (link below).";
    return;
  }
  const target = $("lang").value;
  await chrome.storage.local.set({ targetLang: target });
  $("go").disabled = true;
  $("status").className = "note";
  $("status").textContent = "Translating...";
  try {
    const result = await translate(text, target, apiKey, model || "gemini-2.5-flash");
    $("output").value = result;
    $("output").hidden = false;
    $("copy").hidden = false;
    $("status").textContent = "Done.";
  } catch (e) {
    $("status").className = "note err";
    $("status").textContent = String(e.message || e);
  } finally {
    $("go").disabled = false;
  }
}

init();
