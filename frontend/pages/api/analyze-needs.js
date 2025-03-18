import { GoogleGenerativeAI } from '@google/generative-ai';

// 環境変数からAPIキーを取得
// Vercel環境でも環境変数を正しく取得できるようにする
const API_KEY = process.env.GEMINI_API_KEY || '';

// デバッグ用にAPI KEY長さのログを出力（セキュリティのためにキー自体は表示しない）
console.log(`[DEBUG] API_KEY exists: ${Boolean(API_KEY)}, length: ${API_KEY ? API_KEY.length : 0}`);

if (!API_KEY) {
  console.warn('警告: GEMINI_API_KEY環境変数が設定されていません。Gemini APIは動作しません。');
}

// Gemini APIの初期化（APIキーがある場合のみ）
let genAI = null;
try {
  if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log('Gemini API client initialized successfully');
  }
} catch (e) {
  console.error('Failed to initialize Gemini API client:', e);
}

// モック応答（APIキーが機能しない場合のフォールバック）
const mockAnalysis = {
  generateMockResponse: (keyword) => {
    return `
- 顕在ニーズ: "${keyword}"に関する情報や解決策の探索
- 潜在ニーズ: 時間や手間の節約、専門知識へのアクセス、自信を持って決断するための情報収集
- ターゲットユーザー: ${keyword}について知識を深めたい初心者から中級者、具体的な問題解決を求めるユーザー
- コンテンツ提案: ハウツーガイド、チュートリアル、事例紹介、比較記事、FAQ、基本概念の解説
`;
  }
};

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONSリクエストの場合は早期リターン
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'メソッドが許可されていません' });
  }

  // リクエストボディがない場合のエラー処理
  if (!req.body) {
    return res.status(400).json({ error: 'リクエストボディがありません' });
  }

  const { keyword } = req.body;

  if (!keyword) {
    return res.status(400).json({ error: 'キーワードは必須です' });
  }

  try {
    console.log(`Analyzing keyword: "${keyword}" via Render API`);

    // Renderバックエンドへリクエストを転送する
    // 環境に基づいてバックエンドURLを設定
    const backendUrl = process.env.NODE_ENV === 'production'
      ? 'https://seo-suggest-tool.onrender.com/api/analyze-needs'
      : 'http://localhost:5000/api/analyze-needs';

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keyword }),
      timeout: 15000, // タイムアウトを15秒に設定
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `バックエンドAPIから${response.status}エラーが返されました`);
    }

    const data = await response.json();
    
    console.log('Analysis result received from backend');
    
    // 正しいレスポンスヘッダーを設定
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error analyzing needs:', error);
    
    // エラータイプに基づく適切なメッセージ
    let errorMessage = 'ニーズ分析中にエラーが発生しました';
    let statusCode = 500;
    
    if (error.message?.includes('timeout')) {
      errorMessage = 'バックエンドAPIリクエストがタイムアウトしました。後でもう一度お試しください';
      statusCode = 504;
    } else if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
      errorMessage = 'バックエンドAPIに接続できません。インターネット接続を確認してください';
      statusCode = 503;
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      message: error.message || 'APIエラー',
      success: false
    });
  }
} 