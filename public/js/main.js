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

// Variáveis para controle de tempo
let tempoInicioSessao = null;
let tempoLimiteSessao = null;
let monitorTempo = null;

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

    // Inicia o controle de tempo
    iniciarControleTempo();

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
    
    // Para o monitor de tempo
    pararControleTempo();
    
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

/* ---------- CONTROLE DE TEMPO ---------- */
function iniciarControleTempo() {
    // Para qualquer monitor anterior
    pararControleTempo();
    
    // Recupera configurações do localStorage
    const configControle = JSON.parse(localStorage.getItem('configControlePais') || '{}');
    
    if (configControle.ativo && configControle.tempoLimite) {
        tempoInicioSessao = Date.now();
        tempoLimiteSessao = configControle.tempoLimite * 60 * 1000; // Converter para milissegundos
        
        console.log(`Controle de tempo ativado: ${configControle.tempoLimite} minutos`);
        
        // Inicia o monitor
        monitorTempo = setInterval(verificarTempo, 60000); // Verifica a cada minuto
        
        // Verifica imediatamente
        setTimeout(verificarTempo, 1000);
    }
}

function pararControleTempo() {
    if (monitorTempo) {
        clearInterval(monitorTempo);
        monitorTempo = null;
    }
    tempoInicioSessao = null;
    tempoLimiteSessao = null;
}

function verificarTempo() {
    if (!tempoInicioSessao || !tempoLimiteSessao) return;
    
    const tempoDecorrido = Date.now() - tempoInicioSessao;
    const tempoRestante = tempoLimiteSessao - tempoDecorrido;
    
    console.log(`Tempo restante: ${Math.round(tempoRestante / 60000)} minutos`);
    
    if (tempoRestante <= 0) {
        // Tempo esgotado - bloquear acesso
        bloquearAcesso();
    } else if (tempoRestante <= 300000) { // 5 minutos restantes
        // Aviso de tempo prestes a acabar
        mostrarAvisoTempo(tempoRestante);
    }
}

function bloquearAcesso() {
    pararControleTempo();
    
    // Mostra modal de acesso bloqueado
    const modalElement = document.getElementById("acessoBloqueadoModal");
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.show();
        
        // Limpa campo de senha
        document.getElementById("senhaAcessoBloqueado").value = "";
        document.getElementById("erroSenhaAcesso").style.display = "none";
    }
}

function mostrarAvisoTempo(tempoRestante) {
    const minutos = Math.ceil(tempoRestante / 60000);
    alert(`Atenção! Você tem apenas ${minutos} minuto(s) restante(s) de uso.`);
}

