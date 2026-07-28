/* Belge Tara: kamera/galeri gorselleri CIHAZDA tek PDF'e cevirir (pdf-lib).
   fitRect saf fonksiyon: gorseli sayfaya oranini koruyarak sigdirir (test edilir). */

function fitRect(imgW, imgH, pageW, pageH, margin) {
  const availW = pageW - margin * 2;
  const availH = pageH - margin * 2;
  const scale = Math.min(availW / imgW, availH / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  return {
    x: (pageW - w) / 2,
    y: (pageH - h) / 2,
    width: w,
    height: h,
  };
}

if (typeof document !== "undefined" && document.getElementById("cek")) {
  const S = window.CELL_STRINGS;
  const video = document.getElementById("cam");
  const note = document.getElementById("camnote");
  const startBtn = document.getElementById("camstart");
  const stopBtn = document.getElementById("camstop");
  const cekBtn = document.getElementById("cek");
  const dropEl = document.getElementById("drop");
  const fileEl = document.getElementById("dosya");
  const sayfalar = document.getElementById("sayfalar");
  const adet = document.getElementById("adet");
  const durum = document.getElementById("durum");
  const indirBtn = document.getElementById("indir");

  let stream = null;
  const pages = []; // { blob, url }

  function refresh() {
    adet.textContent = pages.length;
    indirBtn.disabled = pages.length === 0;
    durum.textContent = pages.length === 0 ? S.empty : "";
    sayfalar.innerHTML = "";
    pages.forEach((p, i) => {
      const wrap = document.createElement("div");
      wrap.style.cssText = "position:relative";
      const im = document.createElement("img");
      im.src = p.url;
      im.style.cssText = "width:72px;height:96px;object-fit:cover;border-radius:6px;border:1px solid #333";
      const del = document.createElement("button");
      del.textContent = "×";
      del.title = S.remove;
      del.style.cssText = "position:absolute;top:-6px;right:-6px;width:22px;height:22px;" +
        "border-radius:50%;border:none;background:#c0392b;color:#fff;cursor:pointer;line-height:1";
      del.addEventListener("click", () => {
        URL.revokeObjectURL(p.url);
        pages.splice(i, 1);
        refresh();
      });
      wrap.append(im, del);
      sayfalar.appendChild(wrap);
    });
  }

  function addBlob(blob) {
    pages.push({ blob, url: URL.createObjectURL(blob) });
    refresh();
  }

  async function startCam() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 } }, audio: false
      });
      video.srcObject = stream;
      video.hidden = false;
      await video.play();
      startBtn.hidden = true;
      stopBtn.hidden = false;
      cekBtn.hidden = false;
      note.textContent = "";
    } catch (_) {
      note.textContent = S.no_camera;
    }
  }

  function stopCam() {
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    video.hidden = true;
    startBtn.hidden = false;
    stopBtn.hidden = true;
    cekBtn.hidden = true;
  }

  cekBtn.addEventListener("click", () => {
    const c = document.createElement("canvas");
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    c.getContext("2d").drawImage(video, 0, 0);
    c.toBlob((b) => b && addBlob(b), "image/jpeg", 0.92);
  });

  startBtn.addEventListener("click", startCam);
  stopBtn.addEventListener("click", stopCam);

  function addFiles(list) {
    Array.from(list).forEach((f) => f.type.startsWith("image/") && addBlob(f));
  }
  dropEl.addEventListener("click", () => fileEl.click());
  fileEl.addEventListener("change", () => addFiles(fileEl.files));
  dropEl.addEventListener("dragover", (e) => { e.preventDefault(); dropEl.classList.add("drag"); });
  dropEl.addEventListener("dragleave", () => dropEl.classList.remove("drag"));
  dropEl.addEventListener("drop", (e) => {
    e.preventDefault();
    dropEl.classList.remove("drag");
    addFiles(e.dataTransfer.files);
  });

  indirBtn.addEventListener("click", async () => {
    durum.textContent = S.making;
    const { PDFDocument } = window.PDFLib;
    const doc = await PDFDocument.create();
    const A4 = { w: 595.28, h: 841.89 };
    for (const p of pages) {
      const bytes = new Uint8Array(await p.blob.arrayBuffer());
      const img = p.blob.type === "image/png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      const page = doc.addPage([A4.w, A4.h]);
      page.drawImage(img, fitRect(img.width, img.height, A4.w, A4.h, 24));
    }
    const out = await doc.save();
    const blob = new Blob([out], { type: "application/pdf" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "belge.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    durum.textContent = "";
  });
}

if (typeof module !== "undefined") module.exports = { fitRect };
