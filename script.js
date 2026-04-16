// === IMPORTS DE FIREBASE ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  setDoc,
  getDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// === CONFIGURACIÓN DE TU PROYECTO (Firebase Console) ===
const firebaseConfig = {
  apiKey: "AIzaSyCi7lYGKlX7r3p5tlLQamdV2CgGzyHnMog",
  authDomain: "seccion-gualeguay.firebaseapp.com",
  projectId: "seccion-gualeguay",
  storageBucket: "seccion-gualeguay.firebasestorage.app",
  messagingSenderId: "135545186617",
  appId: "1:135545186617:web:0a3707336fd688f113a0e8"
};

// === INICIALIZAR FIREBASE ===
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === VARIABLES DEL SISTEMA ===
const form = document.getElementById("registroForm");
const tabla = document.querySelector("#tablaRegistros tbody");
const buscar = document.getElementById("buscar");
const tableroSection = document.getElementById("tableroSection");
const toggleTableroBtn = document.getElementById("toggleTableroBtn");
const tablaTablero = document.querySelector("#tablaTableroControl tbody");
const resumenTablero = document.getElementById("resumenTablero");
const tableroOverlay = document.getElementById("tableroOverlay");
const cerrarTableroBtn = document.getElementById("cerrarTableroBtn");
const estadisticaSection = document.getElementById("estadisticaSection");
const toggleEstadisticaBtn = document.getElementById("toggleEstadisticaBtn");
const cerrarEstadisticaBtn = document.getElementById("cerrarEstadisticaBtn");
const estadisticaOverlay = document.getElementById("estadisticaOverlay");
const estadisticaResumen = document.getElementById("estadisticaResumen");
const mesEstadistica = document.getElementById("mesEstadistica");
const anioEstadistica = document.getElementById("anioEstadistica");
const historicoSection = document.getElementById("historicoSection");
const toggleHistoricoBtn = document.getElementById("toggleHistoricoBtn");
const cerrarHistoricoBtn = document.getElementById("cerrarHistoricoBtn");
const historicoOverlay = document.getElementById("historicoOverlay");
const mesHistorico = document.getElementById("mesHistorico");
const anioHistorico = document.getElementById("anioHistorico");
const historicoCampos = document.getElementById("historicoCampos");
const guardarHistoricoBtn = document.getElementById("guardarHistoricoBtn");

const CAMPOS_TABLERO = [
  { key: "preventivo", label: "Preventivo" },
  { key: "CNRT", label: "CNRT" },
  { key: "articulo27", label: "Artículo 27" },
  { key: "Senasa", label: "Senasa" },
  { key: "articulo24", label: "Artículo 24" },
  { key: "polcom", label: "Polcom" },
  { key: "actividadesJudiciales", label: "Actividades Judiciales" },
  { key: "comisionServicio", label: "Comisión de Servicio" }
];

let registros = [];
let tableroControl = [];
const anioActual = new Date().getFullYear();

// === MOSTRAR REGISTROS EN TABLA ===
function mostrarRegistros(data = registros) {
  tabla.innerHTML = "";
  data.forEach((reg, index) => {
    let claseArea = "";
    if (reg.area === "Personal") claseArea = "area-personal";
    if (reg.area === "Logística") claseArea = "area-logistica";
    if (reg.area === "Operaciones") claseArea = "area-operaciones";
    if (reg.area === "Inteligencia") claseArea = "area-inteligencia";
    if (reg.area === "Ayudantia") claseArea = "area-ayudantia";

    let fila = `
      <tr>
        <td>${reg.fecha}</td>
        <td><span class="${claseArea}">${reg.area}</span></td>
        <td>${reg.mto}</td>
        <td>${reg.destino}</td>
        <td>${reg.referencia}</td>
        <td>${reg.hora}</td>
        <td>${reg.operador}</td>
        <td>
          <button class="btn-editar" onclick="editarRegistro(${index})">✏️ Editar</button>
          <button class="btn-eliminar" onclick="eliminarRegistro(${index})">🗑️ Eliminar</button>
        </td>
      </tr>
    `;
    tabla.innerHTML += fila;
  });
}

