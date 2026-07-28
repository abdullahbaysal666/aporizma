/* QR Okuyucu: kamera karelerini ya da secilen gorseli jsQR ile CIHAZDA cozer.
   Hicbir veri disari cikmaz. detectType saf fonksiyon (test edilir). */

function detectType(text) {
  const t = (text || "").trim();
  if (/^https?:\/\//i.test(t)) return "url";
  if (/^WIFI:/i.test(t)) return "wifi";
  if (/^mailto:/i.test(t)) return "email";
  if (/^tel:/i.test(t)) return "tel";
  return "text";
}

if (typeof document !== "undefined" && document.getElementById("camstart")) {
  const S = window.CELL_STRINGS;
  const video = document.getElementById("cam");
  const note = document.getElementById("camnote");
  const startBtn = document.getElementById("camstart");
  const stopBtn = document.getElementById("camstop");
  const sonuc = document.getElementById("sonuc");
  const cikti = document.getElementById("cikti");
  const tur = document.getElementById("tur");
  const ac = document.getElementById("ac");
  const kopyala = document.getElementById("kopyala");

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let stream = null;
  let raf = 0;

  const typeLabel = { url: S.type_url, wifi: S.type_wifi, email: S.type_email, tel: S.type_tel, text: S.type_text };

  function show(text) {
    const kind = detectType(text);
    sonuc.hidden = false;
    cikti.value = text;
    tur.textContent = typeLabel[kind];
    ac.hidden = kind !== "url";
    if (kind === "url") ac.href = text;
  }

  function scanFrame() {
    if (!stream) return;
    if (video.readyState >= 2 && video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const hit = window.jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
      if (hit && hit.data) {
        show(hit.data);
        stopCam();
        return;
      }
    }
    raf = requestAnimationFrame(scanFrame);
  }

  async function startCam() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, audio: false
      });
      video.srcObject = stream;
      video.hidden = false;
      await video.play();
      startBtn.hidden = true;
      stopBtn.hidden = false;
      note.textContent = S.waiting;
      raf = requestAnimationFrame(scanFrame);
    } catch (_) {
      note.textContent = S.no_camera;
    }
  }

  function stopCam() {
    cancelAnimationFrame(raf);
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    video.hidden = true;
    startBtn.hidden = false;
    stopBtn.hidden = true;
  }

  startBtn.addEventListener("click", startCam);
  stopBtn.addEventListener("click", stopCam);

  // Gorselden okuma (drop/sec) — ikili dosya, kendi isleyicimiz
  const dropEl = document.getElementById("drop");
  const fileEl = document.getElementById("dosya");
  function readImage(file) {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      canvas.width = im.naturalWidth;
      canvas.height = im.naturalHeight;
      ctx.drawImage(im, 0, 0);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const hit = window.jsQR(img.data, img.width, img.height);
      if (hit && hit.data) show(hit.data);
      else note.textContent = S.not_found;
      URL.revokeObjectURL(url);
    };
    im.src = url;
  }
  dropEl.addEventListener("click", () => fileEl.click());
  fileEl.addEventListener("change", () => fileEl.files[0] && readImage(fileEl.files[0]));
  dropEl.addEventListener("dragover", (e) => { e.preventDefault(); dropEl.classList.add("drag"); });
  dropEl.addEventListener("dragleave", () => dropEl.classList.remove("drag"));
  dropEl.addEventListener("drop", (e) => {
    e.preventDefault();
    dropEl.classList.remove("drag");
    if (e.dataTransfer.files[0]) readImage(e.dataTransfer.files[0]);
  });

  kopyala.addEventListener("click", async () => {
    await navigator.clipboard.writeText(cikti.value);
    kopyala.textContent = S.copied;
    setTimeout(() => (kopyala.textContent = S.copy), 1200);
  });
}

if (typeof module !== "undefined") module.exports = { detectType };
