/* LLM cost calculator. Prices in USD per 1M tokens, manually verified —
   see PRICES_VERIFIED. Pure logic first (node-testable), UI below. */
"use strict";

const PRICES_VERIFIED = "2026-07-19";
const PRICES = [
  { provider: "Anthropic", model: "Claude Fable 5", in: 10, out: 50 },
  { provider: "Anthropic", model: "Claude Opus 4.8", in: 5, out: 25 },
  { provider: "Anthropic", model: "Claude Sonnet 5", in: 3, out: 15 },
  { provider: "Anthropic", model: "Claude Haiku 4.5", in: 1, out: 5 },
  { provider: "OpenAI", model: "GPT-5.6 Sol", in: 5, out: 30 },
  { provider: "OpenAI", model: "GPT-5.6 Terra", in: 2.5, out: 15 },
  { provider: "OpenAI", model: "GPT-5.6 Luna", in: 1, out: 6 },
  { provider: "OpenAI", model: "GPT-5.4 mini", in: 0.75, out: 4.5 },
  { provider: "OpenAI", model: "GPT-5.4 nano", in: 0.2, out: 1.25 },
  { provider: "Google", model: "Gemini 3.1 Pro", in: 2, out: 12 },
  { provider: "Google", model: "Gemini 3.5 Flash", in: 1.5, out: 9 },
  { provider: "Google", model: "Gemini 3 Flash", in: 0.5, out: 3 },
  { provider: "Google", model: "Gemini 3.1 Flash-Lite", in: 0.25, out: 1.5 },
];

function computeCosts(tokensIn, tokensOut, requestsPerDay) {
  return PRICES.map((p) => {
    const perRequest = (tokensIn * p.in + tokensOut * p.out) / 1e6;
    return { ...p, perRequest, perMonth: perRequest * requestsPerDay * 30 };
  }).sort((a, b) => a.perMonth - b.perMonth);
}

function fmt(usd) {
  if (usd >= 100) return "$" + Math.round(usd).toLocaleString("en-US");
  if (usd >= 1) return "$" + usd.toFixed(2);
  return "$" + usd.toFixed(4);
}

if (typeof module !== "undefined") {
  module.exports = { PRICES, computeCosts, fmt };
}

/* ---- UI ---- */
if (typeof document !== "undefined") {
  const tbody = document.querySelector("#costs tbody");
  const inputs = ["tin", "tout", "rpd"].map((id) => document.getElementById(id));

  const run = () => {
    const [tin, tout, rpd] = inputs.map((el) => Math.max(0, +el.value || 0));
    const rows = computeCosts(tin, tout, rpd);
    tbody.innerHTML = "";
    for (const r of rows) {
      const tr = document.createElement("tr");
      const name = document.createElement("td");
      name.innerHTML = `${r.model} <span class="prov">${r.provider}</span>`;
      tr.appendChild(name);
      for (const v of ["$" + r.in.toFixed(2), "$" + r.out.toFixed(2),
                       fmt(r.perRequest), fmt(r.perMonth)]) {
        const td = document.createElement("td");
        td.className = "num";
        td.textContent = v;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  };

  inputs.forEach((el) => el.addEventListener("input", run));
  run();
}
