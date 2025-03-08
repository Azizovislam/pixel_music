// Модуль основных функций плеера
const PlayerCore = {
    // Элементы DOM
    elements: {
        audioPlayer: null,
        playBtn: null,
        prevBtn: null,
        nextBtn: null,
        albumCover: null,
        songTitle: null,
        artistName: null,
        currentTimeEl: null,
        durationEl: null,
        progressBar: null,
        progress: null,
        playerContainer: null,
        themeToggle: null
    },
    
    // Состояние плеера
    state: {
        isPlaying: false,
        currentTrackIndex: 0,
        isDragging: false
    },
    
    // Инициализация модуля
    init: function() {
        // Получаем элементы DOM
        this.elements.audioPlayer = document.getElementById('audio-player');
        this.elements.playBtn = document.getElementById('play');
        this.elements.prevBtn = document.getElementById('prev');
        this.elements.nextBtn = document.getElementById('next');
        this.elements.albumCover = document.getElementById('album-cover');
        this.elements.songTitle = document.getElementById('song-title');
        this.elements.artistName = document.getElementById('artist-name');
        this.elements.currentTimeEl = document.getElementById('current-time');
        this.elements.durationEl = document.getElementById('duration');
        this.elements.progressBar = document.querySelector('.progress-bar');
        this.elements.progress = document.querySelector('.progress');
        this.elements.playerContainer = document.querySelector('.player');
        this.elements.themeToggle = document.querySelector('.theme-toggle');
        
        // Инициализируем обработчики событий
        this.initEventListeners();
        
        // Создаем дефолтную обложку
        this.createDefaultCover();
    },
    
    // Инициализация обработчиков событий
    initEventListeners: function() {
        // Обработчики для кнопок управления
        this.elements.playBtn.addEventListener('click', () => this.togglePlay());
        this.elements.prevBtn.addEventListener('click', () => this.prevTrack());
        this.elements.nextBtn.addEventListener('click', () => this.nextTrack());
        
        // Обработчик для переключения темы
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Обработчик для прогресс-бара
        this.elements.progressBar.addEventListener('click', (e) => {
            const width = this.elements.progressBar.clientWidth;
            const clickX = e.offsetX;
            const duration = this.elements.audioPlayer.duration;
            this.elements.audioPlayer.currentTime = (clickX / width) * duration;
        });
        
        // Обработчики для перетаскивания прогресс-бара
        this.elements.progressBar.addEventListener('mousedown', () => {
            this.state.isDragging = true;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.state.isDragging) {
                const width = this.elements.progressBar.clientWidth;
                const rect = this.elements.progressBar.getBoundingClientRect();
                const clickX = Math.max(0, Math.min(width, e.clientX - rect.left));
                const duration = this.elements.audioPlayer.duration;
                this.elements.audioPlayer.currentTime = (clickX / width) * duration;
            }
        });
        
        document.addEventListener('mouseup', () => {
            this.state.isDragging = false;
        });
        
        // Обработчики событий аудиоплеера
        this.elements.audioPlayer.addEventListener('loadedmetadata', () => {
            this.elements.durationEl.textContent = this.formatTime(this.elements.audioPlayer.duration);
        });
        
        this.elements.audioPlayer.addEventListener('ended', () => {
            this.nextTrack();
        });
    },
    
    // Функция для форматирования времени
    formatTime: function(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    },
    
    // Функция для обновления прогресс-бара
    updateProgress: function() {
        const { currentTime, duration } = this.elements.audioPlayer;
        const progressPercent = (currentTime / duration) * 100;
        this.elements.progress.style.width = `${progressPercent}%`;
        this.elements.currentTimeEl.textContent = this.formatTime(currentTime);
        
        // Добавляем трек в историю после 30 секунд прослушивания
        if (currentTime > 30 && !Library.state.currentTrack.addedToHistory) {
            Library.addToHistory(Library.state.currentTrack);
            Library.state.currentTrack.addedToHistory = true;
        }
        
        // Запрашиваем следующий кадр анимации
        if (this.state.isPlaying) {
            requestAnimationFrame(() => this.updateProgress());
        }
    },
    
    // Функция для установки активного трека
    setActiveTrack: function(index) {
        if (Library.state.tracks.length === 0) return;
        
        this.state.currentTrackIndex = index;
        const track = Library.state.tracks[this.state.currentTrackIndex];
        Library.state.currentTrack = track;
        
        // Обновляем информацию о треке
        this.elements.songTitle.textContent = track.title || 'Неизвестный трек';
        this.elements.artistName.textContent = track.artist || 'Неизвестный исполнитель';
        
        // Устанавливаем источник аудио
        this.elements.audioPlayer.src = track.audioUrl;
        
        // Устанавливаем обложку
        if (track.coverUrl) {
            this.elements.albumCover.src = track.coverUrl;
        } else {
            this.elements.albumCover.src = 'default-cover.svg';
        }
        
        // Адаптируем цвет фона к обложке
        if (track.coverUrl) {
            this.adaptBackgroundColor(track.coverUrl);
        }
        
        // Если плеер был в состоянии воспроизведения, запускаем новый трек
        if (this.state.isPlaying) {
            this.playAudio();
        }
        
        // Обновляем плейлист
        Library.updatePlaylist();
    },
    
    // Функция для адаптации цвета фона к обложке
    adaptBackgroundColor: function(imageUrl) {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl;
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Получаем данные изображения
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            
            // Вычисляем средний цвет
            let r = 0, g = 0, b = 0;
            const pixelCount = imageData.length / 4;
            
            for (let i = 0; i < imageData.length; i += 4) {
                r += imageData[i];
                g += imageData[i + 1];
                b += imageData[i + 2];
            }
            
            r = Math.floor(r / pixelCount);
            g = Math.floor(g / pixelCount);
            b = Math.floor(b / pixelCount);
            
            // Применяем цвет с низкой непрозрачностью
            this.elements.playerContainer.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.2)`;
            
            // Устанавливаем цвет прогресс-бара
            document.documentElement.style.setProperty('--progress-color', `rgb(${r}, ${g}, ${b})`);
        };
    },
    
    // Функция для воспроизведения аудио
    playAudio: function() {
        this.elements.audioPlayer.play()
            .then(() => {
                this.elements.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                this.state.isPlaying = true;
                this.elements.playerContainer.classList.add('playing');
                requestAnimationFrame(() => this.updateProgress());
            })
            .catch(error => {
                console.error('Ошибка воспроизведения:', error);
                Notifications.error('Не удалось воспроизвести трек');
            });
    },
    
    // Функция для паузы аудио
    pauseAudio: function() {
        this.elements.audioPlayer.pause();
        this.elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.state.isPlaying = false;
        this.elements.playerContainer.classList.remove('playing');
    },
    
    // Функция для переключения воспроизведения/паузы
    togglePlay: function() {
        if (Library.state.tracks.length === 0) {
            Notifications.info('Сначала загрузите музыку');
            return;
        }
        
        if (this.state.isPlaying) {
            this.pauseAudio();
        } else {
            this.playAudio();
        }
    },
    
    // Функция для перехода к предыдущему треку
    prevTrack: function() {
        if (Library.state.tracks.length === 0) return;
        
        if (this.elements.audioPlayer.currentTime > 3) {
            // Если прошло больше 3 секунд, перематываем на начало текущего трека
            this.elements.audioPlayer.currentTime = 0;
        } else {
            // Иначе переходим к предыдущему треку
            let prevIndex = this.state.currentTrackIndex - 1;
            if (prevIndex < 0) prevIndex = Library.state.tracks.length - 1;
            this.setActiveTrack(prevIndex);
        }
    },
    
    // Функция для перехода к следующему треку
    nextTrack: function() {
        if (Library.state.tracks.length === 0) return;
        
        let nextIndex = this.state.currentTrackIndex + 1;
        if (nextIndex >= Library.state.tracks.length) nextIndex = 0;
        this.setActiveTrack(nextIndex);
    },
    
    // Функция для переключения темы
    toggleTheme: function() {
        document.body.classList.toggle('dark-theme');
        const icon = this.elements.themeToggle.querySelector('i');
        if (document.body.classList.contains('dark-theme')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    },
    
    // Функция для создания дефолтной обложки
    createDefaultCover: function() {
        const defaultCover = new Image();
        defaultCover.src = 'default-cover.svg';
        defaultCover.onerror = () => {
            // Если дефолтная обложка не найдена, создаем ее программно
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 300;
            const ctx = canvas.getContext('2d');
            
            // Заливаем фон
            ctx.fillStyle = '#4a4e69';
            ctx.fillRect(0, 0, 300, 300);
            
            // Рисуем иконку музыки
            ctx.fillStyle = '#f2e9e4';
            ctx.font = '120px FontAwesome, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('♪', 150, 150);
            
            // Сохраняем как data URL
            const dataUrl = canvas.toDataURL('image/jpeg');
            this.elements.albumCover.src = dataUrl;
        };
    }
};

// Экспортируем модуль в глобальное пространство имен
window.PlayerCore = PlayerCore; 