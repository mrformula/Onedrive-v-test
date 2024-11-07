import mongoose from 'mongoose'

const fileInfoSchema = new mongoose.Schema({
    fileId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    path: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number },
    itemCount: { type: Number }, // For folders
    lastModified: { type: Date },
    parentId: { type: String },
    downloadUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

export const FileInfo = mongoose.models.FileInfo || mongoose.model('FileInfo', fileInfoSchema) 