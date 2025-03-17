import styles from '../styles/SuggestionList.module.css';

const SuggestionList = ({ suggestions, keyword }) => {
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

  return (
    <ul className={styles.suggestionList}>
      {suggestions.map((suggestion, index) => (
        <li key={index} className={styles.suggestionItem}>
          {highlightKeyword(suggestion, keyword)}
        </li>
      ))}
    </ul>
  );
};

export default SuggestionList; 