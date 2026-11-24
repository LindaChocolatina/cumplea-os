const UNIVERSOS = [
  { src: "version Heidi.jpg", nombre: "Heidi" },
  { src: "version Los Simpson.jpg", nombre: "Los Simpson" },
  { src: "version Hora de aventura.jpg", nombre: "Hora de aventura" },
  { src: "version Beeltjuice.jpg", nombre: "Beeltjuice" },
  { src: "version Tom y Jerry.jpg", nombre: "Tom y Jerry" },
  { src: "version Toy Story.jpg", nombre: "Toy Story" },
  { src: "version Gomosito.jpg", nombre: "Gomosito" },
  { src: "version rubber hose.jpg", nombre: "Rubber hose" },
  { src: "cEl extraño mundo de Jack.jpg", nombre: "El extraño mundo de Jack" },
  { src: "version Los Picapiedra.jpg", nombre: "Los Picapiedra" }
];

const COLORES = ["#ff5d73", "#ffc14d", "#49c6ef", "#6dce86", "#b388ff", "#ff8a3d", "#fffdf8"];
const CERAS = ["#fff4f7", "#d9f4ff", "#e7ffd8", "#fff1b8", "#ffe0cc", "#f3e5ff"];
const DESEOS = [
  "Que esta vuelta llegue con calma, con espacio para tus sueños y la familia cerca.",
  "El 41 ya escuchó tu deseo. Ahora le toca al año cumplirlo.",
  "Listo: el deseo ya está volando, entre confeti y abrazos."
];
const TINTAS = ["#ff4f6d", "#ff8a00", "#e0a100", "#1aa3c9", "#3dae5d", "#8d62e6"];

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const puedeHover = matchMedia("(hover: hover)").matches;
const $ = (id) => document.getElementById(id);

const titulo = $("titulo");
const velasEl = $("velas");
const estadoVelas = $("estado-velas");
const deseo = $("deseo");
const deseoTexto = $("deseo-texto");
const tarjetaPastel = $("tarjeta-pastel");
const medidor = $("medidor");
const barra = $("barra");
const musicaBtn = $("musica");
const microBtn = $("micro");
const marco = $("marco");
const quizImg = $("quiz-img");
const quizPaso = $("quiz-paso");
const opcionesEl = $("opciones");
const quizEstado = $("quiz-estado");
const cuentaAtras = $("cuenta-atras");
const tablero = $("tablero");
const memoriaEstado = $("memoria-estado");
const memoriaFinal = $("memoria-final");
const cine = $("cine");
const cineNombre = $("cine-nombre");

let pedido = false;
let actx = null;
let musicaOn = true;
let musicaArrancada = false;
let musicaTimer = 0;
let escuchando = false;
let rafMic = 0;
let ultimoSoplo = 0;
let streamMic = null;
let analyser = null;
let bufMic = null;
let entro = false;
let llegadaCerrada = false;

let ordenQuiz = [];
let ronda = 0;
let aciertos = 0;
let eleccion = null;
let revelado = false;
let quizEmpezado = false;
let quizEnVista = false;
let timerQuiz = 0;
let avanceQuiz = 0;

let abiertas = [];
let bloqueado = false;
let parejas = 0;
let memoriaToken = 0;
const cineColor = document.querySelector(".cine-color");

const canvas = $("confeti");
const ctx = canvas.getContext("2d");
const piezas = [];

function barajar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function pintarTitulo() {
  const texto = "¡Feliz cumpleaños!";
  document.title = texto;
  titulo.setAttribute("aria-label", texto);
  titulo.replaceChildren();
  let indice = 0;
  texto.split(" ").forEach((palabra, orden, todas) => {
    const grupo = document.createElement("span");
    grupo.className = "palabra";
    grupo.setAttribute("aria-hidden", "true");
    [...palabra].forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "letra";
      span.style.setProperty("--i", indice + i);
      span.style.setProperty("--c", TINTAS[(indice + i) % TINTAS.length]);
      span.textContent = ch;
      grupo.appendChild(span);
    });
    titulo.appendChild(grupo);
    indice += palabra.length;
    if (orden < todas.length - 1) {
      const espacio = document.createElement("span");
      espacio.className = "espacio";
      titulo.appendChild(espacio);
      indice += 1;
    }
  });
}

