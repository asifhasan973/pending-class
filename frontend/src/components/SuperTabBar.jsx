import React, { useState } from 'react';

function SuperTabBar({
    superTabs,
    expandedSuperTab,
    onToggleExpand,
    onAddClick,
    onDrop,
    onRename,
    onDelete,
    onRemoveSubject,
    onSubjectClick,
    draggedSubject,
    subjectCounts
}) {
    const [dragOverId, setDragOverId] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    const handleDragOver = (e, superTabId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverId(superTabId);
    };

    const handleDragLeave = () => {
        setDragOverId(null);
    };

    const handleDrop = (e, superTabId) => {
        e.preventDefault();
        const subject = e.dataTransfer.getData('text/plain');
        if (subject) {
            onDrop(superTabId, subject);
        }
        setDragOverId(null);
    };

    const handleContextMenu = (e, superTab) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            superTab
        });
    };

    const closeContextMenu = () => {
        setContextMenu(null);
    };

    const getTotalCount = (superTab) => {
        return superTab.subjects.reduce((total, subject) => {
            return total + (subjectCounts.get(subject) || 0);
        }, 0);
    };

    return (
        <div className="super-tabs-section">
            <div className="super-tabs-bar">
                <button
                    className="add-super-tab-btn"
                    onClick={onAddClick}
                    title="Create new folder"
                >
                    <span className="plus-icon">+</span>
                    <span className="btn-text">New Folder</span>
                </button>

                {superTabs.map(superTab => (
                    <div
                        key={superTab.id}
                        className={`super-tab ${expandedSuperTab === superTab.id ? 'expanded' : ''} ${dragOverId === superTab.id ? 'drag-over' : ''}`}
                        onClick={() => onToggleExpand(superTab.id)}
                        onDragOver={(e) => handleDragOver(e, superTab.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, superTab.id)}
                        onContextMenu={(e) => handleContextMenu(e, superTab)}
                    >
                        <span className="folder-icon">{expandedSuperTab === superTab.id ? '📂' : '📁'}</span>
                        <span className="super-tab-name">{superTab.name}</span>
                        <span className="super-tab-count">({getTotalCount(superTab)})</span>
                        {superTab.subjects.length > 0 && (
                            <span className="subject-count-badge">{superTab.subjects.length}</span>
                        )}
                    </div>
                ))}
            </div>

            {/* Expanded super tab contents */}
            {expandedSuperTab && (
                <div className="super-tab-contents">
                    {superTabs.find(st => st.id === expandedSuperTab)?.subjects.map(subject => (
                        <div
                            key={subject}
                            className="contained-subject clickable"
                            draggable="true"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onSubjectClick) onSubjectClick(subject);
                            }}
                            onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', subject);
                                e.dataTransfer.setData('fromSuperTab', expandedSuperTab);
                            }}
                        >
                            <span>{subject} ({subjectCounts.get(subject) || 0})</span>
                            <button
                                className="remove-from-folder-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveSubject(expandedSuperTab, subject);
                                }}
                                title="Remove from folder"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    {superTabs.find(st => st.id === expandedSuperTab)?.subjects.length === 0 && (
                        <div className="empty-folder-hint">
                            Drag subject tabs here to organize
                        </div>
                    )}
                </div>
            )}

            {/* Context Menu */}
            {contextMenu && (
                <>
                    <div className="context-menu-overlay" onClick={closeContextMenu} />
                    <div
                        className="context-menu"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                    >
                        <button onClick={() => {
                            onRename(contextMenu.superTab);
                            closeContextMenu();
                        }}>
                            ✏️ Rename
                        </button>
                        <button onClick={() => {
                            onDelete(contextMenu.superTab.id);
                            closeContextMenu();
                        }} className="danger">
                            🗑️ Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default SuperTabBar;
