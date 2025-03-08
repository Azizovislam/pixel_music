// Модуль бокового меню
const Sidebar = {
    // Элементы DOM
    elements: {
        sidebar: null,
        hamburgerBtn: null,
        closeBtn: null,
        overlay: null,
        menuItems: null
    },
    
    // Состояние меню
    state: {
        isOpen: false,
        activeTab: 'all'
    },
    
    // Инициализация модуля
    init: function() {
        // Получаем элементы DOM
        this.elements.sidebar = document.getElementById('sidebar');
        this.elements.hamburgerBtn = document.getElementById('hamburger-btn');
        this.elements.closeBtn = document.getElementById('close-sidebar');
        this.elements.overlay = document.getElementById('overlay');
        this.elements.menuItems = document.querySelectorAll('.sidebar-menu-item');
        
        // Инициализируем обработчики событий
        this.initEventListeners();
        
        // Устанавливаем активный пункт меню
        this.setActiveMenuItem(this.state.activeTab);
        
        console.log('Sidebar инициализирован');
    },
    
    // Инициализация обработчиков событий
    initEventListeners: function() {
        // Обработчик для кнопки гамбургера
        this.elements.hamburgerBtn.addEventListener('click', () => {
            this.openSidebar();
        });
        
        // Обработчик для кнопки закрытия
        this.elements.closeBtn.addEventListener('click', () => {
            this.closeSidebar();
        });
        
        // Обработчик для затемнения
        this.elements.overlay.addEventListener('click', () => {
            this.closeSidebar();
        });
        
        // Обработчики для пунктов меню
        this.elements.menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                this.setActiveMenuItem(tab);
                this.closeSidebar();
                
                // Переключаем библиотеку
                if (window.Library) {
                    Library.switchLibrary(tab);
                }
            });
        });
        
        // Обработчик для клавиши Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isOpen) {
                this.closeSidebar();
            }
        });
    },
    
    // Функция для открытия бокового меню
    openSidebar: function() {
        this.elements.sidebar.classList.add('open');
        this.elements.overlay.classList.add('show');
        this.state.isOpen = true;
        
        // Анимация иконки гамбургера
        this.elements.hamburgerBtn.innerHTML = '<i class="fas fa-times"></i>';
        
        // Блокируем прокрутку страницы
        document.body.style.overflow = 'hidden';
    },
    
    // Функция для закрытия бокового меню
    closeSidebar: function() {
        this.elements.sidebar.classList.remove('open');
        this.elements.overlay.classList.remove('show');
        this.state.isOpen = false;
        
        // Анимация иконки гамбургера
        this.elements.hamburgerBtn.innerHTML = '<i class="fas fa-bars"></i>';
        
        // Разблокируем прокрутку страницы
        document.body.style.overflow = '';
    },
    
    // Функция для установки активного пункта меню
    setActiveMenuItem: function(tab) {
        // Обновляем активный пункт меню
        this.elements.menuItems.forEach(item => {
            if (item.dataset.tab === tab) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Обновляем состояние
        this.state.activeTab = tab;
    },
    
    // Функция для обновления активного пункта меню извне
    updateActiveTab: function(tab) {
        this.setActiveMenuItem(tab);
    }
};

// Экспортируем модуль в глобальное пространство имен
window.Sidebar = Sidebar; 