function audio() {
  if (!actx) actx = new AudioContext();
  if (actx.state === "suspended") actx.resume().then(() => arrancarMusica());
  else arrancarMusica();
  return actx;
}

function arrancarMusica() {
  if (!musicaOn || musicaArrancada) return;
  if (!actx || actx.state !== "running") return;
  musicaArrancada = true;
  loopMusica();
}

function tono(frecuencia, cuando, duracion, tipo, volumen) {
  const contexto = audio();
  const osc = contexto.createOscillator();
  const gan = contexto.createGain();
  osc.type = tipo;
  osc.frequency.value = frecuencia;
  gan.gain.setValueAtTime(0.0001, cuando);
  gan.gain.exponentialRampToValueAtTime(volumen, cuando + 0.02);
  gan.gain.exponentialRampToValueAtTime(0.0001, cuando + duracion);
  osc.connect(gan).connect(contexto.destination);
  osc.start(cuando);
  osc.stop(cuando + duracion + 0.02);
}

function fanfarria() {
  const contexto = audio();
  [523, 659, 784, 1046].forEach((f, i) => tono(f, contexto.currentTime + i * 0.08, 0.22, "triangle", 0.06));
}

function soplido() {
  const contexto = audio();
  const osc = contexto.createOscillator();
  const gan = contexto.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(380, contexto.currentTime);
  osc.frequency.exponentialRampToValueAtTime(90, contexto.currentTime + 0.28);
  gan.gain.setValueAtTime(0.0001, contexto.currentTime);
  gan.gain.exponentialRampToValueAtTime(0.07, contexto.currentTime + 0.03);
  gan.gain.exponentialRampToValueAtTime(0.0001, contexto.currentTime + 0.3);
  osc.connect(gan).connect(contexto.destination);
  osc.start();
  osc.stop(contexto.currentTime + 0.32);
}

function blip() {
  const contexto = audio();
  tono(660, contexto.currentTime, 0.08, "square", 0.04);
  tono(880, contexto.currentTime + 0.06, 0.1, "square", 0.03);
}

const MELODIA = [523, 587, 659, 784, 659, 784, 988, 784, 659, 587];
let pasoMelodia = 0;

function loopMusica() {
  if (!musicaOn) return;
  const contexto = audio();
  const notaActual = MELODIA[pasoMelodia % MELODIA.length];
  tono(notaActual, contexto.currentTime, 0.2, "sine", 0.045);
  if (pasoMelodia % 4 === 0) tono(notaActual / 2, contexto.currentTime, 0.28, "triangle", 0.03);
  pasoMelodia += 1;
  musicaTimer = setTimeout(loopMusica, 280);
}

function pintarMusica() {
  musicaBtn.setAttribute("aria-pressed", String(musicaOn));
  musicaBtn.textContent = musicaOn ? "Música on" : "Música";
  musicaBtn.classList.toggle("activa", musicaOn);
}

function toggleMusica() {
  musicaOn = !musicaOn;
  pintarMusica();
  clearTimeout(musicaTimer);
  musicaArrancada = false;
  if (musicaOn) audio();
}

function ajustarLienzo() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function rafaga(x, y, cantidad, modo) {
  const total = reduce ? Math.min(cantidad, 16) : cantidad;
  for (let i = 0; i < total; i += 1) {
    const angulo = modo === "giro"
      ? Math.random() * Math.PI * 2
      : -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
    const fuerza = modo === "giro" ? 2 + Math.random() * 5 : 4 + Math.random() * 8;
    piezas.push({
      x,
      y,
      vx: Math.cos(angulo) * fuerza,
      vy: Math.sin(angulo) * fuerza,
      w: 6 + Math.random() * 7,
      h: 7 + Math.random() * 8,
      rot: Math.random() * 6,
      spin: (Math.random() - 0.5) * 0.22,
      color: COLORES[i % COLORES.length],
      vida: 70 + Math.random() * 28,
      circulo: Math.random() > 0.72
    });
  }
}

