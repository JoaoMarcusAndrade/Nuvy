if (window.location.pathname === "/jogos") {
    // tentar mostrar jogos direto
    fetch("/check-auth", { credentials: "include" })
        .then(r => r.json())
        .then(data => {
            if (data.authenticated) {
                showJogosSection();
            } else {
                history.pushState({}, "", "/login");
                renderView("/login");
            }
        });
}

/* ---------- ELEMENTOS ---------- */
// Elementos das views
const loginView = document.getElementById("loginView");
const loginRespView = document.getElementById("loginResponsavelView");
const cadastroView = document.getElementById("cadastroView");
const cadastroRespView = document.getElementById("cadastroResponsavelView");

// Seções da SPA
const homeSection = document.getElementById("home");
const jogosSection = document.getElementById("jogos-section");
const mainHeader = document.getElementById("main-header");

// Botões de navegação entre login/cadastro
const toCadastro = document.getElementById("toCadastro");
const toLogin = document.getElementById("toLogin");

// Botões de navegação do responsável
const toCadastroResp = document.getElementById("toCadastroResp");
const toLoginResp = document.getElementById("toLoginResp");

// Elementos de aviso/erro
const avisoLogin = document.getElementById("avisoLogin");
const avisoLoginResp = document.getElementById("avisoLoginResp");
const avisoCadastro = document.getElementById("avisoCadastro");
const avisoCadastroResp = document.getElementById("avisoCadastroResp");

// Variável para guardar ID do usuário recém cadastrado
let usuarioRecemCadastradoID = null;

/* ---------- FUNÇÕES DE VIEW ---------- */
// Esconde todas as views do modal
function hideAllViews() {
    loginView.style.display = "none";
    loginRespView.style.display = "none";
    cadastroView.style.display = "none";
    cadastroRespView.style.display = "none";
}

// Renderiza a view correta de acordo com o caminho
function renderView(path) {
    hideAllViews();
    switch (path) {
        case "/login":
            loginView.style.display = "block"; break;
        case "/login/responsavel":
            loginRespView.style.display = "block"; break;
        case "/cadastro":
            cadastroView.style.display = "block"; break;
        case "/cadastro/responsavel":
            cadastroRespView.style.display = "block"; break;
        default:
            loginView.style.display = "block";
    }
}

// Mostra a seção de jogos e esconde a home
function showJogosSection() {
    homeSection.classList.remove("active");
    homeSection.style.display = "none";
    mainHeader.style.display = "none";
    jogosSection.classList.add("active");
    jogosSection.style.display = "flex";

    history.pushState({}, "", "/jogos");

    carregarVideos("computação para crianças");
    
    // Forçar redimensionamento para corrigir layout
    setTimeout(() => { 
        window.dispatchEvent(new Event('resize')); 
        
        // INICIALIZAR O JOGO - LINHA ADICIONADA
        if (typeof initializeGame === 'function') {
            setTimeout(initializeGame, 100);
        }
    }, 50);
    
    window.scrollTo(0, 0);
}

// Mostra a seção home e esconde a de jogos
function showHomeSection() {
    jogosSection.classList.remove("active");
    jogosSection.style.display = "none";
    homeSection.classList.add("active");
    homeSection.style.display = "flex";
    mainHeader.style.display = "block";
    window.scrollTo(0, 0);
}

// Fecha o modal
function closeModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('staticBackdrop'));
    modal.hide();
}

// Renderiza la view ao carregar a página e ao navegar pelo histórico
window.addEventListener("DOMContentLoaded", async () => {
    try {
        // verifica se há cookie válido no servidor
        const res = await fetch("/check-auth", { credentials: "include" });
        const data = await res.json();

        if (data.authenticated) {
            // já tem cookie válido → mostra a área de jogos
            closeModal(); // garante que modal esteja fechado
            showJogosSection();
        } else {
            // não autenticado → mostra login normal
            renderView(window.location.pathname);
        }
    } catch (err) {
        renderView("/login");
    }
});

// ---------- LOGOUT ----------
async function logoutUser() {
    try {
        // faz o logout no servidor e limpa cookies
        await fetch("/logout", { method: "POST", credentials: "include" });
        
        // Limpa os dados do localStorage
        localStorage.removeItem('userData');
        localStorage.removeItem('userXP');
        localStorage.removeItem("idUsuarioParaVinculo");
        
        // volta para a tela inicial/login
        showHomeSection();
        history.pushState({}, "", "/login");
        renderView("/login");
        
        // Fecha o modal se estiver aberto
        const modal = bootstrap.Modal.getInstance(document.getElementById('staticBackdrop'));
        if (modal) {
            modal.hide();
        }
        
        console.log("Logout realizado com sucesso");
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        // Mesmo em caso de erro, redireciona para home
        showHomeSection();
        history.pushState({}, "", "/login");
        renderView("/login");
    }
}

