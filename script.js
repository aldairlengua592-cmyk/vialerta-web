const rutaForm = document.getElementById("rutaForm");
const rutaResultado = document.getElementById("rutaResultado");
const reporteForm = document.getElementById("reporteForm");
const reporteConfirmacion = document.getElementById("reporteConfirmacion");
const incidenteSelect = document.getElementById("incidente");
const mapIframe = document.getElementById("mapIframe");
const heatmapCanvas = document.getElementById("heatmapCanvas");
const mapSummary = document.getElementById("mapSummary");
const heatGrid = document.getElementById("heatGrid");
const listaReportes = document.getElementById("listaReportes");

const drawHeatmap = (canvas, riskLevels) => {
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  
  canvas.width = width;
  canvas.height = height;
  
  // Limpiar canvas
  ctx.clearRect(0, 0, width, height);
  
  // Crear puntos de calor basados en niveles de riesgo
  const heatPoints = riskLevels.map((segment, index) => ({
    x: (index + 1) * (width / 5),
    y: height / 2 + (Math.random() - 0.5) * 60,
    intensity: segment.level.class === "red" ? 1 : segment.level.class === "yellow" ? 0.6 : 0.3,
    color: segment.level.class === "red" ? "#eb5757" : segment.level.class === "yellow" ? "#f3c95f" : "#2dc36a"
  }));
  
  // Dibujar gradientes radiales tipo SENAMHI
  heatPoints.forEach(point => {
    const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 120);
    
    if (point.intensity >= 0.9) {
      gradient.addColorStop(0, "rgba(235, 87, 87, 0.8)");
      gradient.addColorStop(0.5, "rgba(243, 201, 95, 0.4)");
      gradient.addColorStop(1, "rgba(45, 195, 106, 0.1)");
    } else if (point.intensity >= 0.5) {
      gradient.addColorStop(0, "rgba(243, 201, 95, 0.7)");
      gradient.addColorStop(0.6, "rgba(45, 195, 106, 0.3)");
      gradient.addColorStop(1, "rgba(0, 191, 255, 0.05)");
    } else {
      gradient.addColorStop(0, "rgba(45, 195, 106, 0.5)");
      gradient.addColorStop(1, "rgba(0, 191, 255, 0.1)");
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  });
};

const resizeHeatmapCanvas = () => {
  if (!heatmapCanvas) return;
  const container = heatmapCanvas.parentElement;
  heatmapCanvas.style.width = container.offsetWidth + "px";
  heatmapCanvas.style.height = container.offsetHeight + "px";
};

window.addEventListener("resize", resizeHeatmapCanvas);

const reportesGuardados = JSON.parse(localStorage.getItem("reportesVialerta") || "[]");

const renderReportes = () => {
  if (!listaReportes) return;

  if (reportesGuardados.length === 0) {
    listaReportes.innerHTML = `<li class="report-item report-item--empty">Aún no hay reportes registrados.</li>`;
    return;
  }

  listaReportes.innerHTML = reportesGuardados
    .slice()
    .reverse()
    .map((reporte) => `
      <li class="report-item">
        <strong>${reporte.tipo}</strong>
        <span>${reporte.ubicacion}</span>
        <p>${reporte.descripcion}</p>
        <small>${reporte.fecha}</small>
      </li>
    `)
    .join("");
};

const incidentesNivelRiesgo = {
  iluminacion: { nivel: "Alto", color: "red", mensaje: "Zona con poca iluminación detectada." },
  vandalismo: { nivel: "Alto", color: "red", mensaje: "Incidente de vandalismo reportado." },
  transeuntes: { nivel: "Medio", color: "yellow", mensaje: "Área con baja circulación de personas." },
  pavimento: { nivel: "Medio", color: "yellow", mensaje: "Infraestructura deficiente en la ruta." }
};

const randomRiskLevel = () => {
  const levels = [
    { class: "green", label: "Seguro", description: "Trayecto con buena iluminación y flujo peatonal." },
    { class: "yellow", label: "Precaución", description: "Zona que requiere atención por menor iluminación." },
    { class: "red", label: "Alto riesgo", description: "Segmento con mayor riesgo y poca visibilidad." }
  ];
  return levels[Math.floor(Math.random() * levels.length)];
};

