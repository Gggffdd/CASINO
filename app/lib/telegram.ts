import WebApp from '@twa-dev/sdk';

// Инициализация WebApp
let isInitialized = false;

export const initTelegramWebApp = () => {
  if (typeof window === 'undefined') return;
  
  if (!isInitialized && WebApp.initDataUnsafe?.user) {
    WebApp.ready();
    WebApp.expand();
    WebApp.enableClosingConfirmation();
    isInitialized = true;
  }
  
  return WebApp;
};

// Хук для использования в компонентах
export const getTelegramUser = () => {
  if (typeof window === 'undefined') return null;
  
  const user = WebApp.initDataUnsafe?.user;
  if (!user) return null;
  
  return {
    id: user.id,
    username: user.username || `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`,
    firstName: user.first_name,
    lastName: user.last_name,
    languageCode: user.language_code,
    isPremium: user.is_premium || false,
  };
};

// Взаимодействие с главной кнопкой
export const showMainButton = (text: string, onClick: () => void) => {
  WebApp.MainButton.setText(text);
  WebApp.MainButton.show();
  WebApp.MainButton.onClick(onClick);
};

export const hideMainButton = () => {
  WebApp.MainButton.hide();
};

// Всплывающие окна
export const showAlert = (message: string) => {
  WebApp.showAlert(message);
};

export const showConfirm = (message: string, onOk: () => void) => {
  WebApp.showConfirm(message, (confirmed) => {
    if (confirmed) onOk();
  });
};

// Виброотклик
export const hapticImpact = (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  WebApp.HapticFeedback.impactOccurred(style);
};

export const hapticNotification = (type: 'error' | 'success' | 'warning' = 'success') => {
  WebApp.HapticFeedback.notificationOccurred(type);
};

// Закрытие приложения
export const closeTelegramApp = () => {
  WebApp.close();
};

// Получение данных для верификации бэкендом
export const getInitData = () => {
  return WebApp.initData;
};
