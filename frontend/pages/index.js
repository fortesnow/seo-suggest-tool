import { useState, useEffect } from 'react';
import axios from 'axios';
import Head from 'next/head';
import SearchForm from '../components/SearchForm';
import SuggestionList from '../components/SuggestionList';
import styles from '../styles/Home.module.css';
import Sidebar from '../components/Sidebar';
import NeedsAnalysis from '../components/NeedsAnalysis';
import ProjectManager from '../components/ProjectManager';
import Dashboard from '../components/Dashboard';
import KeywordClusterView from '../components/KeywordClusterView';

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [region, setRegion] = useState('jp');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [analyzeMode, setAnalyzeMode] = useState(false);
  const [showClusters, setShowClusters] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'projects', 'dashboard'
  const [currentProject, setCurrentProject] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // 初期化時に検索履歴をローカルストレージから読み込む
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('検索履歴の読み込みに失敗しました', e);
        setSearchHistory([]);
      }
    }
  }, []);

  // モバイルメニューの切り替え
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const fetchSuggestions = async (searchKeyword, searchRegion) => {
    setLoading(true);
    setError(null);
    
    // モバイル表示の場合、サイドバーを閉じる
    setIsMobileMenuOpen(false);
    
    try {
      // キーワードを適切にエンコード
      let normalizedKeyword = searchKeyword.trim();
      let encodedKeyword = '';
      
      // すでにエンコードされている場合はデコードしてから再エンコード（二重エンコードを防止）
      try {
        if (normalizedKeyword.includes('%')) {
          normalizedKeyword = decodeURIComponent(normalizedKeyword);
        }
        // 日本語などの非ASCII文字を適切に処理
        encodedKeyword = encodeURIComponent(normalizedKeyword);
      } catch (e) {
        console.error('キーワードエンコード中にエラーが発生しました:', e);
        encodedKeyword = encodeURIComponent(searchKeyword.trim());
      }
      
      console.log('検索キーワード:', searchKeyword);
      console.log('正規化後:', normalizedKeyword);
      console.log('エンコード後:', encodedKeyword);
      
      // 完全なURLを構築（ローカル環境とVercel環境の両方で動作するように）
      const apiUrl = `${window.location.origin}/api/suggestions?keyword=${encodedKeyword}&region=${searchRegion}`;
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`サーバーからのレスポンスにエラーがありました (${response.status})`);
      }
      
      // レスポンスヘッダーを確認
      const contentType = response.headers.get('content-type');
      console.log('レスポンスタイプ:', contentType);
      
      const data = await response.json();
      console.log('検索結果データ:', data);
      
      // データ内の文字列を確認してエンコードされているものがあれば修正
      if (data.suggestions) {
        data.suggestions = data.suggestions.map(item => ({
          ...item,
          keyword: ensureCorrectEncoding(item.keyword)
        }));
      }
      
      if (data.longTailKeywords) {
        data.longTailKeywords = data.longTailKeywords.map(item => ({
          ...item,
          keyword: ensureCorrectEncoding(item.keyword)
        }));
      }
      
      setResults(data);
      // 検索後に選択キーワードを更新
      setKeyword(searchKeyword);
      setRegion(searchRegion);
      
      // 検索履歴に追加
      addToSearchHistory(searchKeyword);
      
      // 検索タブをアクティブに
      setActiveTab('search');

      setSuggestions(data.suggestions);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError(err.message || 'キーワード候補の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  // 検索履歴に追加する関数
  const addToSearchHistory = (searchKeyword) => {
    if (!searchKeyword || !searchKeyword.trim()) return;
    
    // すでに同じキーワードが履歴にある場合は最新に更新するため一度削除
    const filteredHistory = searchHistory.filter(item => item !== searchKeyword);
    
    // 新しいキーワードを先頭に追加
    const newHistory = [searchKeyword, ...filteredHistory].slice(0, 15);
    
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };
  
  // 文字列のエンコーディングを修正する関数
  const ensureCorrectEncoding = (str) => {
    if (!str) return '';
    
    try {
      // 文字化けの代表的な文字を検出
      if (str.includes('\uFFFD') || /%.{2}/.test(str)) {
        // エンコードされている可能性がある
        return decodeURIComponent(str);
      }
      return str;
    } catch (e) {
      console.error('文字列処理エラー:', e);
      return str;
    }
  };

  // キーワードが選択されたときのハンドラー
  const handleKeywordSelect = (keyword, shouldAnalyze = false) => {
    console.log(`Selected keyword: ${keyword}, analyze: ${shouldAnalyze}`);
    setSelectedKeyword(keyword);
    
    // 分析モードフラグを設定
    setAnalyzeMode(shouldAnalyze);
    
    // 分析モードでなければ、そのキーワードで検索を実行
    if (!shouldAnalyze) {
      setKeyword(keyword);
      fetchSuggestions(keyword, region);
    }
    
    // キーワード分析セクションへスクロール
    if (shouldAnalyze) {
      setTimeout(() => {
        const needsAnalysisSection = document.getElementById('needs-analysis-section');
        if (needsAnalysisSection) {
          needsAnalysisSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };
  
  // プロジェクトが選択されたときのハンドラー
  const handleProjectSelect = (project, projectKeyword = null) => {
    setCurrentProject(project);
    
    // プロジェクトからキーワードが選択された場合、検索を実行
    if (projectKeyword) {
      setKeyword(projectKeyword);
      fetchSuggestions(projectKeyword, region);
    }
  };

  // クラスタービューの切り替え
  const toggleClusterView = () => {
    setShowClusters(!showClusters);
  };
  
  // キーワードを選択したときの処理
  const handleSelectKeywordFromCluster = (keyword) => {
    setSelectedKeyword(keyword);
    // 必要であれば、クラスター表示を閉じる
    // setShowClusters(false);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>SEO検索サジェストツール</title>
        <meta name="description" content="SEO検索サジェストツール - キーワード候補を素早く見つける" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <button 
        className={styles.mobileMenuToggle} 
        onClick={toggleMobileMenu}
        aria-label="メニューを開く"
      >
        <span className={styles.hamburger}></span>
      </button>

      <main className={styles.main}>
        <div className={`${styles.layout} ${isMobileMenuOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarContainer}>
            <Sidebar 
              onSearch={fetchSuggestions} 
              initialKeyword={keyword} 
              initialRegion={region}
              suggestions={suggestions}
            />
          </div>
          
          <div className={styles.content}>
            <div className={styles.tabContainer}>
              <div className={styles.tabs}>
                <button 
                  className={`${styles.tab} ${activeTab === 'search' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('search')}
                >
                  <span className={styles.tabIcon}>🔍</span>
                  キーワード検索
                </button>
                <button 
                  className={`${styles.tab} ${activeTab === 'projects' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('projects')}
                >
                  <span className={styles.tabIcon}>📁</span>
                  プロジェクト管理
                </button>
                <button 
                  className={`${styles.tab} ${activeTab === 'dashboard' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <span className={styles.tabIcon}>📊</span>
                  ダッシュボード
                </button>
              </div>
            </div>
            
            <h1 className={styles.title}>
              SEO<span className={styles.highlight}>検索サジェスト</span>ツール
            </h1>
            
            {activeTab === 'search' && (
              <>
                <SearchForm 
                  keyword={keyword} 
                  setKeyword={setKeyword} 
                  region={region}
                  setRegion={setRegion}
                  onSearch={fetchSuggestions}
                />
                
                {error && (
                  <div className={styles.error}>
                    <p>エラー: {error}</p>
                  </div>
                )}
                
                {loading ? (
                  <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>キーワード候補を取得中...</p>
                  </div>
                ) : (
                  results && (
                    <>
                      {showClusters && (
                        <KeywordClusterView 
                          suggestions={results.suggestions} 
                          onSelectKeyword={handleSelectKeywordFromCluster}
                        />
                      )}
                    
                      <div className={styles.resultsActions}>
                        <button 
                          className={`${styles.actionButton} ${analyzeMode ? styles.activeButton : ''}`}
                          onClick={() => setAnalyzeMode(!analyzeMode)}
                        >
                          ニーズ分析 {analyzeMode ? '非表示' : '表示'}
                        </button>
                        <button 
                          className={`${styles.actionButton} ${showClusters ? styles.activeButton : ''}`}
                          onClick={toggleClusterView}
                        >
                          グループ表示 {showClusters ? '非表示' : '表示'}
                        </button>
                      </div>
                                            
                      <SuggestionList 
                        results={results} 
                        onKeywordSelect={handleKeywordSelect}
                      />
                      
                      <div id="needs-analysis-section">
                        <NeedsAnalysis 
                          keyword={analyzeMode ? selectedKeyword : keyword}
                          autoAnalyze={analyzeMode}
                        />
                      </div>
                    </>
                  )
                )}
              </>
            )}
            
            {activeTab === 'projects' && (
              <ProjectManager 
                onProjectSelect={handleProjectSelect}
                currentKeyword={keyword}
              />
            )}
            
            {activeTab === 'dashboard' && (
              <Dashboard 
                searchHistory={searchHistory}
                currentProject={currentProject}
              />
            )}
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} SEO検索サジェストツール All rights reserved.</p>
      </footer>
    </div>
  );
} 