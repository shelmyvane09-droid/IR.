
const $ = (id) => document.getElementById(id);

const listaGrupos = $("listaGrupos");
const listaMoleculas = $("listaMoleculas");
const detalleMolecula = $("detalleMolecula");
const busqueda = $("busqueda");

let compuestos = [];
let grupoActual = null;

const descripciones = {
  "Alcohol": "Contiene un grupo hidroxilo unido a un carbono.",
  "Cetona": "Contiene un grupo carbonilo entre dos carbonos.",
  "Aldehído": "Contiene un grupo carbonilo terminal.",
  "Ácido carboxílico": "Contiene el grupo carboxilo.",
  "Éster": "Contiene el grupo funcional éster.",
  "Amina": "Contiene nitrógeno unido a grupos carbonados.",
  "Amida": "Contiene un carbonilo unido a nitrógeno.",
  "Alqueno": "Contiene al menos un doble enlace carbono-carbono.",
  "Alquino": "Contiene un triple enlace carbono-carbono.",
  "Aromático": "Contiene un sistema aromático.",
  "Nitrilo": "Contiene el grupo C≡N."
};

function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function gruposDisponibles() {
  return [...new Set(compuestos.map(c => c.grupo))].sort((a, b) =>
    a.localeCompare(b, "es")
  );
}

function cambiarVista(vista) {
  $("vistaGrupos").classList.toggle("oculto", vista !== "grupos");
  $("vistaMoleculas").classList.toggle("oculto", vista !== "moleculas");
  $("vistaDetalle").classList.toggle("oculto", vista !== "detalle");
  $("portada").classList.toggle("oculto", vista !== "grupos");
  $("portada").classList.toggle("oculto", vista !== "grupos");

  document.querySelectorAll(".menu-item").forEach(boton => {
    boton.classList.toggle("activo", boton.dataset.vista === vista ||
      (vista === "moleculas" && boton.dataset.vista === "grupos") ||
      (vista === "detalle" && boton.dataset.vista === "espectros"));
  });

  if (vista === "grupos") {
    $("estadisticas").style.display = "";
  }
}

function mostrarGrupos(filtro = "") {
  listaGrupos.innerHTML = "";
  const grupos = gruposDisponibles().filter(grupo =>
    normalizar(grupo).includes(normalizar(filtro)) ||
    compuestos.some(c =>
      c.grupo === grupo &&
      normalizar(c.nombre + " " + c.formula).includes(normalizar(filtro))
    )
  );

  $("totalGrupos").textContent = gruposDisponibles().length;
  $("totalMoleculas").textContent = compuestos.length;
  $("contadorGrupos").textContent = `${grupos.length} categorías`;

  grupos.forEach(grupo => {
    const cantidad = compuestos.filter(c => c.grupo === grupo).length;
    const tarjeta = document.createElement("button");
    tarjeta.className = "tarjeta-grupo";
    tarjeta.innerHTML = `
      <div class="icono-grupo">🧪</div>
      <h3></h3>
      <p></p>
      <small>${cantidad} molécula(s) registradas →</small>
    `;
    tarjeta.querySelector("h3").textContent = grupo;
    tarjeta.querySelector("p").textContent =
      descripciones[grupo] || "Consulta las moléculas de esta categoría.";
    tarjeta.addEventListener("click", () => abrirGrupo(grupo));
    listaGrupos.appendChild(tarjeta);
  });
}

function abrirGrupo(grupo, filtro = "") {
  grupoActual = grupo;
  $("tituloGrupo").textContent = grupo;
  $("descripcionGrupo").textContent =
    descripciones[grupo] || "Moléculas clasificadas en este grupo funcional.";

  const coincidencias = compuestos.filter(c =>
    c.grupo === grupo &&
    normalizar(c.nombre + " " + c.formula + " " + c.cas)
      .includes(normalizar(filtro))
  );

  listaMoleculas.innerHTML = "";

  coincidencias.forEach(compuesto => {
    const tarjeta = document.createElement("button");
    tarjeta.className = "tarjeta-molecula";
    tarjeta.innerHTML = `
      <div class="icono-grupo">⚗️</div>
      <h3></h3>
      <p class="formula"></p>
      <p class="cas"></p>
      <small>Consultar ficha y espectro →</small>
    `;
    tarjeta.querySelector("h3").textContent = compuesto.nombre;
    tarjeta.querySelector(".formula").textContent =
      `Fórmula molecular: ${compuesto.formula}`;
    tarjeta.querySelector(".cas").textContent =
      `CAS: ${compuesto.cas || "No registrado"}`;
    tarjeta.addEventListener("click", () => abrirDetalle(compuesto));
    listaMoleculas.appendChild(tarjeta);
  });

  cambiarVista("moleculas");
}