function dibujarConfeti() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (let i = piezas.length - 1; i >= 0; i -= 1) {
    const p = piezas[i];
    p.vy += 0.12;
    p.vx *= 0.995;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.spin;
    p.vida -= 1;
    if (p.vida <= 0 || p.y > innerHeight + 40) {
      piezas.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.max(p.vida / 90, 0);
    ctx.fillStyle = p.color;
    if (p.circulo) {
      ctx.beginPath();
      ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();
  }
  requestAnimationFrame(dibujarConfeti);
}

function velasRestantes() {
  return velasEl.querySelectorAll(".vela:not(.out)");
}

function decirVelas() {
  const quedan = velasRestantes().length;
  const total = velasEl.children.length;
  if (quedan === 0) estadoVelas.textContent = "¡Todas apagadas!";
  else if (quedan === total) estadoVelas.textContent = "El 41 está encendido.";
  else if (quedan === 1) estadoVelas.textContent = "Queda 1 vela.";
  else estadoVelas.textContent = `Quedan ${quedan} velas.`;
  return quedan;
}

function apagarUna(vela) {
  const objetivo = vela && !vela.classList.contains("out") ? vela : velasRestantes()[0];
  if (!objetivo) return;
  objetivo.classList.add("out");
  soplido();
  const rect = objetivo.getBoundingClientRect();
  rafaga(rect.left + rect.width / 2, rect.top, 10, "giro");
  if (decirVelas() === 0) celebrar();
}

function celebrar() {
  if (pedido) return;
  pedido = true;
  deseoTexto.textContent = DESEOS[Math.floor(Math.random() * DESEOS.length)];
  deseo.hidden = false;
  tarjetaPastel.classList.add("celebrando");
  const rect = $("pastel").getBoundingClientRect();
  rafaga(rect.left + rect.width / 2, rect.top + 10, 130, "arriba");
  fanfarria();
}

function reencender() {
  pedido = false;
  velasEl.querySelectorAll(".vela").forEach((vela) => vela.classList.remove("out"));
  deseo.hidden = true;
  tarjetaPastel.classList.remove("celebrando");
  decirVelas();
}

async function soplarTodas() {
  const lista = [...velasRestantes()];
  for (const vela of lista) {
    apagarUna(vela);
    await new Promise((resolver) => setTimeout(resolver, 140));
  }
}

function pararMic() {
  escuchando = false;
  cancelAnimationFrame(rafMic);
  if (streamMic) streamMic.getTracks().forEach((pista) => pista.stop());
  streamMic = null;
  analyser = null;
  medidor.hidden = true;
  microBtn.setAttribute("aria-pressed", "false");
  microBtn.textContent = "Escuchar soplido";
  microBtn.classList.remove("activa");
}

function loopMic() {
  if (!escuchando || !analyser) return;
  analyser.getByteTimeDomainData(bufMic);
  let suma = 0;
  for (let i = 0; i < bufMic.length; i += 1) {
    const valor = (bufMic[i] - 128) / 128;
    suma += valor * valor;
  }
  const rms = Math.sqrt(suma / bufMic.length);
  barra.style.transform = `scaleX(${Math.min(rms * 3.2, 1)})`;
  const ahora = performance.now();
  if (rms > 0.16 && ahora - ultimoSoplo > 680) {
    ultimoSoplo = ahora;
    apagarUna();
    if (rms > 0.32) apagarUna();
  }
  rafMic = requestAnimationFrame(loopMic);
}

async function toggleMic() {
  if (escuchando) {
    pararMic();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    estadoVelas.textContent = "Este navegador no deja usar el micrófono. Toca las velas.";
    return;
  }
  try {
    audio();
    streamMic = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false }
    });
    const contexto = audio();
    const fuente = contexto.createMediaStreamSource(streamMic);
    analyser = contexto.createAnalyser();
    analyser.fftSize = 512;
    fuente.connect(analyser);
    bufMic = new Uint8Array(analyser.fftSize);
    escuchando = true;
    medidor.hidden = false;
    microBtn.setAttribute("aria-pressed", "true");
    microBtn.textContent = "Escuchando…";
    microBtn.classList.add("activa");
    estadoVelas.textContent = "Sopla cerca del micrófono.";
    loopMic();
  } catch (error) {
    estadoVelas.textContent = "No pude usar el micrófono. Toca las velas o el soplido mágico.";
  }
}

