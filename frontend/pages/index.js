import { useState, useEffect } from 'react';
import axios from 'axios';
import Head from 'next/head';
import SearchForm from '../components/SearchForm';
import SuggestionList from '../components/SuggestionList';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [longTailLoading, setLongTailLoading] = useState(false);
  const [googleSuggestions, setGoogleSuggestions] = useState([]);
  const [longTailSuggestions, setLongTailSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [longTailError, setLongTailError] = useState('');
  const [keyword, setKeyword] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // サーバーを活性状態に保つための定期的なping
  useEffect(() => {
    const keepAliveInterval = setInterval(() => {
      axios.get(`${API_URL}/health`)
        .then(() => console.log('API is active'))
        .catch(err => console.error('API ping failed', err));
    }, 600000); // 10分ごと

    return () => clearInterval(keepAliveInterval);
  }, [API_URL]);

  const fetchSuggestions = async (keyword) => {
    if (!keyword.trim()) return;
    
    setKeyword(keyword);
    setLoading(true);
    setLongTailLoading(true);
    setError('');
    setLongTailError('');
    
    try {
      // Googleサジェストの取得
      const googleResponse = await axios.get(`${API_URL}/api/suggestions?keyword=${encodeURIComponent(keyword)}`);
      setGoogleSuggestions(googleResponse.data.suggestions || []);
      
      // ロングテールキーワードの取得
      const longTailResponse = await axios.get(`${API_URL}/api/longtail-suggestions?keyword=${encodeURIComponent(keyword)}`);
      setLongTailSuggestions(longTailResponse.data.suggestions || []);
      setLongTailLoading(false);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('キーワード取得中にエラーが発生しました。しばらく経ってからお試しください。');
      setLongTailError('ロングテールキーワード取得中にエラーが発生しました。');
      setLongTailLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>SEO検索サジェストツール</title>
        <meta name="description" content="Googleの検索サジェストキーワードと検索ボリュームを取得するツール" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>SEO検索サジェストツール</h1>
        
        <p className={styles.description}>
          Googleの検索サジェストキーワードと検索ボリュームを取得できます
        </p>
        
        <SearchForm onSearch={fetchSuggestions} />
        
        {error && <p className={styles.error}>{error}</p>}
        
        {loading ? (
          <p className={styles.loading}>キーワードを取得中...</p>
        ) : (
          keyword && (
            <div className={styles.results}>
              <div className={styles.resultSection}>
                <h2>Google検索サジェスト（検索ボリューム付き）</h2>
                <SuggestionList suggestions={googleSuggestions} keyword={keyword} showVolume={true} />
              </div>
              
              {longTailLoading ? (
                <div className={styles.resultSection}>
                  <h2>ロングテールキーワード（3語以上）</h2>
                  <p className={styles.loading}>ロングテールキーワードを取得中...</p>
                </div>
              ) : longTailError ? (
                <div className={styles.resultSection}>
                  <h2>ロングテールキーワード（3語以上）</h2>
                  <p className={styles.error}>{longTailError}</p>
                </div>
              ) : (
                <div className={styles.resultSection}>
                  <h2>ロングテールキーワード（3語以上）</h2>
                  {longTailSuggestions.length > 0 ? (
                    <SuggestionList suggestions={longTailSuggestions} keyword={keyword} showVolume={true} />
                  ) : (
                    <p className={styles.noResults}>3語以上のロングテールキーワードが見つかりませんでした</p>
                  )}
                </div>
              )}
            </div>
          )
        )}
      </main>

      <footer className={styles.footer}>
        <p>SEO検索サジェストツール &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
} 