function abrirDetalle(c) {
  detalleMolecula.replaceChildren();

  const panel = document.createElement("article");
  panel.className = "panel-detalle";
  const seccion3D = document.createElement("section");
  seccion3D.className = "seccion-3d";

  const titulo3D = document.createElement("h3");
  titulo3D.textContent = "Estructura molecular 3D";

  const visor3D = document.createElement("div");
  visor3D.id = "visor3D";
  visor3D.style.width = "100%";
  visor3D.style.height = "400px";
  visor3D.style.position = "relative";
  visor3D.style.background = "#f4f7fb";
  visor3D.style.borderRadius = "12px";

  seccion3D.append(titulo3D, visor3D);
  panel.appendChild(seccion3D);
    if (typeof $3Dmol !== "undefined") {
    const visor = $3Dmol.createViewer(visor3D, {
      backgroundColor: "#f4f7fb"
    });

   const identificador = c.cas || c.nombre;
fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(identificador)}/SDF?record_type=3d`)
      .then(respuesta => {
        if (!respuesta.ok) {
          throw new Error("No se pudo descargar el modelo 3D");
        }
        return respuesta.text();
      })
      .then(estructura => {
        visor.addModel(estructura, "sdf");
        visor.setStyle({}, {
          stick: { radius: 0.18 },
          sphere: { scale: 0.3 }
        });
        visor.zoomTo();
        visor.render();
      })
      .catch(error => {
        visor3D.textContent = "No se pudo cargar el modelo 3D. Comprueba tu conexión a Internet.";
        console.error(error);
      });
    visor.zoomTo();
    visor.render();
  } else {
    visor3D.textContent = "No se pudo cargar la biblioteca 3Dmol.js.";
  }
  const titulo = document.createElement("h2");
  titulo.textContent = c.nombre;

  const subtitulo = document.createElement("p");
  subtitulo.textContent =
    `${c.nombreIUPAC || c.nombre} · ${c.grupo}`;

  const aviso = document.createElement("p");
  aviso.className = "aviso";
  aviso.textContent = c.espectro
    ? "Esta molécula tiene una fuente de referencia registrada. Consulta la fase y las condiciones antes de comparar el espectro."
    : "Esta ficha todavía no tiene una fuente de espectro registrada.";

  const datos = document.createElement("div");
  datos.className = "datos-grid";

  const campos = [
    ["Fórmula molecular", c.formula],
    ["Masa molar", c.masaMolar || "Pendiente de verificar"],
    ["Número CAS", c.cas || "No disponible"],
    ["Grupo funcional", c.grupo],
    ["Enlace característico", c.enlace || "No registrado"],
    ["Banda orientativa", c.banda || "Consultar la fuente"],
    ["Descripción", c.descripcion || "No registrada"]
  ];

  if (c.espectro) {
    campos.push(
      ["Tipo de espectro", c.espectro.tipo || "No especificado"],
      ["Fase de la muestra", c.espectro.fase || "No especificada"],
      ["Temperatura", c.espectro.temperatura || "No especificada"],
      ["Instrumento", c.espectro.instrumento || "No especificado"],
      ["Resolución", c.espectro.resolucion || "No especificada"],
      ["Fuente", c.espectro.fuente || "No especificada"]
    );
  }

  campos.forEach(([etiqueta, valor]) => {
    const dato = document.createElement("div");
    dato.className = "dato";

    const nombreCampo = document.createElement("small");
    nombreCampo.textContent = etiqueta;

    const valorCampo = document.createElement("strong");
    valorCampo.textContent = valor || "Pendiente de verificar";

    dato.append(nombreCampo, valorCampo);
    datos.appendChild(dato);
  });

  const fuente = document.createElement("p");
  fuente.textContent = "Consultar el espectro original:";

  const enlace = document.createElement("a");
  enlace.className = "fuente";
 
enlace.href = c.fuenteEspectral?.url ||
  c.espectro?.url ||
  (c.cas
    ? `https://webbook.nist.gov/cgi/cbook.cgi?ID=C${c.cas.replace(/[^0-9]/g, "")}&Units=SI`
    : "https://webbook.nist.gov/chemistry/");

  enlace.target = "_blank";
  enlace.rel = "noopener noreferrer";
  
