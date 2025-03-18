import { useState } from 'react';
import styles from '../styles/NeedsAnalysis.module.css';

const NeedsAnalysis = ({ keyword }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        throw new Error('分析中にエラーが発生しました');
      }
      
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      console.error('Error analyzing keyword:', err);
      setError(err.message || '分析中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 分析結果をセクションに分割する
  const formatAnalysis = (text) => {
    if (!text) return [];
    
    // 改行で分割し、空行や不要な空白を取り除く
    const lines = text.split('\n').filter(line => line.trim());
    
    // セクション別に整理
    const sections = {
      顕在ニーズ: '',
      潜在ニーズ: '',
      ターゲットユーザー: '',
      コンテンツ提案: ''
    };
    
    let currentSection = '';
    
    lines.forEach(line => {
      // セクションのヘッダーを検出
      if (line.includes('顕在ニーズ:')) {
        currentSection = '顕在ニーズ';
        sections[currentSection] = line.replace('- 顕在ニーズ:', '').trim();
      } else if (line.includes('潜在ニーズ:')) {
        currentSection = '潜在ニーズ';
        sections[currentSection] = line.replace('- 潜在ニーズ:', '').trim();
      } else if (line.includes('ターゲットユーザー:')) {
        currentSection = 'ターゲットユーザー';
        sections[currentSection] = line.replace('- ターゲットユーザー:', '').trim();
      } else if (line.includes('コンテンツ提案:')) {
        currentSection = 'コンテンツ提案';
        sections[currentSection] = line.replace('- コンテンツ提案:', '').trim();
      } else if (currentSection) {
        // 現在のセクションに内容を追加
        sections[currentSection] += ' ' + line.trim();
      }
    });
    
    return sections;
  };

  return (
    <div className={styles.needsAnalysis}>
      <div className={styles.needsHeader}>
        <h3>キーワードニーズ分析</h3>
        <button 
          className={styles.analyzeButton}
          onClick={analyzeKeyword}
          disabled={loading || !keyword}
        >
          {loading ? '分析中...' : 'AIで分析'}
        </button>
      </div>
      
      {error && (
        <div className={styles.error}>{error}</div>
      )}
      
      {loading && (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <span>AIでキーワードを分析中...</span>
        </div>
      )}
      
      {analysis && !loading && (
        <div className={styles.analysisResults}>
          {Object.entries(formatAnalysis(analysis)).map(([section, content]) => (
            <div key={section} className={styles.analysisSection}>
              <h4>{section}</h4>
              <p>{content || '情報なし'}</p>
            </div>
          ))}
        </div>
      )}
      
      {!analysis && !loading && (
        <div className={styles.placeholder}>
          <p>「AIで分析」ボタンをクリックして、キーワード「{keyword || ''}」のユーザーニーズを分析してください。</p>
        </div>
      )}
    </div>
  );
};

export default NeedsAnalysis; 