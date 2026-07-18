"use strict";
const $ = (id) => document.getElementById(id);
chrome.storage.local.get(["apiKey", "model"]).then((cfg) => {
  $("key").value = cfg.apiKey || "";
  $("model").value = cfg.model || "gemini-2.5-flash";
});
$("save").addEventListener("click", async () => {
  await chrome.storage.local.set({ apiKey: $("key").value.trim(), model: $("model").value });
  $("saved").textContent = "Saved ✓";
  setTimeout(() => ($("saved").textContent = ""), 1500);
});
