// game-integrated.js - Código completo do jogo com carregador integrado

// Variáveis globais
let totalSeconds = 5 * 60;
let timer;
let correctPieces = 0;
let totalPieces = 4;
let gameFinished = false;
let xpCurrent = 0;
const xpMax = 400;
let currentLevel = 1;
const maxLevels = 4;
let startTime; // Nova variável para controlar o tempo inicial
let playerLevel = 1; // Novo nível do jogador

// Variáveis para controle do touch
let touchOffsetX, touchOffsetY;
let activeDraggable = null;

// Variáveis para sons
let pickupSound, dropSound, backgroundMusic, infoSound, levelUpSound, gameCompleteSound;

// Adicione esta variável global no início do arquivo
let isMusicPlaying = false;

// Elementos DOM
let timerElement;
let feedbackElement;
let restartButton;
let infoButton;
let modalInfo;
let levelCompleteModal;
let closeModalButton;
let nextLevelButton;
let xpTextElement;
let xpProgressElement;
let currentLevelElement;
let levelCompleteMessage;
let targetsContainer;
let draggablesContainer;
let musicButton;

// Configurações dos níveis
const levelConfigs = {
  1: {
    title: "Nuvens Coloridas",
    description: "Arraste os itens para as nuvens da mesma cor!",
    targets: [
      { type: "fotos", color: "#FF9E00", description: "Guarda nossas fotos e vídeos" },
      { type: "musica", color: "#4CAF50", description: "Guarda nossas músicas" },
      { type: "jogos", color: "#2196F3", description: "Guarda nossos joguinhos" },
      { type: "desenhos", color: "#cc27e9ff", description: "Guarda nossos desenhos" }
    ]
  },
  2: {
    title: "Nuvens Brilhantes",
    description: "Encontre a casa certa para cada item!",
    targets: [
      { type: "fotos", color: "#FF5722", description: "Fotos e lembranças" },
      { type: "musica", color: "#b73a9cff", description: "Músicas divertidas" },
      { type: "jogos", color: "#009688", description: "Jogos legais" },
      { type: "desenhos", color: "#E91E63", description: "Desenhos criativos" }
    ]
  },
  3: {
    title: "Nuvens Mágicas",
    description: "Cada coisa no seu lugar!",
    targets: [
      { type: "fotos", color: "#11ececff", description: "Fotos da família" },
      { type: "musica", color: "#FF9800", description: "Canções favoritas" },
      { type: "jogos", color: "#4CAF50", description: "Jogos educativos" },
      { type: "desenhos", color: "#F44336", description: "Artes coloridas" }
    ]
  },
  4: {
    title: "Nuvens Douradas",
    description: "Último desafio! Você consegue!",
    targets: [
      { type: "fotos", color: "#d3b015ff", description: "Memórias especiais" },
      { type: "musica", color: "#22729bff", description: "Ritmos animados" },
      { type: "jogos", color: "#e6e2e2ff", description: "Diversão garantida" },
      { type: "desenhos", color: "#00BCD4", description: "Criatividade solta" }
    ]
  }
};

// ==================== FUNÇÕES DO CARREGADOR ====================