// === TABLERO DE CONTROL ===
function obtenerFilaTablero(numero) {
  const existente = tableroControl.find(item => Number(item.numero) === Number(numero));
  return {
    numero,
    preventivo: existente?.preventivo || false,
    CNRT: existente?.CNRT || false,
    articulo27: existente?.articulo27 || false,
    Senasa: existente?.Senasa || false,
    articulo24: existente?.articulo24 || false,
    polcom: existente?.polcom || false,
    actividadesJudiciales: existente?.actividadesJudiciales || false,
    comisionServicio: existente?.comisionServicio || false
  };
}

function renderResumenTablero() {
  const conteos = {};
  CAMPOS_TABLERO.forEach(campo => {
    conteos[campo.key] = 0;
  });

  for (let i = 1; i <= 100; i++) {
    const fila = obtenerFilaTablero(i);
    CAMPOS_TABLERO.forEach(campo => {
      if (fila[campo.key]) conteos[campo.key] += 1;
    });
  }

  const totalGeneral = Object.values(conteos).reduce((acc, val) => acc + val, 0);

  resumenTablero.innerHTML = `
    <div class="resumen-card resumen-destacado">
      <span class="resumen-titulo">Total general</span>
      <strong class="resumen-numero">${totalGeneral}</strong>
    </div>
    ${CAMPOS_TABLERO.map(campo => `
      <div class="resumen-card">
        <span class="resumen-titulo">${campo.label}</span>
        <strong class="resumen-numero">${conteos[campo.key]}</strong>
      </div>
    `).join("")}
  `;
}

function nombreMes(numeroMes) {
  return ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][numeroMes - 1] || "Mes";
}

function clavePeriodo(anio, mes) {
  return `${anio}-${String(mes).padStart(2, "0")}`;
}

function opcionesMeses() {
  return Array.from({ length: 12 }, (_, index) => {
    const mes = index + 1;
    return `<option value="${mes}">${nombreMes(mes)}</option>`;
  }).join("");
}

function opcionesAnios() {
  let opciones = "";
  for (let anio = anioActual - 4; anio <= anioActual + 1; anio++) {
    opciones += `<option value="${anio}">${anio}</option>`;
  }
  return opciones;
}

function renderCamposHistoricos() {
  historicoCampos.innerHTML = CAMPOS_TABLERO.map(campo => `
    <label class="campo-historico">
      <span>${campo.label}</span>
      <input type="number" min="0" step="1" id="historico_${campo.key}" placeholder="0">
    </label>
  `).join("");
}

function limpiarFormularioHistorico() {
  CAMPOS_TABLERO.forEach(campo => {
    const input = document.getElementById(`historico_${campo.key}`);
    if (input) input.value = "";
  });
}

async function cargarDatosHistoricosFormulario() {
  const mes = Number(mesHistorico.value);
  const anio = Number(anioHistorico.value);
  const snap = await getDoc(doc(db, "tableroEstadisticas", clavePeriodo(anio, mes)));
  const datos = snap.exists() ? snap.data() : {};

  CAMPOS_TABLERO.forEach(campo => {
    const input = document.getElementById(`historico_${campo.key}`);
    if (!input) return;
    const valor = Number(datos[campo.key] || 0);
    input.value = valor ? String(valor) : "";
  });
}

function inicializarFiltrosEstadistica() {
  const meses = opcionesMeses();
  const anios = opcionesAnios();
  mesEstadistica.innerHTML = meses;
  anioEstadistica.innerHTML = anios;
  mesHistorico.innerHTML = meses;
  anioHistorico.innerHTML = anios;

  const hoy = new Date();
  const mesActual = String(hoy.getMonth() + 1);
  const anioHoy = String(hoy.getFullYear());

  mesEstadistica.value = mesActual;
  anioEstadistica.value = anioHoy;
  mesHistorico.value = mesActual;
  anioHistorico.value = anioHoy;

  renderCamposHistoricos();
}

