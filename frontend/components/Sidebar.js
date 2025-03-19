import { useState, useEffect } from 'react';
import styles from '../styles/Sidebar.module.css';

const Sidebar = ({ onSearch, initialKeyword = '', initialRegion = 'jp' }) => {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [region, setRegion] = useState(initialRegion);
  const [searchHistory, setSearchHistory] = useState([]);

  // 初期化時に検索履歴をローカルストレージから読み込む
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('検索履歴の読み込みに失敗しました', e);
        setSearchHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    setKeyword(initialKeyword);
    
    // 検索キーワードが有効な場合、履歴に追加
    if (initialKeyword && initialKeyword.trim()) {
      addToSearchHistory(initialKeyword.trim());
    }
  }, [initialKeyword]);

  // 検索履歴に追加する関数
  const addToSearchHistory = (searchKeyword) => {
    // すでに同じキーワードが履歴にある場合は最新に更新するため一度削除
    const filteredHistory = searchHistory.filter(item => item !== searchKeyword);
    
    // 新しいキーワードを先頭に追加
    const newHistory = [searchKeyword, ...filteredHistory].slice(0, 10);
    
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSearch(keyword.trim(), region);
      addToSearchHistory(keyword.trim());
    }
  };

  const handleHistoryClick = (historyKeyword) => {
    setKeyword(historyKeyword);
    onSearch(historyKeyword, region);
  };

  const handleSampleKeywordClick = (sampleKeyword) => {
    setKeyword(sampleKeyword);
    onSearch(sampleKeyword.trim(), region);
    addToSearchHistory(sampleKeyword.trim());
  };

  // 履歴を消去する関数
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const sampleKeywords = [
    'SEO', 'マーケティング', 'プログラミング', 'Web制作',
    'AI', 'ブログ', 'YouTube', 'WordPress'
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>
        SEOキーワードツール
      </div>

      <div className={styles.searchContainer}>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="キーワードを入力"
              className={styles.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              required
            />
          </div>
          <div className={styles.toggleContainer}>
            <span className={styles.toggleLabel}>詳細オプション</span>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                className={styles.toggleInput}
                checked={showAdvanced}
                onChange={() => setShowAdvanced(!showAdvanced)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>

          {showAdvanced && (
            <div className={styles.advancedOptions}>
              <div className={styles.formGroup}>
                <label htmlFor="region">検索リージョン</label>
                <select
                  id="region"
                  className={styles.select}
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                >
                  <option value="jp">日本 (Google.co.jp)</option>
                  <option value="us">アメリカ (Google.com)</option>
                  <option value="uk">イギリス (Google.co.uk)</option>
                </select>
              </div>
            </div>
          )}

          <button type="submit" className={styles.searchButton} disabled={!keyword.trim()}>
            検索
          </button>
        </form>
      </div>

      {searchHistory.length > 0 && (
        <div className={styles.keywordSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>検索履歴</h3>
            <button 
              className={styles.clearHistoryButton}
              onClick={clearHistory}
              title="履歴を消去"
            >
              消去
            </button>
          </div>
          <div className={styles.keywordList}>
            {searchHistory.map((kw, index) => (
              <span
                key={`history-${index}`}
                className={`${styles.keywordTag} ${styles.historyTag}`}
                onClick={() => handleHistoryClick(kw)}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={styles.keywordSection}>
        <h3 className={styles.sectionTitle}>サンプルキーワード</h3>
        <div className={styles.keywordList}>
          {sampleKeywords.map((kw, index) => (
            <span
              key={index}
              className={styles.keywordTag}
              onClick={() => handleSampleKeywordClick(kw)}
            >
              {kw}
            </span>
          ))}
        </div>
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