// Configura os botões de logout
document.addEventListener("DOMContentLoaded", () => {
    // Botão de logout da navbar
    const logoutBtnNav = document.getElementById("logoutBtnNav");
    if (logoutBtnNav) {
        logoutBtnNav.addEventListener("click", async (e) => {
            e.preventDefault();
            await logoutUser();
        });
    }
});

window.addEventListener("popstate", () => renderView(window.location.pathname));

/* ---------- NAVEGAÇÃO ---------- */
// Troca para tela de cadastro
toCadastro.onclick = e => { e.preventDefault(); history.pushState({}, "", "/cadastro"); renderView("/cadastro"); };
// Troca para tela de login
toLogin.onclick = e => { e.preventDefault(); history.pushState({}, "", "/login"); renderView("/login"); };

/* ---------- NAVEGAÇÃO DO RESPONSÁVEL ---------- */
// Troca para tela de cadastro do responsável
toCadastroResp.onclick = e => {
    e.preventDefault();
    history.pushState({}, "", "/cadastro/responsavel");
    renderView("/cadastro/responsavel");
};

// Troca para tela de login do responsável
toLoginResp.onclick = e => {
    e.preventDefault();
    history.pushState({}, "", "/login/responsavel");
    renderView("/login/responsavel");
};

/* ---------- CADASTRO USUÁRIO ---------- */
// Lógica de cadastro de usuário
document.getElementById("formCadastro").onsubmit = async e => {
    e.preventDefault();
    const email = document.getElementById("inpgmailCadastro").value;
    const senha = document.getElementById("inpsenhaCadastro").value;
    const nome = document.getElementById("inpnome").value;
    const idade = parseInt(document.getElementById("inpidade").value);
    const confirmaSenha = document.getElementById("inpconfirmsenha").value;

    // Validação de senha
    if (senha.length < 8) {
        avisoCadastro.style.color = "red";
        avisoCadastro.textContent = "Senha mínima 8 caracteres";
        return;
    }
    if (senha !== confirmaSenha) {
        avisoCadastro.style.color = "red";
        avisoCadastro.textContent = "As senhas não coincidem!";
        return;
    }

    // Envia dados para o backend
    try {
        const res = await fetch("/cadastro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha, nome, idade }),
        });
        const data = await res.json();
        if (!res.ok) {
            avisoCadastro.style.color = "red";
            avisoCadastro.textContent = data.msg;
            return;
        }

        avisoCadastro.style.color = "green";
        avisoCadastro.textContent = "Usuário cadastrado com sucesso!";
        usuarioRecemCadastradoID = data.usuario.ID_usuarios;

        // Se for menor de idade, pede LOGIN do responsável (ALTERADO)
        if (idade < 16) {
            history.pushState({}, "", "/login/responsavel");
            renderView("/login/responsavel");
        } else {
            // Se for maior de idade, fecha o modal e mostra a área de jogos
            closeModal();
            showJogosSection();
        }
    } catch (err) {
        avisoCadastro.style.color = "red";
        avisoCadastro.textContent = "Erro ao cadastrar usuário";
    }
};

/* ---------- CADASTRO RESPONSÁVEL ---------- */
// Lógica de cadastro do responsável
document.getElementById("formCadastroResp").onsubmit = async e => {
    e.preventDefault();
    const email = document.getElementById("inpgmailCadastroResp").value;
    const senha = document.getElementById("inpsenhaCadastroResp").value;
    const confirmaSenha = document.getElementById("inpconfirmsenhaResp").value;

    // Validação de senha
    if (senha.length < 8) {
        avisoCadastroResp.style.color = "red";
        avisoCadastroResp.textContent = "Senha mínima 8 caracteres";
        return;
    }
    if (senha !== confirmaSenha) {
        avisoCadastroResp.style.color = "red";
        avisoCadastroResp.textContent = "As senhas não coincidem!";
        return;
    }

    // Envia dados para o backend
    try {
        const res = await fetch("/cadastro/responsavel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha }),
        });
        const data = await res.json();
        if (!res.ok) {
            avisoCadastroResp.style.color = "red";
            avisoCadastroResp.textContent = data.msg;
            return;
        }

        avisoCadastroResp.style.color = "green";
        avisoCadastroResp.textContent = "Responsável cadastrado com sucesso!";

        // Cria vínculo entre usuário and responsável
        if (usuarioRecemCadastradoID) {
            const vinculoRes = await fetch("/vincular", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    idUsuario: usuarioRecemCadastradoID,
                    idResponsavel: data.responsavel.ID_responsaveis
                })
            });

            if (vinculoRes.ok) {
                // agora o vínculo existe, podemos liberar acesso ao usuário
                closeModal();
                showJogosSection();
            } else {
                avisoLoginResp.style.color = "red";
                avisoLoginResp.textContent = "Erro ao criar vínculo";
            }
        }

    } catch (err) {
        avisoCadastroResp.style.color = "red";
        avisoCadastroResp.textContent = "Erro ao cadastrar responsável";
    }
};

