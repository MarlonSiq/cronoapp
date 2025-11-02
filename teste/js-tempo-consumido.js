(function () {
  // --- DEV MODE (pagina) ---
  const urlParams = new URLSearchParams(window.location.search);
  const devMode = urlParams.get("dev") === "true";

  if (devMode) {
    const badge = document.createElement("div");
    badge.textContent = "DEV MODE";
    Object.assign(badge.style, {
      position: "fixed",
      top: "10px",
      right: "10px",
      background: "#ff0066",
      color: "#fff",
      padding: "5px 10px",
      borderRadius: "8px",
      fontWeight: "bold",
      zIndex: 9999,
      fontFamily: "sans-serif",
      fontSize: "12px",
    });
    document.body.appendChild(badge);
  }

  // --- Corrige display do infos se necessário ---
  const infosEl = document.getElementById("infos");
  if (infosEl && infosEl.style.display === "non") infosEl.style.display = "none";

  // --- Toggle detalhes ---
  const detailsBtn = document.getElementById("detailsBtn");
  const resultSectionMoreinfos = document.getElementById("result-section-moreinfos");
  if (detailsBtn && resultSectionMoreinfos) {
    detailsBtn.addEventListener("click", () => {
      if (resultSectionMoreinfos.style.display === "none" || resultSectionMoreinfos.style.display === "") {
        resultSectionMoreinfos.style.display = "block";
        detailsBtn.textContent = "Menos detalhes";
      } else {
        resultSectionMoreinfos.style.display = "none";
        detailsBtn.textContent = "Mais detalhes";
      }
    });
  }

  // --- TABS ---
  const tabButtons = document.querySelectorAll(".tab-button");
  const sections = document.querySelectorAll(".section, #infos");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("ativo"));
      btn.classList.add("ativo");
      const target = btn.dataset.target;
      sections.forEach(sec => {
        sec.style.display = sec.id === target ? "block" : "none";
      });
    });
  });

  // --- Configuração do TimePicker Scroll ---
  const tpConfig = {
    containerPrincipal: document.getElementById("containerPrincipal"),
    containerExtra: document.getElementById("containerExtra"),
    totalEl: document.getElementById("totalTime"),
    totalMinutesEl: document.getElementById("totalMinutes"),
    countBlocksEl: document.getElementById("countBlocks"),
    avgPerIntervalEl: document.getElementById("avgPerInterval"),
    addBlockPrincipalBtn: document.getElementById("addBlockPrincipal"),
    addBlockExtraBtn: document.getElementById("addBlockExtra"),
    resetPrincipalBtn: document.getElementById("resetPrincipal"),
    resetExtraBtn: document.getElementById("resetExtra"),
    undoPrincipalBtn: document.getElementById("undoPrincipal"),
    undoExtraBtn: document.getElementById("undoExtra"),
    devMode: !!devMode,
    maxHours: devMode ? 299 : 23,
    maxHistory: 6
  };

  // --- Inicialização do ManualTimePicker ---
  const manualConfig = {
    containerManualPrincipal: document.getElementById("manualContainerPrincipal"),
    containerManualExtra: document.getElementById("manualContainerExtra"),
    addManualBlockPrincipalBtn: document.getElementById("addManualBlockPrincipal"),
    addManualBlockExtraBtn: document.getElementById("addManualBlockExtra"),
    resetManualPrincipalBtn: document.getElementById("resetManualPrincipal"),
    resetManualExtraBtn: document.getElementById("resetManualExtra"),
    undoManualPrincipalBtn: document.getElementById("undoManualPrincipal"),
    undoManualExtraBtn: document.getElementById("undoManualExtra")
  };

  if (!window.TimePicker || typeof window.TimePicker.init !== "function") {
    console.error("Erro: TimePicker não encontrado.");
    return;
  }

  if (!window.ManualTimePicker || typeof window.ManualTimePicker.init !== "function") {
    console.error("Erro: ManualTimePicker não encontrado.");
    return;
  }

  // --- FUNÇÃO UNIFICADA DE TOTAL ---
  function calcFrom(container) {
    let sum = 0;
    container.querySelectorAll(".time-block").forEach(block => {
      const pickers = block.querySelectorAll(".picker");
      const h = parseInt(pickers[0]?.textContent) || 0;
      const m = parseInt(pickers[1]?.textContent) || 0;
      const s = parseInt(pickers[2]?.textContent) || 0;
      sum += h * 3600 + m * 60 + s;
    });
    container.querySelectorAll(".manual-time-block").forEach(block => {
      const [hourInput, minuteInput] = block.querySelectorAll("input");
      const h = parseInt(hourInput?.value) || 0;
      const m = parseInt(minuteInput?.value) || 0;
      sum += h * 3600 + m * 60;
    });
    return sum;
  }

  function updateUnifiedTotal(config) {
    const scrollContainerP = tpConfig.containerPrincipal;
    const scrollContainerE = tpConfig.containerExtra;
    const manualContainerP = manualConfig.containerManualPrincipal;
    const manualContainerE = manualConfig.containerManualExtra;

    let totalSeconds = 0;
    if (scrollContainerP) totalSeconds += calcFrom(scrollContainerP);
    if (scrollContainerE) totalSeconds += calcFrom(scrollContainerE);
    if (manualContainerP) totalSeconds += calcFrom(manualContainerP);
    if (manualContainerE) totalSeconds += calcFrom(manualContainerE);

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (config.totalEl) config.totalEl.textContent = `${h}h ${m}min ${s}seg`;

    const countPrincipal = (scrollContainerP?.querySelectorAll(".time-block").length || 0) +
                           (manualContainerP?.querySelectorAll(".manual-time-block").length || 0);
    const countExtra = (scrollContainerE?.querySelectorAll(".time-block").length || 0) +
                       (manualContainerE?.querySelectorAll(".manual-time-block").length || 0);

    if (config.countBlocksEl) {
      config.countBlocksEl.textContent = countExtra > 0
        ? `${countPrincipal} + ${countExtra} extra(s) intervalo(s)`
        : `${countPrincipal} intervalo(s)`;
    }

    if (config.totalMinutesEl) {
      const totalMins = Math.floor(totalSeconds / 60);
      const restS = totalSeconds % 60;
      config.totalMinutesEl.textContent = `${totalMins} min ${restS} seg`;
    }

    if (config.avgPerIntervalEl) {
      const totalBlocks = countPrincipal + countExtra;
      if (totalBlocks > 0) {
        const avgSeconds = totalSeconds / totalBlocks;
        const avgH = Math.floor(avgSeconds / 3600);
        const avgM = Math.floor((avgSeconds % 3600) / 60);
        const avgS = Math.floor(avgSeconds % 60);
        let parts = [];
        if (avgH > 0) parts.push(`${avgH}h`);
        if (avgM > 0) parts.push(`${avgM}min`);
        if (avgS > 0) parts.push(`${avgS}seg`);
        config.avgPerIntervalEl.textContent = `${parts.join(" ")} /${totalBlocks}`;
      } else {
        config.avgPerIntervalEl.textContent = "Nenhuma Info";
      }
    }
  }

  // --- FUNÇÃO DE TROCA DE PICKER ---
  function switchPicker(toManual) {
    const scrollSection = document.getElementById('time-picker-scroll');
    const manualSection = document.getElementById('manualPickerSection');
    if (!scrollSection || !manualSection) return;

    scrollSection.style.display = toManual ? 'none' : 'block';
    manualSection.style.display = toManual ? 'block' : 'none';

    updateUnifiedTotal({
      totalEl: tpConfig.totalEl,
      totalMinutesEl: tpConfig.totalMinutesEl,
      countBlocksEl: tpConfig.countBlocksEl,
      avgPerIntervalEl: tpConfig.avgPerIntervalEl
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    TimePicker.init(tpConfig);
    ManualTimePicker.init(manualConfig);

    // mostra scroll por padrão
    switchPicker(false);

    // --- Botões de troca ---
    const btnScroll = document.getElementById("btnScrollPicker");
    const btnManual = document.getElementById("btnManualPicker");
    btnScroll?.addEventListener("click", () => switchPicker(false));
    btnManual?.addEventListener("click", () => switchPicker(true));
  });

  // --- Expor para uso global ---
  window.switchPicker = switchPicker;
  window.updateUnifiedTotal = updateUnifiedTotal;

})();
