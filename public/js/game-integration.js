// Script de integração do jogo - CORRIGIDO
document.addEventListener('DOMContentLoaded', function () {
    const gameContainer = document.getElementById('game-container');

    // Verificar se o container existe
    if (!gameContainer) {
        console.error('Container do jogo não encontrado');
        return;
    }

    // Criar iframe para carregar o jogo - CORREÇÃO DO NOME DO ARQUIVO
    const gameIframe = document.createElement('iframe');
    gameIframe.src = 'NuvyGame.html'; // NOME CORRIGIDO
    gameIframe.style.width = '100%';
    gameIframe.style.height = '525px'; // Altura fixa inicial
    gameIframe.style.border = 'none';
    gameIframe.style.borderRadius = '18px';
    gameIframe.allow = 'autoplay; microphone'; // PERMISSÕES DE ÁUDIO
    gameIframe.id = 'game-iframe';

    // Adicionar iframe ao container
    gameContainer.innerHTML = ''; // Limpar conteúdo anterior
    gameContainer.appendChild(gameIframe);

    // Ajustar altura do iframe para se adaptar ao conteúdo
    gameIframe.onload = function () {
        // Tentar ajustar altura baseado no conteúdo
        setTimeout(() => {
            try {
                const iframeDoc = gameIframe.contentDocument || gameIframe.contentWindow.document;
                const iframeBody = iframeDoc.body;
                const iframeHtml = iframeDoc.documentElement;

                const height = Math.max(
                    iframeBody.scrollHeight,
                    iframeBody.offsetHeight,
                    iframeHtml.clientHeight,
                    iframeHtml.scrollHeight,
                    iframeHtml.offsetHeight
                );

                if (height > 0) {
                    gameIframe.style.height = height + 'px';
                }
            } catch (e) {
                console.log('Não foi possível ajustar a altura do iframe:', e);
                // Manter altura padrão em caso de erro
                gameIframe.style.height = '400px';
            }
        }, 1000);
    };

    // Tratar erros de carregamento
    gameIframe.onerror = function () {
        console.error('Erro ao carregar o jogo');
        gameContainer.innerHTML = '<p style="color: white; text-align: center; padding: 20px;">Erro ao carregar o jogo. Verifique se o arquivo NuvyGame.html existe.</p>';
    };
});