function initializeGame() {
    const gameContainer = document.getElementById('game-container');
    
    if (!gameContainer) {
        console.error('Container do jogo não encontrado');
        return;
    }

    // Limpar container antes de iniciar
    gameContainer.innerHTML = '';

    // Criar a estrutura HTML do jogo com as classes CORRETAS do seu jogo
    const gameHTML = `
        <div class="game-container">
            <!-- Nuvens decorativas -->
            <div class="game-cloud game-cloud-1"></div>
            <div class="game-cloud game-cloud-2"></div>
            <div class="game-cloud game-cloud-3"></div>
            
            <!-- Cabeçalho do jogo -->
            <div class="game-header">
                <div class="game-title">Nuvy Game</div>
                <div class="game-info-container">
                    <div class="game-xp-container">
                        <span class="xp-text">XP: 0/400</span>
                        <div class="game-xp-bar">
                            <div class="xp-progress"></div>
                        </div>
                    </div>
                    <div class="timer">Tempo: 05:00</div>
                </div>
            </div>
            
            <!-- Instruções -->
            <div class="game-instructions">
                <div class="game-instructions-text">Arraste os itens para as nuvens da mesma cor!</div>
            </div>
            
            <!-- Área de jogo -->
            <div class="game-area">
                <div class="targets-container">
                    <!-- Áreas de destino serão geradas dinamicamente -->
                </div>
                <div class="draggables-container">
                    <!-- Itens arrastáveis serão gerados dinamicamente -->
                </div>
            </div>
            
            <!-- Botões de ação -->
            <button class="game-action-button game-info-button" id="info-btn">?</button>
            <button class="game-action-button game-restart-button" id="restart-btn">Reiniciar</button>
            <button class="game-action-button game-music-button" id="music-btn">🔊</button>
            
            <!-- Modal de informação -->
            <div id="info-modal" class="game-modal">
                <div class="game-modal-content">
                    <h3 class="game-modal-title">Como Jogar</h3>
                    <p class="game-modal-description">
                        Arraste cada item para a nuvem correspondente!<br>
                        Complete antes que o tempo acabe para ganhar XP.
                    </p>
                    <button class="game-modal-button" id="close-modal">Entendi!</button>
                </div>
            </div>
            
            <!-- Modal de nível completo -->
            <div id="level-complete-modal" class="game-modal">
                <div class="game-modal-content">
                    <h3 class="game-modal-title">Parabéns! 🎉</h3>
                    <p class="game-modal-description" id="level-complete-message">
                        Você completou o nível 1!
                    </p>
                    <button class="game-modal-button" id="next-level-btn">Próximo Nível</button>
                </div>
            </div>
            
            <!-- Feedback -->
            <div id="feedback" class="game-feedback"></div>

            <!-- Elemento para mostrar o nível atual -->
            <div id="current-level" style="display: none;">1</div>
        </div>
    `;

    // Inserir a estrutura do jogo
    gameContainer.innerHTML = gameHTML;

    // Inicializar os elementos DOM após inserir o HTML
    initializeDOMElements();
    
    // Aguardar um pouco para garantir que o DOM foi atualizado
    setTimeout(() => {
        // Verificar se as funções do jogo existem
        if (typeof initGame === 'function') {
            console.log('Inicializando o jogo...');
            initGame();
        } else {
            console.error('Função initGame não encontrada. Verificando funções disponíveis:', Object.keys(window).filter(key => typeof window[key] === 'function'));
            
            // Tentar inicializar manualmente se as funções existirem
            if (typeof loadLevel === 'function') {
                console.log('Inicializando manualmente com loadLevel...');
                loadLevel(1);
            }
        }
    }, 100);
}

function initializeDOMElements() {
    // Inicializar elementos DOM após criar a estrutura do jogo
    timerElement = document.querySelector('.timer');
    feedbackElement = document.getElementById('feedback');
    restartButton = document.getElementById('restart-btn');
    infoButton = document.getElementById('info-btn');
    modalInfo = document.getElementById('info-modal');
    levelCompleteModal = document.getElementById('level-complete-modal');
    closeModalButton = document.getElementById('close-modal');
    nextLevelButton = document.getElementById('next-level-btn');
    xpTextElement = document.querySelector('.xp-text');
    xpProgressElement = document.querySelector('.xp-progress');
    currentLevelElement = document.getElementById('current-level');
    levelCompleteMessage = document.getElementById('level-complete-message');
    targetsContainer = document.querySelector('.targets-container');
    draggablesContainer = document.querySelector('.draggables-container');
    musicButton = document.getElementById('music-btn');
}

// Função para carregar o jogo quando a seção de jogos for aberta
function loadGameWhenReady() {
    // Verificar se estamos na seção de jogos
    const jogosSection = document.getElementById('jogos-section');
    
    if (jogosSection && jogosSection.classList.contains('active')) {
        console.log('Seção de jogos ativa - inicializando jogo');
        initializeGame();
    }
}

// Observar mudanças na seção ativa
function observeSectionChanges() {
    const sections = document.querySelectorAll('.section');
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.id === 'jogos-section' && target.classList.contains('active')) {
                    console.log('Seção de jogos tornou-se ativa');
                    setTimeout(() => {
                        initializeGame();
                    }, 300);
                }
            }
        });
    });
    
    // Observar mudanças nas classes das seções
    sections.forEach(section => {
        observer.observe(section, { attributes: true, attributeFilter: ['class'] });
    });
}

