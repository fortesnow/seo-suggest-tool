import { useState, useEffect } from 'react';
import styles from '../styles/Sidebar.module.css';

const Sidebar = ({ onSearch, initialKeyword = '', initialRegion = 'jp' }) => {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [region, setRegion] = useState(initialRegion);

  useEffect(() => {
    setKeyword(initialKeyword);
  }, [initialKeyword]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSearch(keyword.trim(), region);
    }
  };

  const handleSampleKeywordClick = (sampleKeyword) => {
    setKeyword(sampleKeyword);
    onSearch(sampleKeyword.trim(), region);
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