import { useState } from 'react';
import styles from '../styles/SearchForm.module.css';

const SearchForm = ({ onSearch }) => {
  const [keyword, setKeyword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSearch(keyword);
    }
  };

  return (
    <form className={styles.searchForm} onSubmit={handleSubmit}>
      <div className={styles.inputGroup}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="キーワードを入力..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          required
        />
        <button type="submit" className={styles.searchButton}>
          検索
        </button>
      </div>
    </form>
  );
};

export default SearchForm; 