// Verificar se já estamos na seção de jogos ao carregar
function checkInitialSection() {
    const jogosSection = document.getElementById('jogos-section');
    if (jogosSection && jogosSection.classList.contains('active')) {
        console.log('Já na seção de jogos - inicializando...');
        setTimeout(initializeGame, 500);
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado - verificando seção inicial');
    
    // Verificar seção inicial
    setTimeout(checkInitialSection, 100);
    
    // Observar mudanças de seção
    observeSectionChanges();
    
    // Também observar mudanças no URL/hash
    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#jogos' || window.location.pathname.includes('jogos')) {
            setTimeout(initializeGame, 300);
        }
    });
});

// Função para forçar reinicialização do jogo (útil para debugging)
function reloadGame() {
    console.log('Reinicializando jogo...');
    initializeGame();
}

// ==================== FUNÇÕES DO JOGO ====================

// Modifique a função loadSounds para usar MP3
function loadSounds() {
  pickupSound = new Audio('som1.wav');
  dropSound = new Audio('som2.wav');
  backgroundMusic = new Audio('som3.wav');
  infoSound = new Audio('som4.mp3');
  
  // Configurar volumes
  pickupSound.volume = 0.7;
  dropSound.volume = 0.7;
  backgroundMusic.volume = 0.5;
  infoSound.volume = 0.7;
  
  // Configurar música de fundo para loop
  backgroundMusic.loop = true;
  
  // Evento para quando a música terminar (para atualizar o ícone)
  backgroundMusic.addEventListener('ended', function() {
    isMusicPlaying = false;
    updateMusicButtonIcon();
  });
  
  // Pré-carregar os sons
  pickupSound.load();
  dropSound.load();
  backgroundMusic.load();
  infoSound.load();
}

// Nova função para carregar sons de nível
function loadLevelSounds() {
  levelUpSound = new Audio(`som${4 + currentLevel}.mp3`);
  levelUpSound.volume = 0.7;
  levelUpSound.load();
}

// Nova função para carregar som de jogo completo
function loadGameCompleteSound() {
  gameCompleteSound = new Audio('som8.mp3');
  gameCompleteSound.volume = 0.7;
  gameCompleteSound.load();
}

function toggleMusic() {
  if (backgroundMusic) {
    if (isMusicPlaying) {
      backgroundMusic.pause();
      isMusicPlaying = false;
    } else {
      const playPromise = backgroundMusic.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isMusicPlaying = true;
          })
          .catch(error => {
            console.log("Não foi possível iniciar a música:", error);
            isMusicPlaying = false;
          });
      }
    }
    updateMusicButtonIcon();
  }
}

// Adicione esta função para atualizar o ícone do botão
function updateMusicButtonIcon() {
  if (musicButton) {
    if (isMusicPlaying) {
      musicButton.innerHTML = '🔊';
      musicButton.title = 'Desativar música';
    } else {
      musicButton.innerHTML = '🔊';
      musicButton.title = 'Ativar música';
    }
  }
}

// Modifique a função startBackgroundMusic
function startBackgroundMusic() {
  if (backgroundMusic) {
    const playPromise = backgroundMusic.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("Música de fundo iniciada com sucesso");
          isMusicPlaying = true;
          updateMusicButtonIcon();
        })
        .catch(error => {
          console.log("Reprodução automática impedida:", error);
          isMusicPlaying = false;
          updateMusicButtonIcon();
        });
    }
  }
}

// Parar música de fundo
function stopBackgroundMusic() {
  if (backgroundMusic) {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    isMusicPlaying = false;
    updateMusicButtonIcon();
  }
}

// Modifique a função initGame para adicionar o event listener do botão de música
function initGame() {
  loadSounds(); // Carregar os sons
  loadLevelSounds(); // Carregar sons de nível
  loadGameCompleteSound(); // Carregar som de jogo completo
  loadLevel(currentLevel);
  
  // Configurar botões
  restartButton.addEventListener('click', restartGame);
  infoButton.addEventListener('click', () => {
    modalInfo.style.display = 'flex';
    // Tocar som de informação
    if (infoSound) {
      infoSound.currentTime = 0;
      infoSound.play().catch(e => console.log("Não foi possível tocar o som de informação: ", e));
    }
  });
  closeModalButton.addEventListener('click', () => {
    modalInfo.style.display = 'none';
  });
  nextLevelButton.addEventListener('click', nextLevel);
  
  // Adicionar event listener para o botão de música
  if (musicButton) {
    musicButton.addEventListener('click', toggleMusic);
  }

  // Atualizar XP
  updateXP();
  
  // Iniciar contagem de tempo
  startTime = Date.now();
  
  // Iniciar música de fundo
  setTimeout(() => {
    startBackgroundMusic();
  }, 1000);
}

