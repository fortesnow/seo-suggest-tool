import { GoogleGenerativeAI } from '@google/generative-ai';

// 環境変数からAPIキーを取得
// 実際の利用時には、環境変数にAPI_KEYを設定する必要があります
const API_KEY = process.env.GEMINI_API_KEY || 'YOUR_API_KEY';

// Gemini APIの初期化
const genAI = new GoogleGenerativeAI(API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'メソッドが許可されていません' });
  }

  const { keyword } = req.body;

  if (!keyword) {
    return res.status(400).json({ error: 'キーワードは必須です' });
  }

  try {
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
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    res.status(200).json({
      keyword,
      analysis: text
    });
  } catch (error) {
    console.error('Error analyzing needs:', error);
    res.status(500).json({ error: 'ニーズ分析中にエラーが発生しました' });
  }
} 