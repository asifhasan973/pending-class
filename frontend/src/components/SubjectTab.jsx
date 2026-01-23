import React from 'react';

function SubjectTab({ subject, count, isActive, onClick, onDragStart, onDragEnd, isDragging }) {
    return (
        <button
            className={`tab subject-tab ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
            onClick={onClick}
            draggable="true"
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', subject);
                e.dataTransfer.effectAllowed = 'move';
                onDragStart(subject);
            }}
            onDragEnd={onDragEnd}
        >
            {subject} ({count})
        </button>
    );
}

export default SubjectTab;
