import { useState, useEffect } from 'react';
import styles from '../styles/NeedsAnalysis.module.css';

const NeedsAnalysis = ({ keyword, autoAnalyze = false }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  // キーワードが変更されたり、autoAnalyzeがtrueになったりした時に自動分析
  useEffect(() => {
    if (autoAnalyze && keyword) {
      analyzeKeyword();
    }
  }, [keyword, autoAnalyze]);

  const analyzeKeyword = async () => {
    if (!keyword) return;
    
    setLoading(true);
    setError(null);
    setAnalysis(null);
    
    try {
      const apiUrl = `/api/analyze-needs`;
      console.log(`Sending analysis request to: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword }),
      });
      
      // APIのレスポンスをログに記録（デバッグ用）
      console.log('API Response status:', response.status);
      console.log('Response content type:', response.headers.get('content-type'));
      
      // レスポンスが正常でない場合
      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        
        console.log('API error details:', errorData);
        
        // APIキーが設定されていないというエラーの場合は特別な処理
        if (errorData.apiKeySet === false) {
          setApiKeyMissing(false);  // Renderバックエンドに移行したので不要
        }
        
        throw new Error(errorData.error || `サーバーエラー (${response.status})`);
      }
      
      const data = await response.json();
      
      // デバッグ用：レスポンスデータの構造を詳細に記録
      console.log('Analysis result received. Data type:', typeof data);
      console.log('Data structure:', JSON.stringify(data).substring(0, 100) + '...');
      if (data.analysis) {
        console.log('Analysis type:', typeof data.analysis);
        console.log('Analysis preview:', typeof data.analysis === 'string' 
          ? data.analysis.substring(0, 50) + '...' 
          : 'Not a string');
      }
      
      if (data.success === false) {
        throw new Error(data.error || 'キーワード分析に失敗しました');
      }
      
      setAnalysis(data);
    } catch (error) {
      console.error('Error analyzing keyword:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 分析結果をセクションに分割する
  const formatAnalysis = (analysisData) => {
    if (!analysisData) return {};
    
    // 返されたデータの形式を確認
    // analysisDataがオブジェクトの場合、そのanalysisプロパティを取得
    let text = '';
    
    if (typeof analysisData === 'object') {
      // analysisDataがオブジェクトの場合（バックエンドからの直接レスポンス）
      text = analysisData.analysis;
    } else {
      // 既に文字列の場合（レガシーフォーマット向け）
      text = analysisData;
    }
    
    // textが文字列でない場合、空のオブジェクトを返す
    if (typeof text !== 'string') {
      console.error('Analysis text is not a string:', typeof text, text);
      return {
        顕在ニーズ: '分析結果の形式が不正です',
        潜在ニーズ: '',
        ターゲットユーザー: '',
        コンテンツ提案: ''
      };
    }
    
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