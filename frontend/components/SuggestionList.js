import { useState, useEffect } from 'react';
import styles from '../styles/SuggestionList.module.css';

const SuggestionList = ({ results, onKeywordSelect }) => {
  const [activeTab, setActiveTab] = useState('suggestions');
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [showAllAiSuggestions, setShowAllAiSuggestions] = useState(false);
  const [showAllLongTail, setShowAllLongTail] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState(null);
  
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

  // AI生成サジェストをロードする
  useEffect(() => {
    if (results && results.keyword && activeTab === 'aiSuggestions' && aiSuggestions.length === 0 && !isLoadingAi) {
      loadAiSuggestions(results.keyword);
    }
  }, [results, activeTab]);

  // AI生成サジェストを取得する関数
  const loadAiSuggestions = async (keyword) => {
    if (!keyword) return;
    
    setIsLoadingAi(true);
    setAiError(null);
    
    try {
      const encodedKeyword = encodeURIComponent(keyword);
      const response = await fetch(`${window.location.origin}/api/ai-suggestions?keyword=${encodedKeyword}`);
      
      if (!response.ok) {
        throw new Error('AI生成サジェストの取得に失敗しました');
      }
      
      const data = await response.json();
      setAiSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      setAiError(error.message || 'AI生成サジェストの取得中にエラーが発生しました');
    } finally {
      setIsLoadingAi(false);
    }
  };

  // 表示件数を制限（デフォルトは10件）
  const displaySuggestions = showAllSuggestions 
    ? suggestions 
    : suggestions.slice(0, 10);
    
  // AI生成サジェストの表示制限
  const displayAiSuggestions = showAllAiSuggestions 
    ? aiSuggestions 
    : aiSuggestions.slice(0, 10);
    
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
  
  // 検索ボリュームに基づくクラスを取得する関数
  const getVolumeClass = (volume, baseClass = '') => {
    if (volume === null || volume === undefined) return '';
    if (volume > 100000) return `${baseClass} highVolume`;
    if (volume > 10000) return `${baseClass} mediumVolume`;
    return baseClass;
  };
  
  return (
    <div className={styles.suggestionList}>
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'suggestions' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          <span className={styles.tabIcon}>✦</span>
          Google検索サジェスト ({suggestions.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'aiSuggestions' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('aiSuggestions')}
        >
          <span className={styles.tabIcon}>✧</span>
          AI提案 {aiSuggestions.length > 0 ? `(${aiSuggestions.length})` : ''}
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'longTail' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('longTail')}
        >
          <span className={styles.tabIcon}>✪</span>
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
                  className={`${styles.keywordItem} ${getVolumeClass(item.searchVolume, 'item')}`}
                  onClick={() => handleKeywordClick(item.keyword)}
                >
                  <div className={styles.keywordContent}>
                    <span className={styles.keyword}>{item.keyword}</span>
                  </div>
                  <div className={styles.keywordActions}>
                    <span className={`${styles.volume} ${getVolumeClass(item.searchVolume)}`}>
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
        ) : activeTab === 'aiSuggestions' ? (
          <>
            <div className={styles.explanationContainer}>
              <p className={styles.explanation}>
                AI生成による魅力的なキーワード候補です。検索意図に合わせた質の高い提案が含まれています。
                {aiSuggestions.length > 0 && (
                  <span className={styles.averageVolume}>
                    推定検索ボリューム: {Math.round(aiSuggestions.reduce((sum, item) => sum + item.searchVolume, 0) / aiSuggestions.length).toLocaleString()}
                  </span>
                )}
              </p>
              <div className={styles.toolBar}>
                {aiSuggestions.length > 0 && (
                  <span className={styles.resultCount}>{displayAiSuggestions.length}件表示 / 全{aiSuggestions.length}件</span>
                )}
              </div>
            </div>
            
            {isLoadingAi ? (
              <div className={styles.loading}>
                <div className={styles.loadingSpinner}></div>
                <p>AI提案を生成中...</p>
              </div>
            ) : aiError ? (
              <div className={styles.error}>
                <p>{aiError}</p>
                <button 
                  className={styles.retryButton}
                  onClick={() => loadAiSuggestions(results.keyword)}
                >
                  再試行
                </button>
              </div>
            ) : aiSuggestions.length === 0 ? (
              <div className={styles.noResults}>
                <p>まだAI提案はありません。「AI提案」タブを選択すると自動的に生成されます。</p>
                <button 
                  className={styles.generateButton}
                  onClick={() => loadAiSuggestions(results.keyword)}
                >
                  AI提案を生成
                </button>
              </div>
            ) : (
              <>
                <ul className={styles.keywords}>
                  {displayAiSuggestions.map((item, index) => (
                    <li 
                      key={index}
                      className={`${styles.keywordItem} ${styles.aiKeywordItem}`}
                      onClick={() => handleKeywordClick(item.keyword)}
                    >
                      <div className={styles.keywordContent}>
                        <span className={styles.keyword}>
                          {item.isAiGenerated && (
                            <span className={styles.aiIcon} title="AI生成">AI</span>
                          )}
                          {item.keyword}
                        </span>
                        {item.searchIntent && (
                          <span className={styles.searchIntent}>{item.searchIntent}</span>
                        )}
                      </div>
                      <div className={styles.keywordActions}>
                        <span className={`${styles.volume} ${getVolumeClass(item.searchVolume)}`}>
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
                {aiSuggestions.length > 10 && (
                  <div className={styles.showMoreContainer}>
                    <button 
                      className={styles.showMoreButton}
                      onClick={() => setShowAllAiSuggestions(!showAllAiSuggestions)}
                    >
                      {showAllAiSuggestions ? '表示を減らす ↑' : 'すべて表示 ↓'}
                    </button>
                  </div>
                )}
              </>
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
                  className={`${styles.keywordItem} ${getVolumeClass(item.searchVolume, 'item')}`}
                  onClick={() => handleKeywordClick(item.keyword)}
                >
                  <div className={styles.keywordContent}>
                    <span className={styles.keyword}>{item.keyword}</span>
                  </div>
                  <div className={styles.keywordActions}>
                    <span className={`${styles.volume} ${getVolumeClass(item.searchVolume)}`}>
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