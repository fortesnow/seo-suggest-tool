import { useState } from 'react';
import styles from '../styles/SuggestionList.module.css';

const SuggestionList = ({ results, onKeywordSelect }) => {
  const [activeTab, setActiveTab] = useState('suggestions');
  
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
          サジェスト ({suggestions.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'longTail' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('longTail')}
        >
          ロングテール ({longTailKeywords.length})
        </button>
      </div>
      
      <div className={styles.tabContent}>
        {activeTab === 'suggestions' ? (
          <>
            <p className={styles.explanation}>
              よく検索されるキーワード候補です。クリックして検索できます。
              <span className={styles.averageVolume}>
                平均検索ボリューム: {results.averageSearchVolume?.toLocaleString() || '不明'}
              </span>
            </p>
            <ul className={styles.keywords}>
              {suggestions.map((item, index) => (
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
          </>
        ) : (
          <>
            <p className={styles.explanation}>
              より具体的なロングテールキーワードの候補です。
              <span className={styles.averageVolume}>
                平均検索ボリューム: {results.longTailAverageSearchVolume?.toLocaleString() || '不明'}
              </span>
            </p>
            <ul className={styles.keywords}>
              {longTailKeywords.map((item, index) => (
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
          </>
        )}
      </div>
    </div>
  );
};

export default SuggestionList; 