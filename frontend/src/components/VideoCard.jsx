import React from 'react';

function VideoCard({ video, onRemove }) {
    const formatDate = (dateString) => {
        if (!dateString) return 'No date';
        const date = new Date(dateString);
        return isNaN(date) ? 'No date' : date.toDateString();
    };

    return (
        <div className="video">
            <div className="thumb">
                <a href={video.url} target="_blank" rel="noopener">
                    <img
                        src={video.thumbnail || ''}
                        alt={video.title || 'Thumbnail'}
                        loading="lazy"
                    />
                </a>
            </div>
            <div className="info">
                <div className="titleline">{video.title || '(No title)'}</div>
                <div className="meta">{formatDate(video.publishedAt)}</div>
                <div className="actions">
                    <button onClick={() => window.open(video.url, '_blank', 'noopener')}>
                        Open
                    </button>
                    <button className="danger" onClick={onRemove}>
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
}

export default VideoCard;
