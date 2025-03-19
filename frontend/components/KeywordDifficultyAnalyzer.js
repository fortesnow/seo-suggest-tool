import React, { useState, useMemo } from 'react';
import styles from '../styles/KeywordDifficultyAnalyzer.module.css';

const KeywordDifficultyAnalyzer = ({ analysisResults, selectedCluster, onClusterSelect }) => {
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showReasoning, setShowReasoning] = useState(false);

  // 難易度分析データの取得
  const difficultyAnalysis = useMemo(() => {
    if (!analysisResults || !analysisResults.difficultyAnalysis) return [];
    return analysisResults.difficultyAnalysis;
  }, [analysisResults]);

  // クラスター情報の取得
  const clusters = useMemo(() => {
    if (!analysisResults || !analysisResults.clustering) return [];
    return analysisResults.clustering;
  }, [analysisResults]);

  // キーワードがどのクラスターに属しているかのマッピングを作成
  const keywordToClusterMap = useMemo(() => {
    const map = {};
    if (clusters && clusters.length > 0) {
      clusters.forEach(cluster => {
        if (cluster.keywords && Array.isArray(cluster.keywords)) {
          cluster.keywords.forEach(keyword => {
            map[keyword] = cluster.clusterName;
          });
        }
      });
    }
    return map;
  }, [clusters]);

  // ソート関数
  const sortedKeywords = useMemo(() => {
    if (!difficultyAnalysis || difficultyAnalysis.length === 0) return [];
    
    return [...difficultyAnalysis].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'keyword') {
        comparison = a.keyword.localeCompare(b.keyword);
      } else if (sortBy === 'score') {
        comparison = a.score - b.score;
      } else if (sortBy === 'difficulty') {
        const difficultyOrder = {
          'とても簡単': 1,
          '簡単': 2,
          '中程度': 3,
          '難しい': 4,
          'とても難しい': 5
        };
        comparison = (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0);
      } else if (sortBy === 'cluster') {
        comparison = (keywordToClusterMap[a.keyword] || '').localeCompare(keywordToClusterMap[b.keyword] || '');
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [difficultyAnalysis, sortBy, sortOrder, keywordToClusterMap]);
  
  // ソート順の切り替え処理
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  // 難易度に応じたスタイルを取得
  const getDifficultyClass = (difficulty) => {
    switch (difficulty) {
      case 'とても簡単': return styles.veryEasy;
      case '簡単': return styles.easy;
      case '中程度': return styles.moderate;
      case '難しい': return styles.difficult;
      case 'とても難しい': return styles.veryDifficult;
      default: return '';
    }
  };
  
  // スコアに応じたスタイルを取得
  const getScoreClass = (score) => {
    if (score <= 20) return styles.veryEasy;
    if (score <= 40) return styles.easy;
    if (score <= 60) return styles.moderate;
    if (score <= 80) return styles.difficult;
    return styles.veryDifficult;
  };
  
  // スコアに応じたゲージを描画
  const renderScoreGauge = (score) => {
    return (
      <div className={styles.scoreGauge}>
        <div 
          className={`${styles.scoreBar} ${getScoreClass(score)}`} 
          style={{ width: `${score}%` }}
        ></div>
        <span className={styles.scoreValue}>{score}</span>
      </div>
    );
  };
  
  // クラスターをクリックした時の処理
  const handleClusterClick = (clusterName) => {
    if (onClusterSelect && typeof onClusterSelect === 'function') {
      // 同じクラスターを再度クリックした場合は選択を解除
      onClusterSelect(selectedCluster === clusterName ? null : clusterName);
    }
  };
  
  // 選択されたクラスターに基づいてフィルタリング
  const filteredKeywords = useMemo(() => {
    if (!selectedCluster) return sortedKeywords;
    
    return sortedKeywords.filter(item => keywordToClusterMap[item.keyword] === selectedCluster);
  }, [sortedKeywords, selectedCluster, keywordToClusterMap]);
  
  if (!analysisResults || !difficultyAnalysis || difficultyAnalysis.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>キーワード難易度分析</h2>
        <div className={styles.emptyState}>
          <p>分析データがありません。キーワード分析を実行してください。</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>キーワード難易度分析</h2>
        <div className={styles.controls}>
          <div className={styles.sortControls}>
            <span>並べ替え:</span>
            <button 
              className={`${styles.sortButton} ${sortBy === 'keyword' ? styles.active : ''}`}
              onClick={() => handleSort('keyword')}
            >
              キーワード {sortBy === 'keyword' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
              className={`${styles.sortButton} ${sortBy === 'score' ? styles.active : ''}`}
              onClick={() => handleSort('score')}
            >
              スコア {sortBy === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
              className={`${styles.sortButton} ${sortBy === 'difficulty' ? styles.active : ''}`}
              onClick={() => handleSort('difficulty')}
            >
              難易度 {sortBy === 'difficulty' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
              className={`${styles.sortButton} ${sortBy === 'cluster' ? styles.active : ''}`}
              onClick={() => handleSort('cluster')}
            >
              クラスター {sortBy === 'cluster' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
          <button 
            className={`${styles.toggleButton} ${showReasoning ? styles.active : ''}`}
            onClick={() => setShowReasoning(!showReasoning)}
          >
            {showReasoning ? '理由を隠す' : '理由を表示'}
          </button>
        </div>
      </div>
      
      <div className={styles.info}>
        <p>
          <span className={`${styles.difficultyLabel} ${styles.veryEasy}`}>とても簡単 (0-20)</span>
          <span className={`${styles.difficultyLabel} ${styles.easy}`}>簡単 (21-40)</span>
          <span className={`${styles.difficultyLabel} ${styles.moderate}`}>中程度 (41-60)</span>
          <span className={`${styles.difficultyLabel} ${styles.difficult}`}>難しい (61-80)</span>
          <span className={`${styles.difficultyLabel} ${styles.veryDifficult}`}>とても難しい (81-100)</span>
        </p>
        {selectedCluster && (
          <div className={styles.selectedCluster}>
            <p>選択中のクラスター: <strong>{selectedCluster}</strong></p>
            <button className={styles.clearButton} onClick={() => onClusterSelect(null)}>
              クリア
            </button>
          </div>
        )}
      </div>
      
      <div className={styles.keywordList}>
        {filteredKeywords.length === 0 ? (
          <div className={styles.emptyState}>
            <p>条件に一致するキーワードがありません。</p>
          </div>
        ) : (
          <>
            <div className={styles.keywordHeader}>
              <div className={styles.keywordCol}>キーワード</div>
              <div className={styles.scoreCol}>難易度スコア</div>
              <div className={styles.difficultyCol}>難易度</div>
              <div className={styles.clusterCol}>クラスター</div>
            </div>
            
            {filteredKeywords.map((item, index) => (
              <div key={index} className={styles.keywordItem}>
                <div className={styles.keywordCol}>
                  <span className={`${styles.keyword} ${item.keyword === analysisResults.mainKeyword ? styles.mainKeyword : ''}`}>
                    {item.keyword === analysisResults.mainKeyword ? `${item.keyword} (メイン)` : item.keyword}
                  </span>
                </div>
                <div className={styles.scoreCol}>
                  {renderScoreGauge(item.score)}
                </div>
                <div className={styles.difficultyCol}>
                  <span className={`${styles.difficultyBadge} ${getDifficultyClass(item.difficulty)}`}>
                    {item.difficulty}
                  </span>
                </div>
                <div className={styles.clusterCol}>
                  {keywordToClusterMap[item.keyword] && (
                    <span 
                      className={`${styles.clusterBadge} ${selectedCluster === keywordToClusterMap[item.keyword] ? styles.selectedClusterBadge : ''}`}
                      onClick={() => handleClusterClick(keywordToClusterMap[item.keyword])}
                    >
                      {keywordToClusterMap[item.keyword]}
                    </span>
                  )}
                </div>
                {showReasoning && item.reasoning && (
                  <div className={styles.reasoningCol}>
                    <p className={styles.reasoning}>{item.reasoning}</p>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default KeywordDifficultyAnalyzer; 