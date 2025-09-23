// Verifica se está na rota /jogos
if (window.location.pathname === "/jogos") {
    document.addEventListener('DOMContentLoaded', () => {
        fetch("/check-auth", { credentials: "include" })
            .then(r => r.json())
            .then(data => {
                if (data.authenticated) {
                    showJogosSection();
                } else {
                    history.pushState({}, "", "/login");
                    renderView("/login");
                }
            })
            .catch(error => {
                console.error("Erro ao verificar autenticação:", error);
                history.pushState({}, "", "/login");
                renderView("/login");
            });
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
    if (loginView) loginView.style.display = "none";
    if (loginRespView) loginRespView.style.display = "none";
    if (cadastroView) cadastroView.style.display = "none";
    if (cadastroRespView) cadastroRespView.style.display = "none";
}

// Renderiza a view correta de acordo com o caminho
function renderView(path) {
    hideAllViews();
    switch (path) {
        case "/login":
            if (loginView) loginView.style.display = "block";
            break;
        case "/login/responsavel":
            if (loginRespView) loginRespView.style.display = "block";
            break;
        case "/cadastro":
            if (cadastroView) cadastroView.style.display = "block";
            break;
        case "/cadastro/responsavel":
            if (cadastroRespView) cadastroRespView.style.display = "block";
            break;
        default:
            if (loginView) loginView.style.display = "block";
    }
}

// Mostra a seção de jogos e esconde a home
function showJogosSection() {
    if (!homeSection || !jogosSection) {
        console.error("Elementos da seção não encontrados");
        return;
    }
    
    homeSection.classList.remove("active");
    homeSection.style.display = "none";
    if (mainHeader) mainHeader.style.display = "none";
    
    jogosSection.classList.add("active");
    jogosSection.style.display = "flex";

    history.pushState({}, "", "/jogos");

    // Carrega vídeos apenas se a função existir
    if (typeof carregarVideos === 'function') {
        setTimeout(() => {
            carregarVideos("computação para crianças");
        }, 100);
    }

    // Forçar redimensionamento para corrigir layout
    setTimeout(() => { 
        window.dispatchEvent(new Event('resize')); 
        window.scrollTo(0, 0);
    }, 50);
    
    // Inicializa o sidebar após carregar a seção de jogos
    setTimeout(initializeProfileSidebar, 100);
}

// Mostra a seção home e esconde a de jogos
function showHomeSection() {
    if (!homeSection || !jogosSection) return;
    
    jogosSection.classList.remove("active");
    jogosSection.style.display = "none";
    
    homeSection.classList.add("active");
    homeSection.style.display = "flex";
    
    if (mainHeader) mainHeader.style.display = "block";
    window.scrollTo(0, 0);
}

// Fecha o modal
function closeModal() {
    const modalElement = document.getElementById('staticBackdrop');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
    }
}

/* ---------- LOGOUT ---------- */
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
        closeModal();
        
        console.log("Logout realizado com sucesso");
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        // Mesmo em caso de erro, redireciona para home
        showHomeSection();
        history.pushState({}, "", "/login");
        renderView("/login");
    }
}

/* ---------- INICIALIZAÇÃO ---------- */
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Inicializa navegação
        initializeNavigation();
        
        // Inicializa eventos de logout
        initializeLogoutEvents();
        
        // verifica se há cookie válido no servidor
        const res = await fetch("/check-auth", { credentials: "include" });
        
        if (!res.ok) throw new Error('Erro na verificação de autenticação');
        
        const data = await res.json();

        if (data.authenticated) {
            // já tem cookie válido → mostra a área de jogos
            closeModal();
            setTimeout(() => showJogosSection(), 100);
        } else {
            // não autenticado → mostra login normal
            renderView(window.location.pathname);
        }
    } catch (err) {
        console.error("Erro na inicialização:", err);
        renderView("/login");
    }
});

// Configura navegação
function initializeNavigation() {
    // NAVEGAÇÃO PRINCIPAL
    if (toCadastro) {
        toCadastro.onclick = e => { 
            e.preventDefault(); 
            history.pushState({}, "", "/cadastro"); 
            renderView("/cadastro"); 
        };
    }
    
    if (toLogin) {
        toLogin.onclick = e => { 
            e.preventDefault(); 
            history.pushState({}, "", "/login"); 
            renderView("/login"); 
        };
    }

    // NAVEGAÇÃO DO RESPONSÁVEL
    if (toCadastroResp) {
        toCadastroResp.onclick = e => {
            e.preventDefault();
            history.pushState({}, "", "/cadastro/responsavel");
            renderView("/cadastro/responsavel");
        };
    }

    if (toLoginResp) {
        toLoginResp.onclick = e => {
            e.preventDefault();
            history.pushState({}, "", "/login/responsavel");
            renderView("/login/responsavel");
        };
    }
}

// Configura eventos de logout
function initializeLogoutEvents() {
    // Botão de logout da navbar
    const logoutBtnNav = document.getElementById("logoutBtnNav");
    if (logoutBtnNav) {
        logoutBtnNav.addEventListener("click", async (e) => {
            e.preventDefault();
            await logoutUser();
        });
    }
}

