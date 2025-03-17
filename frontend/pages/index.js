import { useState, useEffect } from 'react';
import axios from 'axios';
import Head from 'next/head';
import SearchForm from '../components/SearchForm';
import SuggestionList from '../components/SuggestionList';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [googleSuggestions, setGoogleSuggestions] = useState([]);
  const [error, setError] = useState('');
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
    setError('');
    
    try {
      // Googleサジェストの取得
      const googleResponse = await axios.get(`${API_URL}/api/suggestions?keyword=${encodeURIComponent(keyword)}`);
      setGoogleSuggestions(googleResponse.data.suggestions || []);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('キーワード取得中にエラーが発生しました。しばらく経ってからお試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>SEO検索サジェストツール</title>
        <meta name="description" content="Googleの検索サジェストキーワードを取得するツール" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>SEO検索サジェストツール</h1>
        
        <p className={styles.description}>
          Googleの検索サジェストキーワードを取得できます
        </p>
        
        <SearchForm onSearch={fetchSuggestions} />
        
        {error && <p className={styles.error}>{error}</p>}
        
        {loading ? (
          <p className={styles.loading}>キーワードを取得中...</p>
        ) : (
          keyword && (
            <div className={styles.results}>
              <div className={styles.resultSection}>
                <h2>Google検索サジェスト</h2>
                <SuggestionList suggestions={googleSuggestions} keyword={keyword} />
              </div>
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