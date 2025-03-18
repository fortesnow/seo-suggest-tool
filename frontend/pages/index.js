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
      // キーワードを適切にエンコード
      let normalizedKeyword = searchKeyword.trim();
      let encodedKeyword = '';
      
      // すでにエンコードされている場合はデコードしてから再エンコード（二重エンコードを防止）
      try {
        if (normalizedKeyword.includes('%')) {
          normalizedKeyword = decodeURIComponent(normalizedKeyword);
        }
        // 日本語などの非ASCII文字を適切に処理
        encodedKeyword = encodeURIComponent(normalizedKeyword);
      } catch (e) {
        console.error('キーワードエンコード中にエラーが発生しました:', e);
        encodedKeyword = encodeURIComponent(searchKeyword.trim());
      }
      
      console.log('検索キーワード:', searchKeyword);
      console.log('正規化後:', normalizedKeyword);
      console.log('エンコード後:', encodedKeyword);
      
      // 完全なURLを構築（ローカル環境とVercel環境の両方で動作するように）
      const apiUrl = `${window.location.origin}/api/suggestions?keyword=${encodedKeyword}&region=${searchRegion}`;
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`サーバーからのレスポンスにエラーがありました (${response.status})`);
      }
      
      // レスポンスヘッダーを確認
      const contentType = response.headers.get('content-type');
      console.log('レスポンスタイプ:', contentType);
      
      const data = await response.json();
      console.log('検索結果データ:', data);
      
      // データ内の文字列を確認してエンコードされているものがあれば修正
      if (data.suggestions) {
        data.suggestions = data.suggestions.map(item => ({
          ...item,
          keyword: ensureCorrectEncoding(item.keyword)
        }));
      }
      
      if (data.longTailKeywords) {
        data.longTailKeywords = data.longTailKeywords.map(item => ({
          ...item,
          keyword: ensureCorrectEncoding(item.keyword)
        }));
      }
      
      setResults(data);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError(err.message || 'キーワード候補の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  // 文字列のエンコーディングを修正する関数
  const ensureCorrectEncoding = (str) => {
    if (!str) return '';
    
    try {
      // 文字化けの代表的な文字を検出
      if (str.includes('\uFFFD') || /%.{2}/.test(str)) {
        // エンコードされている可能性がある
        return decodeURIComponent(str);
      }
      return str;
    } catch (e) {
      console.error('文字列処理エラー:', e);
      return str;
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