async function renderEstadisticaMensual() {
  const mes = Number(mesEstadistica.value);
  const anio = Number(anioEstadistica.value);
  const refEstadistica = doc(db, "tableroEstadisticas", clavePeriodo(anio, mes));
  const snapEstadistica = await getDoc(refEstadistica);
  const datos = snapEstadistica.exists() ? snapEstadistica.data() : {};

  const totalGeneral = Number(datos.totalGeneral || 0);

  estadisticaResumen.innerHTML = `
    <div class="resumen-card resumen-destacado resumen-card-ancho">
      <span class="resumen-titulo">Total general de ${nombreMes(mes)} ${anio}</span>
      <strong class="resumen-numero">${totalGeneral}</strong>
    </div>
    ${CAMPOS_TABLERO.map(campo => `
      <div class="resumen-card">
        <span class="resumen-titulo">${campo.label}</span>
        <strong class="resumen-numero">${Number(datos[campo.key] || 0)}</strong>
      </div>
    `).join("")}
  `;
}

async function guardarHistoricoMensual() {
  const mes = Number(mesHistorico.value);
  const anio = Number(anioHistorico.value);

  const datos = {
    mes,
    anio
  };

  let totalGeneral = 0;

  CAMPOS_TABLERO.forEach(campo => {
    const input = document.getElementById(`historico_${campo.key}`);
    const valor = Math.max(0, Number(input?.value || 0));
    datos[campo.key] = valor;
    totalGeneral += valor;
  });

  datos.totalGeneral = totalGeneral;

  await setDoc(doc(db, "tableroEstadisticas", clavePeriodo(anio, mes)), datos, { merge: true });

  alert(`Histórico de ${nombreMes(mes)} ${anio} guardado correctamente.`);

  if (Number(mesEstadistica.value) === mes && Number(anioEstadistica.value) === anio) {
    await renderEstadisticaMensual();
  }
}

function renderTableroControl() {
  let html = "";

  for (let i = 1; i <= 100; i++) {
    const fila = obtenerFilaTablero(i);

    html += `
      <tr>
        <td class="col-numero">${i}</td>
        ${CAMPOS_TABLERO.map(campo => `
          <td>
            <label class="check-celda">
              <input
                type="checkbox"
                data-numero="${i}"
                data-campo="${campo.key}"
                ${fila[campo.key] ? "checked" : ""}
              >
            </label>
          </td>
        `).join("")}
      </tr>
    `;
  }

  tablaTablero.innerHTML = html;
  renderResumenTablero();
}

async function actualizarTableroControl(numero, campo, valor) {
  const ref = doc(db, "tableroControl", String(numero));
  const snap = await getDoc(ref);
  const actual = snap.exists() ? snap.data() : { numero };
  const valorAnterior = Boolean(actual[campo]);

  if (valorAnterior === valor) {
    return;
  }

  const ahora = new Date();
  const metaMes = `${campo}_mes`;
  const metaAnio = `${campo}_anio`;

  if (valor) {
    const periodo = clavePeriodo(ahora.getFullYear(), ahora.getMonth() + 1);
    const refEstadistica = doc(db, "tableroEstadisticas", periodo);

    await setDoc(ref, {
      numero,
      [campo]: true,
      [metaMes]: ahora.getMonth() + 1,
      [metaAnio]: ahora.getFullYear()
    }, { merge: true });

    await setDoc(refEstadistica, {
      mes: ahora.getMonth() + 1,
      anio: ahora.getFullYear(),
      [campo]: increment(1),
      totalGeneral: increment(1)
    }, { merge: true });
  } else {
    const mesOriginal = Number(actual[metaMes]);
    const anioOriginal = Number(actual[metaAnio]);

    await setDoc(ref, {
      numero,
      [campo]: false,
      [metaMes]: null,
      [metaAnio]: null
    }, { merge: true });

    if (mesOriginal && anioOriginal) {
      const refEstadistica = doc(db, "tableroEstadisticas", clavePeriodo(anioOriginal, mesOriginal));
      await setDoc(refEstadistica, {
        mes: mesOriginal,
        anio: anioOriginal,
        [campo]: increment(-1),
        totalGeneral: increment(-1)
      }, { merge: true });
    }
  }

  if (!estadisticaSection.classList.contains("tablero-oculto")) {
    await renderEstadisticaMensual();
  }
}

// === CARGAR REGISTROS EN VIVO (onSnapshot) ===
onSnapshot(collection(db, "registros"), (snapshot) => {
  registros = [];
  snapshot.forEach(docSnap => {
    registros.push({ id: docSnap.id, ...docSnap.data() });
  });
  mostrarRegistros();
});