/* ---------- LOGIN USUÁRIO ---------- */
// Lógica de login do usuário
document.getElementById("formLogin").onsubmit = async e => {
    e.preventDefault();
    const email = document.getElementById("inpgmailLogin").value;
    const senha = document.getElementById("inpsenhaLogin").value;

    try {
        const res = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha }),
            credentials: "include"
        });
        const data = await res.json();

        if (res.ok) {
            avisoLogin.style.color = "green";
            avisoLogin.textContent = data.msg;

            // Fecha o modal e mostra a área de jogos
            closeModal();
            showJogosSection();
        } else {
            avisoLogin.style.color = "red";
            avisoLogin.textContent = data.msg;

            // Se o erro indicar que precisa de responsável
            if (data.requireResponsavel) {
                // Salva o ID do usuário menor no localStorage para usar no login do responsável
                localStorage.setItem("idUsuarioParaVinculo", data.idUsuario);

                history.pushState({}, "", "/login/responsavel");
                renderView("/login/responsavel");
            }
        }
    } catch (err) {
        avisoLogin.style.color = "red";
        avisoLogin.textContent = "Erro ao conectar com servidor";
    }
};

/* ---------- LOGIN RESPONSÁVEL ---------- */
// Lógica de login do responsável
document.getElementById("formLoginResp").onsubmit = async e => {
    e.preventDefault();
    const email = document.getElementById("inpgmailLoginResp").value;
    const senha = document.getElementById("inpsenhaLoginResp").value;

    try {
        // Pega o ID do usuário menor do localStorage
        const idUsuarioParaVinculo = usuarioRecemCadastradoID || localStorage.getItem("idUsuarioParaVinculo");

        const res = await fetch("/login/responsavel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha, idUsuarioParaVinculo }),
            credentials: "include"
        });
        const data = await res.json();

        if (res.ok) {
            avisoLoginResp.style.color = "green";
            avisoLoginResp.textContent = data.msg;

            // Limpa o localStorage após criar vínculo
            localStorage.removeItem("idUsuarioParaVinculo");

            // Fecha o modal e mostra a área de jogos
            closeModal();
            showJogosSection();
        } else {
            avisoLoginResp.style.color = "red";
            avisoLoginResp.textContent = data.msg;
        }
    } catch (err) {
        avisoLoginResp.style.color = "red";
        avisoLoginResp.textContent = "Erro ao conectar com servidor";
    }
};

// ===== SIDEBAR DO PERFIL =====
// Funções para controlar o sidebar do perfil
function initializeProfileSidebar() {
    const profilePic = document.querySelector('.profile-pic-btn');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarLogout = document.getElementById('logoutBtnSidebar');
    const profileSidebar = document.getElementById('profileSidebar');
    
    // Abrir sidebar ao clicar na foto de perfil
    if (profilePic) {
        profilePic.addEventListener('click', openProfileSidebar);
    }
    
    // Fechar sidebar
    if (closeSidebar) {
        closeSidebar.addEventListener('click', closeProfileSidebar);
    }
    
    // Fechar sidebar ao clicar no overlay (apenas desktop)
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeProfileSidebar);
    }
    
    // Logout pelo sidebar
    if (sidebarLogout) {
        sidebarLogout.addEventListener('click', function(e) {
            e.preventDefault();
            closeProfileSidebar();
            // Aguarda a animação do sidebar fechar antes do logout
            setTimeout(logoutUser, 300);
        });
    }
    
    // Fechar sidebar com a tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && profileSidebar.classList.contains('active')) {
            closeProfileSidebar();
        }
    });

    // Fechar sidebar ao clicar em links do menu (mobile)
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) { // Apenas no mobile
                e.preventDefault();
                closeProfileSidebar();
            }
        });
    });
}

function openProfileSidebar() {
    const profileSidebar = document.getElementById('profileSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (profileSidebar) {
        // Carregar dados do usuário antes de abrir
        loadUserData();
        
        profileSidebar.classList.add('active');
        
        // Apenas no desktop mostra o overlay
        if (sidebarOverlay && window.innerWidth > 768) {
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        // No mobile, apenas adiciona uma classe para evitar scroll
        if (window.innerWidth <= 768) {
            document.body.classList.add('sidebar-open');
        }
    }
}

function closeProfileSidebar() {
    const profileSidebar = document.getElementById('profileSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (profileSidebar) {
        profileSidebar.classList.remove('active');
        
        // Remove overlay no desktop
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
        }
        
        // Restaura o scroll
        document.body.style.overflow = '';
        document.body.classList.remove('sidebar-open');
    }
}

