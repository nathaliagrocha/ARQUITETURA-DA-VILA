// ===== Dados da cruzadinha (posições planejadas e verificadas) =====
const PALAVRAS = [
  { resposta: "CACHE",            linha: 2,  coluna: 0,  direcao: "H", pista: "Memória pequena e veloz entre processador e memória principal, guarda dados muito usados." },
  { resposta: "DMA",              linha: 0,  coluna: 11, direcao: "H", pista: "Recurso que deixa periféricos moverem dados direto para a memória, sem ocupar o processador." },
  { resposta: "QUADCORE",         linha: 3,  coluna: 7,  direcao: "H", pista: "Processador com quatro núcleos de execução no mesmo chip." },
  { resposta: "DATABUS",          linha: 6,  coluna: 2,  direcao: "H", pista: "Via por onde trafegam os valores lidos ou escritos entre processador, memória e periféricos." },
  { resposta: "UC",               linha: 6,  coluna: 14, direcao: "H", pista: "Circuito do processador que decodifica instruções e comanda os demais blocos internos." },
  { resposta: "FLASH",            linha: 8,  coluna: 2,  direcao: "H", pista: "Memória não volátil regravável por blocos, usada em pendrives e SSDs." },
  { resposta: "MICROCONTROLADOR", linha: 10, coluna: 0,  direcao: "H", pista: "Chip que reúne processador, memória e periféricos, comum em sistemas embarcados." },
  { resposta: "ADDRESSBUS",       linha: 12, coluna: 0,  direcao: "H", pista: "Linhas por onde o processador indica a posição de memória que quer acessar." },
  { resposta: "RAM",              linha: 13, coluna: 11, direcao: "H", pista: "Memória de trabalho, rápida, que guarda programas em execução e perde o conteúdo sem energia." },
  { resposta: "ULA",              linha: 0,  coluna: 1,  direcao: "V", pista: "Parte do processador que faz as contas e as comparações lógicas." },
  { resposta: "REGISTRADORES",    linha: 1,  coluna: 4,  direcao: "V", pista: "Pequenas memórias dentro do processador, as mais rápidas, que guardam dados da operação em curso." },
  { resposta: "CPU",              linha: 1,  coluna: 8,  direcao: "V", pista: "Componente que busca, interpreta e executa as instruções dos programas no computador." },
  { resposta: "MEMORIADEMASSA",   linha: 0,  coluna: 12, direcao: "V", pista: "Dispositivo de grande capacidade e acesso lento, como o HD, que guarda arquivos sem energia." },
  { resposta: "EEPROM",           linha: 5,  coluna: 0,  direcao: "V", pista: "Memória permanente regravável, cujos bytes podem ser alterados individualmente, sem luz ultravioleta." },
  { resposta: "DUALCORE",         linha: 5,  coluna: 14, direcao: "V", pista: "Processador com dois núcleos de execução no mesmo chip." },
  { resposta: "ROM",              linha: 9,  coluna: 10, direcao: "V", pista: "Memória permanente gravada na fabricação, guarda o firmware inicial e não é reescrita pelo usuário." },
];

// ===== Elementos da página =====
const telas = document.querySelectorAll(".tela");
const tabuleiro = document.getElementById("tabuleiro");
const contador = document.getElementById("contador");
const mensagem = document.getElementById("mensagem");

const celulas = {};          // "linha,coluna" -> { div, input, palavras: {H, V} }
let palavraAtiva = null;     // palavra selecionada no momento
let celulaAtual = null;      // chave da célula com foco

// ===== Navegação entre telas =====
// A tela atual fica na URL (#tela-jogo), então o botão "voltar" do navegador também funciona.
// O progresso da cruzadinha é mantido ao voltar, pois o tabuleiro não é recriado.
const ETAPAS = ["tela-inicio", "tela-historia", "tela-jogo"];

