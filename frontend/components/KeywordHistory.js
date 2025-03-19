import React, { useState, useEffect } from 'react';
import styles from '../styles/KeywordHistory.module.css';

const KeywordHistory = ({ onKeywordSelect }) => {
  const [searchHistory, setSearchHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化時に検索履歴をローカルストレージから読み込む
  useEffect(() => {
    const loadHistory = () => {
      try {
        const savedHistory = localStorage.getItem('searchHistory');
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory);
          // 重複を削除して最新の20件を取得
          const uniqueHistory = [...new Set(parsedHistory)].slice(0, 20);
          setSearchHistory(uniqueHistory);
        }
      } catch (error) {
        console.error('検索履歴の読み込みに失敗しました:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  // 履歴をクリア
  const clearHistory = () => {
    try {
      localStorage.removeItem('searchHistory');
      setSearchHistory([]);
    } catch (error) {
      console.error('検索履歴のクリアに失敗しました:', error);
    }
  };

  // 履歴アイテムをクリック
  const handleHistoryClick = (keyword) => {
    if (onKeywordSelect && typeof onKeywordSelect === 'function') {
      onKeywordSelect(keyword);
    }
  };

  // 履歴アイテムを削除
  const removeHistoryItem = (e, keyword) => {
    e.stopPropagation();
    
    try {
      const updatedHistory = searchHistory.filter(kw => kw !== keyword);
      setSearchHistory(updatedHistory);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('検索履歴の削除に失敗しました:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>履歴を読み込み中...</p>
      </div>
    );
  }

  if (searchHistory.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>検索履歴はありません</p>
        <p className={styles.emptyStateSubtext}>
          キーワードを検索すると、ここに履歴が表示されます
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.historyCount}>
          {searchHistory.length}件の検索履歴
        </p>
        <button 
          className={styles.clearButton}
          onClick={clearHistory}
        >
          すべて削除
        </button>
      </div>
      
      <div className={styles.historyList}>
        {searchHistory.map((keyword, index) => (
          <div 
            key={`history-${index}`} 
            className={styles.historyItem}
            onClick={() => handleHistoryClick(keyword)}
          >
            <span className={styles.keyword}>{keyword}</span>
            <button 
              className={styles.removeButton}
              onClick={(e) => removeHistoryItem(e, keyword)}
              title="この履歴を削除"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      
      <div className={styles.helpText}>
        <p>キーワードをクリックすると、そのキーワードで検索します</p>
      </div>
    </div>
  );
};

export default KeywordHistory; 