/* ---------- LOGOUT ---------- */
async function logoutUser() {
    try {
        // Para o controle de tempo
        pararControleTempo();
        
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
        
        // Inicializa eventos do modal de controle de pais
        initializeControlePaisModal();
        
        // Inicializa eventos do modal de acesso bloqueado
        initializeAcessoBloqueadoModal();
        
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

// Configura eventos do modal de controle de pais
function initializeControlePaisModal() {
    // Habilitar campos quando o switch for ativado
    const acessoLimitado = document.getElementById("acessoLimitado");
    const limiteTempo = document.getElementById("limiteTempo");
    const horarioMaximo = document.getElementById("horarioMaximo");
    const aplicarBtn = document.getElementById("aplicarControlePais");
    
    // Carrega configurações salvas
    const configSalva = JSON.parse(localStorage.getItem('configControlePais') || '{}');
    
    if (acessoLimitado && limiteTempo && horarioMaximo) {
        acessoLimitado.checked = configSalva.ativo || false;
        limiteTempo.disabled = !acessoLimitado.checked;
        horarioMaximo.disabled = !acessoLimitado.checked;
        
        // Configurações salvas para limite de tempo
        if (configSalva.tempoLimite) {
            // Converte minutos para formato HH:MM
            const horas = Math.floor(configSalva.tempoLimite / 60);
            const minutos = configSalva.tempoLimite % 60;
            limiteTempo.value = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        }
        
        // Configurações salvas para horário máximo diário
        if (configSalva.horarioMaximoDiario) {
            horarioMaximo.value = configSalva.horarioMaximoDiario;
        }
        
        // Validação do horário máximo (não pode passar de 10)
        horarioMaximo.addEventListener("input", function() {
            if (this.value > 10) {
                this.value = 10;
                alert("O horário máximo não pode ultrapassar 10 horas.");
            }
            if (this.value < 0) {
                this.value = 0;
            }
        });
        
        // Habilitar/desabilitar campos quando o switch é alterado
        acessoLimitado.addEventListener("change", function () {
            limiteTempo.disabled = !this.checked;
            horarioMaximo.disabled = !this.checked;
        });
    }
    
    if (aplicarBtn) {
        aplicarBtn.addEventListener("click", function () {
            const acessoLimitado = document.getElementById("acessoLimitado").checked;
            const limiteTempoValue = document.getElementById("limiteTempo").value;
            const horarioMaximoValue = parseFloat(document.getElementById("horarioMaximo").value) || 0;

            // Validações
            if (acessoLimitado) {
                if (!limiteTempoValue) {
                    alert("Por favor, defina um limite de tempo por sessão.");
                    return;
                }
                
                if (horarioMaximoValue > 10) {
                    alert("O horário máximo diário não pode ultrapassar 10 horas.");
                    return;
                }
                
                if (horarioMaximoValue <= 0) {
                    alert("Por favor, defina um horário máximo diário válido.");
                    return;
                }
            }

            // Converte HH:MM para minutos
            let tempoEmMinutos = 0;
            if (acessoLimitado && limiteTempoValue) {
                const [horas, minutos] = limiteTempoValue.split(':').map(Number);
                tempoEmMinutos = horas * 60 + minutos;
            }

            // Salva configurações
            const config = {
                ativo: acessoLimitado,
                tempoLimite: tempoEmMinutos,
                horarioMaximoDiario: horarioMaximoValue
            };
            localStorage.setItem('configControlePais', JSON.stringify(config));

            // Mensagem de confirmação
            let mensagem = "Configurações aplicadas com sucesso!\n";
            mensagem += "Acesso limitado: " + (acessoLimitado ? "Sim" : "Não");
            
            if (acessoLimitado) {
                mensagem += "\nLimite por sessão: " + limiteTempoValue;
                mensagem += "\nHorário máximo diário: " + horarioMaximoValue + " horas";
            }

            alert(mensagem);

            // Reinicia o controle de tempo se estiver na seção de jogos
            if (jogosSection && jogosSection.classList.contains('active')) {
                iniciarControleTempo();
            }
                
            // Fecha o modal após aplicar
            const modalElement = document.getElementById("controlePaisModal");
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }
        });
    }
}

// Configura eventos do modal de acesso bloqueado
function initializeAcessoBloqueadoModal() {
    const btnEnviarAcesso = document.getElementById("btnEnviarAcesso");
    const senhaAcessoBloqueado = document.getElementById("senhaAcessoBloqueado");
    const erroSenhaAcesso = document.getElementById("erroSenhaAcesso");

    if (btnEnviarAcesso && senhaAcessoBloqueado) {
        btnEnviarAcesso.addEventListener("click", function() {
            const senhaDigitada = senhaAcessoBloqueado.value;
            
            if (!senhaDigitada) {
                erroSenhaAcesso.textContent = "Por favor, digite a senha.";
                erroSenhaAcesso.style.display = "block";
                return;
            }

            // Aqui você deve verificar a senha do responsável
            // Por enquanto, vou simular uma verificação
            verificarSenhaResponsavel(senhaDigitada);
        });

        // Permitir enviar com Enter
        senhaAcessoBloqueado.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                btnEnviarAcesso.click();
            }
        });
    }
}

function verificarSenhaResponsavel(senhaDigitada) {
    // Simulação - você deve integrar com seu backend
    // Por enquanto, vou usar uma verificação simples
    
    const senhaCorreta = "senha123"; // Substitua pela verificação real
    
    if (senhaDigitada === senhaCorreta) {
        // Senha correta - reinicia o tempo
        const configControle = JSON.parse(localStorage.getItem('configControlePais') || '{}');
        if (configControle.ativo) {
            tempoInicioSessao = Date.now();
            iniciarControleTempo();
        }
        
        // Fecha o modal
        const modalElement = document.getElementById("acessoBloqueadoModal");
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }
        
        alert("Acesso liberado! O tempo foi reiniciado.");
    } else {
        // Senha incorreta
        document.getElementById("erroSenhaAcesso").textContent = "Senha incorreta. Tente novamente.";
        document.getElementById("erroSenhaAcesso").style.display = "block";
        document.getElementById("senhaAcessoBloqueado").value = "";
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
    
    // Inicializar link do controle de pais no sidebar
    const controlePaisLink = document.querySelector('.sidebar-menu a[href="#controle-pais"]');
    if (controlePaisLink) {
        controlePaisLink.addEventListener("click", function (e) {
            e.preventDefault();
            openControlePaisModal();
        });
    }
}

function openProfileSidebar() {
    const profileSidebar = document.getElementById('profileSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const jogosSection = document.getElementById('jogos-section');
    
    if (profileSidebar) {
        loadUserData();
        profileSidebar.classList.add('active');
        
        // Só mostra overlay se estiver na seção de jogos (DESKTOP)
        if (sidebarOverlay && window.innerWidth > 768 && jogosSection && jogosSection.classList.contains('active')) {
            sidebarOverlay.classList.add('active');
            document.body.classList.add('sidebar-open');
        }
        
        // Para mobile
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
        
        document.body.classList.remove('sidebar-open');
    }
}

function openControlePaisModal() {
    // Fecha o sidebar do perfil primeiro
    closeProfileSidebar();
    
    // Delay para o modal aparecer
    setTimeout(() => {
        const modalElement = document.getElementById("controlePaisModal");
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
            modal.show();
            
            // Foca no primeiro elemento do modal para melhor UX
            setTimeout(() => {
                const primeiroInput = modalElement.querySelector('input, select, button');
                if (primeiroInput) primeiroInput.focus();
            }, 50);
        }
    }, 150);
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