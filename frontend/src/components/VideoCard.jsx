import React from 'react';

function VideoCard({
    video,
    onRemove,
    onFinish,
    onRestore,
    isFinished,
    selectionMode,
    isSelected,
    onToggleSelect
}) {
    const formatDate = (dateString) => {
        if (!dateString) return 'No date';
        const date = new Date(dateString);
        return isNaN(date) ? 'No date' : date.toDateString();
    };

    // Handle click on the card or thumbnail in selection mode
    const handleCardClick = (e) => {
        if (selectionMode && onToggleSelect) {
            e.preventDefault();
            e.stopPropagation();
            onToggleSelect(video.id);
        }
    };

    return (
        <div
            className={`video ${isSelected ? 'selected' : ''} ${isFinished ? 'finished' : ''} ${selectionMode ? 'selection-mode' : ''}`}
            onClick={handleCardClick}
        >
            {/* Selection checkbox overlay */}
            {selectionMode && (
                <div className="selection-checkbox" onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(video.id);
                }}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(video.id)}
                    />
                </div>
            )}

            {/* Finished badge */}
            {isFinished && (
                <div className="finished-badge">✓ Finished</div>
            )}

            <div className="thumb" onClick={handleCardClick}>
                {selectionMode ? (
                    <img
                        src={video.thumbnail || ''}
                        alt={video.title || 'Thumbnail'}
                        loading="lazy"
                        style={{ cursor: 'pointer' }}
                    />
                ) : (
                    <a href={video.url} target="_blank" rel="noopener">
                        <img
                            src={video.thumbnail || ''}
                            alt={video.title || 'Thumbnail'}
                            loading="lazy"
                        />
                    </a>
                )}
            </div>
            <div className="info">
                <div className="titleline">{video.title || '(No title)'}</div>
                <div className="meta">
                    {formatDate(video.publishedAt)}
                    {video.finishedAt && (
                        <span className="finished-date"> • Finished {formatDate(video.finishedAt)}</span>
                    )}
                </div>
                <div className="actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => window.open(video.url, '_blank', 'noopener')}>
                        Open
                    </button>
                    {isFinished ? (
                        <button type="button" className="restore" onClick={() => onRestore(video)}>
                            ↩ Restore
                        </button>
                    ) : (
                        <button type="button" className="success" onClick={() => onFinish(video)}>
                            ✓ Finish
                        </button>
                    )}
                    <button type="button" className="danger" onClick={onRemove}>
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
}

export default VideoCard;
