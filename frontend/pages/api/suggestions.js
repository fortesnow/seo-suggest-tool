export default async function handler(req, res) {
  const { keyword, region = 'jp' } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: 'キーワードは必須です' });
  }

  try {
    // Googleサジェストを取得
    const suggestions = await fetchGoogleSuggestions(keyword, region);
    
    // ログを追加
    console.log('Fetched suggestions:', suggestions);
    
    // 検索ボリュームを追加（最大10件に制限）
    const suggestionsWithVolume = suggestions.slice(0, 10).map(suggestion => ({
      keyword: suggestion,
      searchVolume: generateSearchVolume(suggestion)
    }));
    
    // 平均検索ボリュームを計算
    const totalVolume = suggestionsWithVolume.reduce((sum, item) => sum + item.searchVolume, 0);
    const averageSearchVolume = suggestionsWithVolume.length > 0 
      ? Math.round(totalVolume / suggestionsWithVolume.length) 
      : 0;
    
    // AI生成ロングテールキーワードを取得
    const longTailKeywords = await fetchAILongTailKeywords(keyword, suggestionsWithVolume);
    
    // ロングテールキーワードの平均検索ボリュームを計算
    const longTailTotalVolume = longTailKeywords.reduce((sum, item) => sum + item.searchVolume, 0);
    const longTailAverageSearchVolume = longTailKeywords.length > 0 
      ? Math.round(longTailTotalVolume / longTailKeywords.length) 
      : 0;

    // レスポンスヘッダーを設定
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // 日本語文字化け防止のための処理
    const responseData = {
      keyword,
      suggestions: suggestionsWithVolume.map(item => ({
        ...item,
        keyword: ensureUtf8(item.keyword)
      })),
      averageSearchVolume,
      longTailKeywords: longTailKeywords.map(item => ({
        ...item,
        keyword: ensureUtf8(item.keyword)
      })),
      longTailAverageSearchVolume
    };
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'サジェストの取得中にエラーが発生しました' });
  }
}

// 文字列がUTF-8エンコーディングであることを確認する関数
function ensureUtf8(str) {
  if (!str) return '';
  
  try {
    // 文字列が適切にエンコードされていることを確認
    if (str.includes('\uFFFD')) {
      // 文字化けの代表的な文字が含まれている場合、修正を試みる
      return Buffer.from(str).toString('utf8');
    }
    return str;
  } catch (e) {
    console.error('String encoding error:', e);
    return str;
  }
}

// Googleのサジェストキーワードを取得する関数
async function fetchGoogleSuggestions(keyword, region) {
  try {
    // デコードしてから再エンコードして、二重エンコードを防止
    let decodedKeyword = keyword;
    try {
      // URLエンコードされている場合はデコード
      if (keyword.includes('%')) {
        decodedKeyword = decodeURIComponent(keyword);
      }
    } catch (e) {
      console.error('Error decoding keyword:', e);
    }
    
    // Google検索のサジェストURL
    // regionに基づいてURLを変更
    const baseUrl = region === 'us' 
      ? 'https://www.google.com/complete/search' 
      : `https://www.google.co.${region}/complete/search`;
    
    // クエリパラメータ
    const params = new URLSearchParams({
      q: decodedKeyword,
      client: 'firefox',
      hl: region === 'us' ? 'en' : 'ja'
    });
    
    console.log(`Making request to: ${baseUrl}?${params}`);
    
    // リクエストを送信
    const response = await fetch(`${baseUrl}?${params}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': region === 'us' ? 'en-US,en;q=0.9' : 'ja-JP,ja;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // レスポンスが正常でない場合
    if (!response.ok) {
      throw new Error(`Google API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Raw API response:', JSON.stringify(data).slice(0, 500)); // 部分的なログ
    
    // 結果の配列を返す（最初の要素はクエリ自体、2番目の要素がサジェスト）
    let suggestions = data[1] || [];
    
    // デコードが必要な場合、明示的に処理
    suggestions = suggestions.map(suggestion => {
      try {
        // すでにエンコードされている可能性のある文字列を適切に処理
        if (suggestion.includes('%')) {
          return decodeURIComponent(suggestion);
        }
        return suggestion;
      } catch (e) {
        console.error('Error processing suggestion:', e, suggestion);
        return suggestion;
      }
    });
    
    console.log('Processed suggestions:', suggestions);
    return suggestions;
  } catch (error) {
    console.error('Error fetching Google suggestions:', error);
    return [];
  }
}

// 検索ボリュームをシミュレートする関数（実際のAPIに置き換えることができます）
function generateSearchVolume(keyword) {
  // キーワードの長さに基づいて検索ボリュームを生成
  // 実際のアプリでは、実データを使用するAPIに置き換えるべきです
  const words = keyword.split(' ');
  const baseVolume = Math.floor(Math.random() * 10000) + 1000;
  
  // 単語数が多いほど検索ボリュームは減少
  const volumeReduction = Math.pow(0.7, words.length);
  
  return Math.floor(baseVolume * volumeReduction);
}

// ロングテールキーワードを生成する関数
function generateLongTailKeywords(baseKeyword, suggestions) {
  // 既存のサジェストからロングテールキーワードを生成
  const longTailSuggestions = [];
  
  // サジェストからロングテールを生成
  for (const suggestion of suggestions) {
    const suggestedKeyword = suggestion.keyword;
    
    // 単語数をカウント（空白で分割）
    const wordCount = suggestedKeyword.split(/\s+/).length;
    
    // 3語以上のキーワードと、base keywordとは異なるものを抽出（2語から3語以上に変更）
    if (wordCount >= 3 && suggestedKeyword !== baseKeyword) {
      longTailSuggestions.push({
        keyword: suggestedKeyword,
        searchVolume: suggestion.searchVolume * 0.8 // ロングテールは通常、検索ボリュームが低い
      });
    }
  }
  
  // 既存のサジェストから十分なロングテールキーワードが得られない場合、生成する
  if (longTailSuggestions.length < 5) {
    // 組み合わせからロングテールを生成
    const commonPhrases = ['方法 おすすめ', 'やり方 簡単', 'とは 意味 解説', '違い 比較 ポイント', 'おすすめ 人気 ランキング', '使い方 初心者', '意味 例文'];
    
    for (const phrase of commonPhrases) {
      if (longTailSuggestions.length >= 15) break; // 最大15件に制限
      
      const newKeyword = `${baseKeyword} ${phrase}`;
      // 単語数が3つ以上あることを確認
      const wordCount = newKeyword.split(/\s+/).length;
      if (wordCount >= 3) {
        longTailSuggestions.push({
          keyword: newKeyword,
          searchVolume: generateSearchVolume(newKeyword)
        });
      }
    }
  }
  
  return longTailSuggestions;
}

// AI生成ロングテールキーワードを取得する関数
async function fetchAILongTailKeywords(keyword, suggestions) {
  try {
    // 同じサーバーで動作するAIロングテールAPIを呼び出す
    const apiUrl = `/api/ai-longtail`;
    
    // リクエストの準備
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        keyword,
        suggestions: suggestions.slice(0, 5) // コンテキスト用に上位5件のサジェストを送信
      })
    });
    
    if (!response.ok) {
      console.error(`AI longtail API returned ${response.status}`);
      // 失敗した場合は従来のロングテール生成にフォールバック
      return generateLongTailKeywords(keyword, suggestions);
    }
    
    const data = await response.json();
    return data.longTailKeywords || [];
  } catch (error) {
    console.error('Error fetching AI longtail keywords:', error);
    // エラーの場合は従来のロングテール生成にフォールバック
    return generateLongTailKeywords(keyword, suggestions);
  }
} 