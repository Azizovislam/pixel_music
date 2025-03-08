// Модуль библиотеки и плейлистов
const Library = {
    // Элементы DOM
    elements: {
        playlist: null,
        uploadInput: null,
        uploadContainer: null,
        libraryTabs: null,
        currentLibraryTitle: null,
        createPlaylistBtn: null,
        createPlaylistModal: null,
        closeModalBtn: null,
        playlistNameInput: null,
        playlistDescInput: null,
        savePlaylistBtn: null,
        cancelPlaylistBtn: null,
        playlistsContainer: null
    },
    
    // Состояние библиотеки
    state: {
        tracks: [],
        favorites: [],
        history: [],
        playlists: [],
        currentTrack: null,
        currentLibrary: 'all', // all, favorites, my-songs, history, playlists
        currentPlaylist: null
    },
    
    // Инициализация модуля
    init: function() {
        // Получаем элементы DOM
        this.elements.playlist = document.getElementById('playlist');
        this.elements.uploadInput = document.getElementById('upload-input');
        this.elements.uploadContainer = document.getElementById('upload-container');
        this.elements.libraryTabs = document.querySelectorAll('.library-tab');
        this.elements.currentLibraryTitle = document.getElementById('current-library-title');
        this.elements.createPlaylistBtn = document.getElementById('create-playlist-btn');
        this.elements.createPlaylistModal = document.getElementById('create-playlist-modal');
        this.elements.closeModalBtn = document.querySelector('.close-modal');
        this.elements.playlistNameInput = document.getElementById('playlist-name');
        this.elements.playlistDescInput = document.getElementById('playlist-description');
        this.elements.savePlaylistBtn = document.getElementById('save-playlist');
        this.elements.cancelPlaylistBtn = document.getElementById('cancel-playlist');
        this.elements.playlistsContainer = document.getElementById('playlists-container');
        
        // Загружаем данные из localStorage
        this.loadFromStorage();
        
        // Инициализируем обработчики событий
        this.initEventListeners();
        
        // Обновляем плейлист
        this.updatePlaylist();
    },
    
    // Загрузка данных из localStorage
    loadFromStorage: function() {
        // Загружаем избранные треки
        const favoritesData = localStorage.getItem('favorites');
        if (favoritesData) {
            this.state.favorites = JSON.parse(favoritesData);
        }
        
        // Загружаем историю
        const historyData = localStorage.getItem('history');
        if (historyData) {
            this.state.history = JSON.parse(historyData);
        }
        
        // Загружаем плейлисты
        const playlistsData = localStorage.getItem('playlists');
        if (playlistsData) {
            this.state.playlists = JSON.parse(playlistsData);
        }
    },
    
    // Инициализация обработчиков событий
    initEventListeners: function() {
        // Обработчики для загрузки файлов
        this.elements.uploadInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
        
        // Drag & Drop
        this.elements.uploadContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.uploadContainer.classList.add('drag-over');
        });
        
        this.elements.uploadContainer.addEventListener('dragleave', () => {
            this.elements.uploadContainer.classList.remove('drag-over');
        });
        
        this.elements.uploadContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.uploadContainer.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });
        
        // Обработчики для вкладок библиотеки
        this.elements.libraryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchLibrary(tabName);
            });
        });
        
        // Обработчики для модального окна создания плейлиста
        this.elements.createPlaylistBtn.addEventListener('click', () => {
            this.showCreatePlaylistModal();
        });
        
        this.elements.closeModalBtn.addEventListener('click', () => {
            this.hideCreatePlaylistModal();
        });
        
        this.elements.cancelPlaylistBtn.addEventListener('click', () => {
            this.hideCreatePlaylistModal();
        });
        
        this.elements.savePlaylistBtn.addEventListener('click', () => {
            this.createPlaylist();
        });
    },
    
    // Функция для обработки загруженных файлов
    handleFiles: function(files) {
        if (files.length === 0) return;
        
        // Обрабатываем каждый файл
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('audio/')) return;
            
            const audioUrl = URL.createObjectURL(file);
            
            // Создаем уникальный ID для трека
            const trackId = 'track_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Создаем новый трек
            const track = {
                id: trackId,
                title: file.name.replace(/\.[^/.]+$/, ''), // Удаляем расширение
                artist: 'Неизвестный исполнитель',
                audioUrl,
                coverUrl: 'default-cover.svg',
                addedDate: new Date().toISOString(),
                isUserUploaded: true,
                addedToHistory: false
            };
            
            // Добавляем трек в массив
            this.state.tracks.push(track);
            
            // Если это первый трек, устанавливаем его активным
            if (this.state.tracks.length === 1) {
                PlayerCore.setActiveTrack(0);
            }
            
            // Извлекаем метаданные из аудиофайла
            const audio = new Audio(audioUrl);
            audio.addEventListener('loadedmetadata', () => {
                // Получаем длительность
                track.duration = audio.duration;
                
                // Пытаемся извлечь метаданные (ID3 теги)
                if (window.jsmediatags) {
                    window.jsmediatags.read(file, {
                        onSuccess: (tag) => {
                            // Обновляем информацию о треке
                            if (tag.tags.title) track.title = tag.tags.title;
                            if (tag.tags.artist) track.artist = tag.tags.artist;
                            
                            // Обновляем плейлист
                            this.updatePlaylist();
                            
                            // Если есть обложка, устанавливаем ее
                            if (tag.tags.picture) {
                                const { data, format } = tag.tags.picture;
                                let base64String = '';
                                for (let i = 0; i < data.length; i++) {
                                    base64String += String.fromCharCode(data[i]);
                                }
                                const coverUrl = `data:${format};base64,${window.btoa(base64String)}`;
                                track.coverUrl = coverUrl;
                                
                                // Обновляем плейлист
                                this.updatePlaylist();
                                
                                // Если это активный трек, обновляем обложку в плеере
                                if (this.state.currentTrack === track) {
                                    PlayerCore.elements.albumCover.src = coverUrl;
                                    PlayerCore.adaptBackgroundColor(coverUrl);
                                }
                            }
                        }
                    });
                } else {
                    // Если библиотека не загружена, просто обновляем плейлист
                    this.updatePlaylist();
                }
            });
        });
        
        // Показываем уведомление
        Notifications.success(`Загружено ${files.length} файлов`);
    },
    
    // Функция для обновления плейлиста
    updatePlaylist: function() {
        // Очищаем плейлист
        this.elements.playlist.innerHTML = '';
        
        // Определяем, какие треки показывать в зависимости от текущей библиотеки
        let tracksToShow = [];
        
        switch (this.state.currentLibrary) {
            case 'favorites':
                tracksToShow = this.state.tracks.filter(track => 
                    this.state.favorites.includes(track.id)
                );
                break;
            case 'my-songs':
                tracksToShow = this.state.tracks.filter(track => 
                    track.isUserUploaded
                );
                break;
            case 'history':
                tracksToShow = this.state.history.map(historyItem => 
                    this.state.tracks.find(track => track.id === historyItem.trackId)
                ).filter(Boolean);
                break;
            case 'playlists':
                if (this.state.currentPlaylist) {
                    const playlist = this.state.playlists.find(p => p.id === this.state.currentPlaylist);
                    if (playlist) {
                        tracksToShow = playlist.trackIds.map(trackId => 
                            this.state.tracks.find(track => track.id === trackId)
                        ).filter(Boolean);
                    }
                } else {
                    // Если плейлист не выбран, показываем список плейлистов
                    this.showPlaylists();
                    return;
                }
                break;
            default: // 'all'
                tracksToShow = this.state.tracks;
        }
        
        // Если нет треков для отображения
        if (tracksToShow.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-playlist-message';
            
            switch (this.state.currentLibrary) {
                case 'favorites':
                    emptyMessage.textContent = 'У вас пока нет избранных треков';
                    break;
                case 'my-songs':
                    emptyMessage.textContent = 'Вы еще не загрузили ни одного трека';
                    break;
                case 'history':
                    emptyMessage.textContent = 'История прослушивания пуста';
                    break;
                case 'playlists':
                    if (this.state.currentPlaylist) {
                        emptyMessage.textContent = 'В этом плейлисте нет треков';
                    } else {
                        emptyMessage.textContent = 'У вас пока нет плейлистов';
                    }
                    break;
                default:
                    emptyMessage.textContent = 'Загрузите музыку, чтобы начать';
            }
            
            this.elements.playlist.appendChild(emptyMessage);
            return;
        }
        
        // Добавляем треки в плейлист
        tracksToShow.forEach((track) => {
            const playlistItem = document.createElement('div');
            playlistItem.className = 'playlist-item';
            
            // Если это текущий трек, добавляем класс active
            if (track === this.state.currentTrack) {
                playlistItem.classList.add('active');
            }
            
            playlistItem.innerHTML = `
                <img class="playlist-item-cover" src="${track.coverUrl}" alt="Обложка">
                <div class="playlist-item-info">
                    <div class="playlist-item-title">${track.title}</div>
                    <div class="playlist-item-artist">${track.artist}</div>
                </div>
                <button class="favorite-btn ${this.state.favorites.includes(track.id) ? 'active' : ''}">
                    <i class="${this.state.favorites.includes(track.id) ? 'fas' : 'far'} fa-heart"></i>
                </button>
            `;
            
            // Добавляем обработчик клика для воспроизведения
            playlistItem.querySelector('.playlist-item-info').addEventListener('click', () => {
                // Находим индекс трека в полном массиве треков
                const fullIndex = this.state.tracks.indexOf(track);
                PlayerCore.setActiveTrack(fullIndex);
            });
            
            // Добавляем обработчик клика для кнопки избранного
            playlistItem.querySelector('.favorite-btn').addEventListener('click', (e) => {
                e.stopPropagation(); // Предотвращаем всплытие события
                this.toggleFavorite(track.id);
            });
            
            // Добавляем элемент в плейлист
            this.elements.playlist.appendChild(playlistItem);
        });
    },
    
    // Функция для отображения плейлистов
    showPlaylists: function() {
        // Скрываем плейлист и показываем контейнер плейлистов
        this.elements.playlist.style.display = 'none';
        this.elements.playlistsContainer.style.display = 'grid';
        
        // Очищаем контейнер плейлистов
        this.elements.playlistsContainer.innerHTML = '';
        
        // Если нет плейлистов
        if (this.state.playlists.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-playlist-message';
            emptyMessage.textContent = 'У вас пока нет плейлистов';
            this.elements.playlistsContainer.appendChild(emptyMessage);
            return;
        }
        
        // Добавляем плейлисты
        this.state.playlists.forEach(playlist => {
            const playlistCard = document.createElement('div');
            playlistCard.className = 'playlist-card';
            playlistCard.dataset.id = playlist.id;
            
            // Получаем обложку плейлиста (используем обложку первого трека)
            let coverUrl = 'default-cover.svg';
            if (playlist.trackIds.length > 0) {
                const firstTrack = this.state.tracks.find(track => track.id === playlist.trackIds[0]);
                if (firstTrack && firstTrack.coverUrl) {
                    coverUrl = firstTrack.coverUrl;
                }
            }
            
            playlistCard.innerHTML = `
                <div class="playlist-card-cover">
                    <img src="${coverUrl}" alt="${playlist.name}">
                </div>
                <div class="playlist-card-title">${playlist.name}</div>
                <div class="playlist-card-info">${playlist.trackIds.length} треков</div>
                <div class="playlist-card-actions">
                    <button class="playlist-card-btn edit-playlist-btn" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="playlist-card-btn delete-playlist-btn" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // Добавляем обработчик клика для открытия плейлиста
            playlistCard.addEventListener('click', (e) => {
                if (!e.target.closest('.playlist-card-btn')) {
                    this.openPlaylist(playlist.id);
                }
            });
            
            // Добавляем обработчик для кнопки редактирования
            playlistCard.querySelector('.edit-playlist-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.editPlaylist(playlist.id);
            });
            
            // Добавляем обработчик для кнопки удаления
            playlistCard.querySelector('.delete-playlist-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deletePlaylist(playlist.id);
            });
            
            // Добавляем карточку в контейнер
            this.elements.playlistsContainer.appendChild(playlistCard);
        });
    },
    
    // Функция для переключения библиотеки
    switchLibrary: function(libraryName) {
        // Обновляем текущую библиотеку
        this.state.currentLibrary = libraryName;
        
        // Обновляем заголовок
        switch (libraryName) {
            case 'favorites':
                this.elements.currentLibraryTitle.textContent = 'Понравившиеся';
                break;
            case 'my-songs':
                this.elements.currentLibraryTitle.textContent = 'Моя музыка';
                break;
            case 'history':
                this.elements.currentLibraryTitle.textContent = 'История';
                break;
            case 'playlists':
                this.elements.currentLibraryTitle.textContent = 'Плейлисты';
                this.state.currentPlaylist = null;
                break;
            default:
                this.elements.currentLibraryTitle.textContent = 'Все треки';
        }
        
        // Показываем/скрываем кнопку создания плейлиста
        if (libraryName === 'playlists') {
            this.elements.createPlaylistBtn.style.display = 'flex';
        } else {
            this.elements.createPlaylistBtn.style.display = 'none';
            // Скрываем контейнер плейлистов и показываем плейлист
            this.elements.playlistsContainer.style.display = 'none';
            this.elements.playlist.style.display = 'block';
        }
        
        // Обновляем активный пункт в боковом меню, если оно инициализировано
        if (window.Sidebar) {
            Sidebar.updateActiveTab(libraryName);
        }
        
        // Обновляем плейлист
        this.updatePlaylist();
    },
    
    // Функция для добавления/удаления трека из избранного
    toggleFavorite: function(trackId) {
        const index = this.state.favorites.indexOf(trackId);
        
        if (index === -1) {
            // Добавляем в избранное
            this.state.favorites.push(trackId);
            
            // Показываем уведомление
            Notifications.success('Добавлено в избранное');
        } else {
            // Удаляем из избранного
            this.state.favorites.splice(index, 1);
            
            // Показываем уведомление
            Notifications.info('Удалено из избранного');
        }
        
        // Сохраняем в localStorage
        localStorage.setItem('favorites', JSON.stringify(this.state.favorites));
        
        // Обновляем плейлист, если показаны только избранные
        if (this.state.currentLibrary === 'favorites') {
            this.updatePlaylist();
        } else {
            // Иначе просто обновляем иконки
            this.updateFavoriteIcons();
        }
    },
    
    // Функция для обновления иконок избранного
    updateFavoriteIcons: function() {
        document.querySelectorAll('.playlist-item').forEach((item) => {
            const trackTitle = item.querySelector('.playlist-item-title').textContent;
            
            // Находим трек по названию
            const track = this.state.tracks.find(t => t.title === trackTitle);
            
            if (track) {
                const favoriteBtn = item.querySelector('.favorite-btn');
                
                if (this.state.favorites.includes(track.id)) {
                    favoriteBtn.classList.add('active');
                    favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
                } else {
                    favoriteBtn.classList.remove('active');
                    favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
                }
            }
        });
    },
    
    // Функция для добавления трека в историю
    addToHistory: function(track) {
        // Проверяем, есть ли уже этот трек в истории
        const existingIndex = this.state.history.findIndex(item => item.trackId === track.id);
        
        if (existingIndex !== -1) {
            // Если трек уже есть в истории, удаляем его
            this.state.history.splice(existingIndex, 1);
        }
        
        // Добавляем трек в начало истории
        this.state.history.unshift({
            trackId: track.id,
            timestamp: new Date().toISOString()
        });
        
        // Ограничиваем историю 50 треками
        if (this.state.history.length > 50) {
            this.state.history = this.state.history.slice(0, 50);
        }
        
        // Сохраняем в localStorage
        localStorage.setItem('history', JSON.stringify(this.state.history));
        
        // Обновляем плейлист, если показана история
        if (this.state.currentLibrary === 'history') {
            this.updatePlaylist();
        }
    },
    
    // Функция для показа модального окна создания плейлиста
    showCreatePlaylistModal: function() {
        // Очищаем поля
        this.elements.playlistNameInput.value = '';
        this.elements.playlistDescInput.value = '';
        
        // Показываем модальное окно
        this.elements.createPlaylistModal.classList.add('show');
    },
    
    // Функция для скрытия модального окна создания плейлиста
    hideCreatePlaylistModal: function() {
        this.elements.createPlaylistModal.classList.remove('show');
    },
    
    // Функция для создания плейлиста
    createPlaylist: function() {
        const name = this.elements.playlistNameInput.value.trim();
        const description = this.elements.playlistDescInput.value.trim();
        
        if (!name) {
            Notifications.warning('Введите название плейлиста');
            return;
        }
        
        // Создаем новый плейлист
        const playlist = {
            id: 'playlist_' + Date.now(),
            name,
            description,
            trackIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Добавляем плейлист в массив
        this.state.playlists.push(playlist);
        
        // Сохраняем в localStorage
        localStorage.setItem('playlists', JSON.stringify(this.state.playlists));
        
        // Скрываем модальное окно
        this.hideCreatePlaylistModal();
        
        // Показываем уведомление
        Notifications.success('Плейлист создан');
        
        // Обновляем список плейлистов
        this.showPlaylists();
    },
    
    // Функция для открытия плейлиста
    openPlaylist: function(playlistId) {
        // Находим плейлист
        const playlist = this.state.playlists.find(p => p.id === playlistId);
        
        if (!playlist) return;
        
        // Устанавливаем текущий плейлист
        this.state.currentPlaylist = playlistId;
        
        // Обновляем заголовок
        this.elements.currentLibraryTitle.textContent = playlist.name;
        
        // Скрываем контейнер плейлистов и показываем плейлист
        this.elements.playlistsContainer.style.display = 'none';
        this.elements.playlist.style.display = 'block';
        
        // Обновляем плейлист
        this.updatePlaylist();
    },
    
    // Функция для редактирования плейлиста
    editPlaylist: function(playlistId) {
        // Находим плейлист
        const playlist = this.state.playlists.find(p => p.id === playlistId);
        
        if (!playlist) return;
        
        // Заполняем поля
        this.elements.playlistNameInput.value = playlist.name;
        this.elements.playlistDescInput.value = playlist.description || '';
        
        // Показываем модальное окно
        this.elements.createPlaylistModal.classList.add('show');
        
        // Изменяем обработчик для кнопки сохранения
        const originalHandler = this.elements.savePlaylistBtn.onclick;
        this.elements.savePlaylistBtn.onclick = () => {
            const name = this.elements.playlistNameInput.value.trim();
            const description = this.elements.playlistDescInput.value.trim();
            
            if (!name) {
                Notifications.warning('Введите название плейлиста');
                return;
            }
            
            // Обновляем плейлист
            playlist.name = name;
            playlist.description = description;
            playlist.updatedAt = new Date().toISOString();
            
            // Сохраняем в localStorage
            localStorage.setItem('playlists', JSON.stringify(this.state.playlists));
            
            // Скрываем модальное окно
            this.hideCreatePlaylistModal();
            
            // Показываем уведомление
            Notifications.success('Плейлист обновлен');
            
            // Обновляем список плейлистов
            this.showPlaylists();
            
            // Восстанавливаем оригинальный обработчик
            this.elements.savePlaylistBtn.onclick = originalHandler;
        };
    },
    
    // Функция для удаления плейлиста
    deletePlaylist: function(playlistId) {
        // Находим индекс плейлиста
        const index = this.state.playlists.findIndex(p => p.id === playlistId);
        
        if (index === -1) return;
        
        // Удаляем плейлист
        this.state.playlists.splice(index, 1);
        
        // Сохраняем в localStorage
        localStorage.setItem('playlists', JSON.stringify(this.state.playlists));
        
        // Показываем уведомление
        Notifications.info('Плейлист удален');
        
        // Обновляем список плейлистов
        this.showPlaylists();
    }
};

// Экспортируем модуль в глобальное пространство имен
window.Library = Library; 