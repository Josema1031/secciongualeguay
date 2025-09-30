// === IMPORTS DE FIREBASE ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot 
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

let registros = []; // se llenará desde Firestore

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

// === CARGAR REGISTROS EN VIVO (onSnapshot) ===
onSnapshot(collection(db, "registros"), (snapshot) => {
  registros = [];
  snapshot.forEach(docSnap => {
    registros.push({ id: docSnap.id, ...docSnap.data() });
  });
  mostrarRegistros();
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
    // Actualizar
    const id = form.dataset.editId;
    await updateDoc(doc(db, "registros", id), nuevo);
    delete form.dataset.editId;
  } else {
    // Crear nuevo
    await addDoc(collection(db, "registros"), nuevo);
  }

  form.reset();
});

// === BÚSQUEDA ===
buscar.addEventListener("input", () => {
  let texto = buscar.value.toLowerCase();
  let filtrados = registros.filter(reg =>
    Object.values(reg).some(val =>
      val.toString().toLowerCase().includes(texto)
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

  // Encabezado centrado
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
    // Orden numérico de mayor a menor
    registros.sort((a, b) => Number(b.mto) - Number(a.mto));
  } else {
    // Orden alfabético de A a Z
    registros.sort((a, b) => a[campo].localeCompare(b[campo]));
  }
  mostrarRegistros();
}


// 🔧 Exponer funciones al scope global
window.eliminarRegistro = eliminarRegistro;
window.editarRegistro = editarRegistro;
window.exportarPDF = exportarPDF;
window.filtrarArea = filtrarArea;
window.ordenarPor = ordenarPor;
