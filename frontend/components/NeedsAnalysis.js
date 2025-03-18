import { useState } from 'react';
import styles from '../styles/NeedsAnalysis.module.css';

const NeedsAnalysis = ({ keyword }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  const analyzeKeyword = async () => {
    if (!keyword) return;
    
    setLoading(true);
    setError(null);
    setApiKeyMissing(false);
    
    try {
      console.log('Analyzing keyword:', keyword);
      const response = await fetch('/api/analyze-needs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword }),
      });
      
      // レスポンスの詳細をログに出力
      console.log('API Response status:', response.status);
      
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);
      
      if (!response.ok) {
        // エラーレスポンスの詳細を取得
        const errorData = await response.json();
        console.error('API error details:', errorData);
        
        // 環境変数未設定エラーの特殊処理
        if (response.status === 503 && errorData.suggestion && errorData.suggestion.includes('GEMINI_API_KEY')) {
          setApiKeyMissing(true);
          throw new Error('APIキーが設定されていません。管理者に連絡してください。');
        }
        
        throw new Error(errorData.error || '分析中にエラーが発生しました');
      }
      
      const data = await response.json();
      console.log('Analysis result received:', data);
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
    if (!text) return {};
    
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
        sections[currentSection] = line.replace(/^.*顕在ニーズ:/, '').trim();
      } else if (line.includes('潜在ニーズ:')) {
        currentSection = '潜在ニーズ';
        sections[currentSection] = line.replace(/^.*潜在ニーズ:/, '').trim();
      } else if (line.includes('ターゲットユーザー:')) {
        currentSection = 'ターゲットユーザー';
        sections[currentSection] = line.replace(/^.*ターゲットユーザー:/, '').trim();
      } else if (line.includes('コンテンツ提案:')) {
        currentSection = 'コンテンツ提案';
        sections[currentSection] = line.replace(/^.*コンテンツ提案:/, '').trim();
      } else if (currentSection) {
        // 現在のセクションに内容を追加
        sections[currentSection] += ' ' + line.trim();
      }
    });
    
    return sections;
  };

  // APIキーがない場合の説明用コンポーネント
  const ApiKeyMissingInfo = () => (
    <div className={styles.apiKeyMissing}>
      <h4>Gemini API機能が無効です</h4>
      <p>
        この機能を使用するには、管理者がVercel環境変数に<code>GEMINI_API_KEY</code>を設定する必要があります。
        <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
        でAPIキーを取得し、Vercelプロジェクト設定で環境変数として追加してください。
      </p>
    </div>
  );

  return (
    <div className={styles.needsAnalysis}>
      <div className={styles.needsHeader}>
        <h3>キーワードニーズ分析</h3>
        <button 
          className={styles.analyzeButton}
          onClick={analyzeKeyword}
          disabled={loading || !keyword || apiKeyMissing}
        >
          {loading ? '分析中...' : 'AIで分析'}
        </button>
      </div>
      
      {/* APIキー未設定の場合の警告表示 */}
      {apiKeyMissing && <ApiKeyMissingInfo />}
      
      {error && !apiKeyMissing && (
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.fallbackNote}>
            <strong>代替策:</strong> Vercel環境でGemini APIキーを設定するか、
            一時的なデモ表示としてモックデータを使用できます。
          </p>
        </div>
      )}
      
      {loading && (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <span>AIでキーワードを分析中...</span>
        </div>
      )}
      
      {analysis && !loading && (
        <div className={styles.analysisResults}>
          {analysis.isMock || analysis.isFallback ? (
            <div className={styles.mockNotice}>
              <p>※ この結果はデモ表示です。実際のAI分析ではありません。</p>
              {analysis.originalError && (
                <p className={styles.errorInfo}>元のエラー: {analysis.originalError}</p>
              )}
            </div>
          ) : null}
          
          {Object.entries(formatAnalysis(analysis)).map(([section, content]) => (
            content ? (
              <div key={section} className={styles.analysisSection}>
                <h4>{section}</h4>
                <p>{content}</p>
              </div>
            ) : null
          ))}
        </div>
      )}
      
      {!analysis && !loading && !error && !apiKeyMissing && (
        <div className={styles.placeholder}>
          <p>「AIで分析」ボタンをクリックして、キーワード「{keyword || ''}」のユーザーニーズを分析してください。</p>
        </div>
      )}
    </div>
  );
};

export default NeedsAnalysis; 