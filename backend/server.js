require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// ミドルウェア
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
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