// Carregar nível
function loadLevel(level) {
  // Limpar containers
  targetsContainer.innerHTML = '';
  draggablesContainer.innerHTML = '';
  
  // Atualizar título do nível
  currentLevelElement.textContent = level;
  document.body.className = `level-${level}`;
  
  // Reiniciar variáveis
  correctPieces = 0;
  gameFinished = false;
  clearInterval(timer);
  totalSeconds = 5 * 60;
  updateTimer();
  
  // Iniciar temporizador
  timer = setInterval(updateTimer, 1000);
  
  // Obter configuração do nível
  const config = levelConfigs[level];
  
  // Criar áreas de destino
  config.targets.forEach(target => {
    const targetElement = document.createElement('div');
    targetElement.className = 'target';
    targetElement.dataset.target = target.type;
    targetElement.style.borderColor = target.color;
    
    const description = document.createElement('div');
    description.className = 'target-description';
    description.textContent = target.description;
    description.style.color = target.color;
    
    targetElement.appendChild(description);
    targetsContainer.appendChild(targetElement);
    
    // Adicionar event listeners para os alvos
    targetElement.addEventListener('dragover', handleDragOver);
    targetElement.addEventListener('drop', handleDrop);
  });
  
  // Criar elementos arrastáveis
  const draggableItems = shuffleArray([...config.targets]);
  
  draggableItems.forEach(item => {
    const draggableElement = document.createElement('div');
    draggableElement.className = 'draggable';
    draggableElement.draggable = true;
    draggableElement.dataset.type = item.type;
    
    const title = document.createElement('div');
    title.className = 'draggable-title';
    title.textContent = getItemTitle(item.type);
    title.style.color = item.color;
    
    const icon = document.createElement('div');
    icon.className = 'draggable-icon';
    icon.style.backgroundImage = `url("${getItemIcon(item.type)}")`;
    
    const dragHint = document.createElement('div');
    dragHint.className = 'drag-hint';
    
    draggableElement.appendChild(title);
    draggableElement.appendChild(icon);
    draggableElement.appendChild(dragHint);
    
    // Adicionar event listeners para os elementos arrastáveis
    draggableElement.addEventListener('dragstart', handleDragStart);
    draggableElement.addEventListener('dragend', handleDragEnd);
    
    draggablesContainer.appendChild(draggableElement);
  });
  
  // Adicionar suporte a touch após criar os elementos
  setTimeout(() => {
    addTouchSupport();
  }, 100);
}

// Adicionar suporte a eventos touch para elementos arrastáveis
function addTouchSupport() {
  const draggables = document.querySelectorAll('.draggable');
  
  draggables.forEach(draggable => {
    // Remover event listeners existentes para evitar duplicação
    draggable.removeEventListener('touchstart', handleTouchStart);
    draggable.removeEventListener('touchmove', handleTouchMove);
    draggable.removeEventListener('touchend', handleTouchEnd);
    
    // Adicionar event listeners para touch
    draggable.addEventListener('touchstart', handleTouchStart, { passive: false });
    draggable.addEventListener('touchmove', handleTouchMove, { passive: false });
    draggable.addEventListener('touchend', handleTouchEnd);
  });
}

function handleTouchStart(e) {
  if (gameFinished) {
    e.preventDefault();
    return;
  }
  
  const touch = e.touches[0];
  const draggable = e.target.closest('.draggable');
  
  if (!draggable) return;
  
  activeDraggable = draggable;
  
  // Tocar som de pegar o elemento
  if (pickupSound) {
    pickupSound.currentTime = 0;
    pickupSound.play().catch(e => console.log("Não foi possível tocar o som: ", e));
  }
  
  // Obter a posição atual do elemento (incluindo qualquer transformação)
  const rect = draggable.getBoundingClientRect();
  
  // Calcular offset do toque em relação ao elemento
  // Usar pageX/pageY para consistência entre dispositivos
  touchOffsetX = touch.pageX - rect.left;
  touchOffsetY = touch.pageY - rect.top;
  
  // Salvar a posição original para restaurar se necessário
  draggable.dataset.originalLeft = rect.left + 'px';
  draggable.dataset.originalTop = rect.top + 'px';
  
  // Adicionar classe de arrastando
  draggable.classList.add('dragging');
  
  // Prevenir comportamento padrão
  e.preventDefault();
}

