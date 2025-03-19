require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Gemini APIの初期化
const API_KEY = process.env.GEMINI_API_KEY || '';
let genAI = null;

if (API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log('Gemini API initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Gemini API:', error);
  }
}

// モック応答（APIキーが設定されていない場合のフォールバック）
const mockAnalysis = (keyword) => {
  return `
- 顕在ニーズ: "${keyword}"に関する情報や解決策の探索
- 潜在ニーズ: 時間や手間の節約、専門知識へのアクセス、自信を持って決断するための情報収集
- ターゲットユーザー: ${keyword}について知識を深めたい初心者から中級者、具体的な問題解決を求めるユーザー
- コンテンツ提案: ハウツーガイド、チュートリアル、事例紹介、比較記事、FAQ、基本概念の解説
`;
};

// ミドルウェア
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ニーズ分析エンドポイント（Gemini APIを使用）
app.post('/api/analyze-needs', async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword) {
      return res.status(400).json({ error: 'キーワードは必須です' });
    }

    console.log(`[DEBUG] Analyzing keyword: "${keyword}"`);
    console.log(`[DEBUG] API_KEY exists: ${Boolean(API_KEY)}, length: ${API_KEY ? API_KEY.length : 0}`);

    // APIキーが設定されていない場合はモック応答を返す
    if (!API_KEY || !genAI) {
      console.warn('[DEBUG] GEMINI_API_KEY is not set, using mock response');
      return res.status(200).json({
        keyword,
        analysis: mockAnalysis(keyword),
        success: true,
        isMock: true
      });
    }

    // Gemini APIを使用してニーズ分析
    try {
      console.log('[DEBUG] Creating Gemini model instance');
      // 正しいGemini APIモデル名に更新
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const prompt = `
以下のキーワードについて、SEO視点から潜在ニーズと顕在ニーズを分析してください:

キーワード: "${keyword}"

以下の形式で回答してください:
顕在ニーズ: [明示的に表現されている検索意図]
潜在ニーズ: [検索の背景にある可能性が高い隠れたニーズや悩み]
ターゲットユーザー: [このキーワードを検索しそうなユーザー像]
コンテンツ提案: [このキーワードに効果的に対応するコンテンツの種類]

各項目には箇条書きや装飾（アスタリスクなど）を使わず、直接テキストで簡潔に回答してください。
改行は使わず、各項目を一つの段落として記述してください。
全体で各項目100文字以内に収めてください。
`;
      
      console.log('[DEBUG] Prompt:', prompt);
      console.log('[DEBUG] Sending request to Gemini API...');

      // 安全装置として、15秒のタイムアウトを設定
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API request timeout')), 15000);
      });

      // Gemini APIリクエストを実行（最新バージョンのAPIに合わせて修正）
      const result = await Promise.race([
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }).catch(e => {
          console.error('[DEBUG] Gemini API generateContent error:', e);
          console.error('[DEBUG] Error name:', e.name);
          console.error('[DEBUG] Error message:', e.message);
          throw e;
        }),
        timeoutPromise
      ]);

      console.log('[DEBUG] Gemini API request completed');

      if (!result) {
        console.error('[DEBUG] Empty result from Gemini API');
        throw new Error('Gemini APIからの応答が空です');
      }

      console.log('[DEBUG] Response object structure:', Object.keys(result));

      // レスポンス処理を最新バージョンのAPI形式に更新
      let text = '';
      if (result.response && result.response.text) {
        // 古いバージョンの形式
        text = result.response.text();
      } else if (result.candidates && result.candidates.length > 0) {
        // 新しいバージョンの形式
        const content = result.candidates[0].content;
        if (content && content.parts && content.parts.length > 0) {
          text = content.parts[0].text;
        }
      }

      if (!text) {
        console.error('[DEBUG] Could not extract text from response');
        console.log('[DEBUG] Full response:', JSON.stringify(result).substring(0, 500));
        throw new Error('レスポンステキストの抽出に失敗しました');
      }

      console.log('[DEBUG] Analysis text length:', text.length);
      console.log('[DEBUG] Analysis text preview:', text.substring(0, 100) + '...');

      res.status(200).json({
        keyword,
        analysis: text,
        success: true
      });
    } catch (apiError) {
      console.error('[DEBUG] Error in Gemini API call:', apiError);
      
      // モックレスポンスでフォールバック
      console.log('[DEBUG] Falling back to mock response');
      return res.status(200).json({
        keyword,
        analysis: mockAnalysis(keyword),
        success: true,
        isFallback: true,
        error: apiError.message
      });
    }
  } catch (error) {
    console.error('[DEBUG] Top-level error:', error);

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
    }

    // フォールバックとしてモック応答を返す
    // フロントエンドにフレンドリーなエラーメッセージを提供
    if (process.env.USE_FALLBACK_ON_ERROR === 'true' || process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] Using fallback mock response due to error');
      return res.status(200).json({
        keyword,
        analysis: mockAnalysis(keyword),
        success: true,
        isFallback: true,
        originalError: errorMessage
      });
    }

    res.status(statusCode).json({
      error: errorMessage,
      message: error.message || 'APIエラー',
      success: false
    });
  }
});

