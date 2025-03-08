// Модуль эквалайзера
const Equalizer = {
    // Элементы DOM
    elements: {
        equalizerToggle: null,
        equalizerPanel: null,
        presetButtons: null,
        eqRanges: null,
        eqValues: null
    },
    
    // Состояние эквалайзера
    state: {
        isActive: false,
        currentPreset: 'normal',
        audioContext: null,
        sourceNode: null,
        gainNodes: [],
        analyser: null,
        presets: {
            normal: [0, 0, 0, 0, 0],
            bass: [7, 5, 0, 0, 0],
            rock: [4, 2, -2, 2, 3],
            pop: [-1, 2, 5, 1, -2],
            classic: [5, 3, -2, 1, 5],
            audiobook: [-2, 0, 0, 5, 2]
        }
    },
    
    // Инициализация модуля
    init: function() {
        // Получаем элементы DOM
        this.elements.equalizerToggle = document.getElementById('equalizer-toggle');
        this.elements.equalizerPanel = document.querySelector('.equalizer-panel');
        this.elements.presetButtons = document.querySelectorAll('.preset-btn');
        this.elements.eqRanges = document.querySelectorAll('.eq-range');
        this.elements.eqValues = document.querySelectorAll('.eq-value');
        
        // Инициализируем Web Audio API
        this.initAudio();
        
        // Инициализируем обработчики событий
        this.initEventListeners();
    },
    
    // Инициализация Web Audio API
    initAudio: function() {
        try {
            // Создаем аудио контекст
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.state.audioContext = new AudioContext();
            
            // Получаем элемент аудио
            const audioElement = document.getElementById('audio-player');
            
            // Проверяем, что элемент существует
            if (!audioElement) {
                console.error('Элемент audio-player не найден');
                this.elements.equalizerToggle.style.display = 'none';
                return;
            }
            
            // Создаем источник
            try {
                this.state.sourceNode = this.state.audioContext.createMediaElementSource(audioElement);
            } catch (e) {
                console.error('Ошибка при создании источника аудио:', e);
                // Возможно, источник уже создан, пробуем использовать существующий
                if (audioElement._sourceNode) {
                    this.state.sourceNode = audioElement._sourceNode;
                } else {
                    this.elements.equalizerToggle.style.display = 'none';
                    return;
                }
            }
            
            // Сохраняем ссылку на источник в элементе аудио для предотвращения повторного создания
            audioElement._sourceNode = this.state.sourceNode;
            
            // Создаем анализатор для визуализации
            this.state.analyser = this.state.audioContext.createAnalyser();
            this.state.analyser.fftSize = 256;
            
            // Создаем узлы усиления для каждой полосы эквалайзера
            const frequencies = [60, 230, 910, 3600, 14000];
            
            // Очищаем массив узлов, если он уже был заполнен
            this.state.gainNodes = [];
            
            frequencies.forEach((frequency, index) => {
                // Создаем фильтр
                const filter = this.state.audioContext.createBiquadFilter();
                
                // Устанавливаем тип фильтра в зависимости от частоты
                if (index === 0) {
                    filter.type = 'lowshelf'; // Низкие частоты
                } else if (index === frequencies.length - 1) {
                    filter.type = 'highshelf'; // Высокие частоты
                } else {
                    filter.type = 'peaking'; // Средние частоты
                }
                
                // Устанавливаем частоту
                filter.frequency.value = frequency;
                
                // Устанавливаем Q-фактор для peaking фильтров
                if (filter.type === 'peaking') {
                    filter.Q.value = 1;
                }
                
                // Устанавливаем начальное усиление
                filter.gain.value = 0;
                
                // Добавляем в массив
                this.state.gainNodes.push(filter);
            });
            
            // Соединяем узлы
            try {
                // Отключаем предыдущие соединения, если они были
                this.state.sourceNode.disconnect();
                
                // Соединяем источник с первым фильтром
                this.state.sourceNode.connect(this.state.gainNodes[0]);
                
                // Соединяем фильтры между собой
                for (let i = 0; i < this.state.gainNodes.length - 1; i++) {
                    this.state.gainNodes[i].connect(this.state.gainNodes[i + 1]);
                }
                
                // Подключаем последний узел к анализатору
                this.state.gainNodes[this.state.gainNodes.length - 1].connect(this.state.analyser);
                
                // Подключаем анализатор к выходу
                this.state.analyser.connect(this.state.audioContext.destination);
                
                console.log('Эквалайзер инициализирован успешно');
            } catch (e) {
                console.error('Ошибка при соединении узлов аудио:', e);
                
                // Если произошла ошибка, подключаем источник напрямую к выходу
                try {
                    this.state.sourceNode.connect(this.state.audioContext.destination);
                } catch (e) {
                    console.error('Не удалось подключить источник к выходу:', e);
                }
                
                this.elements.equalizerToggle.style.display = 'none';
            }
            
        } catch (e) {
            console.error('Web Audio API не поддерживается:', e);
            // Скрываем кнопку эквалайзера
            this.elements.equalizerToggle.style.display = 'none';
        }
    },
    
    // Инициализация обработчиков событий
    initEventListeners: function() {
        // Обработчик для кнопки эквалайзера
        this.elements.equalizerToggle.addEventListener('click', () => {
            this.toggleEqualizer();
        });
        
        // Обработчики для кнопок пресетов
        this.elements.presetButtons.forEach(button => {
            button.addEventListener('click', () => {
                const preset = button.dataset.preset;
                this.applyPreset(preset);
            });
        });
        
        // Обработчики для ползунков эквалайзера
        this.elements.eqRanges.forEach((range, index) => {
            // Используем событие 'input' для обновления в реальном времени
            range.addEventListener('input', () => {
                const value = parseInt(range.value);
                this.setEQBand(index, value);
                this.updateEQValue(index, value);
                
                // Сбрасываем активный пресет
                this.resetPresetButtons();
                this.state.currentPreset = 'custom';
            });
            
            // Добавляем обработчик для события 'change', которое срабатывает при отпускании ползунка
            range.addEventListener('change', () => {
                const value = parseInt(range.value);
                this.setEQBand(index, value);
                this.updateEQValue(index, value);
            });
            
            // Добавляем обработчики для сенсорных устройств
            range.addEventListener('touchstart', (e) => {
                e.stopPropagation(); // Предотвращаем всплытие события
            });
            
            range.addEventListener('touchmove', (e) => {
                e.stopPropagation(); // Предотвращаем всплытие события
            });
            
            range.addEventListener('touchend', (e) => {
                e.stopPropagation(); // Предотвращаем всплытие события
            });
        });
    },
    
    // Функция для переключения эквалайзера
    toggleEqualizer: function() {
        if (this.state.isActive) {
            this.elements.equalizerPanel.classList.remove('show');
            this.state.isActive = false;
        } else {
            this.elements.equalizerPanel.classList.add('show');
            this.state.isActive = true;
        }
    },
    
    // Функция для применения пресета
    applyPreset: function(preset) {
        if (!this.state.presets[preset]) return;
        
        // Обновляем активную кнопку
        this.resetPresetButtons();
        const presetButton = document.querySelector(`.preset-btn[data-preset="${preset}"]`);
        if (presetButton) {
            presetButton.classList.add('active');
        }
        
        // Устанавливаем значения эквалайзера
        this.state.presets[preset].forEach((value, index) => {
            this.setEQBand(index, value);
            
            // Обновляем положение ползунка
            if (this.elements.eqRanges[index]) {
                this.elements.eqRanges[index].value = value;
            }
            
            // Обновляем отображаемое значение
            this.updateEQValue(index, value);
        });
        
        // Обновляем текущий пресет
        this.state.currentPreset = preset;
        
        // Показываем уведомление
        Notifications.success(`Применен пресет "${this.getPresetName(preset)}"`);
    },
    
    // Функция для сброса активных кнопок пресетов
    resetPresetButtons: function() {
        this.elements.presetButtons.forEach(button => {
            button.classList.remove('active');
        });
    },
    
    // Функция для установки значения полосы эквалайзера
    setEQBand: function(index, value) {
        if (this.state.gainNodes[index]) {
            this.state.gainNodes[index].gain.value = value;
        }
    },
    
    // Функция для получения названия пресета
    getPresetName: function(preset) {
        switch (preset) {
            case 'normal': return 'Обычный';
            case 'bass': return 'Басы';
            case 'rock': return 'Рок';
            case 'pop': return 'Поп';
            case 'classic': return 'Классика';
            case 'audiobook': return 'Аудиокнига';
            default: return 'Пользовательский';
        }
    },
    
    // Функция для обновления отображаемого значения эквалайзера
    updateEQValue: function(index, value) {
        if (this.elements.eqValues[index]) {
            this.elements.eqValues[index].textContent = `${value > 0 ? '+' : ''}${value} dB`;
        }
    },
    
    // Функция для автонастройки эквалайзера при подключении наушников
    autoAdjustForHeadphones: function() {
        // Применяем пресет для наушников (небольшое усиление низких и высоких частот)
        const headphonesPreset = [3, 1, 0, 1, 2];
        
        headphonesPreset.forEach((value, index) => {
            this.setEQBand(index, value);
            this.elements.eqRanges[index].value = value;
            this.elements.eqValues[index].textContent = `${value > 0 ? '+' : ''}${value} dB`;
        });
        
        // Сбрасываем активные кнопки пресетов
        this.resetPresetButtons();
        
        // Обновляем текущий пресет
        this.state.currentPreset = 'headphones';
        
        // Показываем уведомление
        Notifications.info('Эквалайзер настроен для наушников');
    }
};

// Экспортируем модуль в глобальное пространство имен
window.Equalizer = Equalizer; 