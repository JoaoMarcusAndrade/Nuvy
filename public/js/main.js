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
    setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 50);
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
document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            // faz o logout no servidor e limpa cookies
            await fetch("/logout", { method: "POST", credentials: "include" });
            // volta para a tela inicial/login
            showHomeSection();
            history.pushState({}, "", "/login");
            renderView("/login");
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

    // Envia dados para o backend
    try {
        const res = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha }),
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

            // Se o erro indicar que precisa de responsável, vai para o login do responsável (ALTERADO)
            if (data.requireResponsavel) {
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

    // Envia dados para o backend
    try {
        const res = await fetch("/login/responsavel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email,
                senha: senha,
                idUsuarioParaVinculo: usuarioRecemCadastradoID // aqui é o usuário menor
            }),
            credentials: "include"
        });
        const data = await res.json();
        if (res.ok) {
            avisoLoginResp.style.color = "green";
            avisoLoginResp.textContent = data.msg;

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