function handleTouchMove(e) {
  if (!activeDraggable || gameFinished) return;
  
  const touch = e.touches[0];
  
  // Mover o elemento arrastável usando transform para melhor performance
  activeDraggable.style.position = 'fixed';
  activeDraggable.style.zIndex = '1000';
  
  // Calcular a nueva posición basada en el offset correcto
  const newLeft = touch.pageX - touchOffsetX;
  const newTop = touch.pageY - touchOffsetY;
  
  activeDraggable.style.left = newLeft + 'px';
  activeDraggable.style.top = newTop + 'px';
  
  // Prevenir comportamiento por defecto (scroll/zoom)
  e.preventDefault();
}

function handleTouchEnd(e) {
  if (!activeDraggable || gameFinished) return;
  
  // Encontrar o alvo mais próximo com melhor precisão
  const targets = document.querySelectorAll('.target');
  let closestTarget = null;
  let minDistance = 200; // Distância aumentada para melhor experiência em mobile
  
  // Obter a posição do elemento sendo arrastado
  const draggableRect = activeDraggable.getBoundingClientRect();
  const draggableCenterX = draggableRect.left + draggableRect.width / 2;
  const draggableCenterY = draggableRect.top + draggableRect.height / 2;
  
  targets.forEach(target => {
    const targetRect = target.getBoundingClientRect();
    
    // Calcular distância entre centros
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    
    const distance = Math.sqrt(
      Math.pow(targetCenterX - draggableCenterX, 2) +
      Math.pow(targetCenterY - draggableCenterY, 2)
    );
    
    // Verificar si está dentro da área do alvo com tolerância
    const isWithinTargetArea = 
      draggableCenterX > targetRect.left - 40 && 
      draggableCenterX < targetRect.right + 40 &&
      draggableCenterY > targetRect.top - 40 && 
      draggableCenterY < targetRect.bottom + 40;
    
    if ((distance < minDistance) || isWithinTargetArea) {
      minDistance = distance;
      closestTarget = target;
    }
  });
  
  // Verificar si soltou em um alvo válido
  if (closestTarget && minDistance < 250) {
    const draggedType = activeDraggable.dataset.type;
    const targetType = closestTarget.dataset.target;
    
    if (draggedType === targetType) {
      handleCorrectDrop(activeDraggable, closestTarget);
    } else {
      // Tocar som de erro
      if (pickupSound) {
        pickupSound.currentTime = 0;
        pickupSound.playbackRate = 0.7; // Tom mais grave para indicar erro
        pickupSound.play().catch(e => console.log("Não foi possível tocar o som: ", e));
        // Restaurar a velocidade normal após tocar
        setTimeout(() => { pickupSound.playbackRate = 1.0; }, 300);
      }
      
      showFeedback('Tente novamente! 🤔', 'error');
      resetDraggablePosition(activeDraggable);
    }
  } else {
    // Retornar à posição original se não encaixou
    resetDraggablePosition(activeDraggable);
  }
  
  // Limpar estado - garantir que o elemento seja sempre visível
  activeDraggable.classList.remove('dragging');
  activeDraggable.style.opacity = '1'; // Forçar opacidade total
  activeDraggable = null;
}

function resetDraggablePosition(draggable) {
  // Restaurar para posição estática normal
  draggable.style.position = '';
  draggable.style.zIndex = '';
  draggable.style.left = '';
  draggable.style.top = '';
  draggable.style.transform = '';
  draggable.style.opacity = '1';
  
  // Forçar reflow para garantir que o elemento volte ao fluxo normal
  draggable.offsetHeight;
}

