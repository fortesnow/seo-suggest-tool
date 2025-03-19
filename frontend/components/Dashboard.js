import { useState, useEffect } from 'react';
import styles from '../styles/Dashboard.module.css';

const Dashboard = ({ searchHistory, currentProject }) => {
  const [keywordStats, setKeywordStats] = useState({
    totalSearches: 0,
    uniqueKeywords: 0,
    topKeywords: [],
    averageSearchVolume: 0,
    recentSearches: [],
    volumeDistribution: {
      high: 0,
      medium: 0,
      low: 0
    }
  });

  // 検索履歴からデータを計算
  useEffect(() => {
    if (!searchHistory || searchHistory.length === 0) return;

    // 検索履歴の数値を集計
    const totalSearches = searchHistory.length;
    
    // ユニークキーワード数
    const uniqueKeywords = new Set(searchHistory).size;
    
    // 頻度でキーワードをカウント
    const keywordCounts = searchHistory.reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    }, {});
    
    // 人気のキーワードTop5
    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword, count]) => ({ keyword, count }));
    
    // 検索ボリューム（模擬データ - 実際のアプリではAPIから取得）
    const getRandomVolume = () => Math.floor(Math.random() * 10000);
    
    // ボリューム分布の計算
    const volumes = searchHistory.map(getRandomVolume);
    const averageSearchVolume = volumes.length > 0 
      ? Math.round(volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length) 
      : 0;
    
    // ボリューム分布
    const volumeDistribution = volumes.reduce((acc, volume) => {
      if (volume > 5000) acc.high++;
      else if (volume > 1000) acc.medium++;
      else acc.low++;
      return acc;
    }, { high: 0, medium: 0, low: 0 });
    
    // 最近の検索（最新5件）
    const recentSearches = [...searchHistory].reverse().slice(0, 5);
    
    setKeywordStats({
      totalSearches,
      uniqueKeywords,
      topKeywords,
      averageSearchVolume,
      recentSearches,
      volumeDistribution
    });
  }, [searchHistory]);

  // プロジェクトのキーワード統計
  const [projectStats, setProjectStats] = useState({
    totalProjects: 0,
    totalKeywords: 0,
    keywordsPerProject: 0,
    largestProject: { name: '', count: 0 }
  });

  // プロジェクトの統計を計算
  useEffect(() => {
    if (!currentProject) return;
    
    try {
      const savedProjects = localStorage.getItem('seoProjects');
      if (!savedProjects) return;
      
      const projects = JSON.parse(savedProjects);
      
      // プロジェクト統計の計算
      const totalProjects = projects.length;
      const totalKeywords = projects.reduce((sum, p) => sum + (p.keywords?.length || 0), 0);
      const keywordsPerProject = totalProjects > 0 ? (totalKeywords / totalProjects).toFixed(1) : 0;
      
      // 最大のプロジェクトを見つける
      let largestProject = { name: '', count: 0 };
      projects.forEach(p => {
        if ((p.keywords?.length || 0) > largestProject.count) {
          largestProject = { name: p.name, count: p.keywords?.length || 0 };
        }
      });
      
      setProjectStats({
        totalProjects,
        totalKeywords,
        keywordsPerProject,
        largestProject
      });
    } catch (error) {
      console.error('プロジェクト統計の計算中にエラーが発生しました', error);
    }
  }, [currentProject]);

  // 棒グラフの生成
  const renderBarChart = (data, max) => {
    return (
      <div className={styles.barChart}>
        {data.map((item, index) => (
          <div key={index} className={styles.barChartItem}>
            <div className={styles.barLabel}>{item.keyword}</div>
            <div className={styles.barContainer}>
              <div 
                className={styles.bar} 
                style={{ width: `${(item.count / max) * 100}%` }}
              ></div>
              <span className={styles.barValue}>{item.count}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 円グラフの生成
  const renderPieChart = () => {
    const { high, medium, low } = keywordStats.volumeDistribution;
    const total = high + medium + low;
    
    if (total === 0) return null;
    
    const highPercent = Math.round((high / total) * 100);
    const mediumPercent = Math.round((medium / total) * 100);
    const lowPercent = Math.round((low / total) * 100);
    
    return (
      <div className={styles.pieChartContainer}>
        <div className={styles.pieChart} style={{
          background: `conic-gradient(
            #4ade80 0% ${highPercent}%, 
            #fbbf24 ${highPercent}% ${highPercent + mediumPercent}%, 
            #94a3b8 ${highPercent + mediumPercent}% 100%
          )`
        }}></div>
        <div className={styles.pieLabels}>
          <div className={styles.pieLabel}>
            <span className={`${styles.pieDot} ${styles.highDot}`}></span>
            高ボリューム: {highPercent}%
          </div>
          <div className={styles.pieLabel}>
            <span className={`${styles.pieDot} ${styles.mediumDot}`}></span>
            中ボリューム: {mediumPercent}%
          </div>
          <div className={styles.pieLabel}>
            <span className={`${styles.pieDot} ${styles.lowDot}`}></span>
            低ボリューム: {lowPercent}%
          </div>
        </div>
      </div>
    );
  };

  // 日付のフォーマット
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 現在の日付を取得
  const today = formatDate(new Date());

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h2 className={styles.title}>SEOダッシュボード</h2>
        <div className={styles.date}>{today}</div>
      </div>
      
      <div className={styles.statsGrid}>
        {/* 検索統計 */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🔍</div>
          <div className={styles.statContent}>
            <h3 className={styles.statTitle}>総検索数</h3>
            <div className={styles.statValue}>{keywordStats.totalSearches}</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🔤</div>
          <div className={styles.statContent}>
            <h3 className={styles.statTitle}>ユニークキーワード</h3>
            <div className={styles.statValue}>{keywordStats.uniqueKeywords}</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statContent}>
            <h3 className={styles.statTitle}>平均検索ボリューム</h3>
            <div className={styles.statValue}>{keywordStats.averageSearchVolume.toLocaleString()}</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📁</div>
          <div className={styles.statContent}>
            <h3 className={styles.statTitle}>プロジェクト数</h3>
            <div className={styles.statValue}>{projectStats.totalProjects}</div>
          </div>
        </div>
      </div>
      
      <div className={styles.chartsGrid}>
        {/* 人気のキーワード */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>人気のキーワード</h3>
          {keywordStats.topKeywords.length > 0 ? (
            renderBarChart(keywordStats.topKeywords, Math.max(...keywordStats.topKeywords.map(k => k.count)))
          ) : (
            <div className={styles.emptyChart}>データがありません</div>
          )}
        </div>
        
        {/* 検索ボリューム分布 */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>検索ボリューム分布</h3>
          {keywordStats.totalSearches > 0 ? (
            renderPieChart()
          ) : (
            <div className={styles.emptyChart}>データがありません</div>
          )}
        </div>
      </div>
      
      <div className={styles.tablesGrid}>
        {/* 最近の検索 */}
        <div className={styles.tableCard}>
          <h3 className={styles.tableTitle}>最近の検索</h3>
          {keywordStats.recentSearches.length > 0 ? (
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>キーワード</th>
                    <th>推定ボリューム</th>
                  </tr>
                </thead>
                <tbody>
                  {keywordStats.recentSearches.map((keyword, index) => (
                    <tr key={index}>
                      <td>{keyword}</td>
                      <td>{Math.floor(Math.random() * 10000).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyTable}>検索履歴がありません</div>
          )}
        </div>
        
        {/* プロジェクト概要 */}
        <div className={styles.tableCard}>
          <h3 className={styles.tableTitle}>プロジェクト概要</h3>
          {projectStats.totalProjects > 0 ? (
            <div className={styles.projectStats}>
              <div className={styles.projectStat}>
                <span className={styles.projectStatLabel}>総キーワード数:</span>
                <span className={styles.projectStatValue}>{projectStats.totalKeywords}</span>
              </div>
              <div className={styles.projectStat}>
                <span className={styles.projectStatLabel}>プロジェクトあたりの平均:</span>
                <span className={styles.projectStatValue}>{projectStats.keywordsPerProject}</span>
              </div>
              {projectStats.largestProject.name && (
                <div className={styles.projectStat}>
                  <span className={styles.projectStatLabel}>最大プロジェクト:</span>
                  <span className={styles.projectStatValue}>
                    {projectStats.largestProject.name} ({projectStats.largestProject.count}キーワード)
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.emptyTable}>プロジェクトがありません</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 