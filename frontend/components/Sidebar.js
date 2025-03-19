import { useState, useEffect } from 'react';
import styles from '../styles/Sidebar.module.css';

const Sidebar = ({ onSearch, initialKeyword = '', initialRegion = 'jp', suggestions = [] }) => {
  const [searchKeyword, setSearchKeyword] = useState(initialKeyword);
  const [searchRegion, setSearchRegion] = useState(initialRegion);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  // 初期化時に検索履歴をローカルストレージから読み込む
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        // 重複を削除して最新の10件を取得
        const uniqueHistory = [...new Set(parsedHistory)].slice(0, 10);
        setSearchHistory(uniqueHistory);
      } catch (e) {
        console.error('検索履歴の読み込みに失敗しました', e);
        setSearchHistory([]);
      }
    }
  }, []);

  // キーワードが変更されたときの処理
  useEffect(() => {
    setSearchKeyword(initialKeyword);
  }, [initialKeyword]);
  
  // 地域が変更されたときの処理
  useEffect(() => {
    setSearchRegion(initialRegion);
  }, [initialRegion]);

  // 検索履歴に追加する関数
  const addToSearchHistory = (searchKeyword) => {
    // すでに同じキーワードが履歴にある場合は最新に更新するため一度削除
    const filteredHistory = searchHistory.filter(item => item !== searchKeyword);
    
    // 新しいキーワードを先頭に追加
    const newHistory = [searchKeyword, ...filteredHistory].slice(0, 10);
    
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // 検索の実行
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      onSearch(searchKeyword, searchRegion);
      addToSearchHistory(searchKeyword.trim());
    }
  };

  const handleHistoryClick = (historyKeyword) => {
    setSearchKeyword(historyKeyword);
    onSearch(historyKeyword, searchRegion);
  };

  // 履歴を消去する関数
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
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
  
  // よく検索されるキーワード（仮のデータ）
  const popularKeywords = [
    'WordPress SEO',
    'Google アルゴリズム',
    'SEO ツール',
    'タイトルタグ 最適化',
    'メタディスクリプション'
  ];

  return (
    <div className={styles.sidebar}>
      <h1 className={styles.logo}>SEOキーワードツール</h1>
      
      <div className={styles.sidebarSection}>
        <h3 className={styles.sidebarTitle}>キーワード検索</h3>
        <form onSubmit={handleSearch} className={styles.sidebarForm}>
          <div className={styles.formGroup}>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="キーワードを入力"
              className={styles.sidebarInput}
            />
          </div>
          <div className={styles.formGroup}>
            <select
              value={searchRegion}
              onChange={(e) => setSearchRegion(e.target.value)}
              className={styles.sidebarSelect}
            >
              <option value="jp">日本 (Google.co.jp)</option>
              <option value="us">アメリカ (Google.com)</option>
              <option value="uk">イギリス (Google.co.uk)</option>
            </select>
          </div>
          <button type="submit" className={styles.sidebarButton}>
            検索
          </button>
        </form>
      </div>
      
      {suggestions && suggestions.length > 0 && (
        <div className={styles.sidebarSection}>
          <h3 className={styles.sidebarTitle}>現在のキーワード案</h3>
          <ul className={styles.keywordList}>
            {suggestions.slice(0, 5).map((sugg, index) => (
              <li key={index} className={styles.keywordItem}>
                <button
                  className={styles.keywordButton}
                  onClick={() => onSearch(sugg.keyword, searchRegion)}
                >
                  {sugg.keyword}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 検索履歴セクション */}
      <div className={styles.sidebarSection}>
        <div className={styles.historyHeader}>
          <h3 className={styles.sidebarTitle}>検索履歴</h3>
          {searchHistory.length > 0 && (
            <button className={styles.clearButton} onClick={clearHistory}>
              消去
            </button>
          )}
        </div>
        
        {searchHistory.length === 0 ? (
          <p className={styles.emptyHistory}>検索履歴はありません</p>
        ) : (
          <ul className={styles.keywordList}>
            {searchHistory.map((historyKeyword, index) => (
              <li key={index} className={styles.keywordItem}>
                <button
                  className={styles.keywordButton}
                  onClick={() => handleHistoryClick(historyKeyword)}
                >
                  {historyKeyword}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className={styles.sidebarSection}>
        <h3 className={styles.sidebarTitle}>人気のキーワード</h3>
        <ul className={styles.keywordList}>
          {popularKeywords.map((keyword, index) => (
            <li key={index} className={styles.keywordItem}>
              <button
                className={styles.keywordButton}
                onClick={() => {
                  setSearchKeyword(keyword);
                  onSearch(keyword, searchRegion);
                }}
              >
                {keyword}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.instructions}>
        <h3 className={styles.sectionTitle}>使い方</h3>
        <p className={styles.instructionText}>
          1. 調査したいキーワードを入力<br />
          2. 必要に応じて詳細オプションを設定<br />
          3. 「検索」ボタンをクリック<br />
          4. Googleサジェストとロングテールキーワードが表示されます
        </p>
      </div>

      <div className={styles.sidebarFooter}>
        © 2025 SEOキーワードサジェストツール
      </div>
    </div>
  );
};

export default Sidebar; 