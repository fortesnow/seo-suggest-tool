import React, { useState, useEffect } from 'react';
import styles from '../styles/KeywordClusterView.module.css';

const KeywordClusterView = ({ suggestions, onSelectKeyword }) => {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCluster, setActiveCluster] = useState(null);

  useEffect(() => {
    if (suggestions && suggestions.length > 0) {
      groupKeywords(suggestions.map(s => s.keyword));
    }
  }, [suggestions]);

  const groupKeywords = async (keywords) => {
    if (!keywords || keywords.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('グルーピング用キーワード:', keywords);
      const response = await fetch('/api/group-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywords }),
      });
      
      if (!response.ok) {
        throw new Error('グルーピングAPIからのレスポンスにエラーがありました');
      }
      
      const data = await response.json();
      console.log('グルーピング結果:', data);
      
      if (data.success && data.groups) {
        setClusters(data.groups);
      } else {
        setError('グルーピング結果が無効です');
      }
    } catch (err) {
      console.error('キーワードのグルーピング中にエラーが発生しました:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClusterClick = (index) => {
    setActiveCluster(activeCluster === index ? null : index);
  };

  const handleKeywordClick = (keyword) => {
    if (onSelectKeyword) {
      onSelectKeyword(keyword);
    }
  };

  if (loading) {
    return <div className={styles.loading}>キーワードをグループ化しています...</div>;
  }

  if (error) {
    return <div className={styles.error}>エラー: {error}</div>;
  }

  if (!clusters || clusters.length === 0) {
    return <div className={styles.empty}>グループ化できるキーワードがありません</div>;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>関連キーワードグループ</h3>
      <p className={styles.description}>
        意味的に関連するキーワードがグループ化されています。グループをクリックして詳細を表示できます。
      </p>
      
      <div className={styles.clusterContainer}>
        {clusters.map((cluster, index) => (
          <div 
            key={index} 
            className={`${styles.cluster} ${activeCluster === index ? styles.active : ''}`}
            onClick={() => handleClusterClick(index)}
          >
            <div className={styles.clusterHeader}>
              <h4 className={styles.clusterTitle}>{cluster.label}</h4>
              <span className={styles.keywordCount}>{cluster.keywords.length}キーワード</span>
            </div>
            
            {activeCluster === index && (
              <div className={styles.keywordList}>
                {cluster.keywords.map((keyword, kidx) => (
                  <div 
                    key={kidx}
                    className={styles.keyword}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleKeywordClick(keyword);
                    }}
                  >
                    {keyword}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeywordClusterView; 