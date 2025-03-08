document.addEventListener('DOMContentLoaded', () => {
    // Глобальный обработчик ошибок
    window.onerror = function(message, source, lineno, colno, error) {
        console.error('Глобальная ошибка:', message, 'Источник:', source, 'Строка:', lineno, 'Колонка:', colno, 'Объект ошибки:', error);
        return false; // Позволяем стандартной обработке ошибок продолжиться
    };
    
    // Импортируем модули
    loadScript('logic/player-core.js', () => {
        loadScript('logic/library.js', () => {
            loadScript('logic/sidebar.js', () => {
                try {
                    // Инициализация приложения после загрузки всех модулей
                    initApp();
                } catch (e) {
                    console.error('Ошибка при инициализации приложения:', e);
                    alert('Произошла ошибка при запуске приложения. Пожалуйста, обновите страницу.');
                }
            });
        });
    });

    // Функция для загрузки скриптов
    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        script.onerror = (e) => {
            console.error(`Не удалось загрузить скрипт: ${src}`, e);
            alert(`Не удалось загрузить компонент: ${src}. Пожалуйста, обновите страницу.`);
        };
        document.head.appendChild(script);
    }

    // Инициализация приложения
    function initApp() {
        console.log('Инициализация приложения...');
        
        // Проверяем, что все необходимые модули загружены
        if (!window.PlayerCore || !window.Library || !window.Sidebar) {
            console.error('Не все модули загружены');
            return;
        }
        
        // Инициализация основных компонентов
        try {
            PlayerCore.init();
            console.log('PlayerCore инициализирован');
        } catch (e) {
            console.error('Ошибка при инициализации PlayerCore:', e);
        }
        
        try {
            Library.init();
            console.log('Library инициализирован');
        } catch (e) {
            console.error('Ошибка при инициализации Library:', e);
        }
        
        try {
            Sidebar.init();
            console.log('Sidebar инициализирован');
        } catch (e) {
            console.error('Ошибка при инициализации Sidebar:', e);
        }

        // Загрузка библиотеки jsmediatags для чтения метаданных
        const jsmediatagsScript = document.createElement('script');
        jsmediatagsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsmediatags/3.9.5/jsmediatags.min.js';
        jsmediatagsScript.onerror = () => {
            console.error('Не удалось загрузить библиотеку jsmediatags');
        };
        document.head.appendChild(jsmediatagsScript);

        // Инициализация уведомлений
        initNotifications();
        console.log('Приложение инициализировано');
    }

    // Инициализация системы уведомлений
    function initNotifications() {
        window.Notifications = {
            show: function(options) {
                const notification = document.getElementById('notification');
                const icon = notification.querySelector('.notification-icon i');
                const title = notification.querySelector('.notification-title');
                const message = notification.querySelector('.notification-message');
                
                // Устанавливаем тип уведомления
                notification.className = 'notification';
                if (options.type) {
                    notification.classList.add(options.type);
                    
                    // Устанавливаем иконку в зависимости от типа
                    switch (options.type) {
                        case 'success':
                            icon.className = 'fas fa-check-circle';
                            break;
                        case 'warning':
                            icon.className = 'fas fa-exclamation-triangle';
                            break;
                        case 'error':
                            icon.className = 'fas fa-times-circle';
                            break;
                        default:
                            icon.className = 'fas fa-info-circle';
                    }
                }
                
                // Устанавливаем заголовок и сообщение
                title.textContent = options.title || 'Уведомление';
                message.textContent = options.message || '';
                
                // Показываем уведомление
                notification.classList.add('show');
                
                // Автоматически скрываем через указанное время
                const timeout = options.timeout || 3000;
                const hideTimeout = setTimeout(() => {
                    notification.classList.remove('show');
                }, timeout);
                
                // Обработчик для кнопки закрытия
                const closeBtn = notification.querySelector('.notification-close');
                closeBtn.onclick = () => {
                    clearTimeout(hideTimeout);
                    notification.classList.remove('show');
                };
            },
            
            success: function(message, title = 'Успешно') {
                this.show({
                    type: 'success',
                    title,
                    message
                });
            },
            
            warning: function(message, title = 'Внимание') {
                this.show({
                    type: 'warning',
                    title,
                    message
                });
            },
            
            error: function(message, title = 'Ошибка') {
                this.show({
                    type: 'error',
                    title,
                    message
                });
            },
            
            info: function(message, title = 'Информация') {
                this.show({
                    type: 'info',
                    title,
                    message
                });
            }
        };
    }
}); 