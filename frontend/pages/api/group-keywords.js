// /api/group-keywords.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '許可されていないメソッドです' });
  }

  try {
    const { keywords } = req.body;
    
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: 'キーワードの配列が必要です' });
    }

    // バックエンドAPIのURLを環境変数から取得
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${apiUrl}/api/group-keywords`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keywords }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`バックエンドAPIエラー (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('キーワードグルーピングAPI呼び出し中にエラーが発生しました:', error);
    return res.status(500).json({ 
      error: 'キーワードのグルーピングに失敗しました', 
      details: error.message 
    });
  }
} 