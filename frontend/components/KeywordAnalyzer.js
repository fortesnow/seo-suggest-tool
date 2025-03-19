import React, { useState, useEffect } from 'react';
import styles from '../styles/KeywordAnalyzer.module.css';
import KeywordDifficultyAnalyzer from './KeywordDifficultyAnalyzer';
import KeywordClusterAnalyzer from './KeywordClusterAnalyzer';

const KeywordAnalyzer = ({ mainKeyword, relatedKeywords }) => {
  const [activeTab, setActiveTab] = useState('difficulty');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);

  const analyzeKeywords = async () => {
    if (!mainKeyword || !relatedKeywords || relatedKeywords.length === 0) {
      setError('分析するキーワードが指定されていません');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // APIを呼び出してキーワード分析を実行
      const response = await fetch('/api/keyword-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mainKeyword,
          relatedKeywords: relatedKeywords.map(kw => 
            typeof kw === 'string' ? kw : kw.keyword
          )
        }),
      });

      if (!response.ok) {
        throw new Error(`APIエラー (${response.status}): ${await response.text()}`);
      }

      const data = await response.json();
      
      if (data.isError) {
        throw new Error('APIレスポンスにエラーが含まれています。もう一度お試しください。');
      }
      
      setAnalysisResults(data);
    } catch (err) {
      console.error('キーワード分析中にエラーが発生しました:', err);
      setError(`分析に失敗しました: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // コンポーネントマウント時またはキーワードが変更された時に分析を実行
  useEffect(() => {
    if (mainKeyword && relatedKeywords && relatedKeywords.length > 0) {
      analyzeKeywords();
    }
  }, [mainKeyword]);

  // クラスター選択を処理
  const handleClusterSelect = (cluster) => {
    setSelectedCluster(cluster);
    
    // クラスターが選択されたら、タブを自動的に切り替える
    if (cluster && activeTab === 'difficulty') {
      setActiveTab('clustering');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>キーワード分析</h2>
        
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'difficulty' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('difficulty')}
          >
            難易度分析
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'clustering' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('clustering')}
          >
            クラスタリング
          </button>
        </div>
        
        {analysisResults && (
          <button 
            className={styles.refreshButton}
            onClick={analyzeKeywords}
            disabled={isLoading}
          >
            {isLoading ? '更新中...' : '分析を更新'}
          </button>
        )}
      </div>

      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>キーワードを分析中...</p>
          <p>難易度スコアの計算やクラスタリングを行っています。</p>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={analyzeKeywords}
          >
            再試行
          </button>
        </div>
      )}

      {!isLoading && !error && analysisResults && (
        <div className={styles.content}>
          {activeTab === 'difficulty' && (
            <KeywordDifficultyAnalyzer 
              analysisResults={analysisResults}
              selectedCluster={selectedCluster}
              onClusterSelect={handleClusterSelect}
            />
          )}
          
          {activeTab === 'clustering' && (
            <KeywordClusterAnalyzer 
              analysisResults={analysisResults}
              selectedCluster={selectedCluster}
              onClusterSelect={handleClusterSelect}
            />
          )}
        </div>
      )}
      
      {!isLoading && !error && !analysisResults && (
        <div className={styles.initialState}>
          <p>キーワード分析を実行するとキーワードの難易度スコアとクラスタリング結果が表示されます。</p>
          <button 
            className={styles.analyzeButton}
            onClick={analyzeKeywords}
          >
            分析を実行
          </button>
        </div>
      )}
    </div>
  );
};

export default KeywordAnalyzer;