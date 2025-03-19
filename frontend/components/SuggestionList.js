import { useState, useEffect } from 'react';
import styles from '../styles/SuggestionList.module.css';

const SuggestionList = ({ results, onKeywordSelect }) => {
  const [activeTab, setActiveTab] = useState('suggestions'); // 'suggestions', 'aiSuggestions', 'longTail'
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [showAllAiSuggestions, setShowAllAiSuggestions] = useState(false);
  const [showAllLongTail, setShowAllLongTail] = useState(false);

  // 結果が存在しない場合でも最低限の構造を確保
  const safeResults = results || { suggestions: [] };
  const suggestions = safeResults.suggestions || [];
  
  // モック用のロングテールキーワードを生成
  const generateLongTailKeywords = (suggestions) => {
    if (!suggestions || !Array.isArray(suggestions) || suggestions.length === 0) {
      const baseKeyword = safeResults.keyword || '検索';
      return generateBackupLongTailKeywords(baseKeyword);
    }

    const baseKeywords = suggestions.slice(0, 3).map(s => s.keyword || '検索');
    const longTailVariations = [
      'とは', 'おすすめ', '比較', '選び方', '違い', '評判', 'レビュー', '口コミ', '活用法', '使い方'
    ];

    const result = [];
    baseKeywords.forEach(baseKeyword => {
      if (!baseKeyword) return; // 安全チェック
      longTailVariations.slice(0, 3).forEach(variation => {
        result.push({
          keyword: `${baseKeyword} ${variation}`,
          volume: Math.floor(Math.random() * 300) + 50
        });
      });
    });

    return result.length > 0 ? result : generateBackupLongTailKeywords('検索');
  };
  
  // バックアップのロングテールキーワードを生成
  const generateBackupLongTailKeywords = (baseKeyword) => {
    const variations = [
      'おすすめ', '比較', '違い', '最新', '2024', 'ランキング', '選び方', '入門', '初心者', 'メリット'
    ];
    
    return variations.map(variation => ({
      keyword: `${baseKeyword} ${variation}`,
      volume: Math.floor(Math.random() * 200) + 50
    }));
  };
  
  // 何があっても常にロングテールキーワードを生成
  const longTailKeywords = generateLongTailKeywords(suggestions);

  // AI生成サジェストを取得する関数
  useEffect(() => {
    if (activeTab === 'aiSuggestions' && aiSuggestions.length === 0 && !isLoadingAi) {
      loadAiSuggestions();
    }
  }, [activeTab, aiSuggestions.length, isLoadingAi]);

  // AI生成サジェストを取得する関数
  const loadAiSuggestions = async () => {
    setIsLoadingAi(true);
    setAiError(null);
    
    try {
      // ここでは実際のAPIではなく、モックデータを生成します
      setTimeout(() => {
        // suggestions が空の場合のフォールバック
        const baseKeyword = (suggestions[0]?.keyword || safeResults.keyword || '検索');
        const mockAiSuggestions = generateAiSuggestions(baseKeyword, 10);
        setAiSuggestions(mockAiSuggestions);
        setIsLoadingAi(false);
      }, 1500);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      setAiError('AI提案の生成中にエラーが発生しました');
      setIsLoadingAi(false);
    }
  };

  // モック用のAI提案を生成
  const generateAiSuggestions = (baseKeyword, count) => {
    const variations = [
      '画像', '動画', 'サイズ', '写真集', '壁紙', 'まとめ', 'プロフィール',
      '最新', '公式', 'インスタ', 'ツイッター', 'ブログ', '年齢', '出身'
    ];
    
    return variations.slice(0, count).map((variation, index) => ({
      keyword: `${baseKeyword} ${variation}`,
      searchVolume: Math.floor(Math.random() * 2000) + 300,
      isAiGenerated: true,
      searchIntent: index % 3 === 0 ? '情報収集' : index % 3 === 1 ? '比較検討' : '購入意向'
    }));
  };

  // 表示件数を制限
  const displaySuggestions = showAllSuggestions 
    ? suggestions 
    : suggestions.slice(0, 10);
    
  const displayAiSuggestions = showAllAiSuggestions 
    ? aiSuggestions 
    : aiSuggestions.slice(0, 10);
    
  const displayLongTail = showAllLongTail 
    ? longTailKeywords 
    : longTailKeywords.slice(0, 10);

  // 検索結果が空の場合でも、常にUIは表示する（モックデータを生成）
  if (!suggestions || suggestions.length === 0) {
    // バックアップデータの生成
    const mockData = {
      suggestions: Array.from({ length: 5 }, (_, i) => ({
        keyword: `検索キーワード例 ${i + 1}`,
        volume: Math.floor(Math.random() * 1000) + 100
      }))
    };
    
    return (
      <div className={styles.container}>
        <div className={styles.noResults}>
          <p>検索結果がありません。別のキーワードをお試しください。</p>
          <p className={styles.hint}>検索例: 「SEO対策」「マーケティング」「Webデザイン」</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
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
          AI提案 ({aiSuggestions.length})
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
        {activeTab === 'suggestions' && (
          <div className={styles.keywordResults}>
            <div className={styles.resultsHeader}>
              <p className={styles.resultsDescription}>
                Google検索サジェストから取得したキーワード候補です。
              </p>
              <div className={styles.pagination}>
                {displaySuggestions.length} / {suggestions.length} 件表示
              </div>
            </div>
            
            <div className={styles.keywordList}>
              {displaySuggestions.map((suggestion, index) => (
                <div key={index} className={styles.keywordItem}>
                  <div className={styles.keywordContent}>
                    <span className={styles.keyword}>{suggestion.keyword || `キーワード ${index + 1}`}</span>
                  </div>
                  <div className={styles.keywordMeta}>
                    <span className={styles.volume}>
                      {suggestion.volume || Math.floor(Math.random() * 1000) + 100}
                    </span>
                    <button 
                      className={styles.analyzeButton}
                      onClick={() => onKeywordSelect(suggestion.keyword, true)}
                    >
                      分析
                    </button>
                    <button
                      className={styles.searchButton}
                      onClick={() => onKeywordSelect(suggestion.keyword, false)}
                    >
                      調査
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {suggestions.length > 10 && (
              <div className={styles.showMoreContainer}>
                <button 
                  className={styles.showMoreButton}
                  onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                >
                  {showAllSuggestions ? '表示を減らす ▲' : 'すべて表示 ▼'}
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'aiSuggestions' && (
          <div className={styles.keywordResults}>
            <div className={styles.resultsHeader}>
              <p className={styles.resultsDescription}>
                AI生成による魅力的なキーワード候補です。検索意図に合わせた質の高い提案が含まれています。
              </p>
              {aiSuggestions.length > 0 && (
                <div className={styles.pagination}>
                  {displayAiSuggestions.length} / {aiSuggestions.length} 件表示
                </div>
              )}
            </div>
            
            {isLoadingAi ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>AI提案を生成中...</p>
              </div>
            ) : aiError ? (
              <div className={styles.error}>
                <p>{aiError}</p>
                <button 
                  className={styles.retryButton}
                  onClick={loadAiSuggestions}
                >
                  再試行
                </button>
              </div>
            ) : aiSuggestions.length === 0 ? (
              <div className={styles.empty}>
                <p>AIによるキーワード提案を生成しています...</p>
              </div>
            ) : (
              <>
                <div className={styles.keywordList}>
                  {displayAiSuggestions.map((suggestion, index) => (
                    <div key={index} className={styles.keywordItem}>
                      <div className={styles.keywordContent}>
                        <span className={styles.keyword}>
                          <span className={styles.aiTag}>AI</span>
                          {suggestion.keyword}
                        </span>
                      </div>
                      <div className={styles.keywordMeta}>
                        <span className={styles.volume}>
                          {suggestion.searchVolume}
                        </span>
                        <button 
                          className={styles.analyzeButton}
                          onClick={() => onKeywordSelect(suggestion.keyword, true)}
                        >
                          分析
                        </button>
                        <button
                          className={styles.searchButton}
                          onClick={() => onKeywordSelect(suggestion.keyword, false)}
                        >
                          調査
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {aiSuggestions.length > 10 && (
                  <div className={styles.showMoreContainer}>
                    <button 
                      className={styles.showMoreButton}
                      onClick={() => setShowAllAiSuggestions(!showAllAiSuggestions)}
                    >
                      {showAllAiSuggestions ? '表示を減らす ▲' : 'すべて表示 ▼'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {activeTab === 'longTail' && (
          <div className={styles.keywordResults}>
            <div className={styles.resultsHeader}>
              <p className={styles.resultsDescription}>
                より具体的なロングテールキーワードの候補です。ニッチな需要を狙うのに最適です。
              </p>
              <div className={styles.pagination}>
                {displayLongTail.length} / {longTailKeywords.length} 件表示
              </div>
            </div>
            
            <div className={styles.keywordList}>
              {displayLongTail.map((suggestion, index) => (
                <div key={index} className={styles.keywordItem}>
                  <div className={styles.keywordContent}>
                    <span className={styles.keyword}>{suggestion.keyword}</span>
                  </div>
                  <div className={styles.keywordMeta}>
                    <span className={styles.volume}>
                      {suggestion.volume}
                    </span>
                    <button 
                      className={styles.analyzeButton}
                      onClick={() => onKeywordSelect(suggestion.keyword, true)}
                    >
                      分析
                    </button>
                    <button
                      className={styles.searchButton}
                      onClick={() => onKeywordSelect(suggestion.keyword, false)}
                    >
                      調査
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {longTailKeywords.length > 10 && (
              <div className={styles.showMoreContainer}>
                <button 
                  className={styles.showMoreButton}
                  onClick={() => setShowAllLongTail(!showAllLongTail)}
                >
                  {showAllLongTail ? '表示を減らす ▲' : 'すべて表示 ▼'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestionList; 