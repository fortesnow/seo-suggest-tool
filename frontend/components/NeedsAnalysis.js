import { useState, useEffect } from 'react';
import styles from '../styles/NeedsAnalysis.module.css';

const NeedsAnalysis = ({ keyword, autoAnalyze = false }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(autoAnalyze);

  // キーワードが変更されたときに分析を実行
  useEffect(() => {
    if (keyword && isVisible && !analysis) {
      analyzeKeyword();
    }
  }, [keyword, isVisible]);
  
  // 自動分析モードが変更されたときに可視性を更新
  useEffect(() => {
    setIsVisible(autoAnalyze);
  }, [autoAnalyze]);
  
  // キーワード分析を実行する関数
  const analyzeKeyword = async () => {
    if (!keyword) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/analyze-needs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword }),
      });
      
      if (!response.ok) {
        throw new Error('分析APIからのレスポンスにエラーがありました');
      }
      
      const data = await response.json();
      
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        throw new Error(data.error || 'データ形式が無効です');
      }
    } catch (err) {
      console.error('キーワード分析中にエラーが発生しました:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 可視性を切り替える関数
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    
    // 初めて表示される場合かつ分析がまだの場合は分析を実行
    if (!isVisible && !analysis && !loading) {
      analyzeKeyword();
    }
  };
  
  // 分析結果を整形する関数
  const formatAnalysis = (text) => {
    if (!text) return '';
    
    // 行分割
    const lines = text.split('\n');
    
    // HTMLに変換
    return lines.map((line, index) => {
      if (line.trim() === '') return <br key={index} />;
      
      // 「- 」などの箇条書きを検出
      if (line.trim().startsWith('- ')) {
        return <li key={index}>{line.trim().substring(2)}</li>;
      }
      
      // 「顕在ニーズ:」などのラベルを検出
      const labelMatch = line.match(/^(顕在ニーズ|潜在ニーズ|ターゲットユーザー|コンテンツ提案):\s*(.+)$/i);
      if (labelMatch) {
        return (
          <div key={index} className={styles.analysisItem}>
            <strong className={styles.analysisLabel}>{labelMatch[1]}:</strong>
            <span className={styles.analysisContent}>{labelMatch[2]}</span>
          </div>
        );
      }
      
      return <p key={index}>{line}</p>;
    });
  };
  
  if (!keyword) {
    return null;
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          キーワード分析
          {keyword && <span className={styles.keyword}>「{keyword}」</span>}
        </h2>
        <button 
          className={styles.toggleButton}
          onClick={toggleVisibility}
        >
          {isVisible ? '閉じる ▲' : '表示 ▼'}
        </button>
      </div>
      
      {isVisible && (
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>分析中...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <p>エラー: {error}</p>
              <button 
                className={styles.retryButton}
                onClick={analyzeKeyword}
              >
                再試行
              </button>
            </div>
          ) : analysis ? (
            <div className={styles.analysisResult}>
              {formatAnalysis(analysis)}
            </div>
          ) : (
            <div className={styles.empty}>
              <p>「分析」ボタンをクリックすると、このキーワードの潜在・顕在ニーズを分析します。</p>
              <button 
                className={styles.analyzeButton}
                onClick={analyzeKeyword}
              >
                分析を実行
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NeedsAnalysis; 