function loadUserData() {
    // Recupera dados do usuário do localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    const userNameElement = document.getElementById('userName');
    const userXPElement = document.getElementById('userXP');
    
    if (userData && userNameElement) {
        userNameElement.textContent = userData.nome || 'Usuário';
    }
    
    if (userXPElement) {
        // Recupera XP do localStorage ou define como 0
        const userXP = localStorage.getItem('userXP') || '0';
        userXPElement.textContent = userXP;
    }
}

// Fechar sidebar ao redimensionar a janela (se mudar de mobile para desktop)
window.addEventListener('resize', function() {
    const profileSidebar = document.getElementById('profileSidebar');
    if (window.innerWidth > 768 && profileSidebar.classList.contains('active')) {
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (sidebarOverlay) {
            sidebarOverlay.classList.add('active');
        }
    }
});

// ===== MODAL DE VÍDEO DO YOUTUBE =====
// Função para inicializar o modal de vídeo
function initializeVideoModal() {
    const videoModal = document.getElementById('videoModal');
    
    // Fechar modal com tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && videoModal.classList.contains('show')) {
            const modal = bootstrap.Modal.getInstance(videoModal);
            modal.hide();
        }
    });
    
    // Limpar o vídeo quando o modal for fechado
    videoModal.addEventListener('hidden.bs.modal', function() {
        const player = document.getElementById('youtubePlayer');
        player.src = ''; // Para o vídeo
    });
}

// Função para adicionar event listeners aos cards de vídeo
function adicionarEventListenersVideos() {
    const videoCards = document.querySelectorAll('.video-card');
    
    videoCards.forEach(card => {
        card.addEventListener('click', function() {
            const videoId = this.getAttribute('data-video-id');
            const videoTitle = this.getAttribute('data-video-title');
            abrirModalVideo(videoId, videoTitle);
        });
    });
}

// Função para abrir o modal de vídeo
function abrirModalVideo(videoId, videoTitle) {
    // Atualiza o título do modal
    document.getElementById('videoModalLabel').textContent = videoTitle;
    
    // Configura a URL do vídeo com autoplay
    const videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    
    // Atualiza o iframe do player
    const player = document.getElementById('youtubePlayer');
    player.src = videoUrl;
    
    // Abre o modal
    const videoModal = new bootstrap.Modal(document.getElementById('videoModal'));
    videoModal.show();
}

// ===== API YOUTUBE ATUALIZADA =====
const API_KEY = "AIzaSyBxtBtd9sz9cgafxGT1zkPMb4lHXmGxsLU"

async function carregarVideos(termo = "Videos educacionais Infantil sobre computação em nuvem") {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(termo)}&type=video&maxResults=12&key=${API_KEY}`;

    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();

        const container = document.getElementById("youtube-cards");
        container.innerHTML = ""; // limpa antes de inserir novos cards

        dados.items.forEach(item => {
            const videoId = item.id.videoId;
            const titulo = item.snippet.title;
            const thumb = item.snippet.thumbnails.medium.url;

            // card HTML - Agora com evento para abrir modal
            const card = document.createElement("div");
            card.className = "card video-card";
            card.setAttribute('data-video-id', videoId);
            card.setAttribute('data-video-title', titulo);
            card.innerHTML = `
                <img src="${thumb}" alt="${titulo}" />
                <p>${titulo}</p>
            `;
            container.appendChild(card);
        });

        // Adiciona event listeners para os cards de vídeo
        adicionarEventListenersVideos();
    } catch (error) {
        console.error('Erro ao carregar vídeos:', error);
        const container = document.getElementById("youtube-cards");
        container.innerHTML = '<p>Erro ao carregar vídeos. Tente novamente mais tarde.</p>';
    }
}

// ===== INICIALIZAÇÃO GERAL =====
// Inicializar tudo quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    initializeProfileSidebar();
    initializeVideoModal();
    
    // Inicializar o botão de logout existente
    const logoutBtnNav = document.getElementById("logoutBtnNav");
    if (logoutBtnNav) {
        logoutBtnNav.addEventListener("click", async (e) => {
            e.preventDefault();
            await logoutUser();
        });
    }
    
    // Carregar vídeos se estiver na seção de jogos
    if (window.location.pathname === "/jogos" || document.getElementById('jogos-section').classList.contains('active')) {
        carregarVideos("computação para crianças");
    }
});

// Exportar funções para uso global (se necessário)
window.carregarVideos = carregarVideos;
window.abrirModalVideo = abrirModalVideo;