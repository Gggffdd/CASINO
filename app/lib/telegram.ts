// Типы для Telegram WebApp
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
          };
          chat?: {
            id: number;
            type: string;
          };
          auth_date?: number;
          hash?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        showPopup: (params: {
          title?: string;
          message: string;
          buttons?: { id?: string; type?: string; text?: string }[];
        }, callback?: (buttonId: string) => void) => void;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color: string;
          text_color: string;
          hint_color: string;
          link_color: string;
          button_color: string;
          button_text_color: string;
          secondary_bg_color: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        platform: string;
        version: string;
      };
    };
  }
}

// Получение объекта WebApp
export const getWebApp = () => {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp;
};

// Инициализация
export const initTelegramWebApp = () => {
  const webApp = getWebApp();
  if (!webApp) return null;
  
  webApp.ready();
  webApp.expand();
  webApp.enableClosingConfirmation();
  
  return webApp;
};

// Получение данных пользователя
export const getTelegramUser = () => {
  const webApp = getWebApp();
  if (!webApp) return null;
  
  const user = webApp.initDataUnsafe?.user;
  if (!user) return null;
  
  return {
    id: user.id,
    username: user.username || `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`,
    firstName: user.first_name,
    lastName: user.last_name,
    languageCode: user.language_code || 'en',
    isPremium: user.is_premium || false,
  };
};

// Получение initData для бэкенда
export const getInitData = () => {
  const webApp = getWebApp();
  return webApp?.initData || '';
};

// Главная кнопка
export const showMainButton = (text: string, onClick: () => void) => {
  const webApp = getWebApp();
  if (!webApp) return;
  
  webApp.MainButton.setText(text);
  webApp.MainButton.show();
  webApp.MainButton.onClick(onClick);
};

export const hideMainButton = () => {
  const webApp = getWebApp();
  webApp?.MainButton.hide();
};

export const updateMainButton = (text: string, isEnabled: boolean = true) => {
  const webApp = getWebApp();
  if (!webApp) return;
  
  webApp.MainButton.setText(text);
  if (isEnabled) {
    webApp.MainButton.enable();
  } else {
    webApp.MainButton.disable();
  }
};

// Кнопка назад
export const showBackButton = (onClick: () => void) => {
  const webApp = getWebApp();
  if (!webApp) return;
  
  webApp.BackButton.show();
  webApp.BackButton.onClick(onClick);
};

export const hideBackButton = () => {
  const webApp = getWebApp();
  webApp?.BackButton.hide();
};

// Виброотклик
export const hapticImpact = (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  const webApp = getWebApp();
  webApp?.HapticFeedback.impactOccurred(style);
};

export const hapticNotification = (type: 'error' | 'success' | 'warning' = 'success') => {
  const webApp = getWebApp();
  webApp?.HapticFeedback.notificationOccurred(type);
};

// Уведомления
export const showAlert = (message: string, callback?: () => void) => {
  const webApp = getWebApp();
  webApp?.showAlert(message, callback);
};

export const showConfirm = (message: string, callback?: (confirmed: boolean) => void) => {
  const webApp = getWebApp();
  webApp?.showConfirm(message, callback);
};

// Закрытие
export const closeApp = () => {
  const webApp = getWebApp();
  webApp?.close();
};

// Получение темы
export const getColorScheme = (): 'light' | 'dark' => {
  const webApp = getWebApp();
  return webApp?.colorScheme || 'dark';
};

// Расширение на весь экран
export const expandApp = () => {
  const webApp = getWebApp();
  webApp?.expand();
};