function crearVelaPequena(indice) {
  const vela = document.createElement("button");
  vela.type = "button";
  vela.className = "vela";
  vela.setAttribute("aria-label", `Apagar vela ${indice + 1}`);
  vela.innerHTML = '<span class="llama"></span><span class="cera"></span>';
  vela.style.setProperty("--h", `${1.8 + (indice % 3) * 0.35}em`);
  vela.style.setProperty("--cera", CERAS[indice % CERAS.length]);
  vela.addEventListener("click", () => apagarUna(vela));
  return vela;
}

function crearVelaNumero(cifra) {
  const vela = document.createElement("button");
  vela.type = "button";
  vela.className = "vela numeral";
  vela.setAttribute("aria-label", `Apagar la vela del ${cifra}`);
  const llama = document.createElement("span");
  llama.className = "llama";
  const numero = document.createElement("span");
  numero.className = "cifra";
  numero.textContent = cifra;
  vela.append(llama, numero);
  vela.addEventListener("click", () => apagarUna(vela));
  return vela;
}

function construirVelas() {
  const piezasVela = [
    crearVelaPequena(0),
    crearVelaPequena(1),
    crearVelaNumero("4"),
    crearVelaNumero("1"),
    crearVelaPequena(2),
    crearVelaPequena(3)
  ];
  piezasVela.forEach((vela) => velasEl.appendChild(vela));
}

function construirGlobos() {
  const caja = $("globos");
  for (let i = 0; i < 7; i += 1) {
    const globo = document.createElement("button");
    globo.type = "button";
    globo.className = "globo";
    globo.setAttribute("aria-label", "Explotar globo");
    globo.style.setProperty("--c", COLORES[i % 6]);
    globo.style.left = `${6 + ((i * 13) % 78)}%`;
    globo.style.animationDuration = `${10 + (i % 5) * 1.6}s`;
    globo.style.animationDelay = `${-i * 1.7}s`;
    globo.addEventListener("click", () => {
      if (globo.classList.contains("pop")) return;
      globo.classList.add("pop");
      const rect = globo.getBoundingClientRect();
      rafaga(rect.left + rect.width / 2, rect.top + 20, 16, "giro");
      blip();
      setTimeout(() => {
        globo.classList.remove("pop");
        globo.style.left = `${5 + Math.random() * 78}%`;
        globo.style.animationDelay = "0s";
      }, 380);
    });
    caja.appendChild(globo);
  }
}

function construirGuirnalda() {
  const cinta = $("guirnalda");
  for (let i = 0; i < 18; i += 1) {
    const bandera = document.createElement("i");
    bandera.style.setProperty("--c", COLORES[i % 6]);
    cinta.appendChild(bandera);
  }
}

function opcionesDe(universo) {
  const otras = barajar(UNIVERSOS.filter((item) => item.nombre !== universo.nombre)).slice(0, 2);
  return barajar([universo, ...otras]);
}

function limpiarTimersQuiz() {
  clearInterval(timerQuiz);
  clearTimeout(avanceQuiz);
}

function mostrarRonda() {
  limpiarTimersQuiz();
  if (ronda >= ordenQuiz.length) {
    terminarQuiz();
    return;
  }
  revelado = false;
  eleccion = null;
  const universo = ordenQuiz[ronda];
  quizPaso.textContent = `${ronda + 1} / ${ordenQuiz.length}`;
  quizImg.src = universo.src;
  quizImg.alt = "Foto familiar en un universo paralelo";
  cuentaAtras.hidden = false;
  cuentaAtras.textContent = "3";
  quizEstado.textContent = "Tienes 3 segundos.";
  opcionesEl.replaceChildren();
  opcionesDe(universo).forEach((opcion) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton blanco opcion";
    boton.textContent = opcion.nombre;
    boton.addEventListener("click", () => elegirOpcion(boton, opcion.nombre));
    opcionesEl.appendChild(boton);
  });
  const inicio = performance.now();
  timerQuiz = setInterval(() => {
    const pasado = (performance.now() - inicio) / 1000;
    const muestra = Math.min(3, Math.max(1, 3 - Math.floor(pasado)));
    cuentaAtras.textContent = String(muestra);
    if (pasado >= 3) revelarRonda();
  }, 80);
}

