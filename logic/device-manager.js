// Модуль управления устройствами
const DeviceManager = {
    // Элементы DOM
    elements: {
        deviceBtn: null,
        deviceSelector: null,
        deviceItems: null
    },
    
    // Состояние устройств
    state: {
        currentDevice: 'speakers', // speakers, headphones, bluetooth
        isBluetoothAvailable: false,
        connectedDevices: [],
        deviceNames: {
            speakers: 'Динамики',
            headphones: 'Наушники',
            bluetooth: 'Bluetooth'
        }
    },
    
    // Инициализация модуля
    init: function() {
        // Получаем элементы DOM
        this.elements.deviceBtn = document.getElementById('device-btn');
        this.elements.deviceSelector = document.querySelector('.device-selector');
        this.elements.deviceItems = document.querySelectorAll('.device-item');
        
        // Инициализируем обработчики событий
        this.initEventListeners();
        
        // Проверяем доступность Bluetooth
        this.checkBluetoothAvailability();
        
        // Проверяем подключение наушников
        this.checkHeadphonesConnection();
    },
    
    // Инициализация обработчиков событий
    initEventListeners: function() {
        // Обработчик для кнопки выбора устройства
        this.elements.deviceBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Предотвращаем всплытие события
            this.toggleDeviceSelector();
        });
        
        // Обработчики для элементов выбора устройства
        this.elements.deviceItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation(); // Предотвращаем всплытие события
                const device = item.dataset.device;
                this.switchDevice(device);
                this.toggleDeviceSelector();
            });
        });
        
        // Обработчик для закрытия селектора при клике вне его
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.device-selector') && this.elements.deviceSelector.classList.contains('active')) {
                this.toggleDeviceSelector(false); // Закрываем селектор
            }
        });
        
        // Обработчик для события подключения/отключения устройств
        if (navigator.mediaDevices && navigator.mediaDevices.ondevicechange) {
            navigator.mediaDevices.ondevicechange = () => {
                this.checkHeadphonesConnection();
            };
        }
    },
    
    // Функция для переключения селектора устройств
    toggleDeviceSelector: function(show) {
        if (show === undefined) {
            // Если параметр не передан, переключаем состояние
            this.elements.deviceSelector.classList.toggle('active');
        } else if (show) {
            // Если show === true, показываем селектор
            this.elements.deviceSelector.classList.add('active');
        } else {
            // Если show === false, скрываем селектор
            this.elements.deviceSelector.classList.remove('active');
        }
    },
    
    // Функция для переключения устройства
    switchDevice: function(device) {
        // Проверяем доступность устройства
        if (device === 'bluetooth' && !this.state.isBluetoothAvailable) {
            this.showBluetoothNotAvailable();
            return;
        }
        
        // Если выбраны наушники, но они не подключены
        if (device === 'headphones' && !this.isDeviceConnected('headphones')) {
            this.showHeadphonesNotConnected();
            return;
        }
        
        // Обновляем активный элемент
        this.elements.deviceItems.forEach(item => {
            if (item.dataset.device === device) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Если текущее устройство - динамики, и мы переключаемся на наушники
        if (this.state.currentDevice === 'speakers' && device === 'headphones') {
            // Автонастройка эквалайзера для наушников
            Equalizer.autoAdjustForHeadphones();
        }
        
        // Обновляем текущее устройство
        this.state.currentDevice = device;
        
        // Обновляем кнопку
        const icon = this.getDeviceIcon(device);
        const name = this.state.deviceNames[device];
        this.elements.deviceBtn.innerHTML = `<i class="${icon}"></i><span>${name}</span>`;
        
        // Показываем уведомление
        this.showDeviceConnectedNotification(device);
    },
    
    // Функция для проверки доступности Bluetooth
    checkBluetoothAvailability: function() {
        // Проверяем поддержку Web Bluetooth API
        if (navigator.bluetooth) {
            this.state.isBluetoothAvailable = true;
        } else {
            // Скрываем опцию Bluetooth
            const bluetoothItem = document.querySelector('.device-item[data-device="bluetooth"]');
            if (bluetoothItem) {
                bluetoothItem.style.display = 'none';
            }
        }
    },
    
    // Функция для проверки подключения наушников
    checkHeadphonesConnection: function() {
        // В реальном приложении здесь был бы код для проверки подключения наушников
        // через Web Audio API или другие API
        
        // Для демонстрации будем считать, что наушники подключены
        const isConnected = true;
        
        if (isConnected) {
            this.addConnectedDevice('headphones');
        } else {
            this.removeConnectedDevice('headphones');
            
            // Если текущее устройство - наушники, переключаемся на динамики
            if (this.state.currentDevice === 'headphones') {
                this.pauseAndShowDisconnectionNotification();
            }
        }
    },
    
    // Функция для добавления подключенного устройства
    addConnectedDevice: function(device) {
        if (!this.state.connectedDevices.includes(device)) {
            this.state.connectedDevices.push(device);
            
            // Показываем уведомление о подключении
            if (device === 'headphones') {
                this.showHeadphonesConnectedNotification();
            }
        }
    },
    
    // Функция для удаления подключенного устройства
    removeConnectedDevice: function(device) {
        const index = this.state.connectedDevices.indexOf(device);
        if (index !== -1) {
            this.state.connectedDevices.splice(index, 1);
        }
    },
    
    // Функция для проверки, подключено ли устройство
    isDeviceConnected: function(device) {
        return this.state.connectedDevices.includes(device);
    },
    
    // Функция для получения иконки устройства
    getDeviceIcon: function(device) {
        switch (device) {
            case 'speakers':
                return 'fas fa-volume-up';
            case 'headphones':
                return 'fas fa-headphones';
            case 'bluetooth':
                return 'fab fa-bluetooth-b';
            default:
                return 'fas fa-volume-up';
        }
    },
    
    // Функция для показа уведомления о подключении устройства
    showDeviceConnectedNotification: function(device) {
        let title, message;
        
        switch (device) {
            case 'speakers':
                title = 'Динамики подключены';
                message = 'Звук воспроизводится через динамики';
                break;
            case 'headphones':
                title = 'Наушники подключены';
                message = 'Звук воспроизводится через наушники';
                break;
            case 'bluetooth':
                title = 'Bluetooth подключен';
                message = 'Звук воспроизводится через Bluetooth-устройство';
                break;
            default:
                return;
        }
        
        Notifications.success(message, title);
    },
    
    // Функция для показа уведомления о подключении наушников
    showHeadphonesConnectedNotification: function() {
        Notifications.success('Наушники подключены', 'Устройство обнаружено');
    },
    
    // Функция для показа уведомления о недоступности Bluetooth
    showBluetoothNotAvailable: function() {
        Notifications.warning('Bluetooth не поддерживается в вашем браузере', 'Bluetooth недоступен');
    },
    
    // Функция для показа уведомления о неподключенных наушниках
    showHeadphonesNotConnected: function() {
        Notifications.warning('Подключите наушники к устройству', 'Наушники не обнаружены');
    },
    
    // Функция для паузы и показа уведомления об отключении
    pauseAndShowDisconnectionNotification: function() {
        // Ставим плеер на паузу
        if (PlayerCore.state.isPlaying) {
            PlayerCore.pauseAudio();
        }
        
        // Переключаемся на динамики
        this.switchDevice('speakers');
        
        // Показываем уведомление
        Notifications.warning('Музыка поставлена на паузу. Подключите устройство или продолжите через динамики.', 'Устройство отключено');
    }
};

// Экспортируем модуль в глобальное пространство имен
window.DeviceManager = DeviceManager; 