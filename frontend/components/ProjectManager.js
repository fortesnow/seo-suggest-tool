import { useState, useEffect } from 'react';
import styles from '../styles/ProjectManager.module.css';

const ProjectManager = ({ onProjectSelect, currentKeyword }) => {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // ローカルストレージからプロジェクトを読み込む
  useEffect(() => {
    const savedProjects = localStorage.getItem('seoProjects');
    if (savedProjects) {
      try {
        const parsedProjects = JSON.parse(savedProjects);
        setProjects(parsedProjects);
      } catch (e) {
        console.error('プロジェクトの読み込みに失敗しました', e);
        setProjects([]);
      }
    }
  }, []);

  // プロジェクトが変更されたらローカルストレージに保存
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('seoProjects', JSON.stringify(projects));
    }
  }, [projects]);

  // 新しいプロジェクトを作成
  const createProject = () => {
    if (!newProjectName.trim()) return;
    
    const newProject = {
      id: Date.now().toString(),
      name: newProjectName.trim(),
      createdAt: new Date().toISOString(),
      keywords: [],
      lastUpdated: new Date().toISOString()
    };
    
    setProjects([...projects, newProject]);
    setNewProjectName('');
    setShowProjectForm(false);
    setSelectedProject(newProject);

    // 親コンポーネントに通知
    if (onProjectSelect) {
      onProjectSelect(newProject);
    }
  };

  // プロジェクトを選択
  const selectProject = (project) => {
    setSelectedProject(project);
    
    // 親コンポーネントに通知
    if (onProjectSelect) {
      onProjectSelect(project);
    }
  };

  // プロジェクトを削除
  const deleteProject = (projectId, e) => {
    e.stopPropagation(); // 選択イベントを防止
    
    if (window.confirm('このプロジェクトを削除してもよろしいですか？')) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
      
      // 現在選択されているプロジェクトが削除された場合
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(null);
        if (onProjectSelect) {
          onProjectSelect(null);
        }
      }
    }
  };

  // プロジェクト名を編集
  const editProjectName = (projectId, e) => {
    e.stopPropagation(); // 選択イベントを防止
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setEditingProject(project);
      setNewProjectName(project.name);
      setShowProjectForm(true);
    }
  };

  // プロジェクトを更新
  const updateProject = () => {
    if (!newProjectName.trim() || !editingProject) return;
    
    const updatedProjects = projects.map(p => {
      if (p.id === editingProject.id) {
        return {
          ...p,
          name: newProjectName.trim(),
          lastUpdated: new Date().toISOString()
        };
      }
      return p;
    });
    
    setProjects(updatedProjects);
    setNewProjectName('');
    setEditingProject(null);
    setShowProjectForm(false);
  };

  // 現在のキーワードをプロジェクトに追加
  const addCurrentKeywordToProject = () => {
    if (!selectedProject || !currentKeyword) return;
    
    // すでに同じキーワードがあるか確認
    if (selectedProject.keywords.includes(currentKeyword)) {
      alert('このキーワードはすでにプロジェクトに追加されています');
      return;
    }
    
    const updatedProjects = projects.map(p => {
      if (p.id === selectedProject.id) {
        return {
          ...p,
          keywords: [...p.keywords, currentKeyword],
          lastUpdated: new Date().toISOString()
        };
      }
      return p;
    });
    
    setProjects(updatedProjects);
    setIsAddingKeyword(false);
    
    // 更新されたプロジェクトを選択状態に設定
    const updatedProject = updatedProjects.find(p => p.id === selectedProject.id);
    setSelectedProject(updatedProject);
    
    alert(`キーワード「${currentKeyword}」をプロジェクト「${selectedProject.name}」に追加しました`);
  };

  // プロジェクトからキーワードを削除
  const removeKeywordFromProject = (projectId, keyword, e) => {
    e.stopPropagation(); // 選択イベントを防止
    
    const updatedProjects = projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          keywords: p.keywords.filter(k => k !== keyword),
          lastUpdated: new Date().toISOString()
        };
      }
      return p;
    });
    
    setProjects(updatedProjects);
    
    // 更新されたプロジェクトを選択状態に設定（選択中の場合）
    if (selectedProject && selectedProject.id === projectId) {
      const updatedProject = updatedProjects.find(p => p.id === projectId);
      setSelectedProject(updatedProject);
    }
  };

  // プロジェクトキーワードを使って検索
  const searchWithKeyword = (keyword) => {
    if (onProjectSelect) {
      onProjectSelect(selectedProject, keyword);
    }
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

  return (
    <div className={styles.projectManager}>
      <div className={styles.header}>
        <h3 className={styles.title}>プロジェクト管理</h3>
        <button 
          className={styles.addButton}
          onClick={() => {
            setEditingProject(null);
            setNewProjectName('');
            setShowProjectForm(!showProjectForm);
          }}
        >
          {showProjectForm ? '閉じる' : '新規プロジェクト'}
        </button>
      </div>

      {showProjectForm && (
        <div className={styles.projectForm}>
          <input
            type="text"
            placeholder="プロジェクト名を入力"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className={styles.projectInput}
          />
          <button 
            className={styles.saveButton}
            onClick={editingProject ? updateProject : createProject}
          >
            {editingProject ? '更新' : '作成'}
          </button>
        </div>
      )}

      {currentKeyword && selectedProject && (
        <div className={styles.addKeywordSection}>
          <button
            className={styles.addKeywordButton}
            onClick={addCurrentKeywordToProject}
          >
            現在のキーワードをプロジェクトに追加
          </button>
        </div>
      )}

      <div className={styles.projectList}>
        {projects.length === 0 ? (
          <div className={styles.emptyState}>
            プロジェクトを作成して、関連キーワードを整理しましょう
          </div>
        ) : (
          projects.map(project => (
            <div 
              key={project.id}
              className={`${styles.projectItem} ${selectedProject && selectedProject.id === project.id ? styles.selected : ''}`}
              onClick={() => selectProject(project)}
            >
              <div className={styles.projectHeader}>
                <h4 className={styles.projectName}>{project.name}</h4>
                <div className={styles.projectActions}>
                  <button 
                    className={styles.editButton}
                    onClick={(e) => editProjectName(project.id, e)}
                    title="プロジェクト名を編集"
                  >
                    編集
                  </button>
                  <button 
                    className={styles.deleteButton}
                    onClick={(e) => deleteProject(project.id, e)}
                    title="プロジェクトを削除"
                  >
                    削除
                  </button>
                </div>
              </div>
              <div className={styles.projectMeta}>
                作成: {formatDate(project.createdAt)}
                {project.lastUpdated !== project.createdAt && (
                  <span> | 更新: {formatDate(project.lastUpdated)}</span>
                )}
              </div>
              
              {project.keywords.length > 0 && (
                <div className={styles.keywordList}>
                  <h5 className={styles.keywordHeader}>キーワード ({project.keywords.length})</h5>
                  {project.keywords.map((keyword, index) => (
                    <div key={index} className={styles.keywordItem}>
                      <span 
                        className={styles.keyword}
                        onClick={(e) => {
                          e.stopPropagation();
                          searchWithKeyword(keyword);
                        }}
                      >
                        {keyword}
                      </span>
                      <button
                        className={styles.removeKeyword}
                        onClick={(e) => removeKeywordFromProject(project.id, keyword, e)}
                        title="キーワードを削除"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectManager; 