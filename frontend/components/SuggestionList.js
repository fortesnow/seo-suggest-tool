import { useState } from 'react';
import styles from '../styles/SuggestionList.module.css';

const SuggestionList = ({ results, onKeywordSelect }) => {
  const [activeTab, setActiveTab] = useState('suggestions');
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [showAllLongTail, setShowAllLongTail] = useState(false);
  
  // 表示する結果がない場合
  if (!results) return null;
  
  const { suggestions = [], longTailKeywords = [] } = results;
  
  // サジェストが空の場合
  if (suggestions.length === 0 && longTailKeywords.length === 0) {
    return (
      <div className={styles.noResults}>
        <p>サジェストが見つかりませんでした。別のキーワードで試してみてください。</p>
      </div>
    );
  }

  // 表示件数を制限（デフォルトは10件）
  const displaySuggestions = showAllSuggestions 
    ? suggestions 
    : suggestions.slice(0, 10);
    
  const displayLongTail = showAllLongTail 
    ? longTailKeywords 
    : longTailKeywords.slice(0, 10);
  
  // キーワードをクリックしたときの処理
  const handleKeywordClick = (keyword) => {
    if (onKeywordSelect) {
      onKeywordSelect(keyword);
    }
  };
  
  // 分析ボタンをクリックしたときの処理
  const handleAnalyzeClick = (event, keyword) => {
    // イベントの伝播を停止
    event.stopPropagation();
    
    // 分析用の関数を呼び出す
    if (onKeywordSelect) {
      onKeywordSelect(keyword, true); // 第2引数をtrueにして分析モードを示す
    }
  };
  
  return (
    <div className={styles.suggestionList}>
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'suggestions' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          <span className={styles.tabIcon}>✦</span>
          サジェスト ({suggestions.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'longTail' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('longTail')}
        >
          <span className={styles.tabIcon}>✧</span>
          ロングテール ({longTailKeywords.length})
        </button>
      </div>
      
      <div className={styles.tabContent}>
        {activeTab === 'suggestions' ? (
          <>
            <div className={styles.explanationContainer}>
              <p className={styles.explanation}>
                よく検索されるキーワード候補です。クリックして検索できます。
                <span className={styles.averageVolume}>
                  平均検索ボリューム: {results.averageSearchVolume?.toLocaleString() || '不明'}
                </span>
              </p>
              <div className={styles.toolBar}>
                <span className={styles.resultCount}>{displaySuggestions.length}件表示 / 全{suggestions.length}件</span>
              </div>
            </div>
            <ul className={styles.keywords}>
              {displaySuggestions.map((item, index) => (
                <li 
                  key={index}
                  className={styles.keywordItem}
                  onClick={() => handleKeywordClick(item.keyword)}
                >
                  <span className={styles.keyword}>{item.keyword}</span>
                  <div className={styles.keywordActions}>
                    <span className={styles.volume}>
                      {item.searchVolume ? item.searchVolume.toLocaleString() : '0'}
                    </span>
                    <button 
                      className={styles.analyzeButton}
                      onClick={(e) => handleAnalyzeClick(e, item.keyword)}
                      title="このキーワードを分析"
                    >
                      分析
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {suggestions.length > 10 && (
              <div className={styles.showMoreContainer}>
                <button 
                  className={styles.showMoreButton}
                  onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                >
                  {showAllSuggestions ? '表示を減らす ↑' : 'すべて表示 ↓'}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className={styles.explanationContainer}>
              <p className={styles.explanation}>
                より具体的なロングテールキーワードの候補です。
                <span className={styles.averageVolume}>
                  平均検索ボリューム: {results.longTailAverageSearchVolume?.toLocaleString() || '不明'}
                </span>
              </p>
              <div className={styles.toolBar}>
                <span className={styles.resultCount}>{displayLongTail.length}件表示 / 全{longTailKeywords.length}件</span>
              </div>
            </div>
            <ul className={styles.keywords}>
              {displayLongTail.map((item, index) => (
                <li 
                  key={index} 
                  className={styles.keywordItem}
                  onClick={() => handleKeywordClick(item.keyword)}
                >
                  <span className={styles.keyword}>{item.keyword}</span>
                  <div className={styles.keywordActions}>
                    <span className={styles.volume}>
                      {item.searchVolume ? item.searchVolume.toLocaleString() : '0'}
                    </span>
                    <button 
                      className={styles.analyzeButton}
                      onClick={(e) => handleAnalyzeClick(e, item.keyword)}
                      title="このキーワードを分析"
                    >
                      分析
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {longTailKeywords.length > 10 && (
              <div className={styles.showMoreContainer}>
                <button 
                  className={styles.showMoreButton}
                  onClick={() => setShowAllLongTail(!showAllLongTail)}
                >
                  {showAllLongTail ? '表示を減らす ↑' : 'すべて表示 ↓'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SuggestionList; 