import { Globe, Moon, Settings, Sun, Trash2, X } from 'lucide-react';
import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { connectionStorage } from '../../services/connectionStorage';
import { navigationHistoryService } from '../../services/navigationHistory';
import { settingsStorage } from '../../services/settingsStorage';
import { showToast } from '../../utils/clipboard';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [usePureBlackBg, setUsePureBlackBg] = useState(() =>
    settingsStorage.getSetting('usePureBlackBg')
  );
  const [isClearingCache, setIsClearingCache] = useState(false);
  // 切换纯黑色背景
  const handlePureBlackBgToggle = () => {
    const newValue = !usePureBlackBg;
    setUsePureBlackBg(newValue);
    settingsStorage.updateSetting('usePureBlackBg', newValue);

    // 立即应用主题变化
    const root = window.document.documentElement;
    if (newValue && root.classList.contains('dark')) {
      root.classList.add('pure-black-bg');
    } else {
      root.classList.remove('pure-black-bg');
    }
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      // 清理导航历史缓存
      navigationHistoryService.clearHistory();
      navigationHistoryService.clearScrollPositions();
      navigationHistoryService.clearDirectoryCache();

      // 清理保存的连接
      connectionStorage.clearAllConnections();

      // 清理其他本地存储缓存（不清理用户设置）
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('cache') || key.includes('temp') || key.includes('history'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // 不重置用户设置，保持当前状态

      console.log('Cache cleared successfully');
      showToast(t('cache.cleared.success'), 'success');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      showToast(t('cache.clear.failed'), 'error');
    } finally {
      setIsClearingCache(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('settings')}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Theme Settings */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {t('settings.theme')}
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[
                { value: 'light', labelKey: 'theme.light', icon: Sun },
                { value: 'dark', labelKey: 'theme.dark', icon: Moon },
                { value: 'system', labelKey: 'theme.system', icon: Settings },
              ].map(({ value, labelKey, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value as any)}
                  className={`flex flex-col items-center justify-center space-y-1.5 px-3 py-2 rounded-lg transition-colors ${
                    theme === value
                      ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                      : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{t(labelKey)}</span>
                </button>
              ))}
            </div>
            {/* 纯黑色背景开关 */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">{t('pure.black.bg')}</span>
              <button
                onClick={handlePureBlackBgToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  usePureBlackBg ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    usePureBlackBg ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Language Settings */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {t('settings.language')}
            </h3>
            <div className="space-y-3">
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {t('language.description')}
              </p>
              <button
                onClick={() => {
                  const newLang = i18n.language === 'zh' ? 'en' : 'zh';
                  i18n.changeLanguage(newLang);
                  // 保存语言设置到持久化存储
                  settingsStorage.updateSetting('language', newLang);
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm">
                  {t('language.switch.to')}
                  {i18n.language === 'zh' ? t('language.english') : t('language.chinese')}
                </span>
              </button>
            </div>
          </div>

          {/* Cache Management */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {t('settings.cache')}
            </h3>
            <div className="space-y-3">
              <p className="text-xs text-gray-600 dark:text-gray-300">{t('cache.description')}</p>
              <button
                onClick={handleClearCache}
                disabled={isClearingCache}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className={`w-4 h-4 ${isClearingCache ? 'animate-pulse' : ''}`} />
                <span className="text-sm">
                  {isClearingCache ? t('clearing.cache') : t('clear.cache')}
                </span>
              </button>
            </div>
          </div>

          {/* About */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">{t('about')}</h3>
            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <div>{t('app.name')}</div>
              <div>{t('app.description')}</div>
              <div>{t('app.features')}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-600 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
          >
            {t('ok')}
          </button>
        </div>
      </div>
    </div>
  );
};
