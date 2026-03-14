// Seleciona todos os elementos que vão se mover
const parallaxElements = document.querySelectorAll('.parallax-el');

// Variáveis para rastrear o mouse e a posição atual (para o LERP)
let mouseX = 0;
let mouseY = 0;
let currentX = 0;
let currentY = 0;

// Ouve o movimento do mouse
window.addEventListener('mousemove', (e) => {
    // Normaliza os valores para que o centro da tela seja 0,0
    // Dividir por um número alto (como 40) define o limite de quão longe os itens vão
    mouseX = (window.innerWidth / 2 - e.pageX) / 40;
    mouseY = (window.innerHeight / 2 - e.pageY) / 40;
});

// Função de animação de alta performance
const animateParallax = () => {
    // LERP (Linear Interpolation) - suaviza o movimento
    // 0.05 é a velocidade da suavização. Menor = mais suave/lento.
    currentX += (mouseX - currentX) * 0.05;
    currentY += (mouseY - currentY) * 0.05;

    parallaxElements.forEach((el) => {
        // Pega a velocidade individual de cada elemento
        const speed = el.getAttribute('data-speed');
        
        // Aplica o movimento e adiciona uma leve rotação 3D
        const x = currentX * speed;
        const y = currentY * speed;
        const rotate = (currentX * speed) * 0.5; // Gira levemente baseado no eixo X

        // Preserva a animação de CSS (float) e adiciona o transform do JS
        el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg)`;
    });

    // Chama o próximo frame (loop infinito amigável para o navegador)
    requestAnimationFrame(animateParallax);
};

// Inicia o loop de animação de parallax
animateParallax();

// --- ANIMAÇÃO DE REVELAÇÃO AO ROLAR (SCROLL REVEAL) ---
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            // IMPORTANTE: Para de observar o elemento após a animação acontecer pela primeira vez!
            // Isso evita que a animação fique "resetando" toda vez que você sobe e desce a página.
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.10 // Reduzi um pouco para 10% para garantir que dispare mais fácil em telas menores
});

revealElements.forEach(el => revealObserver.observe(el));

// --- MODAL DE CEP ---
const cepModal = document.getElementById('cep-modal');
const btnOpenModal = document.getElementById('btn-open-cep-modal');
const btnCloseModal = document.getElementById('close-cep-modal');

// Abrir modal
if (btnOpenModal && cepModal) {
    btnOpenModal.addEventListener('click', () => {
        cepModal.classList.remove('hidden');
    });
}

// Fechar modal no X
if (btnCloseModal && cepModal) {
    btnCloseModal.addEventListener('click', () => {
        cepModal.classList.add('hidden');
    });
}

// Fechar modal clicando fora da caixa
if (cepModal) {
    cepModal.addEventListener('click', (e) => {
        if (e.target === cepModal) {
            cepModal.classList.add('hidden');
        }
    });
}

// --- INTEGRAÇÃO COM A VIA CEP API ---
const cepInput = document.getElementById('cep-input');
const btnBuscarCep = document.getElementById('btn-buscar-cep');
const enderecoResult = document.getElementById('endereco-result');
const inputRua = document.getElementById('rua');
const inputBairro = document.getElementById('bairro');
const inputCidadeUf = document.getElementById('cidade-uf');
const cepError = document.getElementById('cep-error');

// Evento de clique no botão de busca
if (btnBuscarCep) {
    btnBuscarCep.addEventListener('click', () => {
        buscarCep(cepInput.value);
    });
}

// Permitir busca ao pressionar "Enter" no campo
if (cepInput) {
    cepInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            buscarCep(cepInput.value);
        }
    });
}

async function buscarCep(cep) {
    // Remove tudo que não for número (caso o usuário digite traços)
    const cepLimpo = cep.replace(/\D/g, '');

    // Validação básica do CEP (deve ter 8 números)
    if (cepLimpo.length !== 8) {
        mostrarErro(true);
        return;
    }

    try {
        // Altera texto do botão para carregando
        const btnOriginalText = btnBuscarCep.innerText;
        btnBuscarCep.innerText = "Buscando...";
        btnBuscarCep.disabled = true;

        // Requisição para a API ViaCEP
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();

        // Volta botão ao normal
        btnBuscarCep.innerText = btnOriginalText;
        btnBuscarCep.disabled = false;

        // Se a API retornar erro (CEP não existe)
        if (data.erro) {
            mostrarErro(true);
            return;
        }

        // Sucesso: Preenche os campos
        mostrarErro(false);
        inputRua.value = data.logradouro || 'Não disponível';
        inputBairro.value = data.bairro || 'Não disponível';
        inputCidadeUf.value = `${data.localidade} / ${data.uf}`;

        // Mostra a div de resultados
        enderecoResult.classList.remove('hidden');

    } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        mostrarErro(true);
        btnBuscarCep.innerText = "Buscar";
        btnBuscarCep.disabled = false;
    }
}

function mostrarErro(show) {
    if (show) {
        cepError.classList.remove('hidden');
        enderecoResult.classList.add('hidden');
    } else {
        cepError.classList.add('hidden');
    }
}