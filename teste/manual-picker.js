(function () {
  let intervalCounter = { principal: 0, extra: 0 };
  const history = { principal: [], extra: [] };

  function createManualInput(labelText) {
    const wrapper = document.createElement("div");
    wrapper.className = "manual-time-block";

    const label = document.createElement("div");
    label.className = "manual-block-label";
    label.textContent = labelText;

    const hourInput = document.createElement("input");
    hourInput.type = "number";
    hourInput.min = 0;
    hourInput.max = 23;
    hourInput.placeholder = "Horas";

    const minuteInput = document.createElement("input");
    minuteInput.type = "number";
    minuteInput.min = 0;
    minuteInput.max = 59;
    minuteInput.placeholder = "Minutos";

    const removeBtn = document.createElement("button");
    removeBtn.className = "manual-remove-btn";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      wrapper.remove();
      renumberBlocks();
      updateTotals();
      saveState(wrapper.dataset.extra === "true");
    });

    wrapper.append(label, hourInput, document.createTextNode(":"), minuteInput, removeBtn);
    wrapper.dataset.extra = "false"; // default
    [hourInput, minuteInput].forEach(input => input.addEventListener("input", updateTotals));

    return { wrapper, hourInput, minuteInput };
  }

  function createBlock(container, isExtra) {
    const type = isExtra ? "extra" : "principal";
    intervalCounter[type]++;
    const { wrapper } = createManualInput(`Intervalo ${intervalCounter[type]}`);
    wrapper.dataset.extra = isExtra ? "true" : "false";
    container.appendChild(wrapper);
    saveState(isExtra);
    updateTotals();
  }

  function renumberBlocks() {
    const containers = [
      { type: "principal", container: document.getElementById("manualContainerPrincipal") },
      { type: "extra", container: document.getElementById("manualContainerExtra") }
    ];
    containers.forEach(({ type, container }) => {
      if (!container) return;
      const blocks = container.querySelectorAll(".manual-time-block");
      blocks.forEach((block, i) => {
        const label = block.querySelector(".manual-block-label");
        if (label) label.textContent = `Intervalo ${i + 1}`;
      });
      intervalCounter[type] = blocks.length;
    });
  }

  function updateTotals() {
    let totalSec = 0;
    const allBlocks = document.querySelectorAll(".manual-time-block");
    allBlocks.forEach(block => {
      const [hourInput, minuteInput] = block.querySelectorAll("input");
      const h = parseInt(hourInput.value) || 0;
      const m = parseInt(minuteInput.value) || 0;
      totalSec += h * 3600 + m * 60;
    });

    // atualiza UI unificado
    const totalEl = document.getElementById("totalTime");
    const totalMinutesEl = document.getElementById("totalMinutes");
    const countBlocksEl = document.getElementById("countBlocks");
    const avgPerIntervalEl = document.getElementById("avgPerInterval");

    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;

    if (totalEl) totalEl.textContent = `${h}h ${m}min ${s}seg`;
    if (totalMinutesEl) totalMinutesEl.textContent = `${Math.floor(totalSec / 60)} min ${s} seg`;
    if (countBlocksEl) countBlocksEl.textContent = allBlocks.length;
    if (avgPerIntervalEl) {
      if (allBlocks.length > 0) {
        const avgSec = totalSec / allBlocks.length;
        const avgH = Math.floor(avgSec / 3600);
        const avgM = Math.floor((avgSec % 3600) / 60);
        const avgS = Math.floor(avgSec % 60);
        let parts = [];
        if (avgH) parts.push(`${avgH}h`);
        if (avgM) parts.push(`${avgM}min`);
        if (avgS) parts.push(`${avgS}seg`);
        avgPerIntervalEl.textContent = `${parts.join(" ")} /${allBlocks.length}`;
      } else {
        avgPerIntervalEl.textContent = "Nenhuma Info";
      }
    }

    // retorna total em segundos para integração externa
    return totalSec;
  }

  function saveState(isExtra) {
    const container = isExtra
      ? document.getElementById("manualContainerExtra")
      : document.getElementById("manualContainerPrincipal");
    if (!container) return;
    const blocks = Array.from(container.querySelectorAll(".manual-time-block"));
    history[isExtra ? "extra" : "principal"].push(
      blocks.map(b => ({ hour: b.querySelectorAll("input")[0].value, minute: b.querySelectorAll("input")[1].value }))
    );
    if (history[isExtra ? "extra" : "principal"].length > 5) history[isExtra ? "extra" : "principal"].shift();
  }

  function resetBlocks(isExtra) {
    const container = isExtra
      ? document.getElementById("manualContainerExtra")
      : document.getElementById("manualContainerPrincipal");
    if (!container) return;
    container.innerHTML = "";
    intervalCounter[isExtra ? "extra" : "principal"] = 0;
    if (!isExtra) {
      createBlock(container, false);
      createBlock(container, false);
    }
    updateTotals();
  }

  function undo(isExtra) {
    const type = isExtra ? "extra" : "principal";
    const last = history[type].pop();
    if (!last) return;
    const container = isExtra
      ? document.getElementById("manualContainerExtra")
      : document.getElementById("manualContainerPrincipal");
    container.innerHTML = "";
    last.forEach(data => {
      const { wrapper, hourInput, minuteInput } = createManualInput("Intervalo ?");
      wrapper.dataset.extra = isExtra ? "true" : "false";
      hourInput.value = data.hour || 0;
      minuteInput.value = data.minute || 0;
      container.appendChild(wrapper);
    });
    renumberBlocks();
    updateTotals();
  }

  function init(config) {
    if (!config.containerManualPrincipal || !config.containerManualExtra) {
      console.warn("ManualTimePicker: containers não definidos corretamente");
      return;
    }
    config.addManualBlockPrincipalBtn?.addEventListener("click", () =>
      createBlock(config.containerManualPrincipal, false)
    );
    config.addManualBlockExtraBtn?.addEventListener("click", () =>
      createBlock(config.containerManualExtra, true)
    );
    config.resetManualPrincipalBtn?.addEventListener("click", () => resetBlocks(false));
    config.resetManualExtraBtn?.addEventListener("click", () => resetBlocks(true));
    config.undoManualPrincipalBtn?.addEventListener("click", () => undo(false));
    config.undoManualExtraBtn?.addEventListener("click", () => undo(true));

    // cria 2 blocos padrão
    createBlock(config.containerManualPrincipal, false);
    createBlock(config.containerManualPrincipal, false);
  }

  window.ManualTimePicker = { init, updateTotals };
})();
