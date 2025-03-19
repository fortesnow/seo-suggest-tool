import { GoogleGenerativeAI } from '@google/generative-ai';

// 環境変数からAPIキーを取得
const API_KEY = process.env.GEMINI_API_KEY || '';

// デバッグ用にAPI KEY長さのログを出力（セキュリティのためにキー自体は表示しない）
console.log(`[AI-LONGTAIL] API_KEY exists: ${Boolean(API_KEY)}, length: ${API_KEY ? API_KEY.length : 0}`);

if (!API_KEY) {
  console.warn('警告: GEMINI_API_KEY環境変数が設定されていません。AI生成ロングテールキーワードは動作しません。');
}

// Gemini APIの初期化（APIキーがある場合のみ）
let genAI = null;
try {
  if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log('Gemini API client initialized successfully for AI longtail generation');
  }
} catch (e) {
  console.error('Failed to initialize Gemini API client for AI longtail:', e);
}

// モックロングテールキーワード（APIキーが機能しない場合のフォールバック）
const mockLongTailKeywords = (keyword) => {
  // キーワードに基づいたより多様なモックデータを生成
  const phrases = [
    `${keyword} 初心者向け 詳細ガイド`,
    `${keyword} 効果的な活用方法とコツ`,
    `${keyword} 失敗しない選び方 ポイント`,
    `${keyword} 専門家おすすめ 人気ランキング`,
    `${keyword} トラブル解決 対処法`,
    `${keyword} メリットとデメリット 比較`,
    `${keyword} 最新情報 2024年版`,
    `${keyword} コスパ最強 おすすめ商品`,
    `${keyword} よくある質問と回答 FAQ`,
    `${keyword} ステップバイステップ 解説`
  ];
  
  // 各キーワードに検索ボリュームと検索意図を設定
  return phrases.map(phrase => ({
    keyword: phrase,
    searchVolume: Math.floor(Math.random() * 3000) + 100, // ロングテールは検索ボリュームが低め
    searchIntent: getRandomIntent(),
    isAiGenerated: true
  }));
};

// ランダムな検索意図を返す関数（モックデータ用）
const getRandomIntent = () => {
  const intents = ['情報収集', '問題解決', '購入検討', '使い方確認', '比較調査'];
  return intents[Math.floor(Math.random() * intents.length)];
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
  let suggestions = [];
  
  if (req.method === 'GET') {
    keyword = req.query.keyword;
    if (req.query.suggestions) {
      try {
        suggestions = JSON.parse(req.query.suggestions);
      } catch (e) {
        console.error('[AI-LONGTAIL] Error parsing suggestions from query:', e);
      }
    }
  } else if (req.method === 'POST') {
    keyword = req.body.keyword;
    suggestions = req.body.suggestions || [];
  }

  if (!keyword) {
    return res.status(400).json({ error: 'キーワードは必須です' });
  }

  console.log(`[AI-LONGTAIL] Generating AI longtail keywords for: "${keyword}"`);
  console.log(`[AI-LONGTAIL] Received ${suggestions.length} suggestions for context`);

  try {
    // APIキーがない場合はモックデータを返す
    if (!API_KEY || !genAI) {
      console.log('[AI-LONGTAIL] No API key, returning mock data');
      return res.status(200).json({
        keyword,
        longTailKeywords: mockLongTailKeywords(keyword),
        isMock: true
      });
    }

    // Gemini APIを使用してロングテールキーワードを生成
    try {
      console.log('[AI-LONGTAIL] Creating Gemini model instance');
      // 適切なGemini APIモデルを使用
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      // 関連するキーワードの文字列を作成（コンテキスト用）
      const suggestionsContext = suggestions.length > 0 
        ? `関連キーワード: ${suggestions.map(s => typeof s === 'string' ? s : s.keyword).join(', ')}`
        : '';
      
      const prompt = `
      あなたはSEOとコンテンツマーケティングの専門家です。以下のキーワードに関連する自然なロングテールキーワードを生成してください:

      キーワード: "${keyword}"
      ${suggestionsContext}

      以下の条件を満たすロングテールキーワードを10個生成してください:
      1. 実際のユーザーが検索しそうな自然な日本語の検索クエリ
      2. 3〜5語程度の具体的な検索フレーズ
      3. 「やり方」「おすすめ」などの定型句に頼らない多様な表現
      4. 問い合わせ、悩み、疑問など様々な検索意図を反映
      5. 業界固有の専門用語や最新トレンドを考慮
      6. 実際のユーザーがロングテールで検索しそうな自然な表現

      各キーワードには、概算の月間検索ボリュームと検索意図も付けてください。
      
      出力は以下のJSON形式で返してください:
      [
        {
          "keyword": "ロングテールキーワード1",
          "searchVolume": 推定検索ボリューム数値,
          "searchIntent": "検索意図（情報収集/問題解決/購入検討など）"
        },
        ...
      ]

      追加の説明は不要です。JSONのみを返してください。
      `;
      
      console.log('[AI-LONGTAIL] Sending request to Gemini API...');

      // タイムアウト設定（10秒）
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API request timeout')), 10000);
      });

      // Gemini APIリクエストを実行
      const result = await Promise.race([
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8, // より多様な結果を得るため温度を上げる
            maxOutputTokens: 1024,
          },
        }),
        timeoutPromise
      ]);

      console.log('[AI-LONGTAIL] Gemini API request completed');

      if (!result || !result.response) {
        throw new Error('Gemini APIからの応答が空です');
      }

      // レスポンステキストを取得
      const responseText = result.response.text();
      console.log('[AI-LONGTAIL] Raw response:', responseText.substring(0, 200));

      // JSON配列を抽出するための正規表現パターン
      const jsonPattern = /\[\s*\{.*\}\s*\]/s;
      const match = responseText.match(jsonPattern);

      let longTailKeywords = [];
      if (match) {
        try {
          // JSON配列を解析
          const parsedKeywords = JSON.parse(match[0]);
          
          // 必要なプロパティを確認して抽出
          longTailKeywords = parsedKeywords.map(item => ({
            keyword: item.keyword || '',
            searchVolume: item.searchVolume || generateSearchVolume(item.keyword || ''),
            searchIntent: item.searchIntent || '情報収集',
            isAiGenerated: true
          }));
        } catch (jsonError) {
          console.error('[AI-LONGTAIL] JSON parse error:', jsonError);
          // フォールバック：行ごとに処理
          longTailKeywords = parseNonJsonResponse(responseText, keyword);
        }
      } else {
        // JSONパターンが見つからない場合も行ごとに処理
        longTailKeywords = parseNonJsonResponse(responseText, keyword);
      }

      console.log('[AI-LONGTAIL] Parsed longtail keywords:', longTailKeywords);

      // レスポンスヘッダーを設定
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      
      return res.status(200).json({
        keyword,
        longTailKeywords: longTailKeywords
      });
    } catch (apiError) {
      console.error('[AI-LONGTAIL] Error in Gemini API call:', apiError);
      
      // モックレスポンスでフォールバック
      return res.status(200).json({
        keyword,
        longTailKeywords: mockLongTailKeywords(keyword),
        isFallback: true,
        error: apiError.message
      });
    }
  } catch (error) {
    console.error('[AI-LONGTAIL] Error generating longtail keywords:', error);
    res.status(500).json({ 
      error: 'AIロングテールキーワードの生成中にエラーが発生しました',
      message: error.message
    });
  }
}

