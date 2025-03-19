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
  
  // 結果が存在しない場合
  if (!results || !results.suggestions || results.suggestions.length === 0) {
    return (
      <div className={styles.noResults}>
        検索結果がありません。別のキーワードをお試しください。
      </div>
    );
  }

  // 結果が存在する場合
  const { suggestions } = results;
  
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>検索サジェスト結果</h2>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.keywordColumn}>キーワード</th>
              <th className={styles.volumeColumn}>検索ボリューム</th>
              <th className={styles.actionColumn}>アクション</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((suggestion, index) => (
              <tr key={index} className={styles.tableRow}>
                <td className={styles.keywordCell}>
                  {suggestion.keyword}
                </td>
                <td className={styles.volumeCell}>
                  <div className={styles.volumeBar}>
                    <div 
                      className={styles.volumeFill}
                      style={{ width: `${Math.min(100, suggestion.volume / 50)}%` }}
                    ></div>
                  </div>
                  <span className={styles.volumeValue}>{suggestion.volume}</span>
                </td>
                <td className={styles.actionCell}>
                  <button 
                    className={styles.analyzeButton}
                    onClick={() => onKeywordSelect(suggestion.keyword, true)}
                    title="このキーワードの潜在・顕在ニーズを分析"
                  >
                    分析
                  </button>
                  <button 
                    className={styles.searchButton}
                    onClick={() => onKeywordSelect(suggestion.keyword, false)}
                    title="このキーワードで検索"
                  >
                    検索
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuggestionList; 