function handleCorrectDrop(draggable, target) {
  // Tocar som de soltar/encaixar
  if (dropSound) {
    dropSound.currentTime = 0;
    dropSound.play().catch(e => console.log("Não foi possível tocar o som: ", e));
  }
  
  // Adicionar classe de correto
  target.classList.add('correct');
  draggable.classList.add('correct');
  
  // Remover elemento arrastável da área de origem
  draggable.remove();
  
  // Adicionar o elemento arrastável ao alvo
  const clone = draggable.cloneNode(true);
  clone.style.position = 'absolute';
  clone.style.top = '0';
  clone.style.left = '0';
  clone.style.width = '100%';
  clone.style.height = '100%';
  clone.style.margin = '0';
  clone.style.padding = '0';
  clone.style.borderRadius = 'calc(var(--border-radius) - 3px)';
  clone.style.cursor = 'default';
  
  target.appendChild(clone);
  
  // Atualizar contador
  correctPieces++;
  
  // Mostrar feedback positivo
  showFeedback('Correto! 🎉', 'success');
  
  // Adicionar XP
  addXP(25);
  
  // Verificar se o nível foi concluído
  if (correctPieces === totalPieces) {
    finishLevel();
  }
}

// Funções auxiliares para itens
function getItemTitle(type) {
  const titles = {
    fotos: "Fotos",
    musica: "Músicas",
    jogos: "Jogos",
    desenhos: "Desenhos"
  };
  return titles[type] || "Item";
}

function getItemIcon(type) {
  const icons = {
    fotos: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='10' y='10' width='44' height='44' fill='%23ffffff' stroke='%236a4bc6' stroke-width='2'/%3E%3Ccircle cx='20' cy='24' r='6' fill='%23ff9800'/%3E%3Cpolygon points='40,44 24,34 14,44' fill='%236a4bc6'/%3E%3C/svg%3E",
    musica: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='10' y='24' width='12' height='30' fill='%23ffffff' stroke='%236a4bc6' stroke-width='2'/%3E%3Crect x='30' y='18' width='12' height='36' fill='%23ffffff' stroke='%236a4bc6' stroke-width='2'/%3E%3Crect x='50' y='10' width='12' height='44' fill='%23ffffff' stroke='%236a4bc6' stroke-width='2'/%3E%3C/svg%3E",
    jogos: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='10' y='10' width='44' height='44' fill='%23ffffff' stroke='%236a4bc6' stroke-width='2' rx='5'/%3E%3Ccircle cx='24' cy='32' r='8' fill='%23ff5e90'/%3E%3Crect x='36' y='20' width='8' height='8' fill='%236a4bc6'/%3E%3Crect x='20' y='20' width='8' height='8' fill='%236a4bc6'/%3E%3C/svg%3E",
    desenhos: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='10' y='10' width='44' height='44' fill='%23ffffff' stroke='%236a4bc6' stroke-width='2'/%3E%3Cline x1='18' y1='20' x2='46' y2='38' stroke='%23ff9e00' stroke-width='3'/%3E%3Cline x1='46' y1='20' x2='18' y2='38' stroke='%23ff9e00' stroke-width='3'/%3E%3Ccircle cx='32' cy='29' r='8' fill='none' stroke='%236a4bc6' stroke-width='2'/%3E%3C/svg%3E"
  };
  return icons[type] || "";
}

// Funções de arrastar e soltar - CORREÇÃO COMPLETA
function handleDragStart(e) {
  if (gameFinished) {
    e.preventDefault();
    return;
  }
  
  e.dataTransfer.setData('text/plain', e.target.dataset.type);
  e.target.classList.add('dragging');
  
  // Tocar som de pegar o elemento
  if (pickupSound) {
    pickupSound.currentTime = 0;
    pickupSound.play().catch(e => console.log("Não foi possível tocar o som: ", e));
  }
  
  // REMOVIDO COMPLETAMENTE: qualquer código relacionado a opacidade
  // Isso estava causando o problema de desaparecimento no mobile
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  // REMOVIDO COMPLETAMENTE: código que restaurava opacidade
}

