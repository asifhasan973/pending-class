import React, { useState, useEffect, useCallback } from 'react';
import VideoCard from './components/VideoCard';
import Toast from './components/Toast';
import { useAPI } from './hooks/useAPI';
import { parseYouTubeId, subjectFromTitle, dateFromTitle } from './utils/youtubeUtils';

const PREFS_KEY = 'pendingClasses.prefs.v3';
const DEFAULT_PREFS = { sort: 'publishedAt-desc', currentSubject: 'ALL' };

function App() {
    const [prefs, setPrefs] = useState(() => {
        try {
            return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') };
        } catch {
            return { ...DEFAULT_PREFS };
        }
    });

    const [url, setUrl] = useState('');
    const [bulkUrls, setBulkUrls] = useState('');
    const [importData, setImportData] = useState('');
    const [toasts, setToasts] = useState([]);
    const [recentBanner, setRecentBanner] = useState('');

    const {
        videos,
        online,
        loading,
        addVideo,
        addBulkVideos,
        removeVideo,
        clearVideos,
        importVideos,
        mergeVideos,
        exportVideos
    } = useAPI();

    // Save preferences to localStorage
    useEffect(() => {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    }, [prefs]);

    // Update recent banner
    useEffect(() => {
        const filtered = videos.filter(v =>
            prefs.currentSubject === 'ALL' || (v.subject || subjectFromTitle(v.title)) === prefs.currentSubject
        );
        const candidates = filtered.filter(v => v.publishedAt)
            .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        if (candidates.length) {
            const top = candidates[0];
            const date = top.publishedAt ? new Date(top.publishedAt).toDateString() : 'No date';
            setRecentBanner(`Recent Uploaded Video: ${date} : ${top.title}`);
        } else {
            setRecentBanner('Recent Uploaded Video: —');
        }
    }, [videos, prefs.currentSubject]);

    const showToast = useCallback((message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 2000);
    }, []);

    const handleAddVideo = async () => {
        if (!url.trim()) {
            showToast('Paste a YouTube link');
            return;
        }

        if (!online) {
            showToast('Backend offline - cannot add videos');
            return;
        }

        try {
            await addVideo(url);
            setUrl('');
            showToast('Added');
        } catch (error) {
            showToast(error.message || 'Add failed');
        }
    };

    const handleBulkAdd = async () => {
        const urls = bulkUrls.trim().split('\n').filter(url => url.trim());

        if (!urls.length) {
            showToast('Please enter at least one YouTube URL');
            return;
        }

        if (!online) {
            showToast('Backend offline - cannot add videos');
            return;
        }

        try {
            const result = await addBulkVideos(urls);
            setBulkUrls('');
            showToast(`Added ${result.added} videos${result.errors > 0 ? `, ${result.errors} failed` : ''}`);
        } catch (error) {
            showToast(error.message || 'Bulk add failed');
        }
    };

    const handleRemoveVideo = async (video) => {
        if (!online) {
            showToast('Backend offline - cannot remove videos');
            return;
        }

        if (!confirm(`Are you sure you want to remove "${video.title || 'this video'}"?`)) {
            return;
        }

        try {
            const result = await removeVideo(video.id);
            if (result.removed) {
                showToast('Video removed successfully');
            } else {
                showToast('Video not found or already removed');
            }
        } catch (error) {
            showToast(`Remove failed: ${error.message || 'Unknown error'}`);
        }
    };

    const handleImport = async () => {
        if (!importData.trim()) {
            showToast('Please paste JSON data first');
            return;
        }

        if (!online) {
            showToast('Backend offline - cannot import data');
            return;
        }

        try {
            const data = JSON.parse(importData);
            if (!Array.isArray(data)) {
                showToast('JSON must be an array of video objects');
                return;
            }

            if (!data.every(x => x && typeof x.id === 'string' && typeof x.url === 'string')) {
                showToast('Each video must have id and url fields');
                return;
            }

            await importVideos(data);
            showToast('Imported (replaced)');
        } catch (error) {
            if (error.name === 'SyntaxError') {
                showToast('Invalid JSON format');
            } else {
                showToast(error.message || 'Import failed');
            }
        }
    };

    const handleMerge = async () => {
        if (!importData.trim()) {
            showToast('Please paste JSON data first');
            return;
        }

        if (!online) {
            showToast('Backend offline - cannot merge data');
            return;
        }

        try {
            const data = JSON.parse(importData);
            if (!Array.isArray(data)) {
                showToast('JSON must be an array of video objects');
                return;
            }

            if (!data.every(x => x && typeof x.id === 'string' && typeof x.url === 'string')) {
                showToast('Each video must have id and url fields');
                return;
            }

            await mergeVideos(data);
            showToast('Merged');
        } catch (error) {
            if (error.name === 'SyntaxError') {
                showToast('Invalid JSON format');
            } else {
                showToast(error.message || 'Merge failed');
            }
        }
    };

    const handleClear = async () => {
        if (!confirm('Clear all?')) return;

        if (!online) {
            showToast('Backend offline - cannot clear data');
            return;
        }

        try {
            await clearVideos();
            showToast('Cleared');
        } catch (error) {
            showToast('Clear failed');
        }
    };

    const handleCopyExport = async () => {
        try {
            const data = JSON.stringify(videos, null, 2);
            await navigator.clipboard.writeText(data);
            showToast('Copied');
        } catch (error) {
            showToast('Copy failed');
        }
    };

    // Filter and sort videos
    const filteredVideos = videos.filter(v =>
        prefs.currentSubject === 'ALL' || (v.subject || subjectFromTitle(v.title)) === prefs.currentSubject
    );

    const [sortField, sortDir] = prefs.sort.split('-');
    const sortedVideos = [...filteredVideos].sort((a, b) => {
        const va = a[sortField] ? +new Date(a[sortField]) : 0;
        const vb = b[sortField] ? +new Date(b[sortField]) : 0;

        if (va === vb) {
            const t = String(a.title || '').localeCompare(String(b.title || ''));
            return t !== 0 ? t : String(a.id).localeCompare(String(b.id));
        }

        return sortDir === 'desc' ? vb - va : va - vb;
    });

    // Count videos by subject
    const subjectCounts = new Map();
    videos.forEach(v => {
        const subject = v.subject || subjectFromTitle(v.title);
        subjectCounts.set(subject, (subjectCounts.get(subject) || 0) + 1);
    });

    const subjects = ['ALL', ...Array.from(subjectCounts.keys()).sort()];

    return (
        <>
            <header>
                <div className="wrap" style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h1 style={{ margin: 0 }}>Pending Classes — Global Sync</h1>
                    <div className={`badge ${online ? 'ok' : 'err'}`}>
                        <span>●</span> {online ? 'Connected' : 'Offline'}
                    </div>
                </div>
            </header>

            <main className="wrap" role="main">
                <section className="card" aria-labelledby="add-heading">
                    <h2 id="add-heading">Add YouTube Link</h2>
                    <div className="row">
                        <label className="sr-only" htmlFor="url">YouTube URL</label>
                        <input
                            id="url"
                            type="url"
                            placeholder="Paste YouTube link"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddVideo()}
                        />
                        <button
                            onClick={handleAddVideo}
                            disabled={!online || loading}
                        >
                            {!online ? 'Offline' : loading ? 'Adding...' : 'Add'}
                        </button>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        <label htmlFor="bulkUrls">Bulk Upload (one URL per line)</label>
                        <textarea
                            id="bulkUrls"
                            placeholder="Paste multiple YouTube URLs, one per line"
                            value={bulkUrls}
                            onChange={(e) => setBulkUrls(e.target.value)}
                            style={{ minHeight: '80px' }}
                        />
                        <div className="row" style={{ marginTop: '8px' }}>
                            <button
                                onClick={handleBulkAdd}
                                disabled={!online || loading}
                            >
                                {!online ? 'Offline' : loading ? 'Adding...' : 'Add All'}
                            </button>
                            <button onClick={() => setBulkUrls('')}>Clear</button>
                        </div>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        <label htmlFor="sortSelect">Sort by</label>
                        <select
                            id="sortSelect"
                            value={prefs.sort}
                            onChange={(e) => setPrefs(prev => ({ ...prev, sort: e.target.value }))}
                        >
                            <option value="publishedAt-desc">Upload date (new→old)</option>
                            <option value="publishedAt-asc">Upload date (old→new)</option>
                            <option value="addedAt-desc">Added time (new→old)</option>
                            <option value="addedAt-asc">Added time (old→new)</option>
                        </select>
                        <div className="note" style={{ marginTop: '8px' }}>{recentBanner}</div>
                    </div>
                </section>

                <section aria-labelledby="list-heading">
                    <h2 id="list-heading" className="sr-only">Video List</h2>
                    <div className="tabs" role="tablist" aria-label="Subjects">
                        {subjects.map(subject => (
                            <button
                                key={subject}
                                className={`tab ${prefs.currentSubject === subject ? 'active' : ''}`}
                                onClick={() => setPrefs(prev => ({ ...prev, currentSubject: subject }))}
                            >
                                {(subject === 'ALL' ? 'All' : subject)} ({subject === 'ALL' ? videos.length : subjectCounts.get(subject) || 0})
                            </button>
                        ))}
                    </div>

                    <div className="grid">
                        {sortedVideos.map(video => (
                            <VideoCard
                                key={video.id}
                                video={video}
                                onRemove={() => handleRemoveVideo(video)}
                            />
                        ))}
                    </div>

                    {sortedVideos.length === 0 && (
                        <div className="card" style={{ textAlign: 'center' }}>
                            No videos yet.
                        </div>
                    )}
                </section>

                <section className="card" aria-labelledby="sync-heading">
                    <h2 id="sync-heading">Manual Sync</h2>
                    <p className="note">Copy from one device, paste into another (still works even if backend is offline).</p>

                    <label htmlFor="exportBox">Export (read-only)</label>
                    <textarea
                        id="exportBox"
                        readOnly
                        value={JSON.stringify(videos, null, 2)}
                        style={{ minHeight: '120px' }}
                    />
                    <div className="row">
                        <button onClick={() => showToast('Refreshed')}>Refresh</button>
                        <button onClick={handleCopyExport}>Copy</button>
                    </div>

                    <hr />

                    <label htmlFor="importBox">Import / Merge</label>
                    <textarea
                        id="importBox"
                        placeholder="Paste JSON here"
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                        style={{ minHeight: '120px' }}
                    />
                    <div className="row">
                        <button onClick={handleImport} disabled={!online}>Import & Replace</button>
                        <button onClick={handleMerge} disabled={!online}>Merge</button>
                        <button onClick={handleClear} className="danger" disabled={!online}>Clear All</button>
                    </div>
                </section>
            </main>

            <div id="toast" aria-live="polite" aria-atomic="true">
                {toasts.map(toast => (
                    <Toast key={toast.id} message={toast.message} />
                ))}
            </div>
        </>
    );
}

export default App;
