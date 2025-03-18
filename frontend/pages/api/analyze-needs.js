import { GoogleGenerativeAI } from '@google/generative-ai';

// 環境変数からAPIキーを取得
// Vercel環境でも環境変数を正しく取得できるようにする
const API_KEY = process.env.GEMINI_API_KEY || '';

if (!API_KEY) {
  console.warn('警告: GEMINI_API_KEY環境変数が設定されていません。Gemini APIは動作しません。');
}

// Gemini APIの初期化（APIキーがある場合のみ）
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

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

  console.log('Request body:', req.body);
  
  const { keyword } = req.body;

  if (!keyword) {
    return res.status(400).json({ error: 'キーワードは必須です' });
  }

  // APIキーが設定されていない場合
  if (!API_KEY || !genAI) {
    console.error('Gemini API key is missing or invalid');
    return res.status(503).json({ 
      error: 'Gemini APIサービスは現在利用できません',
      suggestion: '環境変数 GEMINI_API_KEY を設定してください',
      apiKeySet: false
    });
  }

  try {
    console.log(`Analyzing keyword: "${keyword}" with Gemini API`);
    
    // Gemini APIを使用してニーズ分析
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
    以下のキーワードについて、SEO視点から潜在ニーズと顕在ニーズを分析してください:
    
    キーワード: "${keyword}"
    
    以下の形式で回答してください:
    - 顕在ニーズ: [明示的に表現されている検索意図]
    - 潜在ニーズ: [検索の背景にある可能性が高い隠れたニーズや悩み]
    - ターゲットユーザー: [このキーワードを検索しそうなユーザー像]
    - コンテンツ提案: [このキーワードに効果的に対応するコンテンツの種類]
    
    簡潔に、箇条書きで各項目100文字以内で回答してください。
    `;
    
    // 安全装置として、10秒のタイムアウトを設定
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API request timeout')), 10000);
    });
    
    // Gemini APIリクエストを実行
    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ]);
    
    if (!result || !result.response) {
      throw new Error('Gemini APIからの応答が空です');
    }
    
    const response = result.response;
    const text = response.text();
    
    console.log('Analysis result length:', text.length);
    
    // 正しいレスポンスヘッダーを設定
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    res.status(200).json({
      keyword,
      analysis: text,
      success: true
    });
  } catch (error) {
    console.error('Error analyzing needs:', error);
    
    // エラータイプに基づく適切なメッセージ
    let errorMessage = 'ニーズ分析中にエラーが発生しました';
    let statusCode = 500;
    
    if (error.message?.includes('API key not valid')) {
      errorMessage = 'APIキーが無効です';
      statusCode = 403;
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'API要求がタイムアウトしました。後でもう一度お試しください';
      statusCode = 504;
    } else if (error.message?.includes('rate limit')) {
      errorMessage = 'API制限に達しました。しばらく待ってからもう一度お試しください';
      statusCode = 429;
    } else if (error.name === 'AbortError') {
      errorMessage = 'リクエストがキャンセルされました';
      statusCode = 499;
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      message: error.message || 'APIエラー',
      success: false
    });
  }
} 