enlace.textContent = c.fuenteEspectral
  ? "Consultar espectro original en SDBS ↗"
  : "Consultar fuente científica ↗";

  const nota = document.createElement("p");
  nota.className = "nota";
  nota.textContent =
    "Importante: la página enlazada puede mostrar espectros en distintas fases. Comprueba que las condiciones de la fuente sean adecuadas para la comparación.";
// Mostrar el espectro IR del acetato de etilo
console.log("Molécula seleccionada:", c.nombre, c.fuenteEspectral);


if (c.espectroImagen) {
  const seccionEspectro = document.createElement("section");
  seccionEspectro.className = "seccion-espectro";

  const tituloEspectro = document.createElement("h3");
  tituloEspectro.textContent = "Espectro infrarrojo (IR)";

  const imagenEspectro = document.createElement("img");
  imagenEspectro.src = c.espectroImagen;
  imagenEspectro.alt = `Espectro infrarrojo de ${c.nombre}`;

  imagenEspectro.style.width = "100%";
  imagenEspectro.style.maxWidth = "850px";
  imagenEspectro.style.display = "block";
  imagenEspectro.style.margin = "20px auto";
  imagenEspectro.style.borderRadius = "10px";

  imagenEspectro.onerror = () => {
    seccionEspectro.textContent =
      `No se encontró la imagen del espectro IR de ${c.nombre}.`;
  };

  const pieEspectro = document.createElement("p");
  pieEspectro.textContent = c.fuenteEspectro
    ? `Fuente: ${c.fuenteEspectro}`
    : `Espectro IR de referencia de ${c.nombre}.`;

  seccionEspectro.append(
    tituloEspectro,
    imagenEspectro,
    pieEspectro
  );

  panel.appendChild(seccionEspectro);
}

  panel.append(titulo, subtitulo, aviso, datos, fuente, enlace, nota);
  detalleMolecula.appendChild(panel);

  cambiarVista("detalle");
}


async function cargarDatos() {
  try {
    const respuesta = await fetch("data/spectra.json");
    if (!respuesta.ok) throw new Error("No se pudo leer spectra.json");

    compuestos = await respuesta.json();
    mostrarGrupos();
  } catch (error) {
    listaGrupos.textContent =
      "No se pudo cargar la base de datos. Ejecuta index.html con Live Server.";
    console.error(error);
  }
}

busqueda.addEventListener("input", () => {
  const texto = busqueda.value.trim();
  cambiarVista("grupos");
  mostrarGrupos(texto);
});

document.querySelectorAll(".menu-item").forEach(boton => {
  boton.addEventListener("click", () => {
    const vista = boton.dataset.vista;
    busqueda.value = "";

    if (vista === "inicio" || vista === "grupos") {
      cambiarVista("grupos");
      mostrarGrupos();
    } else {
      cambiarVista("grupos");
      mostrarGrupos();
      busqueda.focus();
    }
  });
});

$("inicioLogo").addEventListener("click", evento => {
  evento.preventDefault();
  busqueda.value = "";
  cambiarVista("grupos");
  mostrarGrupos();
});

$("volverGrupos").addEventListener("click", () => {
  cambiarVista("grupos");
  mostrarGrupos();
});

$("volverMoleculas").addEventListener("click", () => {
  abrirGrupo(grupoActual);
});

cargarDatos();
