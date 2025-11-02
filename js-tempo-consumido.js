
// js-tempo-consumido.js (corrigido)
// Unifica totals entre picker scroll e manual, gerencia troca de UI e inicialização.

(function () {
  // DEV MODE
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

  // corrige atributo errado
  const infosEl = document.getElementById("infos");
  if (infosEl && infosEl.style.display === "non") infosEl.style.display = "none";

  // Toggle detalhes
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

  // TABS
  const tabButtons = document.querySelectorAll(".tab-button");
  const sections = document.querySelectorAll(".section, #infos");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("ativo"));
      btn.classList.add("ativo");
      const target = btn.dataset.target;
      sections.forEach(sec => {
        if (sec.id === target) sec.style.display = "block";
        else sec.style.display = "none";
      });
    });
  });

  // config refs (DOM will be available on DOMContentLoaded)
  const tpConfig = {
    containerPrincipal: null,
    containerExtra: null,
  };
  const manualConfig = {
    containerManualPrincipal: null,
    containerManualExtra: null,
  };

  // função unificada que lê DOM por conta própria (não precisa argumento)
  function calcFrom(container) {
    if (!container) return 0;
    let sum = 0;
    // scroll blocks
    container.querySelectorAll(".time-block").forEach((block) => {
      const pickers = block.querySelectorAll(".picker");
      const h = parseInt(pickers[0]?.textContent) || 0;
      const m = parseInt(pickers[1]?.textContent) || 0;
      const s = parseInt(pickers[2]?.textContent) || 0;
      sum += h * 3600 + m * 60 + s;
    });
    // manual blocks
    container.querySelectorAll(".manual-time-block").forEach(block => {
      const inputs = block.querySelectorAll("input");
      if (inputs.length >= 2) {
        const h = parseInt(inputs[0].value) || 0;
        const m = parseInt(inputs[1].value) || 0;
        sum += h * 3600 + m * 60;
      }
    });
    return sum;
  }

  function updateUnifiedTotal() {
    const scrollContainerP = document.getElementById("containerPrincipal");
    const scrollContainerE = document.getElementById("containerExtra");
    const manualContainerP = document.getElementById("manualContainerPrincipal");
    const manualContainerE = document.getElementById("manualContainerExtra");

    let totalSeconds = 0;
    if (scrollContainerP) totalSeconds += calcFrom(scrollContainerP);
    if (scrollContainerE) totalSeconds += calcFrom(scrollContainerE);
    if (manualContainerP) totalSeconds += calcFrom(manualContainerP);
    if (manualContainerE) totalSeconds += calcFrom(manualContainerE);

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const totalEl = document.getElementById("totalTime");
    const countBlocksEl = document.getElementById("countBlocks");
    const totalMinutesEl = document.getElementById("totalMinutes");
    const avgPerIntervalEl = document.getElementById("avgPerInterval");

    if (totalEl) totalEl.textContent = `${h}h ${m}min ${s}seg`;

    const countPrincipal = (scrollContainerP?.querySelectorAll(".time-block").length || 0) + (manualContainerP?.querySelectorAll(".manual-time-block").length || 0);
    const countExtra = (scrollContainerE?.querySelectorAll(".time-block").length || 0) + (manualContainerE?.querySelectorAll(".manual-time-block").length || 0);

    if (countBlocksEl) {
      countBlocksEl.textContent = countExtra > 0 ? `${countPrincipal} + ${countExtra} extra(s) intervalo(s)` : `${countPrincipal} intervalo(s)`;
    }

    if (totalMinutesEl) {
      const totalMins = Math.floor(totalSeconds / 60);
      const restS = totalSeconds % 60;
      totalMinutesEl.textContent = `${totalMins} min ${restS} seg`;
    }

    if (avgPerIntervalEl) {
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
        avgPerIntervalEl.textContent = `${parts.join(" ")} /${totalBlocks}`;
      } else {
        avgPerIntervalEl.textContent = "Nenhuma Info";
      }
    }

    // atualiza seção infos se existir
    const infosTotalEl = document.querySelector("#infos #total");
    if (infosTotalEl) {
      infosTotalEl.textContent = `${h}h ${m}min ${s}seg`;
    }
  }

  // expose globally so picker/manual can call it
  window.updateUnifiedTotal = updateUnifiedTotal;

  function clearVisibleBlocks(container) {
    if (!container) return;
    container.querySelectorAll(".time-block, .manual-time-block").forEach(b => b.remove());
  }

  // DOM ready: initialize modules and UI controls
  document.addEventListener("DOMContentLoaded", () => {
    // set config refs
    tpConfig.containerPrincipal = document.getElementById("containerPrincipal");
    tpConfig.containerExtra = document.getElementById("containerExtra");

    manualConfig.containerManualPrincipal = document.getElementById("manualContainerPrincipal");
    manualConfig.containerManualExtra = document.getElementById("manualContainerExtra");

    // initialize pickers (check availability)
    if (!window.TimePicker || typeof window.TimePicker.init !== "function") {
      console.warn("Aviso: TimePicker não encontrado. Verifique ordem de scripts.");
    } else {
      // initialize with the buttons/els expected by TimePicker
      const tpInitConfig = {
        ...tpConfig,
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
      window.TimePicker.init(tpInitConfig);
    }

    if (!window.ManualTimePicker || typeof window.ManualTimePicker.init !== "function") {
      console.warn("Aviso: ManualTimePicker não encontrado. Verifique ordem de scripts.");
    } else {
      const mInitConfig = {
        containerManualPrincipal: document.getElementById("manualContainerPrincipal"),
        containerManualExtra: document.getElementById("manualContainerExtra"),
        addManualBlockPrincipalBtn: document.getElementById("addManualBlockPrincipal"),
        addManualBlockExtraBtn: document.getElementById("addManualBlockExtra"),
        resetManualPrincipalBtn: document.getElementById("resetManualPrincipal"),
        resetManualExtraBtn: document.getElementById("resetManualExtra"),
        undoManualPrincipalBtn: document.getElementById("undoManualPrincipal"),
        undoManualExtraBtn: document.getElementById("undoManualExtra")
      };
      window.ManualTimePicker.init(mInitConfig);
    }

    // Buttons to switch UI
    const btnScroll = document.getElementById("btnScrollPicker");
    const btnManual = document.getElementById("btnManualPicker");
    const scrollSection = document.getElementById("time-picker-scroll");
    const manualSection = document.getElementById("manualPickerSection");

    function switchPicker(toManual) {
      if (!scrollSection || !manualSection) return;
      if (toManual) {
        scrollSection.style.display = "none";
        manualSection.style.display = "block";
        // do not clear storage; just remove visible blocks to avoid duplicates
        clearVisibleBlocks(scrollSection);
      } else {
        manualSection.style.display = "none";
        scrollSection.style.display = "block";
        clearVisibleBlocks(manualSection);
      }
      // force unified update
      updateUnifiedTotal();
    }

    if (btnScroll) btnScroll.addEventListener("click", () => switchPicker(false));
    if (btnManual) btnManual.addEventListener("click", () => switchPicker(true));

    // show scroll by default
    switchPicker(false);

    // ensure pickers call unified update on interaction by polling/registering a MutationObserver on containers
    const observerTargets = [tpConfig.containerPrincipal, tpConfig.containerExtra, manualConfig.containerManualPrincipal, manualConfig.containerManualExtra].filter(Boolean);
    observerTargets.forEach(t => {
      const obs = new MutationObserver(() => {
        updateUnifiedTotal();
      });
      obs.observe(t, { childList: true, subtree: true, characterData: true, attributes: true });
    });

    // initial total update
    updateUnifiedTotal();
  });

})();
