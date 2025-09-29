const form = document.getElementById("registroForm");
const tabla = document.querySelector("#tablaRegistros tbody");
const buscar = document.getElementById("buscar");

let registros = JSON.parse(localStorage.getItem("registros")) || [];

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



function eliminarRegistro(i) {
  if (confirm("¿Seguro que deseas eliminar este registro?")) {
    registros.splice(i, 1);
    localStorage.setItem("registros", JSON.stringify(registros));
    mostrarRegistros();
  }
}

function editarRegistro(i) {
  let reg = registros[i];
  document.getElementById("fecha").value = reg.fecha;
  document.getElementById("area").value = reg.area;
  document.getElementById("mto").value = reg.mto;
  document.getElementById("destino").value = reg.destino;
  document.getElementById("referencia").value = reg.referencia;
  document.getElementById("hora").value = reg.hora;
  document.getElementById("operador").value = reg.operador;

  // Borrar el registro viejo y esperar que lo reemplacen al guardar
  registros.splice(i, 1);
  localStorage.setItem("registros", JSON.stringify(registros));
  mostrarRegistros();
}


form.addEventListener("submit", (e) => {
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
  registros.push(nuevo);
  localStorage.setItem("registros", JSON.stringify(registros));
  mostrarRegistros();
  form.reset();
});

buscar.addEventListener("input", () => {
  let texto = buscar.value.toLowerCase();
  registrosFiltrados = registros.filter(reg =>
    Object.values(reg).some(val =>
      val.toString().toLowerCase().includes(texto)
    )
  );
  mostrarRegistros(registrosFiltrados);
});


mostrarRegistros();

function exportarCSV() {
  if (registros.length === 0) {
    alert("No hay registros para exportar.");
    return;
  }

  // Encabezados
  let csv = "Fecha,Área,MTO,Destino,Referencia,Hora,Operador\n";

  // Filas
  registros.forEach(reg => {
    csv += `${reg.fecha},${reg.area},${reg.mto},${reg.destino},${reg.referencia},${reg.hora},${reg.operador}\n`;
  });

  // Descargar
  let blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "registros.csv";
  link.click();
}

async function exportarPDF() {
  if (registros.length === 0) {
    alert("No hay registros para exportar.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4"); // 📄 A4 vertical

  // === Encabezado centrado ===
  doc.setFontSize(16);
  const titulo = "Registro de MTO Secion Gualeguay";
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text(titulo, pageWidth / 2, 20, { align: "center" });

  // === Encabezados y datos ===
  const headers = [["Fecha", "Área", "MTO", "Destino", "Referencia", "Hora", "Operador"]];
  const data = registros.map(reg => [
    reg.fecha,
    reg.area,
    reg.mto,
    reg.destino,
    reg.referencia,
    reg.hora,
    reg.operador
  ]);

  // === Dibujar tabla ===
  doc.autoTable({
    head: headers,
    body: data,
    startY: 30,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 2,
      halign: "center",
      valign: "middle"
    },
    headStyles: {
      fillColor: [0, 123, 255],
      textColor: 255,
      halign: "center"
    },
    // 👉 auto ajusta los anchos
    tableWidth: "auto",
    columnStyles: {
      0: { cellWidth: 20 }, // Fecha
      1: { cellWidth: 25 }, // Área
      2: { cellWidth: 15 }, // MTO
      3: { cellWidth: 30 }, // Destino
      4: { cellWidth: 60 }, // Referencia
      5: { cellWidth: 20 }, // Hora
      6: { cellWidth: 30 }  // Operador
    },
   margin: { top: 25, bottom: 15, left: 5 },
    didDrawPage: function (data) {
      // Pie de página
      let str = "Página " + doc.internal.getNumberOfPages();
      doc.setFontSize(9);
      doc.text(str, pageWidth - 20, doc.internal.pageSize.height - 10, { align: "right" });
    }
  });

  doc.save("registros.pdf");
}



let ordenActual = { campo: null, asc: true };
let registrosFiltrados = [...registros]; // para búsqueda + orden

function ordenarPor(campo) {
  if (ordenActual.campo === campo) {
    // Si vuelvo a hacer clic en la misma columna → cambiar de asc a desc
    ordenActual.asc = !ordenActual.asc;
  } else {
    ordenActual.campo = campo;
    ordenActual.asc = true;
  }

  // Ordenar los registros filtrados (no todos)
  let registrosOrdenados = [...registrosFiltrados].sort((a, b) => {
    let valA = a[campo];
    let valB = b[campo];

    // Si son números
    if (!isNaN(valA) && !isNaN(valB)) {
      valA = Number(valA);
      valB = Number(valB);
    } 
    // Si parecen fechas
    else if (Date.parse(valA) && Date.parse(valB)) {
      valA = new Date(valA);
      valB = new Date(valB);
    } 
    // Si son textos
    else {
      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();
    }

    if (valA < valB) return ordenActual.asc ? -1 : 1;
    if (valA > valB) return ordenActual.asc ? 1 : -1;
    return 0;
  });

  // Quitar clases previas
  document.querySelectorAll("th").forEach(th => {
    th.classList.remove("orden-asc", "orden-desc");
    if (th.dataset.campo === campo) {
      th.classList.add(ordenActual.asc ? "orden-asc" : "orden-desc");
    }
  });

  mostrarRegistros(registrosOrdenados);
  registrosFiltrados = registrosOrdenados; // mantener consistencia
}

function filtrarArea(area) {
  if (area === "todos") {
    registrosFiltrados = [...registros]; // mostrar todos
  } else {
    registrosFiltrados = registros.filter(reg => reg.area === area);
  }
  mostrarRegistros(registrosFiltrados);
}