function mostrarTela(id) {
  telas.forEach(t => t.classList.toggle("ativa", t.id === id));
  document.querySelectorAll(".etapas button").forEach(b => b.classList.toggle("atual", b.dataset.ir === id));
  document.body.classList.toggle("fundo-sala", id === "tela-jogo");
  window.scrollTo(0, 0);
  if (id === "tela-jogo" && !palavraAtiva) {
    const primeira = numeradas[0];
    const k = chave(primeira.linha, primeira.coluna);
    selecionarPalavra(primeira, k);
    celulas[k].input.focus();
  }
}

function rotear() {
  const id = location.hash.slice(1);
  mostrarTela(ETAPAS.includes(id) ? id : "tela-inicio");
}

document.querySelectorAll("[data-ir]").forEach(el =>
  el.addEventListener("click", () => { location.hash = el.dataset.ir; })
);
window.addEventListener("hashchange", rotear);

// ===== Construção do tabuleiro =====
const chave = (l, c) => l + "," + c;
const coordenadas = (p, i) => [p.linha + (p.direcao === "V" ? i : 0), p.coluna + (p.direcao === "H" ? i : 0)];

// numeração pela ordem de leitura (linha, depois coluna)
const inicios = [...new Set(PALAVRAS.map(p => chave(p.linha, p.coluna)))]
  .sort((a, b) => {
    const [la, ca] = a.split(",").map(Number), [lb, cb] = b.split(",").map(Number);
    return la - lb || ca - cb;
  });
PALAVRAS.forEach(p => p.numero = inicios.indexOf(chave(p.linha, p.coluna)) + 1);
const numeradas = [...PALAVRAS].sort((a, b) => a.numero - b.numero);

function construirTabuleiro() {
  PALAVRAS.forEach(p => {
    for (let i = 0; i < p.resposta.length; i++) {
      const [l, c] = coordenadas(p, i);
      const k = chave(l, c);
      if (!celulas[k]) celulas[k] = { l, c, palavras: {} };
      celulas[k].palavras[p.direcao] = p;
    }
  });

  const totalLinhas = Math.max(...Object.values(celulas).map(x => x.l)) + 1;
  const totalColunas = Math.max(...Object.values(celulas).map(x => x.c)) + 1;
  tabuleiro.style.gridTemplateColumns = `repeat(${totalColunas}, auto)`;

  for (let l = 0; l < totalLinhas; l++) {
    for (let c = 0; c < totalColunas; c++) {
      const div = document.createElement("div");
      div.className = "cell";
      const dados = celulas[chave(l, c)];
      if (!dados) {
        div.classList.add("vazia");
      } else {
        const input = document.createElement("input");
        input.maxLength = 1;
        input.autocomplete = "off";
        input.setAttribute("aria-label", `Linha ${l + 1}, coluna ${c + 1}`);
        input.addEventListener("focus", () => aoFocar(chave(l, c)));
        input.addEventListener("click", () => aoClicar(chave(l, c)));
        input.addEventListener("input", () => aoDigitar(chave(l, c)));
        input.addEventListener("keydown", e => aoTeclar(e, chave(l, c)));
        div.appendChild(input);
        const inicio = inicios.indexOf(chave(l, c));
        if (inicio >= 0) {
          const num = document.createElement("span");
          num.className = "num";
          num.textContent = inicio + 1;
          div.appendChild(num);
        }
        dados.div = div;
        dados.input = input;
      }
      tabuleiro.appendChild(div);
    }
  }
}

function construirPistas() {
  numeradas.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `<b>${p.numero}.</b> ${p.pista}`;
    li.addEventListener("click", () => {
      const k = chave(p.linha, p.coluna);
      selecionarPalavra(p, k);
      celulas[k].input.focus();
    });
    p.itemPista = li;
    document.getElementById(p.direcao === "H" ? "pistas-horizontais" : "pistas-verticais").appendChild(li);
  });
}

// ===== Seleção e digitação =====
function selecionarPalavra(palavra, k) {
  palavraAtiva = palavra;
  celulaAtual = k;
  Object.values(celulas).forEach(x => x.div.classList.remove("ativa", "atual"));
  PALAVRAS.forEach(p => p.itemPista.classList.remove("ativa"));
  for (let i = 0; i < palavra.resposta.length; i++) {
    celulas[chave(...coordenadas(palavra, i))].div.classList.add("ativa");
  }
  celulas[k].div.classList.add("atual");
  palavra.itemPista.classList.add("ativa");
}

