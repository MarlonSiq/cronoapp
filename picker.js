window.TimePicker = (function () {
  const btnScroll = document.getElementById("btnScrollPicker");
  const btnManual = document.getElementById("btnManualPicker");
  const scrollSection = document.getElementById("time-picker-scroll");
  const manualSection = document.getElementById("manualPickerSection");

  function switchPicker(toManual) {
    if (!scrollSection || !manualSection) return;
    if (toManual) {
      scrollSection.style.display = "none";
      manualSection.style.display = "block";
    } else {
      manualSection.style.display = "none";
      scrollSection.style.display = "block";
    }
    updateTotal();
  }

  function updateTotal() {
    let totalSec = 0;
    const totalEl = document.getElementById("totalTime");
    const totalMinutesEl = document.getElementById("totalMinutes");
    const countBlocksEl = document.getElementById("countBlocks");
    const avgPerIntervalEl = document.getElementById("avgPerInterval");

    const containers = [];
    if (scrollSection.style.display !== "none") {
      containers.push(document.getElementById("containerPrincipal"));
      containers.push(document.getElementById("containerExtra"));
    }
    if (manualSection.style.display !== "none") {
      containers.push(document.getElementById("manualContainerPrincipal"));
      containers.push(document.getElementById("manualContainerExtra"));
    }

    let totalBlocks = 0;

    containers.forEach(c => {
      if (!c) return;
      c.querySelectorAll(".time-block, .manual-time-block").forEach(block => {
        const pickers = block.querySelectorAll(".picker, input");
        if (pickers.length === 3) { // scroll picker
          const h = parseInt(pickers[0].textContent) || 0;
          const m = parseInt(pickers[1].textContent) || 0;
          const s = parseInt(pickers[2].textContent) || 0;
          totalSec += h*3600 + m*60 + s;
        } else if (pickers.length === 2) { // manual picker
          const h = parseInt(pickers[0].value) || 0;
          const m = parseInt(pickers[1].value) || 0;
          totalSec += h*3600 + m*60;
        }
        totalBlocks++;
      });
    });

    const h = Math.floor(totalSec/3600);
    const m = Math.floor((totalSec%3600)/60);
    const s = totalSec%60;

    if (totalEl) totalEl.textContent = `${h}h ${m}min ${s}seg`;
    if (totalMinutesEl) totalMinutesEl.textContent = `${Math.floor(totalSec/60)} min ${s} seg`;
    if (countBlocksEl) countBlocksEl.textContent = totalBlocks > 0 ? `${totalBlocks} intervalo(s)` : "Nenhum intervalo";
    if (avgPerIntervalEl) {
      if (totalBlocks > 0) {
        const avgSec = totalSec / totalBlocks;
        const avgH = Math.floor(avgSec/3600);
        const avgM = Math.floor((avgSec%3600)/60);
        const avgS = Math.floor(avgSec%60);
        let parts = [];
        if (avgH) parts.push(`${avgH}h`);
        if (avgM) parts.push(`${avgM}min`);
        if (avgS) parts.push(`${avgS}seg`);
        avgPerIntervalEl.textContent = `${parts.join(" ")} /${totalBlocks}`;
      } else {
        avgPerIntervalEl.textContent = "Nenhuma Info";
      }
    }
  }

  // bind dos botões
  if (btnScroll) btnScroll.addEventListener("click", () => switchPicker(false));
  if (btnManual) btnManual.addEventListener("click", () => switchPicker(true));

  // inicializa mostrando scroll
  document.addEventListener("DOMContentLoaded", () => {
    switchPicker(false);
  });

  return {
    init: function() {}, // só pra manter compatibilidade com js-tempo-consumido.js
    updateTotal
  };
})();
