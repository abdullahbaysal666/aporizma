/* Aporizma organ: shared helpers. No dependencies, no tracking cookies. */
window.Aporizma = {
  // Download a string as a file, entirely client-side.
  download(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  },

  // Wire a dropzone + hidden file input to a callback(text, filename).
  dropzone(el, input, cb) {
    const read = (file) => {
      const r = new FileReader();
      r.onload = () => cb(String(r.result), file.name);
      r.readAsText(file);
    };
    el.addEventListener("click", () => input.click());
    input.addEventListener("change", () => input.files[0] && read(input.files[0]));
    el.addEventListener("dragover", (e) => { e.preventDefault(); el.classList.add("drag"); });
    el.addEventListener("dragleave", () => el.classList.remove("drag"));
    el.addEventListener("drop", (e) => {
      e.preventDefault();
      el.classList.remove("drag");
      if (e.dataTransfer.files[0]) read(e.dataTransfer.files[0]);
    });
  },

  // Pheromone beacon stub — becomes a real endpoint when telemetry lands.
  beacon() {},
};