function elegirOpcion(boton, nombre) {
  if (revelado) return;
  eleccion = nombre;
  opcionesEl.querySelectorAll(".opcion").forEach((item) => item.classList.remove("elegida"));
  boton.classList.add("elegida");
}

function revelarRonda() {
  if (revelado) return;
  revelado = true;
  clearInterval(timerQuiz);
  cuentaAtras.hidden = true;
  const universo = ordenQuiz[ronda];
  quizImg.alt = `Foto familiar en el universo de ${universo.nombre}`;
  opcionesEl.querySelectorAll(".opcion").forEach((boton) => {
    boton.disabled = true;
    if (boton.textContent === universo.nombre) boton.classList.add("verdadera", "salta");
    else boton.classList.add("falsa");
  });
  if (eleccion === universo.nombre) {
    aciertos += 1;
    quizEstado.textContent = "¡Ese es!";
    blip();
  } else if (eleccion) {
    quizEstado.textContent = `Era ${universo.nombre}.`;
  } else {
    quizEstado.textContent = `Este era: ${universo.nombre}.`;
  }
  ronda += 1;
  avanceQuiz = setTimeout(mostrarRonda, reduce ? 900 : 2200);
}

function terminarQuiz() {
  quizPaso.textContent = "Listo";
  quizEstado.textContent = `Acertaste ${aciertos} de ${ordenQuiz.length}.`;
  opcionesEl.replaceChildren();
  const otra = document.createElement("button");
  otra.type = "button";
  otra.className = "boton";
  otra.textContent = "Jugar otra vez";
  otra.addEventListener("click", () => {
    aciertos = 0;
    ronda = 0;
    ordenQuiz = barajar(UNIVERSOS);
    mostrarRonda();
  });
  opcionesEl.appendChild(otra);
  const rect = quizImg.getBoundingClientRect();
  rafaga(rect.left + rect.width / 2, rect.top + 20, 70, "arriba");
}

function intentarQuiz() {
  if (llegadaCerrada && quizEnVista && !quizEmpezado) {
    quizEmpezado = true;
    ordenQuiz = barajar(UNIVERSOS);
    mostrarRonda();
  }
}

function crearCarta(universo) {
  const carta = document.createElement("button");
  carta.type = "button";
  carta.className = "carta";
  carta.dataset.nombre = universo.nombre;
  carta.setAttribute("aria-label", "Carta boca abajo");
  const dorso = document.createElement("span");
  dorso.className = "dorso";
  dorso.setAttribute("aria-hidden", "true");
  const foto = document.createElement("img");
  foto.src = universo.src;
  foto.alt = "";
  foto.width = 1200;
  foto.height = 896;
  carta.append(dorso, foto);
  carta.addEventListener("click", () => voltear(carta));
  return carta;
}

function construirMemoria() {
  memoriaToken += 1;
  tablero.replaceChildren();
  abiertas = [];
  bloqueado = false;
  parejas = 0;
  memoriaFinal.textContent = "";
  memoriaEstado.textContent = `Parejas: 0 / ${UNIVERSOS.length}`;
  const mazo = barajar(UNIVERSOS.flatMap((universo) => [universo, universo]));
  mazo.forEach((universo) => tablero.appendChild(crearCarta(universo)));
}

