export default async function handler(req, res) {
  const { keyword, region = 'jp' } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: 'キーワードは必須です' });
  }

  try {
    // Googleサジェストを取得
    const suggestions = await fetchGoogleSuggestions(keyword, region);
    
    // 検索ボリュームを追加
    const suggestionsWithVolume = suggestions.map(suggestion => ({
      keyword: suggestion,
      searchVolume: generateSearchVolume(suggestion)
    }));
    
    // 平均検索ボリュームを計算
    const totalVolume = suggestionsWithVolume.reduce((sum, item) => sum + item.searchVolume, 0);
    const averageSearchVolume = suggestionsWithVolume.length > 0 
      ? Math.round(totalVolume / suggestionsWithVolume.length) 
      : 0;
    
    // ロングテールキーワードの生成
    const longTailKeywords = generateLongTailKeywords(keyword, suggestionsWithVolume);
    
    // ロングテールキーワードの平均検索ボリュームを計算
    const longTailTotalVolume = longTailKeywords.reduce((sum, item) => sum + item.searchVolume, 0);
    const longTailAverageSearchVolume = longTailKeywords.length > 0 
      ? Math.round(longTailTotalVolume / longTailKeywords.length) 
      : 0;

    res.status(200).json({
      keyword,
      suggestions: suggestionsWithVolume,
      averageSearchVolume,
      longTailKeywords,
      longTailAverageSearchVolume
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'サジェストの取得中にエラーが発生しました' });
  }
}

// Googleのサジェストキーワードを取得する関数
async function fetchGoogleSuggestions(keyword, region) {
  try {
    // Google検索のサジェストURL
    // regionに基づいてURLを変更
    const baseUrl = region === 'us' 
      ? 'https://www.google.com/complete/search' 
      : `https://www.google.co.${region}/complete/search`;
    
    // クエリパラメータ
    const params = new URLSearchParams({
      q: keyword,
      client: 'firefox',
      hl: region === 'us' ? 'en' : 'ja'
    });
    
    // リクエストを送信
    const response = await fetch(`${baseUrl}?${params}`);
    const data = await response.json();
    
    // 結果の配列を返す（最初の要素はクエリ自体、2番目の要素がサジェスト）
    return data[1] || [];
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
    
    // 単語数をカウント
    const wordCount = suggestedKeyword.split(' ').length;
    
    // 3語以上のキーワードと、base keywordとは異なるものを抽出
    if (wordCount >= 3 && suggestedKeyword !== baseKeyword) {
      longTailSuggestions.push({
        keyword: suggestedKeyword,
        searchVolume: suggestion.searchVolume * 0.8 // ロングテールは通常、検索ボリュームが低い
      });
    }
  }
  
  // 組み合わせからロングテールを生成
  const commonPhrases = ['方法', 'やり方', 'とは', '違い', '比較', 'おすすめ', '使い方', '意味'];
  
  for (const phrase of commonPhrases) {
    if (longTailSuggestions.length >= 15) break; // 最大15件に制限
    
    const newKeyword = `${baseKeyword} ${phrase}`;
    longTailSuggestions.push({
      keyword: newKeyword,
      searchVolume: generateSearchVolume(newKeyword)
    });
  }
  
  return longTailSuggestions;
} 