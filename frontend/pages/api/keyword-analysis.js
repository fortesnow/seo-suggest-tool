import { GoogleGenerativeAI } from '@google/generative-ai';

// 環境変数からAPIキーを取得
const API_KEY = process.env.GEMINI_API_KEY || '';

// デバッグ用にAPI KEY長さのログを出力（セキュリティのためにキー自体は表示しない）
console.log(`[KEYWORD-ANALYSIS] API_KEY exists: ${Boolean(API_KEY)}, length: ${API_KEY ? API_KEY.length : 0}`);

// Gemini APIの初期化
let genAI = null;
try {
  if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log('Gemini API client initialized successfully for keyword analysis');
  }
} catch (e) {
  console.error('Failed to initialize Gemini API client for keyword analysis:', e);
}

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONSリクエストの場合は早期リターン
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POSTリクエストのみ受け付ける
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'メソッドが許可されていません' });
  }

  try {
    const { mainKeyword, relatedKeywords } = req.body;

    if (!mainKeyword || !relatedKeywords || !Array.isArray(relatedKeywords)) {
      return res.status(400).json({ error: 'Invalid request data. mainKeyword and relatedKeywords array required.' });
    }

    const allKeywords = [mainKeyword, ...relatedKeywords].filter(Boolean);

    if (allKeywords.length === 0) {
      return res.status(400).json({ error: 'No valid keywords provided' });
    }

    // Gemini APIの設定
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    console.log(`API Key length: ${process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0}`);
    console.log(`Model being used: gemini-pro`);
    console.log(`Number of keywords to analyze: ${allKeywords.length}`);

    const prompt = `
あなたはSEO専門家として、以下のキーワードリストについて分析を行ってください。
メインキーワード: ${mainKeyword}
関連キーワード: ${relatedKeywords.join(', ')}

以下の2つの分析を行い、その結果をJSON形式で返してください:

1. キーワード難易度分析:
各キーワードについて0〜100のスケールで難易度スコアを評価してください。
- 0-20: とても簡単（低競争キーワード）
- 21-40: 簡単（中低競争キーワード）
- 41-60: 中程度（中競争キーワード）
- 61-80: 難しい（中高競争キーワード）
- 81-100: とても難しい（高競争キーワード）

難易度評価は以下の要素を考慮してください:
- キーワードの長さ（より長いフレーズは通常より簡単）
- 検索意図の明確さ（明確な意図を持つキーワードは通常より簡単）
- 一般的/専門的な用語（専門的な用語は通常より簡単）
- 商業的価値（高い商業的価値があるキーワードは通常より難しい）
- 競合の可能性（大企業やウェブサイトが上位表示される可能性が高いか）

2. キーワードクラスタリング:
関連性に基づいてキーワードをクラスター（グループ）に分類してください。各クラスターには:
- クラスター名（このグループを最もよく表す短い名前）
- 検索意図（このグループのキーワードが持つ主な検索意図）
- キーワードリスト（このクラスターに属するキーワード）

結果は以下のJSON構造で返してください:
{
  "difficultyAnalysis": [
    {"keyword": "キーワード1", "score": 45, "difficulty": "中程度", "reasoning": "このキーワードが中程度の難易度である理由の簡潔な説明"}
  ],
  "clustering": [
    {
      "clusterName": "クラスター1",
      "searchIntent": "このクラスターの検索意図の説明",
      "keywords": ["キーワード1", "キーワード2"]
    }
  ]
}

分析結果のみをJSON形式で返してください。説明や前置きは不要です。
`;

    console.log('Sending prompt to Gemini API...');
    console.log(`Prompt length: ${prompt.length} characters`);

    // Promise.raceを使用して30秒のタイムアウトを設定
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('API request timed out after 30 seconds')), 30000)
    );

    const responsePromise = model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const response = await Promise.race([responsePromise, timeoutPromise]);
    
    console.log('Received response from Gemini API');
    
    const textResponse = response.response.text();
    console.log(`Response length: ${textResponse.length} characters`);
    
    try {
      // JSONのみを抽出するための正規表現
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error('Failed to extract JSON from response');
        console.log('Response:', textResponse);
        return res.status(500).json({ error: 'Failed to extract analysis results from API response' });
      }
      
      const jsonData = JSON.parse(jsonMatch[0]);
      
      // キーワード難易度分析結果を検証
      if (!jsonData.difficultyAnalysis || !Array.isArray(jsonData.difficultyAnalysis)) {
        console.error('difficultyAnalysis is missing or not an array');
        console.log('Response JSON:', jsonData);
        return res.status(500).json({ error: 'Invalid difficulty analysis results' });
      }
      
      // クラスタリング結果を検証
      if (!jsonData.clustering || !Array.isArray(jsonData.clustering)) {
        console.error('clustering is missing or not an array');
        console.log('Response JSON:', jsonData);
        return res.status(500).json({ error: 'Invalid clustering results' });
      }
      
      // タイムスタンプを追加
      const result = {
        ...jsonData,
        timestamp: new Date().toISOString(),
        mainKeyword,
      };
      
      return res.status(200).json(result);
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      console.log('Raw response:', textResponse);
      
      // フォールバック処理: JSONが解析できない場合は簡易的な分析結果を返す
      const fallbackResult = {
        difficultyAnalysis: allKeywords.map(keyword => ({
          keyword,
          score: Math.floor(Math.random() * 100),
          difficulty: "解析エラー",
          reasoning: "APIレスポンスの解析中にエラーが発生しました。"
        })),
        clustering: [{
          clusterName: "エラー",
          searchIntent: "APIレスポンスの解析中にエラーが発生しました。",
          keywords: allKeywords
        }],
        timestamp: new Date().toISOString(),
        mainKeyword,
        isError: true
      };
      
      return res.status(200).json(fallbackResult);
    }
  } catch (error) {
    console.error('Error in keyword analysis:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze keywords',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// AIを使用してキーワード分析を実行する関数
async function analyzeKeywordsWithAI(mainKeyword, keywordsStr) {
  try {
    console.log('[KEYWORD-ANALYSIS] Creating Gemini model instance');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
    あなたはSEOとキーワード分析の専門家です。以下のメインキーワードと関連キーワードを分析してください：

    メインキーワード: "${mainKeyword}"
    関連キーワード: ${keywordsStr}

    タスク1: キーワード難易度スコア
    各キーワードの競争度を1-100の数値で評価してください。以下の要素を考慮します：
    - 検索意図の一貫性（統一された検索意図であれば低スコア、多様であれば高スコア）
    - 語句の長さと具体性（長いほど低スコア、短いほど高スコア）
    - 潜在的な商業価値（高いほど高スコア）
    - ブランド名を含むかどうか（含む場合は通常高スコア）

    タスク2: キーワードクラスタリング
    関連キーワードを意味的に関連するグループに分類してください。各クラスターには：
    - クラスター名（そのグループを表す簡潔な名前）
    - 含まれるキーワードリスト
    - そのクラスターの主な検索意図
    を含めてください。

    出力は以下のJSON形式で返してください：
    {
      "difficultyScoredKeywords": [
        {
          "keyword": "キーワード1",
          "difficultyScore": 75,
          "reason": "このスコアの簡潔な根拠"
        },
        ...
      ],
      "clusters": [
        {
          "name": "クラスター1の名前",
          "searchIntent": "このクラスターの主な検索意図",
          "keywords": ["キーワードA", "キーワードB", ...]
        },
        ...
      ]
    }

    説明や追加のテキストは不要です。JSONデータのみを返してください。
    `;
    
    console.log('[KEYWORD-ANALYSIS] Sending request to Gemini API...');

    // タイムアウト設定（15秒）
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API request timeout')), 15000);
    });

    // Gemini APIリクエストを実行
    const result = await Promise.race([
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
      timeoutPromise
    ]);

    console.log('[KEYWORD-ANALYSIS] Gemini API request completed');

    if (!result || !result.response) {
      throw new Error('Gemini APIからの応答が空です');
    }

    // レスポンステキストを取得
    const responseText = result.response.text();
    console.log('[KEYWORD-ANALYSIS] Raw response:', responseText.substring(0, 200));

    // JSONデータを抽出して解析
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        
        // レスポンスの構造を確認
        if (!parsedData.difficultyScoredKeywords || !parsedData.clusters) {
          throw new Error('応答データの構造が正しくありません');
        }
        
        return {
          mainKeyword,
          difficultyScoredKeywords: parsedData.difficultyScoredKeywords || [],
          clusters: parsedData.clusters || [],
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('JSON形式のデータが見つかりませんでした');
      }
    } catch (jsonError) {
      console.error('[KEYWORD-ANALYSIS] JSON parse error:', jsonError);
      console.error('[KEYWORD-ANALYSIS] Raw text:', responseText);
      
      // JSON解析に失敗した場合はモックデータを返す
      return generateMockAnalysis(mainKeyword, keywordsStr.split(', '));
    }
  } catch (apiError) {
    console.error('[KEYWORD-ANALYSIS] API error:', apiError);
    return generateMockAnalysis(mainKeyword, keywordsStr.split(', '));
  }
}

// モックデータ生成関数
function generateMockAnalysis(mainKeyword, keywords) {
  // 配列でない場合は配列に変換
  if (!Array.isArray(keywords)) {
    keywords = [keywords];
  }
  
  // キーワードがオブジェクトの場合はkeywordプロパティを取得
  const keywordsList = keywords.map(kw => 
    typeof kw === 'string' ? kw : kw.keyword
  );

  // 難易度スコア付きキーワード
  const difficultyScoredKeywords = keywordsList.map(keyword => {
    // ランダムな難易度スコアを生成（ただし文字列長に影響される）
    const baseScore = Math.floor(Math.random() * 60) + 20;
    const lengthFactor = Math.max(0, (15 - keyword.length)) * 2;
    const score = Math.min(100, Math.max(1, baseScore + lengthFactor));
    
    // 難易度の根拠
    let reason = '';
    if (score > 80) {
      reason = '高い商業的価値と短いキーワード長';
    } else if (score > 60) {
      reason = '中程度の競争と明確な検索意図';
    } else if (score > 40) {
      reason = '長めのキーワードとニッチな領域';
    } else {
      reason = '非常に具体的で競争が少ない長いフレーズ';
    }

    return {
      keyword,
      difficultyScore: score,
      reason
    };
  });

  // キーワードをクラスタリング（簡易的なモックロジック）
  const clusters = [];
  const usedKeywords = new Set();
  
  // 単語の共通性に基づいて簡易的なクラスタリング
  keywordsList.forEach(keyword => {
    if (usedKeywords.has(keyword)) return;
    
    const words = keyword.toLowerCase().split(/\s+/);
    if (words.length === 0) return;
    
    // このキーワードに類似したキーワードを見つける
    const similarKeywords = [keyword];
    usedKeywords.add(keyword);
    
    keywordsList.forEach(otherKeyword => {
      if (keyword === otherKeyword || usedKeywords.has(otherKeyword)) return;
      
      const otherWords = otherKeyword.toLowerCase().split(/\s+/);
      // 少なくとも1つの単語が共通していれば類似と見なす
      const hasCommonWord = words.some(word => 
        word.length > 3 && otherWords.includes(word)
      );
      
      if (hasCommonWord) {
        similarKeywords.push(otherKeyword);
        usedKeywords.add(otherKeyword);
      }
    });
    
    // クラスター名を決定（共通する最初の単語を使用）
    let clusterName = '';
    if (words.length > 0 && words[0].length > 3) {
      clusterName = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    } else {
      clusterName = `${mainKeyword}関連`;
    }
    
    // クラスター情報
    if (similarKeywords.length > 0) {
      clusters.push({
        name: `${clusterName}関連情報`,
        searchIntent: getRandomIntent(),
        keywords: similarKeywords
      });
    }
  });
  
  // 使われていないキーワードを「その他」クラスターに追加
  const unusedKeywords = keywordsList.filter(kw => !usedKeywords.has(kw));
  if (unusedKeywords.length > 0) {
    clusters.push({
      name: `その他の${mainKeyword}関連キーワード`,
      searchIntent: '多様な検索意図',
      keywords: unusedKeywords
    });
  }

  return {
    mainKeyword,
    difficultyScoredKeywords,
    clusters,
    timestamp: new Date().toISOString()
  };
}

// ランダムな検索意図を返す関数
function getRandomIntent() {
  const intents = [
    '情報収集',
    '問題解決',
    '購入前調査',
    '使い方確認',
    '比較検討',
    'ハウツー検索',
    '定義検索'
  ];
  return intents[Math.floor(Math.random() * intents.length)];
} 