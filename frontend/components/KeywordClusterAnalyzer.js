import React, { useState, useMemo, useEffect } from 'react';
import styles from '../styles/KeywordClusterAnalyzer.module.css';

const KeywordClusterAnalyzer = ({ analysisResults, selectedCluster, onClusterSelect }) => {
  const [clusters, setClusters] = useState([]);
  const [selectedClusters, setSelectedClusters] = useState([]);
  const [clusterColors, setClusterColors] = useState({});

  // クラスター情報の取得と色の設定
  useEffect(() => {
    if (analysisResults && analysisResults.clustering && analysisResults.clustering.length > 0) {
      setClusters(analysisResults.clustering);
      
      // 選択されているクラスターがあれば設定
      if (selectedCluster) {
        setSelectedClusters([selectedCluster]);
      } else {
        setSelectedClusters([]);
      }
      
      // クラスターごとにランダムな色を割り当て
      const colors = {};
      const colorList = [
        '#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', 
        '#6366f1', '#ef4444', '#14b8a6', '#f97316', '#8b5cf6'
      ];
      
      analysisResults.clustering.forEach((cluster, index) => {
        colors[cluster.clusterName] = colorList[index % colorList.length];
      });
      
      setClusterColors(colors);
    }
  }, [analysisResults, selectedCluster]);

  // クラスター選択時の処理
  const handleClusterSelect = (clusterName) => {
    if (onClusterSelect && typeof onClusterSelect === 'function') {
      onClusterSelect(clusterName);
    }
    
    // 内部の選択状態も更新
    setSelectedClusters([clusterName]);
  };

  // 全キーワード数を計算
  const totalKeywords = useMemo(() => {
    let count = 0;
    if (clusters && clusters.length > 0) {
      clusters.forEach(cluster => {
        if (cluster.keywords && Array.isArray(cluster.keywords)) {
          count += cluster.keywords.length;
        }
      });
    }
    return count;
  }, [clusters]);

  // クラスターごとのキーワード割合を計算
  const getClusterPercentage = (keywordCount) => {
    if (totalKeywords === 0) return 0;
    return Math.round((keywordCount / totalKeywords) * 100);
  };

  if (!analysisResults || !analysisResults.clustering || analysisResults.clustering.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>キーワードクラスタリング</h2>
        <div className={styles.emptyState}>
          <p>クラスタリングデータがありません。キーワード分析を実行してください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>キーワードクラスタリング</h2>
      </div>

      <div className={styles.info}>
        <p>
          クラスタリングとは、関連性の高いキーワードをグループ化する分析手法です。
          同じクラスター内のキーワードは、検索意図や関連性が似ている傾向があります。
          コンテンツ作成の際に、同じクラスターに属するキーワードをまとめてカバーすると効果的です。
        </p>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statsCard}>
          <div className={styles.statsValue}>{clusters.length}</div>
          <div className={styles.statsLabel}>クラスター数</div>
        </div>
        <div className={styles.statsCard}>
          <div className={styles.statsValue}>{totalKeywords}</div>
          <div className={styles.statsLabel}>キーワード総数</div>
        </div>
        <div className={styles.statsCard}>
          <div className={styles.statsValue}>
            {selectedClusters.length > 0 ? 
              clusters.find(c => c.clusterName === selectedClusters[0])?.keywords?.length || 0 : 
              Math.round(totalKeywords / clusters.length)
            }
          </div>
          <div className={styles.statsLabel}>
            {selectedClusters.length > 0 ? '選択クラスター内' : '平均クラスターサイズ'}
          </div>
        </div>
      </div>

      <div className={styles.clusterOverview}>
        <h3>クラスター分布</h3>
        <div className={styles.clusterBars}>
          {clusters.map((cluster) => (
            <div 
              key={cluster.clusterName}
              className={`${styles.clusterBar} ${selectedClusters.includes(cluster.clusterName) ? styles.selected : ''}`}
              style={{ 
                width: `${getClusterPercentage(cluster.keywords.length)}%`,
                backgroundColor: clusterColors[cluster.clusterName] || '#e5e7eb',
                minWidth: '30px'
              }}
              onClick={() => handleClusterSelect(cluster.clusterName)}
              title={`${cluster.clusterName}: ${cluster.keywords.length}キーワード (${getClusterPercentage(cluster.keywords.length)}%)`}
            >
              <span className={styles.clusterBarLabel}>
                {getClusterPercentage(cluster.keywords.length)}%
              </span>
            </div>
          ))}
        </div>
        <div className={styles.clusterLabels}>
          {clusters.map((cluster) => (
            <div 
              key={cluster.clusterName} 
              className={`${styles.clusterLabel} ${selectedClusters.includes(cluster.clusterName) ? styles.selected : ''}`}
              onClick={() => handleClusterSelect(cluster.clusterName)}
            >
              <div 
                className={styles.clusterColorBox} 
                style={{ backgroundColor: clusterColors[cluster.clusterName] || '#e5e7eb' }}
              ></div>
              <span>{cluster.clusterName}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.clusterDetails}>
        <h3>クラスター詳細</h3>
        <div className={styles.clusterCards}>
          {selectedClusters.length > 0 ? (
            clusters
              .filter(cluster => selectedClusters.includes(cluster.clusterName))
              .map(cluster => (
                <div 
                  key={cluster.clusterName} 
                  className={styles.clusterCard}
                  style={{ borderColor: clusterColors[cluster.clusterName] || '#e5e7eb' }}
                >
                  <div 
                    className={styles.clusterCardHeader}
                    style={{ backgroundColor: clusterColors[cluster.clusterName] || '#e5e7eb' }}
                  >
                    <h4>{cluster.clusterName}</h4>
                    <div className={styles.clusterStats}>
                      {cluster.keywords.length}キーワード 
                      ({getClusterPercentage(cluster.keywords.length)}%)
                    </div>
                  </div>
                  <div className={styles.clusterCardContent}>
                    <div className={styles.clusterIntent}>
                      <strong>検索意図:</strong> {cluster.searchIntent}
                    </div>
                    <div className={styles.keywordTags}>
                      {cluster.keywords.map((keyword, index) => (
                        <span 
                          key={index} 
                          className={`${styles.keywordTag} ${keyword === analysisResults.mainKeyword ? styles.mainKeyword : ''}`}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button 
                    className={styles.deselectButton}
                    onClick={() => onClusterSelect(null)}
                  >
                    選択解除
                  </button>
                </div>
              ))
          ) : (
            <div className={styles.selectPrompt}>
              <p>クラスターを選択すると、詳細情報が表示されます。</p>
              <div className={styles.quickSelectButtons}>
                {clusters.slice(0, 4).map(cluster => (
                  <button 
                    key={cluster.clusterName}
                    className={styles.quickSelectButton}
                    style={{ backgroundColor: clusterColors[cluster.clusterName] || '#e5e7eb' }}
                    onClick={() => handleClusterSelect(cluster.clusterName)}
                  >
                    {cluster.clusterName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.usageTips}>
        <h3>活用のヒント</h3>
        <ul>
          <li>同じクラスター内のキーワードは、1つのコンテンツでまとめて対応すると効率的です。</li>
          <li>クラスターごとに異なるページやセクションを作成することで、検索意図に合わせたコンテンツ構成ができます。</li>
          <li>メインキーワードを含むクラスターを優先的に対応することで、関連キーワードで上位表示される可能性が高まります。</li>
        </ul>
      </div>
    </div>
  );
};

export default KeywordClusterAnalyzer; 