if (rutaForm) {
  rutaForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const origen = document.getElementById("origen").value.trim();
    const destino = document.getElementById("destino").value.trim();
    const movilidad = document.getElementById("movilidad").value;

    const resultado = {
      ruta: `${origen} → ${destino}`,
      seguridad: "Muy alta",
      tiempo: movilidad === "peatonal" ? "18 min" : movilidad === "bicicleta" ? "12 min" : "14 min",
      distancia: movilidad === "peatonal" ? "2.1 km" : movilidad === "bicicleta" ? "3.5 km" : "3.0 km"
    };

    rutaResultado.classList.add("active");
    rutaResultado.innerHTML = `
      <div>
        <h3>Ruta recomendada</h3>
        <p>Esta ruta prioriza iluminación y flujo peatonal.</p>
        <ul class="result-list">
          <li><span>Origen / destino</span><strong>${resultado.ruta}</strong></li>
          <li><span>Nivel de seguridad</span><strong>${resultado.seguridad}</strong></li>
          <li><span>Tiempo estimado</span><strong>${resultado.tiempo}</strong></li>
          <li><span>Distancia</span><strong>${resultado.distancia}</strong></li>
        </ul>
      </div>
    `;

    if (mapSummary) {
      mapSummary.textContent = `Ruta calculada entre ${origen} y ${destino}. El mapa se actualiza automáticamente para mostrar la ruta.`;
    }

    if (heatGrid) {
      const riskLevels = [
        { label: "Inicio", level: randomRiskLevel() },
        { label: "Medio camino", level: randomRiskLevel() },
        { label: "Cruce céntrico", level: randomRiskLevel() },
        { label: "Destino", level: randomRiskLevel() }
      ];

      heatGrid.innerHTML = riskLevels.map((segment) => `
        <div class="heat-zone heat-zone--${segment.level.class}">${segment.level.label}</div>
      `).join("");
      
      drawHeatmap(heatmapCanvas, riskLevels);
    }

    if (mapIframe) {
      const mapQuery = encodeURIComponent(`${origen} a ${destino}`);
      mapIframe.src = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
    }
  });
}

if (reporteForm) {
  reporteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const incidente = incidenteSelect.value;
    const ubicacion = document.getElementById("ubicacion").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();

    const riesgo = incidentesNivelRiesgo[incidente];

    reporteConfirmacion.classList.add("active");
    reporteConfirmacion.innerHTML = `
      <div>
        <h3>Reporte registrado</h3>
        <p>Reporte registrado correctamente. Gracias por contribuir con la comunidad.</p>
        <p><strong>Tipo:</strong> ${incidente.replace(/^[a-z]/, (c) => c.toUpperCase())}</p>
        <p><strong>Ubicación:</strong> ${ubicacion}</p>
        <p><strong>Nivel de riesgo:</strong> ${riesgo.nivel}</p>
      </div>
    `;

    reporteConfirmacion.style.borderColor = riesgo.color === "red"
      ? "rgba(235, 87, 87, 0.25)"
      : "rgba(243, 201, 95, 0.25)";
    reporteConfirmacion.style.background = riesgo.color === "red"
      ? "linear-gradient(180deg, rgba(235, 87, 87, 0.08), #ffffff)"
      : "linear-gradient(180deg, rgba(243, 201, 95, 0.08), #ffffff)";

    reportesGuardados.push({
      tipo: incidente.replace(/^[a-z]/, (c) => c.toUpperCase()),
      ubicacion,
      descripcion,
      fecha: new Date().toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })
    });

    localStorage.setItem("reportesVialerta", JSON.stringify(reportesGuardados));
    renderReportes();
    reporteForm.reset();
  });
}

renderReportes();

if (incidenteSelect) {
  incidenteSelect.addEventListener("change", () => {
    const incidente = incidenteSelect.value;
    const riesgo = incidentesNivelRiesgo[incidente];

    if (riesgo) {
      incidenteSelect.style.borderColor = riesgo.color;
    }
  });
}

window.addEventListener("scroll", () => {
  const sections = document.querySelectorAll(".section");
  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) {
      section.style.opacity = "1";
      section.style.transform = "translateY(0)";
    }
  });
});

const revealSections = () => {
  const sections = document.querySelectorAll(".section");
  sections.forEach((section) => {
    section.style.opacity = "0";
    section.style.transform = "translateY(24px)";
    section.style.transition = "opacity 0.7s ease, transform 0.7s ease";
  });
};

revealSections();
window.dispatchEvent(new Event("scroll"));

// Inicializar canvas de mapa de calor
setTimeout(() => {
  resizeHeatmapCanvas();
  if (heatmapCanvas && heatGrid) {
    const initialRiskLevels = [
      { label: "Inicio", level: randomRiskLevel() },
      { label: "Medio camino", level: randomRiskLevel() },
      { label: "Cruce céntrico", level: randomRiskLevel() },
      { label: "Destino", level: randomRiskLevel() }
    ];
    drawHeatmap(heatmapCanvas, initialRiskLevels);
  }
}, 100);
