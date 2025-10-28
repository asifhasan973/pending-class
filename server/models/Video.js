import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        default: ''
    },
    publishedAt: {
        type: String,
        default: null
    },
    url: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        default: 'GENERAL'
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for better query performance
videoSchema.index({ id: 1 });
videoSchema.index({ subject: 1 });
videoSchema.index({ addedAt: -1 });

export default mongoose.model('Video', videoSchema);