onSnapshot(collection(db, "tableroControl"), (snapshot) => {
  tableroControl = [];
  snapshot.forEach(docSnap => {
    tableroControl.push({ id: docSnap.id, ...docSnap.data() });
  });

  tableroControl.sort((a, b) => Number(a.numero) - Number(b.numero));
  renderTableroControl();
});

inicializarFiltrosEstadistica();
cargarDatosHistoricosFormulario();

// === BOTÓN MOSTRAR / OCULTAR TABLERO ===
window.abrirTablero = function abrirTablero() {
  tableroSection.classList.remove("tablero-oculto");
  tableroOverlay.classList.remove("tablero-oculto");
  tableroSection.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  const menu = document.getElementById("dropdownAcciones");
  if (menu) menu.style.display = "none";
}

window.cerrarTablero = function cerrarTablero() {
  tableroSection.classList.add("tablero-oculto");
  tableroOverlay.classList.add("tablero-oculto");
  tableroSection.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

window.abrirEstadistica = function abrirEstadistica() {
  estadisticaSection.classList.remove("tablero-oculto");
  estadisticaOverlay.classList.remove("tablero-oculto");
  estadisticaSection.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  renderEstadisticaMensual();
  const menu = document.getElementById("dropdownAcciones");
  if (menu) menu.style.display = "none";
}

window.cerrarEstadistica = function cerrarEstadistica() {
  estadisticaSection.classList.add("tablero-oculto");
  estadisticaOverlay.classList.add("tablero-oculto");
  estadisticaSection.setAttribute("aria-hidden", "true");
  if (tableroSection.classList.contains("tablero-oculto") && historicoSection.classList.contains("tablero-oculto")) {
    document.body.style.overflow = "";
  }
}

window.abrirHistorico = function abrirHistorico() {
  historicoSection.classList.remove("tablero-oculto");
  historicoOverlay.classList.remove("tablero-oculto");
  historicoSection.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  cargarDatosHistoricosFormulario();
  const menu = document.getElementById("dropdownAcciones");
  if (menu) menu.style.display = "none";
}

window.cerrarHistorico = function cerrarHistorico() {
  historicoSection.classList.add("tablero-oculto");
  historicoOverlay.classList.add("tablero-oculto");
  historicoSection.setAttribute("aria-hidden", "true");
  if (tableroSection.classList.contains("tablero-oculto") && estadisticaSection.classList.contains("tablero-oculto")) {
    document.body.style.overflow = "";
  }
}

toggleTableroBtn.addEventListener("click", abrirTablero);
cerrarTableroBtn.addEventListener("click", cerrarTablero);
tableroOverlay.addEventListener("click", cerrarTablero);
toggleEstadisticaBtn.addEventListener("click", abrirEstadistica);
cerrarEstadisticaBtn.addEventListener("click", cerrarEstadistica);
estadisticaOverlay.addEventListener("click", cerrarEstadistica);
toggleHistoricoBtn.addEventListener("click", abrirHistorico);
cerrarHistoricoBtn.addEventListener("click", cerrarHistorico);
historicoOverlay.addEventListener("click", cerrarHistorico);
guardarHistoricoBtn.addEventListener("click", guardarHistoricoMensual);
mesEstadistica.addEventListener("change", renderEstadisticaMensual);
anioEstadistica.addEventListener("change", renderEstadisticaMensual);
mesHistorico.addEventListener("change", cargarDatosHistoricosFormulario);
anioHistorico.addEventListener("change", cargarDatosHistoricosFormulario);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !tableroSection.classList.contains("tablero-oculto")) {
    cerrarTablero();
  }
  if (e.key === "Escape" && !estadisticaSection.classList.contains("tablero-oculto")) {
    cerrarEstadistica();
  }
  if (e.key === "Escape" && !historicoSection.classList.contains("tablero-oculto")) {
    cerrarHistorico();
  }
});

// === EVENTO DE CHECKBOXES DEL TABLERO ===
tablaTablero.addEventListener("change", async (e) => {
  const target = e.target;
  if (!target.matches('input[type="checkbox"]')) return;

  const numero = Number(target.dataset.numero);
  const campo = target.dataset.campo;
  await actualizarTableroControl(numero, campo, target.checked);
});

