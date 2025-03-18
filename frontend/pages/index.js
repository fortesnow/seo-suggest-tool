import { useState, useEffect } from 'react';
import axios from 'axios';
import Head from 'next/head';
import SearchForm from '../components/SearchForm';
import SuggestionList from '../components/SuggestionList';
import styles from '../styles/Home.module.css';
import Sidebar from '../components/Sidebar';
import NeedsAnalysis from '../components/NeedsAnalysis';

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [region, setRegion] = useState('jp');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSuggestions = async (searchKeyword, searchRegion) => {
    setLoading(true);
    setError(null);
    
    try {
      const encodedKeyword = encodeURIComponent(searchKeyword.trim());
      const response = await fetch(`/api/suggestions?keyword=${encodedKeyword}&region=${searchRegion}`);
      
      if (!response.ok) {
        throw new Error('サーバーからのレスポンスにエラーがありました');
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError(err.message || 'キーワード候補の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchKeyword, searchRegion) => {
    if (!searchKeyword.trim()) return;
    
    setKeyword(searchKeyword);
    setRegion(searchRegion);
    fetchSuggestions(searchKeyword, searchRegion);
  };

  // サンプルキーワードのクリックハンドラ
  const handleSampleKeywordClick = (sampleKeyword) => {
    setKeyword(sampleKeyword);
    fetchSuggestions(sampleKeyword, region);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>SEOキーワードサジェストツール</title>
        <meta name="description" content="Googleのサジェストキーワードを取得するツール" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Sidebar 
        onSearch={handleSearch} 
        initialKeyword={keyword}
        initialRegion={region}
      />

      <main className={styles.main}>
        <div className={styles.mainContent}>
          <div className={styles.header}>
            <h1 className={styles.title}>SEOキーワードサジェストツール</h1>
            <p className={styles.description}>
              検索キーワードを入力して、潜在的なSEOキーワードを見つけましょう
            </p>
          </div>

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}></div>
              <span>キーワード候補を取得中...</span>
            </div>
          ) : (
            results && (
              <>
                <div className={styles.results}>
                  <div className={styles.resultSection}>
                    <div className={styles.resultHeader}>
                      <h2>Googleサジェスト</h2>
                    </div>
                    <div className={styles.resultBody}>
                      {results?.suggestions?.length > 0 ? (
                        <>
                          <div className={styles.statsRow}>
                            <div className={styles.statCard}>
                              <div className={styles.statValue}>{results.suggestions.length}</div>
                              <div className={styles.statLabel}>提案数</div>
                            </div>
                            <div className={styles.statCard}>
                              <div className={styles.statValue}>{results.averageSearchVolume || "N/A"}</div>
                              <div className={styles.statLabel}>平均検索ボリューム</div>
                            </div>
                          </div>
                          <ul>
                            {results.suggestions.map((suggestion, index) => (
                              <li key={index}>
                                {suggestion.keyword} 
                                {suggestion.searchVolume && (
                                  <span style={{ color: '#666', fontSize: '0.85em', marginLeft: '8px' }}>
                                    ({suggestion.searchVolume}/月)
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <div className={styles.noResults}>サジェストが見つかりませんでした</div>
                      )}
                    </div>
                  </div>

                  <div className={styles.resultSection}>
                    <div className={styles.resultHeader}>
                      <h2>関連ロングテールキーワード</h2>
                    </div>
                    <div className={styles.resultBody}>
                      {results?.longTailKeywords?.length > 0 ? (
                        <>
                          <div className={styles.statsRow}>
                            <div className={styles.statCard}>
                              <div className={styles.statValue}>{results.longTailKeywords.length}</div>
                              <div className={styles.statLabel}>提案数</div>
                            </div>
                            <div className={styles.statCard}>
                              <div className={styles.statValue}>{results.longTailAverageSearchVolume || "N/A"}</div>
                              <div className={styles.statLabel}>平均検索ボリューム</div>
                            </div>
                          </div>
                          <ul>
                            {results.longTailKeywords.map((keyword, index) => (
                              <li key={index}>
                                {keyword.keyword}
                                {keyword.searchVolume && (
                                  <span style={{ color: '#666', fontSize: '0.85em', marginLeft: '8px' }}>
                                    ({keyword.searchVolume}/月)
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <div className={styles.noResults}>関連キーワードが見つかりませんでした</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ニーズ分析セクション */}
                <NeedsAnalysis keyword={keyword} />
              </>
            )
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© 2025 SEOキーワードサジェストツール</p>
      </footer>
    </div>
  );
} 