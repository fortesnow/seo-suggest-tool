import styles from '../styles/SuggestionList.module.css';

const SuggestionList = ({ suggestions, keyword, showVolume = false }) => {
  if (!suggestions || suggestions.length === 0) {
    return <p className={styles.noResults}>サジェストが見つかりませんでした</p>;
  }

  // キーワードを強調表示する関数
  const highlightKeyword = (text, keyword) => {
    if (!keyword) return text;
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.split(regex).map((part, i) => {
      if (part.toLowerCase() === keyword.toLowerCase()) {
        return <span key={i} className={styles.highlight}>{part}</span>;
      }
      return part;
    });
  };

  // 検索ボリュームのフォーマット
  const formatVolume = (volume) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume;
  };

  return (
    <ul className={styles.suggestionList}>
      {suggestions.map((suggestion, index) => {
        // 新しいAPIレスポース形式（オブジェクト）と古い形式（文字列）の両方に対応
        const keyword = typeof suggestion === 'object' ? suggestion.keyword : suggestion;
        const volume = typeof suggestion === 'object' ? suggestion.volume : null;
        
        return (
          <li key={index} className={styles.suggestionItem}>
            <div className={styles.suggestionContent}>
              <span className={styles.suggestionText}>
                {highlightKeyword(keyword, keyword)}
              </span>
              {showVolume && volume !== null && (
                <span className={styles.volumeBadge} title="推定月間検索ボリューム">
                  {formatVolume(volume)}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default SuggestionList; 