function voltear(carta) {
  if (bloqueado || carta.classList.contains("vuelta")) return;
  const token = memoriaToken;
  carta.classList.add("vuelta");
  carta.setAttribute("aria-label", carta.dataset.nombre);
  abiertas.push(carta);
  if (abiertas.length < 2) return;
  bloqueado = true;
  const [primera, segunda] = abiertas;
  if (primera.dataset.nombre === segunda.dataset.nombre) {
    primera.classList.add("pareja");
    segunda.classList.add("pareja");
    parejas += 1;
    memoriaEstado.textContent = `Parejas: ${parejas} / ${UNIVERSOS.length}`;
    abiertas = [];
    bloqueado = false;
    blip();
    if (parejas === UNIVERSOS.length) {
      memoriaFinal.textContent = "Encontraste todos los universos.";
      const rect = tablero.getBoundingClientRect();
      rafaga(rect.left + rect.width / 2, rect.top + 40, 110, "arriba");
      fanfarria();
    }
  } else {
    setTimeout(() => {
      if (token !== memoriaToken) return;
      primera.classList.remove("vuelta");
      segunda.classList.remove("vuelta");
      primera.setAttribute("aria-label", "Carta boca abajo");
      segunda.setAttribute("aria-label", "Carta boca abajo");
      abiertas = [];
      bloqueado = false;
    }, reduce ? 350 : 900);
  }
}

function revelarCine() {
  cine.classList.remove("revelando");
  cineNombre.hidden = true;
  window.requestAnimationFrame(() => {
    cine.classList.add("revelando");
    if (reduce) cineNombre.hidden = false;
  });
}

cineColor.addEventListener("animationend", (evento) => {
  if (evento.animationName !== "abrir-circulo") return;
  cineNombre.hidden = false;
});

function prepararInclinacion() {
  if (reduce || !puedeHover) return;
  marco.addEventListener("pointermove", (evento) => {
    const rect = marco.getBoundingClientRect();
    const x = (evento.clientX - rect.left) / rect.width - 0.5;
    const y = (evento.clientY - rect.top) / rect.height - 0.5;
    marco.style.transform = `rotate(-1deg) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg)`;
  });
  marco.addEventListener("pointerleave", () => {
    marco.style.transform = "rotate(-1deg)";
  });
}

function entrarALaFiesta() {
  if (entro) return;
  entro = true;
  llegadaCerrada = true;
  document.body.classList.add("abierta");
  rafaga(innerWidth / 2, innerHeight * 0.34, 130, "arriba");
  const contexto = audio();
  if (contexto.state === "running") fanfarria();
  titulo.focus({ preventScroll: true });
  intentarQuiz();
}

function iniciar() {
  if (reduce) document.body.classList.add("reduce");
  pintarTitulo();
  construirGuirnalda();
  construirGlobos();
  construirVelas();
  construirMemoria();
  ajustarLienzo();
  dibujarConfeti();
  prepararInclinacion();
  UNIVERSOS.forEach((universo) => {
    const imagen = new Image();
    imagen.src = universo.src;
  });

  pintarMusica();

  const llegada = $("llegada");
  $("cerrar-llegada").addEventListener("click", () => llegada.close());
  llegada.addEventListener("close", () => {
    llegada.remove();
    entrarALaFiesta();
  });
  llegada.showModal();

  const gestoParaMusica = (evento) => {
    const destino = evento.target;
    if (destino && destino.closest && destino.closest("#musica")) return;
    audio();
  };
  document.addEventListener("pointerdown", gestoParaMusica);
  document.addEventListener("keydown", gestoParaMusica);

  musicaBtn.addEventListener("click", toggleMusica);
  $("mas-fiesta").addEventListener("click", () => {
    audio();
    rafaga(innerWidth * 0.5, innerHeight * 0.35, 100, "arriba");
    fanfarria();
  });
  $("soplar-una").addEventListener("click", () => apagarUna());
  $("soplar-todas").addEventListener("click", soplarTodas);
  microBtn.addEventListener("click", toggleMic);
  $("reencender").addEventListener("click", reencender);
  $("reiniciar-memoria").addEventListener("click", construirMemoria);
  $("replay-cine").addEventListener("click", revelarCine);

  const verQuiz = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      quizEnVista = entrada.isIntersecting;
      if (entrada.isIntersecting) intentarQuiz();
    });
  }, { threshold: 0.4 });
  verQuiz.observe($("seccion-quiz"));

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && llegadaCerrada) pararMic();
  });
  addEventListener("resize", ajustarLienzo);
}

iniciar();