function handleDragOver(e) {
  if (gameFinished) return;
  
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
  if (gameFinished) return;
  
  e.preventDefault();
  const draggedType = e.dataTransfer.getData('text/plain');
  const targetType = e.target.closest('.target').dataset.target;
  
  if (draggedType === targetType) {
    // Tocar som de soltar/encaixar
    if (dropSound) {
      dropSound.currentTime = 0;
      dropSound.play().catch(e => console.log("Não foi possível tocar o som: ", e));
    }
    
    // Acertou
    const draggedElement = document.querySelector(`.draggable[data-type="${draggedType}"]`);
    const targetElement = e.target.closest('.target');
    
    // Adicionar classe de correto
    targetElement.classList.add('correct');
    draggedElement.classList.add('correct');
    
    // Remover elemento arrastável da área de origem
    draggedElement.remove();
    
    // Adicionar o elemento arrastável ao alvo
    const clone = draggedElement.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.width = '100%';
    clone.style.height = '100%';
    clone.style.margin = '0';
    clone.style.padding = '0';
    clone.style.borderRadius = 'calc(var(--border-radius) - 3px)';
    clone.style.cursor = 'default';

    
    targetElement.appendChild(clone);
    
    // Atualizar contador
    correctPieces++;
    
    // Mostrar feedback positivo
    showFeedback('Correto! 🎉', 'success');
    
    // Adicionar XP
    addXP(25);
    
    // Verificar se o nível foi concluído
    if (correctPieces === totalPieces) {
      finishLevel();
    }
  } else {
    // Errou - tocar som de erro
    if (pickupSound) {
      pickupSound.currentTime = 0;
      pickupSound.playbackRate = 0.7; // Tom mais grave para indicar erro
      pickupSound.play().catch(e => console.log("Não foi possível tocar o som: ", e));
      // Restaurar a velocidade normal após tocar
      setTimeout(() => { pickupSound.playbackRate = 1.0; }, 300);
    }
    
    // Mostrar feedback de erro
    showFeedback('Tente novamente! 🤔', 'error');
  }
}

