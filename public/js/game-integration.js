// Script de integração do jogo - CORRIGIDO (ÁUDIO FUNCIONANDO)
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
    
    // ADIÇÃO CRÍTICA: Permitir políticas de áudio mais permissivas
    gameIframe.allow = 'autoplay *; microphone *';
    gameIframe.setAttribute('allowfullscreen', 'true');
    gameIframe.setAttribute('webkitallowfullscreen', 'true');
    gameIframe.setAttribute('mozallowfullscreen', 'true');

    // Adicionar iframe ao container
    gameContainer.innerHTML = ''; // Limpar conteúdo anterior
    gameContainer.appendChild(gameIframe);

    // CORREÇÃO DO ÁUDIO: Iniciar áudio após interação do usuário
    let audioStarted = false;
    
    // Função para iniciar áudio após primeira interação
    function startAudioOnInteraction() {
        if (!audioStarted && gameIframe.contentWindow) {
            try {
                // Enviar mensagem para o iframe iniciar o áudio
                gameIframe.contentWindow.postMessage('startAudio', '*');
                audioStarted = true;
                
                // Remover event listeners após primeira interação
                document.removeEventListener('click', startAudioOnInteraction);
                document.removeEventListener('touchstart', startAudioOnInteraction);
            } catch (error) {
                console.log('Erro ao iniciar áudio:', error);
            }
        }
    }

    // Adicionar event listeners para interação do usuário
    document.addEventListener('click', startAudioOnInteraction, { once: true });
    document.addEventListener('touchstart', startAudioOnInteraction, { once: true });

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