// Evento de popstate para navegação pelo histórico
window.addEventListener("popstate", () => renderView(window.location.pathname));

/* ---------- FORMULÁRIOS ---------- */
// CADASTRO USUÁRIO
if (document.getElementById("formCadastro")) {
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

            // Se for menor de idade, pede LOGIN do responsável
            if (idade < 16) {
                history.pushState({}, "", "/login/responsavel");
                renderView("/login/responsavel");
            } else {
                // Se for maior de idade, fecha o modal e mostra a área de jogos
                closeModal();
                setTimeout(() => showJogosSection(), 100);
            }
        } catch (err) {
            avisoCadastro.style.color = "red";
            avisoCadastro.textContent = "Erro ao cadastrar usuário";
        }
    };
}

// CADASTRO RESPONSÁVEL
if (document.getElementById("formCadastroResp")) {
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
                    closeModal();
                    setTimeout(() => showJogosSection(), 100);
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
}

// LOGIN USUÁRIO
if (document.getElementById("formLogin")) {
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

                closeModal();
                setTimeout(() => showJogosSection(), 100);
            } else {
                avisoLogin.style.color = "red";
                avisoLogin.textContent = data.msg;

                if (data.requireResponsavel) {
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
}

// LOGIN RESPONSÁVEL
if (document.getElementById("formLoginResp")) {
    document.getElementById("formLoginResp").onsubmit = async e => {
        e.preventDefault();
        const email = document.getElementById("inpgmailLoginResp").value;
        const senha = document.getElementById("inpsenhaLoginResp").value;

        try {
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

                localStorage.removeItem("idUsuarioParaVinculo");
                closeModal();
                setTimeout(() => showJogosSection(), 100);
            } else {
                avisoLoginResp.style.color = "red";
                avisoLoginResp.textContent = data.msg;
            }
        } catch (err) {
            avisoLoginResp.style.color = "red";
            avisoLoginResp.textContent = "Erro ao conectar com servidor";
        }
    };
}

/* ---------- SIDEBAR DO PERFIL ---------- */
function initializeProfileSidebar() {
    const profilePic = document.querySelector('.profile-pic-btn');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarLogout = document.getElementById('logoutBtnSidebar');
    
    if (profilePic) {
        profilePic.addEventListener('click', openProfileSidebar);
    }
    
    if (closeSidebar) {
        closeSidebar.addEventListener('click', closeProfileSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeProfileSidebar);
    }
    
    if (sidebarLogout) {
        sidebarLogout.addEventListener('click', function(e) {
            e.preventDefault();
            closeProfileSidebar();
            setTimeout(logoutUser, 300);
        });
    }
    
    // Fechar sidebar com ESC
    document.addEventListener('keydown', function(e) {
        const profileSidebar = document.getElementById('profileSidebar');
        if (e.key === 'Escape' && profileSidebar && profileSidebar.classList.contains('active')) {
            closeProfileSidebar();
        }
    });
}

function openProfileSidebar() {
    const profileSidebar = document.getElementById('profileSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (profileSidebar) {
        loadUserData();
        profileSidebar.classList.add('active');
        
        if (sidebarOverlay && window.innerWidth > 768) {
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
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
        
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
        }
        
        document.body.style.overflow = '';
        document.body.classList.remove('sidebar-open');
    }
}

function loadUserData() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const userNameElement = document.getElementById('userName');
    const userXPElement = document.getElementById('userXP');
    
    if (userNameElement) {
        userNameElement.textContent = userData.nome || 'Usuário';
    }
    
    if (userXPElement) {
        const userXP = localStorage.getItem('userXP') || '0';
        userXPElement.textContent = userXP;
    }
}

// Redimensionamento da janela
window.addEventListener('resize', function() {
    const profileSidebar = document.getElementById('profileSidebar');
    if (profileSidebar && profileSidebar.classList.contains('active')) {
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (window.innerWidth > 768 && sidebarOverlay) {
            sidebarOverlay.classList.add('active');
        } else if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
        }
    }
});

// Abrir modal quando clicar no link do menu
document.querySelector('a[href="#controle-pais"]').addEventListener("click", function (e) {
  e.preventDefault();
  const modal = new bootstrap.Modal(document.getElementById("controlePaisModal"));
  modal.show();
});

// Habilitar campo de data quando o switch for ativado
document.getElementById("acessoLimitado").addEventListener("change", function () {
  document.getElementById("limiteTempo").disabled = !this.checked;
});

// Botão aplicar (aqui você pode salvar no localStorage, enviar para backend, etc.)
document.getElementById("aplicarControlePais").addEventListener("click", function () {
  const acessoLimitado = document.getElementById("acessoLimitado").checked;
  const limiteTempo = document.getElementById("limiteTempo").value;

  if (acessoLimitado && !limiteTempo) {
    alert("Por favor, defina um limite de tempo.");
    return;
  }

  alert("Configurações aplicadas:\n" +
    "Acesso limitado: " + (acessoLimitado ? "Sim" : "Não") +
    "\nLimite de tempo: " + (limiteTempo || "Não definido"));
});