// Funções do jogo
function updateTimer() {
  if (gameFinished) return;
  
  totalSeconds--;
  
  if (totalSeconds <= 0) {
    clearInterval(timer);
    gameOver();
    return;
  }
  
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  timerElement.textContent = `Tempo: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function finishLevel() {
  gameFinished = true;
  clearInterval(timer);
  
  // Tocar som de conclusão de nível
  if (levelUpSound) {
    levelUpSound.currentTime = 0;
    levelUpSound.play().catch(e => console.log("Não foi possível tocar o som de nível: ", e));
  }
  
  // Criar efeito de confete
  createConfetti();
  
  // Mostrar modal de nível concluído
  levelCompleteMessage.textContent = `Você completou o nível ${currentLevel}!`;
  levelCompleteModal.style.display = 'flex';
  
  // Mostrar botão de reiniciar
  restartButton.style.display = 'block';
}

function gameOver() {
  gameFinished = true;
  showFeedback('Tempo esgotado! 😢 Tente novamente.', 'error');
  
  // Mostrar botão de reiniciar
  restartButton.style.display = 'block';
}

function restartGame() {
  loadLevel(currentLevel);
  restartButton.style.display = 'none';
}

function nextLevel() {
  if (currentLevel < maxLevels) {
    currentLevel++;
    levelCompleteModal.style.display = 'none';
    loadLevelSounds(); // Carregar som do próximo nível
    loadLevel(currentLevel);
    restartButton.style.display = 'none';
  } else {
    // Tocar som de jogo completo
    if (gameCompleteSound) {
      gameCompleteSound.currentTime = 0;
      gameCompleteSound.play().catch(e => console.log("Não foi possível tocar o som de jogo completo: ", e));
    }
    
    // Jogo completo - usar o novo modal
    levelCompleteModal.style.display = 'none';
    showGameCompleteModal();
    restartButton.style.display = 'block';
    currentLevel = 1; // Reiniciar para o nível 1
  }
}

// Nova função para mostrar mensagem de jogo completo
function showGameCompleteModal() {
  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const levelsGained = playerLevel - 1; // Níveis ganhos durante o jogo
  const xpEarned = xpCurrent; // XP total adquirido
  
  // Configurar o modal para mostrar informações de jogo completo
  levelCompleteMessage.innerHTML = `
    <div class="game-complete-stats">
      <h3>🎉 Jogo Concluído! 🎉</h3>
      <div class="stat-row">
        <span class="stat-label">Tempo total:</span>
        <span class="stat-value">${timeString}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Níveis conquistados:</span>
        <span class="stat-value">${levelsGained}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">XP total:</span>
        <span class="stat-value">${xpEarned}/${xpMax}</span>
      </div>
    </div>
  `;
  
  // Alterar o texto do botão para "Jogar Novamente"
  nextLevelButton.textContent = "Jogar Novamente";
  
  // Mostrar o modal
  levelCompleteModal.style.display = 'flex';
  
  // Adicionar efeito de confete extra
  createConfetti();
  setTimeout(() => createConfetti(), 500);
  setTimeout(() => createConfetti(), 1000);
}

// Modificar a função showFeedback para aceitar um parâmetro de duração personalizado
function showFeedback(message, type, duration = 5000) {
  feedbackElement.textContent = message;
  feedbackElement.style.display = 'block';
  feedbackElement.style.backgroundColor = type === 'success' ? 'rgba(76, 175, 80, 0.95)' : 'rgba(244, 67, 54, 0.95)';
  feedbackElement.style.whiteSpace = 'pre-line'; // Permite quebras de linha na mensagem
  
  setTimeout(() => {
    feedbackElement.style.display = 'none';
  }, duration);
}

function addXP(amount) {
  const oldPlayerLevel = playerLevel;
  xpCurrent += amount;
  if (xpCurrent > xpMax) {
    xpCurrent = xpMax;
  }
  
  // Calcular novo nível do jogador (a cada 50 XP = 1 nível)
  playerLevel = Math.floor(xpCurrent / 50) + 1;
  
  // Si o nível do jogador aumentou, mostrar mensagem
  if (playerLevel > oldPlayerLevel) {
    showLevelUpMessage(playerLevel);
  }
  
  updateXP();
}

// Nova função para mostrar mensagem de aumento de nível
function showLevelUpMessage(newLevel) {
  showFeedback(`🎊 Nível Up! 🎊\nAgora você é nível ${newLevel}!`, 'success', 8000); // Aumentado para 8 segundos
}

function updateXP() {
  xpTextElement.textContent = `XP: ${xpCurrent}/${xpMax}`;
  xpProgressElement.style.width = `${(xpCurrent / xpMax) * 100}%`;
}

function createConfetti() {
  const confettiCount = 100;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    
    // Posição aleatória
    confetti.style.left = `${Math.random() * 100}%`;
    
    // Cor aleatória
    const colors = ['#FFC107', '#FF9800', '#FF5722', '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39'];
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Tamanho aleatório
    const size = Math.random() * 10 + 5;
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;
    
    // Forma aleatória (redonda ou quadrada)
    if (Math.random() > 0.5) {
      confetti.style.borderRadius = '50%';
    }
    
    // Animação com atraso aleatório
    confetti.style.animationDelay = `${Math.random() * 2}s`;
    
    document.body.appendChild(confetti);
    
    // Remover após a animação
    setTimeout(() => {
      confetti.remove();
    }, 5000);
  }
}

// Função utilitária para embaralhar array
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Melhorias de acessibilidade para teclado
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (modalInfo && modalInfo.style.display === 'flex') {
      modalInfo.style.display = 'none';
    }
    if (levelCompleteModal && levelCompleteModal.style.display === 'flex') {
      levelCompleteModal.style.display = 'none';
    }
  }
});

// Melhorias para dispositivos touch
let touchStartX, touchStartY;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  // Detectar deslize longo (swipe) para a esquerda como atalho para reiniciar
  if (touchStartX - touchEndX > 100 && Math.abs(touchStartY - touchEndY) < 50) {
    restartGame();
  }
}, { passive: true });

// Prevenir zoom em elementos interativos
document.addEventListener('gesturestart', (e) => {
  if (e.target.closest('.draggable') || e.target.closest('.target')) {
    e.preventDefault();
  }
});

// Melhorias de performance: pré-carregar ícones
function preloadIcons() {
  const types = ['fotos', 'musica', 'jogos', 'desenhos'];
  types.forEach(type => {
    const img = new Image();
    img.src = getItemIcon(type);
  });
}

// Pré-carregar ícones quando a página carregar
window.addEventListener('load', preloadIcons);

// Suporte para modo de alto contraste
if (window.matchMedia('(prefers-contrast: high)').matches) {
  document.documentElement.style.setProperty('--primary-color', '#4a36a1');
  document.documentElement.style.setProperty('--primary-light', '#5d46c2');
  document.documentElement.style.setProperty('--primary-dark', '#3c2b7d');
}

// Exportar funções para uso global
window.initializeGame = initializeGame;
window.loadGameWhenReady = loadGameWhenReady;
window.reloadGame = reloadGame;

console.log('Jogo Nuvens Coloridas carregado com sucesso');