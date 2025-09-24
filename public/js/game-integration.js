// Script de integração do jogo - CORRIGIDO PARA ÁUDIO
document.addEventListener('DOMContentLoaded', function () {
    const gameContainer = document.getElementById('game-container');

    // Verificar se o container existe
    if (!gameContainer) {
        console.error('Container do jogo não encontrado');
        return;
    }

    // Criar iframe para carregar o jogo
    const gameIframe = document.createElement('iframe');
    gameIframe.src = 'NuvyGame.html';
    gameIframe.style.width = '100%';
    gameIframe.style.height = '525px';
    gameIframe.style.border = 'none';
    gameIframe.style.borderRadius = '18px';
    gameIframe.allow = 'autoplay; microphone;';
    gameIframe.id = 'game-iframe';
    gameIframe.allowFullscreen = true;

    // Adicionar iframe ao container
    gameContainer.innerHTML = '';
    gameContainer.appendChild(gameIframe);

    // Função para liberar áudio no iframe após interação do usuário
    function enableAudio() {
        try {
            const iframeWindow = gameIframe.contentWindow;
            // Disparar um evento customizado no iframe para liberar áudio
            iframeWindow.postMessage('enableAudio', '*');
        } catch (e) {
            console.log('Não foi possível liberar áudio:', e);
        }
    }

    // Capturar interações do usuário na página principal
    document.addEventListener('click', function() {
        enableAudio();
    }, { once: true });

    // Capturar interações no iframe
    gameIframe.addEventListener('load', function() {
        // Adicionar event listener para mensagens do iframe
        window.addEventListener('message', function(event) {
            if (event.data === 'userInteracted') {
                enableAudio();
            }
        });

        // Adicionar evento de clique no iframe
        try {
            const iframeDoc = gameIframe.contentDocument || gameIframe.contentWindow.document;
            iframeDoc.addEventListener('click', function() {
                window.postMessage('userInteracted', '*');
                enableAudio();
            });
        } catch (e) {
            console.log('Não foi possível adicionar listener ao iframe:', e);
        }
    });

    // Restante do código para ajustar altura...
    gameIframe.onload = function () {
        // Código existente para ajustar altura
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
                gameIframe.style.height = '400px';
            }
        }, 1000);
    };

    gameIframe.onerror = function () {
        console.error('Erro ao carregar o jogo');
        gameContainer.innerHTML = '<p style="color: white; text-align: center; padding: 20px;">Erro ao carregar o jogo. Verifique se o arquivo NuvyGame.html existe.</p>';
    };
});