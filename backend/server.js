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
      return res.json({ suggestions });
    } else {
      return res.json({ suggestions: [] });
    }
  } catch (error) {
    console.error('サジェスト取得エラー:', error);
    res.status(500).json({ error: 'サジェストの取得に失敗しました' });
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