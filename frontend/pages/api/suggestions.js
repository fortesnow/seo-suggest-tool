export default async function handler(req, res) {
  try {
    const { keyword, region = 'jp' } = req.query;
    
    if (!keyword) {
      return res.status(200).json({ 
        suggestions: [],
        success: true,
        isEmpty: true
      });
    }
    
    console.log(`[API] キーワード検索: "${keyword}", リージョン: ${region}`);
    
    // バックエンドAPIのURLを環境変数から取得
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    console.log(`[API] バックエンドURL: ${apiUrl}`);
    
    try {
      // Googleサジェスト取得
      const googleResponse = await fetch(
        `${apiUrl}/api/google-suggestions?keyword=${encodeURIComponent(keyword)}&region=${region}`,
        { 
          headers: { 'Accept': 'application/json' },
          // タイムアウト設定を追加
          signal: AbortSignal.timeout(5000)
        }
      );
      
      if (googleResponse.ok) {
        const googleData = await googleResponse.json();
        console.log(`[API] Googleデータ取得成功:`, googleData);
        
        // 有効なデータが返された場合
        if (googleData && googleData.suggestions && googleData.suggestions.length > 0) {
          res.setHeader('Cache-Control', 'max-age=0, s-maxage=86400');
          return res.status(200).json({
            suggestions: googleData.suggestions,
            success: true
          });
        }
      }
      
      // レスポンスが正常でないか、有効なデータがない場合はモックデータにフォールバック
      throw new Error('有効な検索結果がありません - モックデータを使用します');
      
    } catch (apiError) {
      console.warn('APIエラー - モックデータにフォールバック:', apiError.message);
      // APIエラーの場合はモックデータを使用
      const mockSuggestions = generateMockSuggestions(keyword, 15);
      
      res.setHeader('Cache-Control', 'max-age=0, s-maxage=3600');
      return res.status(200).json({
        suggestions: mockSuggestions,
        success: true,
        isMock: true
      });
    }
    
  } catch (error) {
    console.error('サジェスト取得エラー:', error);
    
    // 最終的なフォールバック: 最低限のモックデータを生成
    const lastResortMockSuggestions = generateMockSuggestions(req.query.keyword || '検索', 5);
    
    res.status(200).json({ 
      suggestions: lastResortMockSuggestions,
      success: true,
      isMock: true,
      isLastResort: true
    });
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

// モックサジェスト生成関数の強化
function generateMockSuggestions(baseKeyword, count) {
  // 基本キーワードがnullや空文字の場合は、デフォルト値を使用
  const keyword = baseKeyword && baseKeyword.trim() !== '' ? baseKeyword : '検索';
  console.log(`モックデータ生成: "${keyword}" の ${count} 件`);
  
  // 一般的な関連キーワード（日本語）
  const commonSuffixes = [
    'とは', 'やり方', '方法', '意味', 
    'おすすめ', 'ランキング', '比較', '違い', 
    '最新', '2024', '使い方', 'アプリ', 
    '無料', 'サービス', '対策', '例', 
    'メリット', 'デメリット', '費用', '相場',
    'プロ', '初心者', '入門', 'コツ'
  ];
  
  // 結果配列
  const suggestions = [];
  
  // ベースキーワードをそのまま追加（検索量を多めに）
  suggestions.push({
    keyword: keyword,
    volume: Math.floor(Math.random() * 5000) + 5000
  });
  
  // サフィックスを付けたパターンを追加
  for (let i = 0; i < Math.min(count - 1, commonSuffixes.length); i++) {
    const newKeyword = `${keyword} ${commonSuffixes[i]}`;
    
    suggestions.push({
      keyword: newKeyword,
      volume: Math.floor(Math.random() * 3000) + 500
    });
  }
  
  // カウント数が足りない場合はランダム組み合わせで補う
  while (suggestions.length < count) {
    const randomSuffix1 = commonSuffixes[Math.floor(Math.random() * commonSuffixes.length)];
    const randomSuffix2 = commonSuffixes[Math.floor(Math.random() * commonSuffixes.length)];
    
    if (randomSuffix1 === randomSuffix2) continue; // 同じサフィックスの組み合わせは避ける
    
    const newKeyword = `${keyword} ${randomSuffix1} ${randomSuffix2}`;
    
    // 重複チェック
    if (!suggestions.some(s => s.keyword === newKeyword)) {
      suggestions.push({
        keyword: newKeyword,
        volume: Math.floor(Math.random() * 1000) + 100 // 長いキーワードは検索量を少なめに
      });
    }
  }
  
  return suggestions;
} 