function aoFocar(k) {
  const palavras = celulas[k].palavras;
  const manter = palavraAtiva && palavras[palavraAtiva.direcao] === palavraAtiva;
  selecionarPalavra(manter ? palavraAtiva : (palavras.H || palavras.V), k);
}

// segundo clique na mesma casa troca entre horizontal e vertical
let ultimoClique = null;
function aoClicar(k) {
  const { H, V } = celulas[k].palavras;
  if (H && V && ultimoClique === k) selecionarPalavra(palavraAtiva === H ? V : H, k);
  ultimoClique = k;
}

function posicaoNaPalavra(k) {
  for (let i = 0; i < palavraAtiva.resposta.length; i++) {
    if (chave(...coordenadas(palavraAtiva, i)) === k) return i;
  }
  return -1;
}

function irPara(indice) {
  if (indice < 0 || indice >= palavraAtiva.resposta.length) return;
  const k = chave(...coordenadas(palavraAtiva, indice));
  celulas[k].input.focus();
}

function aoDigitar(k) {
  const input = celulas[k].input;
  // maiúscula, sem acento, somente A-Z
  const letra = input.value.normalize("NFD").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(-1);
  input.value = letra;
  limparResultado();
  if (letra) irPara(posicaoNaPalavra(k) + 1);
}

function aoTeclar(e, k) {
  const input = celulas[k].input;
  const setas = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };
  if (e.key === "Backspace" && !input.value) {
    e.preventDefault();
    irPara(posicaoNaPalavra(k) - 1);
  } else if (setas[e.key]) {
    e.preventDefault();
    const [dl, dc] = setas[e.key];
    const vizinha = celulas[chave(celulas[k].l + dl, celulas[k].c + dc)];
    if (vizinha) vizinha.input.focus();
  }
}

// ===== Conferir, contador e reiniciar =====
function limparResultado() {
  Object.values(celulas).forEach(x => x.div.classList.remove("certa", "errada"));
  PALAVRAS.forEach(p => p.itemPista.classList.remove("certa", "errada"));
}

function textoDigitado(p) {
  let texto = "";
  for (let i = 0; i < p.resposta.length; i++) texto += celulas[chave(...coordenadas(p, i))].input.value || "_";
  return texto;
}

function conferir() {
  limparResultado();
  let acertos = 0;
  // erradas primeiro, certas depois: letra compartilhada fica verde se uma das palavras está certa
  const resultados = PALAVRAS.map(p => ({ p, certa: textoDigitado(p) === p.resposta }));
  [...resultados].sort((a, b) => a.certa - b.certa).forEach(({ p, certa }) => {
    if (certa) acertos++;
    p.itemPista.classList.add(certa ? "certa" : "errada");
    for (let i = 0; i < p.resposta.length; i++) {
      const div = celulas[chave(...coordenadas(p, i))].div;
      if (certa) { div.classList.remove("errada"); div.classList.add("certa"); }
      else if (!div.classList.contains("certa")) div.classList.add("errada");
    }
  });
  contador.textContent = `${acertos} de ${PALAVRAS.length} palavras`;
  mensagem.textContent = acertos === PALAVRAS.length
    ? "Parabéns! Você completou o desafio da Vila!"
    : "Verde: palavra certa. Vermelho: palavra errada ou incompleta.";
}

function reiniciar() {
  Object.values(celulas).forEach(x => x.input.value = "");
  limparResultado();
  contador.textContent = `0 de ${PALAVRAS.length} palavras`;
  mensagem.textContent = "";
  const k = chave(numeradas[0].linha, numeradas[0].coluna);
  selecionarPalavra(numeradas[0], k);
  celulas[k].input.focus();
}

document.getElementById("btn-conferir").addEventListener("click", conferir);
document.getElementById("btn-reiniciar").addEventListener("click", reiniciar);

construirTabuleiro();
construirPistas();
rotear();
