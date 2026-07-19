/* YouTube title/thumbnail preview: image never leaves the browser. */
"use strict";

const MOBILE_VISIBLE = 65;

function truncateTitle(t, limit = MOBILE_VISIBLE) {
  return t.length > limit ? t.slice(0, limit).trimEnd() + "..." : t;
}

if (typeof module !== "undefined") {
  module.exports = { truncateTitle, MOBILE_VISIBLE };
}

if (typeof document !== "undefined") {
  const S = window.CELL_STRINGS;
  const title = document.getElementById("vtitle");
  const chan = document.getElementById("vchannel");
  const counter = document.getElementById("counter");

  const sync = () => {
    const t = title.value || title.placeholder;
    const c = chan.value || chan.placeholder;
    document.getElementById("titleD").textContent = t;
    document.getElementById("chanD").textContent = c;
    document.getElementById("chanM").textContent = c;
    document.getElementById("titleM").textContent = truncateTitle(t);
    counter.textContent = S.counter_fmt
      .replace("{n}", title.value.length)
      .replace("{m}", MOBILE_VISIBLE);
    counter.className = title.value.length > MOBILE_VISIBLE ? "note err" : "note ok";
  };

  title.addEventListener("input", sync);
  chan.addEventListener("input", sync);
  sync();

  const drop = document.getElementById("drop");
  const file = document.getElementById("file");
  const setThumb = (f) => {
    const url = URL.createObjectURL(f);
    for (const id of ["thumbD", "thumbM"]) {
      document.getElementById(id).style.backgroundImage = `url('${url}')`;
    }
  };
  drop.addEventListener("click", () => file.click());
  file.addEventListener("change", () => file.files[0] && setThumb(file.files[0]));
  drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("drag"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("drag"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("drag");
    if (e.dataTransfer.files[0]) setThumb(e.dataTransfer.files[0]);
  });
}