// Googleサジェストキーワード取得エンドポイント
app.get('/api/suggestions', async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({ error: 'キーワードが必要です' });
    }
    
    // Googleサジェスト APIからのデータ取得（非公式API）
    const response = await axios.get(
      `http://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(keyword)}`, 
      { timeout: 5000 }
    );
    
    if (response.data && Array.isArray(response.data) && response.data.length > 1) {
      const suggestions = response.data[1];
      
      // 検索ボリュームの推定値を付加（仮の値を生成）
      const suggestionsWithVolume = suggestions.map(suggestion => {
        // 単語の長さと複雑さに基づいた仮の検索ボリューム値を生成
        // 実際の検索ボリュームを取得するには有料APIが必要
        const wordCount = suggestion.split(' ').length;
        const baseVolume = Math.floor(Math.random() * 5000) + 100; // 100〜5100の間の値
        const volumeMultiplier = Math.max(0.1, 1 - (wordCount * 0.15)); // 単語数が多いほど検索ボリュームは小さくなる傾向
        const volume = Math.floor(baseVolume * volumeMultiplier);
        
        return {
          keyword: suggestion,
          volume: volume
        };
      });

      return res.json({ 
        suggestions: suggestionsWithVolume 
      });
    } else {
      return res.json({ suggestions: [] });
    }
  } catch (error) {
    console.error('サジェスト取得エラー:', error);
    res.status(500).json({ error: 'サジェストの取得に失敗しました' });
  }
});

// ロングテールキーワード予測エンドポイント
app.get('/api/longtail-suggestions', async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({ error: 'キーワードが必要です' });
    }
    
    // キーワードを単語に分割
    const words = keyword.trim().split(/\s+/);
    
    // 1単語か2単語の場合のみロングテールを生成
    if (words.length <= 2) {
      // Googleサジェストを取得
      const response = await axios.get(
        `http://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(keyword)}`, 
        { timeout: 5000 }
      );
      
      if (response.data && Array.isArray(response.data) && response.data.length > 1) {
        const suggestions = response.data[1];
        
        // 2語サジェストからさらに追加のサジェストを取得（最大3つ）
        const longTailPromises = suggestions
          .filter(sugg => sugg.split(/\s+/).length >= 2) // 2単語以上のサジェストのみ
          .slice(0, 3) // 最大3つのサジェストに対して追加クエリを実行
          .map(async (sugg) => {
            try {
              const longTailResponse = await axios.get(
                `http://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(sugg)}`, 
                { timeout: 5000 }
              );
              
              if (longTailResponse.data && Array.isArray(longTailResponse.data) && longTailResponse.data.length > 1) {
                // 3単語以上のサジェストのみを返す
                return longTailResponse.data[1]
                  .filter(lt => lt.split(/\s+/).length >= 3)
                  .slice(0, 5); // 各サジェストから最大5つのロングテールを返す
              }
              return [];
            } catch (error) {
              console.error('ロングテールサジェスト取得エラー:', error);
              return [];
            }
          });
        
        // すべての追加サジェストリクエストの結果を待つ
        const longTailResults = await Promise.all(longTailPromises);
        
        // 結果をフラット化して重複を削除
        const longTailSuggestions = [...new Set(longTailResults.flat())];
        
        // 検索ボリュームの推定値を付加（仮の値を生成）
        const longTailWithVolume = longTailSuggestions.map(suggestion => {
          const wordCount = suggestion.split(' ').length;
          // ロングテールは検索ボリュームが低い傾向にある
          const baseVolume = Math.floor(Math.random() * 500) + 10; // 10〜510の間の値
          const volumeMultiplier = Math.max(0.05, 1 - (wordCount * 0.2));
          const volume = Math.floor(baseVolume * volumeMultiplier);
          
          return {
            keyword: suggestion,
            volume: volume
          };
        });
        
        return res.json({ suggestions: longTailWithVolume });
      }
    }
    
    return res.json({ suggestions: [] });
  } catch (error) {
    console.error('ロングテールサジェスト取得エラー:', error);
    res.status(500).json({ error: 'ロングテールサジェストの取得に失敗しました' });
  }
});

// Yahoo!サジェストキーワード取得エンドポイント（オプション）
app.get('/api/yahoo-suggestions', async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({ error: 'キーワードが必要です' });
    }
    
    // Yahoo!サジェスト APIからのデータ取得
    const response = await axios.get(
      `https://search.yahoo.co.jp/ajax/search_sg?p=${encodeURIComponent(keyword)}`,
      { timeout: 5000 }
    );
    
    if (response.data && response.data.Result) {
      const suggestions = response.data.Result.map(item => item.Suggest);
      return res.json({ suggestions });
    } else {
      return res.json({ suggestions: [] });
    }
  } catch (error) {
    console.error('Yahoo!サジェスト取得エラー:', error);
    res.status(500).json({ error: 'Yahoo!サジェストの取得に失敗しました' });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
}); 