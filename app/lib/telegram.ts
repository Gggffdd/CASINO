// Расширяем существующий тип Telegram, а не переопределяем
import '@types/telegram-web-app';

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
  if (webApp.enableClosingConfirmation) {
    webApp.enableClosingConfirmation();
  }
  
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
  if (!webApp || !webApp.MainButton) return;
  
  webApp.MainButton.setText(text);
  webApp.MainButton.show();
  webApp.MainButton.onClick(onClick);
};

export const hideMainButton = () => {
  const webApp = getWebApp();
  webApp?.MainButton?.hide();
};

export const updateMainButton = (text: string, isEnabled: boolean = true) => {
  const webApp = getWebApp();
  if (!webApp || !webApp.MainButton) return;
  
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
  if (!webApp || !webApp.BackButton) return;
  
  webApp.BackButton.show();
  webApp.BackButton.onClick(onClick);
};

export const hideBackButton = () => {
  const webApp = getWebApp();
  webApp?.BackButton?.hide();
};

// Виброотклик
export const hapticImpact = (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  const webApp = getWebApp();
  webApp?.HapticFeedback?.impactOccurred(style);
};

export const hapticNotification = (type: 'error' | 'success' | 'warning' = 'success') => {
  const webApp = getWebApp();
  webApp?.HapticFeedback?.notificationOccurred(type);
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
