import React, { useState, useEffect, useCallback } from 'react';
import VideoCard from './components/VideoCard';
import Toast from './components/Toast';
import SuperTabBar from './components/SuperTabBar';
import SubjectTab from './components/SubjectTab';
import AddSuperTabModal from './components/AddSuperTabModal';
import { useAPI } from './hooks/useAPI';
import { parseYouTubeId, subjectFromTitle, dateFromTitle } from './utils/youtubeUtils';

const PREFS_KEY = 'pendingClasses.prefs.v3';
const SUPER_TABS_KEY = 'pendingClasses.superTabs.v1';
const FINISHED_VIDEOS_KEY = 'pendingClasses.finishedVideos.v1';
const DEFAULT_PREFS = { sort: 'publishedAt-desc', currentSubject: 'ALL' };

function App() {
    const [prefs, setPrefs] = useState(() => {
        try {
            return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') };
        } catch {
            return { ...DEFAULT_PREFS };
        }
    });

    // Super tabs state
    const [superTabs, setSuperTabs] = useState(() => {
        try {
            const saved = localStorage.getItem(SUPER_TABS_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Finished videos state (stored as array of full video objects)
    const [finishedVideos, setFinishedVideos] = useState(() => {
        try {
            const saved = localStorage.getItem(FINISHED_VIDEOS_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // View toggle: pending or finished
    const [showFinished, setShowFinished] = useState(false);

    // Bulk selection state
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    const [expandedSuperTab, setExpandedSuperTab] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSuperTab, setEditingSuperTab] = useState(null);
    const [draggedSubject, setDraggedSubject] = useState(null);
    const [tabFilter, setTabFilter] = useState('');

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

    // Save super tabs to localStorage
    useEffect(() => {
        localStorage.setItem(SUPER_TABS_KEY, JSON.stringify(superTabs));
    }, [superTabs]);

    // Save finished videos to localStorage
    useEffect(() => {
        localStorage.setItem(FINISHED_VIDEOS_KEY, JSON.stringify(finishedVideos));
    }, [finishedVideos]);

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

    // Check if video is already finished before adding
    const handleAddVideo = async () => {
        if (!url.trim()) {
            showToast('Paste a YouTube link');
            return;
        }

        if (!online) {
            showToast('Backend offline - cannot add videos');
            return;
        }

        // Extract video ID and check if finished
        const videoId = parseYouTubeId(url);
        if (videoId && finishedVideos.some(v => v.id === videoId)) {
            showToast('⚠️ This video is already marked as finished!');
            setUrl('');
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

        // Filter out already finished videos
        const finishedIdSet = new Set(finishedVideos.map(v => v.id));
        const newUrls = urls.filter(u => {
            const videoId = parseYouTubeId(u);
            return !videoId || !finishedIdSet.has(videoId);
        });

        const skipped = urls.length - newUrls.length;

        if (newUrls.length === 0) {
            showToast(`All ${skipped} videos are already finished!`);
            setBulkUrls('');
            return;
        }

        try {
            const result = await addBulkVideos(newUrls);
            setBulkUrls('');
            let msg = `Added ${result.added} videos`;
            if (result.errors > 0) msg += `, ${result.errors} failed`;
            if (skipped > 0) msg += `, ${skipped} already finished`;
            showToast(msg);
        } catch (error) {
            showToast(error.message || 'Bulk add failed');
        }
    };

    const handleRemoveVideo = async (video) => {
        if (!online) {
            showToast('Backend offline - cannot remove videos');
            return;
        }

        try {
            const result = await removeVideo(video.id);
            if (result.removed) {
                showToast('Video removed');
            } else {
                showToast('Video not found or already removed');
            }
        } catch (error) {
            showToast(`Remove failed: ${error.message || 'Unknown error'}`);
        }
    };

    // Mark video as finished
    const handleFinishVideo = async (video) => {
        // Add full video object to finished array (avoid duplicates)
        setFinishedVideos(prev => {
            if (prev.some(v => v.id === video.id)) return prev;
            return [...prev, { ...video, finishedAt: new Date().toISOString() }];
        });

        // Remove from pending list
        if (online) {
            try {
                await removeVideo(video.id);
                showToast(`✓ "${video.title?.slice(0, 30)}..." marked as finished`);
            } catch (error) {
                showToast('Moved to finished');
            }
        } else {
            showToast('✓ Marked as finished (will sync when online)');
        }
    };

    // Restore video from finished back to pending
    const handleRestoreVideo = async (video) => {
        // Remove from finished list
        setFinishedVideos(prev => prev.filter(v => v.id !== video.id));

        // Add back to pending list
        if (online) {
            try {
                await addVideo(video.url);
                showToast(`↩ "${video.title?.slice(0, 30)}..." restored to pending`);
            } catch (error) {
                showToast('Restored locally (will sync when online)');
            }
        } else {
            showToast('↩ Restored (will sync when online)');
        }
    };

    // Bulk selection handlers
    const handleToggleSelect = (videoId) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(videoId)) {
                next.delete(videoId);
            } else {
                next.add(videoId);
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        const allIds = new Set(sortedVideos.map(v => v.id));
        setSelectedIds(allIds);
    };

    const handleDeselectAll = () => {
        setSelectedIds(new Set());
    };

    const handleBulkFinish = async () => {
        if (selectedIds.size === 0) {
            showToast('No videos selected');
            return;
        }

        const count = selectedIds.size;

        // Get full video objects for selected IDs
        const videosToFinish = (showFinished ? finishedVideos : sortedVideos)
            .filter(v => selectedIds.has(v.id));

        // Add all to finished
        setFinishedVideos(prev => {
            const existingIds = new Set(prev.map(v => v.id));
            const newVideos = videosToFinish
                .filter(v => !existingIds.has(v.id))
                .map(v => ({ ...v, finishedAt: new Date().toISOString() }));
            return [...prev, ...newVideos];
        });

        // Remove from backend (parallel for speed)
        if (online) {
            await Promise.all(
                Array.from(selectedIds).map(id =>
                    removeVideo(id).catch(() => { })
                )
            );
        }

        setSelectedIds(new Set());
        setSelectionMode(false);
        showToast(`✓ ${count} videos marked as finished`);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) {
            showToast('No videos selected');
            return;
        }

        if (!online) {
            showToast('Backend offline - cannot delete videos');
            return;
        }

        const count = selectedIds.size;

        // Remove from backend (parallel for speed)
        await Promise.all(
            Array.from(selectedIds).map(id =>
                removeVideo(id).catch(() => { })
            )
        );

        setSelectedIds(new Set());
        setSelectionMode(false);
        showToast(`🗑️ ${count} videos deleted`);
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

    // Super tabs handlers
    const handleCreateSuperTab = (name) => {
        const newSuperTab = {
            id: `st_${Date.now()}`,
            name,
            subjects: []
        };
        setSuperTabs(prev => [...prev, newSuperTab]);
        setShowAddModal(false);
        showToast(`Folder "${name}" created`);
    };

    const handleRenameSuperTab = (name) => {
        if (!editingSuperTab) return;
        setSuperTabs(prev => prev.map(st =>
            st.id === editingSuperTab.id ? { ...st, name } : st
        ));
        setEditingSuperTab(null);
        showToast('Folder renamed');
    };

    const handleDeleteSuperTab = (superTabId) => {
        const folder = superTabs.find(st => st.id === superTabId);
        const folderName = folder?.name || 'Folder';

        setSuperTabs(prev => prev.filter(st => st.id !== superTabId));
        if (expandedSuperTab === superTabId) {
            setExpandedSuperTab(null);
        }
        showToast(`"${folderName}" deleted`);
    };

    const handleDropSubjectToSuperTab = (superTabId, subject) => {
        setSuperTabs(prev => prev.map(st => ({
            ...st,
            subjects: st.subjects.filter(s => s !== subject)
        })));

        setSuperTabs(prev => prev.map(st =>
            st.id === superTabId
                ? { ...st, subjects: [...st.subjects.filter(s => s !== subject), subject] }
                : st
        ));
        showToast(`Moved "${subject}" to folder`);
    };

    const handleRemoveSubjectFromSuperTab = (superTabId, subject) => {
        setSuperTabs(prev => prev.map(st =>
            st.id === superTabId
                ? { ...st, subjects: st.subjects.filter(s => s !== subject) }
                : st
        ));
        showToast(`Removed "${subject}" from folder`);
    };

    const handleToggleExpandSuperTab = (superTabId) => {
        setExpandedSuperTab(prev => prev === superTabId ? null : superTabId);
    };

    // Clear finished list
    const handleClearFinished = () => {
        setFinishedVideos([]);
        showToast('Finished list cleared');
    };

    // Get subjects that are inside super tabs
    const subjectsInSuperTabs = new Set(superTabs.flatMap(st => st.subjects));

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

    // Get all unique subjects
    const allSubjects = Array.from(subjectCounts.keys()).sort();

    // Filter loose subjects (not in any super tab)
    const looseSubjects = allSubjects.filter(s => !subjectsInSuperTabs.has(s));

    // Apply tab filter
    const filteredLooseSubjects = tabFilter
        ? looseSubjects.filter(s => s.toLowerCase().includes(tabFilter.toLowerCase()))
        : looseSubjects;

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

                    {/* Super Tabs Bar */}
                    <SuperTabBar
                        superTabs={superTabs}
                        expandedSuperTab={expandedSuperTab}
                        onToggleExpand={handleToggleExpandSuperTab}
                        onAddClick={() => setShowAddModal(true)}
                        onDrop={handleDropSubjectToSuperTab}
                        onRename={setEditingSuperTab}
                        onDelete={handleDeleteSuperTab}
                        onRemoveSubject={handleRemoveSubjectFromSuperTab}
                        onSubjectClick={(subject) => setPrefs(prev => ({ ...prev, currentSubject: subject }))}
                        draggedSubject={draggedSubject}
                        subjectCounts={subjectCounts}
                    />

                    {/* View Controls: Selection Mode Toggle + Finished Counter */}
                    <div className="view-controls">
                        <label
                            className={`selection-mode-toggle ${selectionMode ? 'active' : ''}`}
                        >
                            <input
                                type="checkbox"
                                checked={selectionMode}
                                onChange={(e) => {
                                    setSelectionMode(e.target.checked);
                                    if (!e.target.checked) setSelectedIds(new Set());
                                }}
                            />
                            Select Mode
                        </label>

                        {finishedVideos.length > 0 && (
                            <div className="badge" style={{ marginLeft: 'auto' }}>
                                ✓ {finishedVideos.length} finished
                                <button
                                    onClick={handleClearFinished}
                                    style={{
                                        marginLeft: '8px',
                                        padding: '2px 6px',
                                        fontSize: '11px',
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--muted)',
                                        cursor: 'pointer'
                                    }}
                                    title="Clear finished list"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Bulk Action Bar (shown when in selection mode) */}
                    {selectionMode && (
                        <div className="bulk-action-bar">
                            <div className="selection-info">
                                <strong>{selectedIds.size}</strong> of {sortedVideos.length} selected
                            </div>
                            <button onClick={handleSelectAll}>Select All</button>
                            <button onClick={handleDeselectAll}>Deselect All</button>
                            <button className="success" onClick={handleBulkFinish}>
                                ✓ Finish Selected
                            </button>
                            <button className="danger" onClick={handleBulkDelete}>
                                🗑️ Delete Selected
                            </button>
                        </div>
                    )}

                    {/* Tab Search/Filter */}
                    {allSubjects.length > 5 && (
                        <div className="tab-search-wrapper">
                            <input
                                type="text"
                                className="tab-search"
                                placeholder="🔍 Search subjects..."
                                value={tabFilter}
                                onChange={(e) => setTabFilter(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Subject Tabs */}
                    <div className="tabs" role="tablist" aria-label="Subjects">
                        <button
                            className={`tab ${prefs.currentSubject === 'ALL' ? 'active' : ''}`}
                            onClick={() => setPrefs(prev => ({ ...prev, currentSubject: 'ALL' }))}
                        >
                            All ({videos.length})
                        </button>

                        {filteredLooseSubjects.map(subject => (
                            <SubjectTab
                                key={subject}
                                subject={subject}
                                count={subjectCounts.get(subject) || 0}
                                isActive={prefs.currentSubject === subject}
                                onClick={() => setPrefs(prev => ({ ...prev, currentSubject: subject }))}
                                onDragStart={setDraggedSubject}
                                onDragEnd={() => setDraggedSubject(null)}
                                isDragging={draggedSubject === subject}
                            />
                        ))}
                    </div>

                    {/* Pending / Finished View Toggle */}
                    <div className="view-toggle-tabs">
                        <button
                            className={!showFinished ? 'active' : ''}
                            onClick={() => setShowFinished(false)}
                        >
                            📋 Pending ({videos.length})
                        </button>
                        <button
                            className={`finished-tab ${showFinished ? 'active' : ''}`}
                            onClick={() => setShowFinished(true)}
                        >
                            ✓ Finished ({finishedVideos.length})
                        </button>
                    </div>

                    {/* Video Grid - shows pending or finished based on toggle */}
                    <div className="grid">
                        {showFinished ? (
                            // Finished Videos view
                            finishedVideos.length > 0 ? (
                                finishedVideos.map(video => (
                                    <VideoCard
                                        key={video.id}
                                        video={video}
                                        onRemove={() => {
                                            setFinishedVideos(prev => prev.filter(v => v.id !== video.id));
                                            showToast('Removed from finished');
                                        }}
                                        onFinish={handleFinishVideo}
                                        onRestore={handleRestoreVideo}
                                        isFinished={true}
                                        selectionMode={selectionMode}
                                        isSelected={selectedIds.has(video.id)}
                                        onToggleSelect={handleToggleSelect}
                                    />
                                ))
                            ) : null
                        ) : (
                            // Pending Videos view
                            sortedVideos.map(video => (
                                <VideoCard
                                    key={video.id}
                                    video={video}
                                    onRemove={() => handleRemoveVideo(video)}
                                    onFinish={handleFinishVideo}
                                    onRestore={handleRestoreVideo}
                                    isFinished={false}
                                    selectionMode={selectionMode}
                                    isSelected={selectedIds.has(video.id)}
                                    onToggleSelect={handleToggleSelect}
                                />
                            ))
                        )}
                    </div>

                    {/* Empty state messages */}
                    {showFinished && finishedVideos.length === 0 && (
                        <div className="card" style={{ textAlign: 'center' }}>
                            No finished videos yet. Mark videos as finished to see them here.
                        </div>
                    )}
                    {!showFinished && sortedVideos.length === 0 && (
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

            {/* Add/Edit Super Tab Modal */}
            <AddSuperTabModal
                isOpen={showAddModal || editingSuperTab !== null}
                onClose={() => {
                    setShowAddModal(false);
                    setEditingSuperTab(null);
                }}
                onSubmit={editingSuperTab ? handleRenameSuperTab : handleCreateSuperTab}
                editMode={editingSuperTab !== null}
                initialName={editingSuperTab?.name || ''}
            />

            <div id="toast" aria-live="polite" aria-atomic="true">
                {toasts.map(toast => (
                    <Toast key={toast.id} message={toast.message} />
                ))}
            </div>
        </>
    );
}

export default App;