// 非JSON形式のレスポンスをパースする関数
function parseNonJsonResponse(text, baseKeyword) {
  const lines = text.split('\n');
  const results = [];
  const keywordRegex = /"keyword":\s*"([^"]+)"|"([^"]+)"/;
  const volumeRegex = /searchVolume":\s*(\d+)|\b(\d+)\b/;
  const intentRegex = /searchIntent":\s*"([^"]+)"|\b(情報収集|問題解決|購入検討|比較調査|使い方確認)\b/;
  
  let currentKeyword = null;
  
  for (const line of lines) {
    // キーワードを抽出
    const keywordMatch = line.match(keywordRegex);
    if (keywordMatch) {
      currentKeyword = keywordMatch[1] || keywordMatch[2];
      
      if (currentKeyword && currentKeyword.includes(baseKeyword)) {
        // 検索ボリューム
        let searchVolume = generateSearchVolume(currentKeyword);
        const volumeMatch = line.match(volumeRegex);
        if (volumeMatch) {
          const volumeStr = volumeMatch[1] || volumeMatch[2];
          if (volumeStr) {
            searchVolume = parseInt(volumeStr);
          }
        }
        
        // 検索意図
        let searchIntent = '情報収集';
        const intentMatch = line.match(intentRegex);
        if (intentMatch) {
          searchIntent = intentMatch[1] || intentMatch[2] || '情報収集';
        }
        
        results.push({
          keyword: currentKeyword,
          searchVolume,
          searchIntent,
          isAiGenerated: true
        });
      }
    }
  }
  
  // 結果が少ない場合はモックで補完
  if (results.length < 5) {
    const mockResults = mockLongTailKeywords(baseKeyword);
    return [...results, ...mockResults.slice(0, 10 - results.length)];
  }
  
  // 最大10件に制限
  return results.slice(0, 10);
}

// 検索ボリュームをシミュレートする関数
function generateSearchVolume(keyword) {
  if (!keyword) return 100;
  
  // キーワードの長さに基づいて検索ボリュームを生成
  const words = keyword.split(/\s+/);
  const baseVolume = Math.floor(Math.random() * 2000) + 100;
  
  // 単語数が多いほど検索ボリュームは減少（ロングテールになるほど検索数が減る傾向を模倣）
  const volumeReduction = Math.pow(0.6, words.length - 1);
  
  return Math.floor(baseVolume * volumeReduction);
} 