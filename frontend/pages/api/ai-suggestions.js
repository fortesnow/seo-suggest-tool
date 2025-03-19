import { GoogleGenerativeAI } from '@google/generative-ai';

// 環境変数からAPIキーを取得
const API_KEY = process.env.GEMINI_API_KEY || '';

// デバッグ用にAPI KEY長さのログを出力（セキュリティのためにキー自体は表示しない）
console.log(`[AI-SUGGESTIONS] API_KEY exists: ${Boolean(API_KEY)}, length: ${API_KEY ? API_KEY.length : 0}`);

if (!API_KEY) {
  console.warn('警告: GEMINI_API_KEY環境変数が設定されていません。魅力的なサジェスト生成は動作しません。');
}

// Gemini APIの初期化（APIキーがある場合のみ）
let genAI = null;
try {
  if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log('Gemini API client initialized successfully for AI suggestions');
  }
} catch (e) {
  console.error('Failed to initialize Gemini API client for AI suggestions:', e);
}

// モックサジェスト（APIキーが機能しない場合のフォールバック）
const mockSuggestions = (keyword) => {
  // キーワードに基づいたモックデータを生成
  const baseKeywords = [
    `${keyword} おすすめ`,
    `${keyword} 比較`,
    `${keyword} メリット`,
    `${keyword} 活用法`,
    `${keyword} ランキング`,
    `${keyword} 初心者向け`,
    `${keyword} プロ向け`,
    `${keyword} 最新情報`,
    `${keyword} 選び方`,
    `${keyword} トレンド`
  ];
  
  // 各キーワードに検索ボリュームを設定
  return baseKeywords.map(kw => ({
    keyword: kw,
    searchVolume: Math.floor(Math.random() * 5000) + 500,
    isAiGenerated: true
  }));
};

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONSリクエストの場合は早期リターン
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GETとPOSTの両方を許可
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'メソッドが許可されていません' });
  }

  // キーワードの取得（GETとPOSTの両方に対応）
  let keyword = '';
  
  if (req.method === 'GET') {
    keyword = req.query.keyword;
  } else if (req.method === 'POST') {
    keyword = req.body.keyword;
  }

  if (!keyword) {
    return res.status(400).json({ error: 'キーワードは必須です' });
  }

  console.log(`[AI-SUGGESTIONS] Generating AI suggestions for keyword: "${keyword}"`);

  try {
    // APIキーがない場合はモックデータを返す
    if (!API_KEY || !genAI) {
      console.log('[AI-SUGGESTIONS] No API key, returning mock data');
      return res.status(200).json({
        keyword,
        suggestions: mockSuggestions(keyword),
        isMock: true
      });
    }

    // Gemini APIを使用して魅力的なキーワードを生成
    try {
      console.log('[AI-SUGGESTIONS] Creating Gemini model instance');
      // 適切なGemini APIモデルを使用
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `
      あなたはSEOとキーワードリサーチの専門家です。以下のキーワードに関連する高需要の検索キーワード候補を生成してください:
      
      キーワード: "${keyword}"
      
      以下の条件を満たす検索キーワードを10個生成してください:
      1. 実際のユーザーが検索する可能性が高く、検索ボリュームが見込めるキーワード
      2. 様々な検索意図（調査型、購入型、問題解決型など）をカバーする
      3. 競合性と実用性のバランスが取れている
      4. 自然な日本語で、実際の検索クエリとして使われそうなフレーズ
      5. 主要なキーワードだけでなく、ニッチでも検索需要のある関連キーワードも含める
      
      各キーワードには、概算の月間検索ボリュームと検索意図も付けてください。
      
      出力は以下のJSON形式で返してください:
      [
        {
          "keyword": "キーワード1",
          "searchVolume": 推定検索ボリューム数値,
          "searchIntent": "検索意図（調査/購入/解決など）"
        },
        ...
      ]
      
      追加の説明は不要です。JSONのみを返してください。
      `;
      
      console.log('[AI-SUGGESTIONS] Sending request to Gemini API...');

      // タイムアウト設定（10秒）
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API request timeout')), 10000);
      });

      // Gemini APIリクエストを実行
      const result = await Promise.race([
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
        timeoutPromise
      ]);

      console.log('[AI-SUGGESTIONS] Gemini API request completed');

      if (!result || !result.response) {
        throw new Error('Gemini APIからの応答が空です');
      }

      // レスポンステキストを取得
      const responseText = result.response.text();
      console.log('[AI-SUGGESTIONS] Raw response:', responseText.substring(0, 200));

      // JSON配列を抽出するための正規表現パターン
      const jsonPattern = /\[\s*\{.*\}\s*\]/s;
      const match = responseText.match(jsonPattern);

      let aiSuggestions = [];
      if (match) {
        try {
          // JSON配列を解析
          const parsedSuggestions = JSON.parse(match[0]);
          
          // 必要なプロパティを確認して抽出
          aiSuggestions = parsedSuggestions.map(item => ({
            keyword: item.keyword || '',
            searchVolume: item.searchVolume || generateSearchVolume(item.keyword || ''),
            searchIntent: item.searchIntent || '情報収集',
            isAiGenerated: true
          }));
        } catch (jsonError) {
          console.error('[AI-SUGGESTIONS] JSON parse error:', jsonError);
          // フォールバック：一般的な区切り文字で分割
          aiSuggestions = responseText
            .replace(/[\[\]{}"\s]/g, '')
            .split(/,\s*keyword:/)
            .filter(item => item.trim().length > 0)
            .map(item => ({
              keyword: item.split(',')[0].trim(),
              searchVolume: Math.floor(Math.random() * 5000) + 500,
              searchIntent: '情報収集',
              isAiGenerated: true
            }));
        }
      } else {
        // 行ごとに分割する代替手段
        const lines = responseText.split('\n');
        const keywordRegex = /"keyword":\s*"([^"]+)"/;
        const volumeRegex = /"searchVolume":\s*(\d+)/;
        const intentRegex = /"searchIntent":\s*"([^"]+)"/;
        
        for (const line of lines) {
          const keywordMatch = line.match(keywordRegex);
          if (keywordMatch) {
            const keyword = keywordMatch[1];
            
            // 検索ボリューム
            let searchVolume = generateSearchVolume(keyword);
            const volumeMatch = line.match(volumeRegex);
            if (volumeMatch) {
              searchVolume = parseInt(volumeMatch[1]) || searchVolume;
            }
            
            // 検索意図
            let searchIntent = '情報収集';
            const intentMatch = line.match(intentRegex);
            if (intentMatch) {
              searchIntent = intentMatch[1];
            }
            
            aiSuggestions.push({
              keyword,
              searchVolume,
              searchIntent,
              isAiGenerated: true
            });
          }
        }
        
        // 最大10件に制限
        aiSuggestions = aiSuggestions.slice(0, 10);
      }

      console.log('[AI-SUGGESTIONS] Parsed suggestions:', aiSuggestions);

      // 検索ボリュームが含まれていない場合は追加
      const suggestionsWithVolume = aiSuggestions.map(item => ({
        ...item,
        searchVolume: item.searchVolume || generateSearchVolume(item.keyword),
        searchIntent: item.searchIntent || '情報収集'
      }));

      // レスポンスヘッダーを設定
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      
      return res.status(200).json({
        keyword,
        suggestions: suggestionsWithVolume
      });
    } catch (apiError) {
      console.error('[AI-SUGGESTIONS] Error in Gemini API call:', apiError);
      
      // モックレスポンスでフォールバック
      return res.status(200).json({
        keyword,
        suggestions: mockSuggestions(keyword),
        isFallback: true,
        error: apiError.message
      });
    }
  } catch (error) {
    console.error('[AI-SUGGESTIONS] Error generating suggestions:', error);
    res.status(500).json({ 
      error: 'AI提案キーワードの生成中にエラーが発生しました',
      message: error.message
    });
  }
}

// 検索ボリュームをシミュレートする関数
function generateSearchVolume(keyword) {
  // キーワードの長さに基づいて検索ボリュームを生成
  const words = keyword.split(' ');
  const baseVolume = Math.floor(Math.random() * 8000) + 2000;
  
  // 単語数が多いほど検索ボリュームは減少（ロングテールになるほど検索数が減る傾向を模倣）
  const volumeReduction = Math.pow(0.8, words.length);
  
  return Math.floor(baseVolume * volumeReduction);
} 