// === ELIMINAR REGISTRO ===
async function eliminarRegistro(i) {
  if (confirm("¿Seguro que deseas eliminar este registro?")) {
    const id = registros[i].id;
    await deleteDoc(doc(db, "registros", id));
  }
}

// === EDITAR REGISTRO ===
function editarRegistro(i) {
  let reg = registros[i];
  document.getElementById("fecha").value = reg.fecha;
  document.getElementById("area").value = reg.area;
  document.getElementById("mto").value = reg.mto;
  document.getElementById("destino").value = reg.destino;
  document.getElementById("referencia").value = reg.referencia;
  document.getElementById("hora").value = reg.hora;
  document.getElementById("operador").value = reg.operador;

  // Guardar el ID en el formulario para actualizar
  form.dataset.editId = reg.id;
}

// === GUARDAR O ACTUALIZAR DESDE EL FORM ===
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  let nuevo = {
    fecha: document.getElementById("fecha").value,
    area: document.getElementById("area").value,
    mto: document.getElementById("mto").value,
    destino: document.getElementById("destino").value,
    referencia: document.getElementById("referencia").value,
    hora: document.getElementById("hora").value,
    operador: document.getElementById("operador").value
  };

  if (form.dataset.editId) {
    const id = form.dataset.editId;
    await updateDoc(doc(db, "registros", id), nuevo);
    delete form.dataset.editId;
  } else {
    await addDoc(collection(db, "registros"), nuevo);
  }

  form.reset();
});

// === BÚSQUEDA ===
buscar.addEventListener("input", () => {
  let texto = buscar.value.toLowerCase();
  let filtrados = registros.filter(reg =>
    Object.values(reg).some(val =>
      String(val).toLowerCase().includes(texto)
    )
  );
  mostrarRegistros(filtrados);
});

// === EXPORTAR PDF ===
async function exportarPDF() {
  if (registros.length === 0) {
    alert("No hay registros para exportar.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const docPDF = new jsPDF("p", "mm", "a4");

  docPDF.setFontSize(16);
  const titulo = "Registro de MTO - Sección Gualeguay";
  const pageWidth = docPDF.internal.pageSize.getWidth();
  docPDF.text(titulo, pageWidth / 2, 20, { align: "center" });

  const headers = [["Fecha", "Área", "MTO", "Destino", "Referencia", "Hora", "Operador"]];
  const data = registros.map(reg => [
    reg.fecha, reg.area, reg.mto, reg.destino, reg.referencia, reg.hora, reg.operador
  ]);

  docPDF.autoTable({
    head: headers,
    body: data,
    startY: 30,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2, halign: "center", valign: "middle" },
    headStyles: { fillColor: [0, 123, 255], textColor: 255, halign: "center" },
    tableWidth: "auto",
    margin: { top: 25, bottom: 15, left: 5 },
    didDrawPage: function () {
      let str = "Página " + docPDF.internal.getNumberOfPages();
      docPDF.setFontSize(9);
      docPDF.text(str, pageWidth - 20, docPDF.internal.pageSize.height - 10, { align: "right" });
    }
  });

  docPDF.save("registros.pdf");
}

// === FILTRAR POR ÁREA ===
function filtrarArea(area) {
  if (area === "todos") {
    mostrarRegistros();
  } else {
    mostrarRegistros(registros.filter(r => r.area === area));
  }
}

// === ORDENAR POR CAMPO ===
function ordenarPor(campo) {
  if (campo === "mto") {
    registros.sort((a, b) => Number(b.mto) - Number(a.mto));
  } else {
    registros.sort((a, b) => String(a[campo]).localeCompare(String(b[campo])));
  }
  mostrarRegistros();
}

// 🔧 Exponer funciones al scope global
window.eliminarRegistro = eliminarRegistro;
window.editarRegistro = editarRegistro;
window.exportarPDF = exportarPDF;
window.filtrarArea = filtrarArea;
window.ordenarPor = ordenarPor;


window.toggleMenuAcciones = function toggleMenuAcciones() {
  const menu = document.getElementById("dropdownAcciones");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

document.addEventListener("click", function(e) {
  const contenedor = document.querySelector(".menu-acciones");
  const menu = document.getElementById("dropdownAcciones");

  if (contenedor && !contenedor.contains(e.target)) {
    menu.style.display = "none";
  }
});