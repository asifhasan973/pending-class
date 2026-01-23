import React, { useState, useEffect, useRef } from 'react';

function AddSuperTabModal({ isOpen, onClose, onSubmit, editMode, initialName }) {
    const [name, setName] = useState(initialName || '');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setName(initialName || '');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, initialName]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onSubmit(name.trim());
            setName('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>{editMode ? 'Rename Folder' : 'Create New Folder'}</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Enter folder name..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={30}
                    />
                    <div className="modal-actions">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" className="primary" disabled={!name.trim()}>
                            {editMode ? 'Save' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddSuperTabModal;
