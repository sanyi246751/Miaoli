import React, { useRef, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';

export default function PhotoUploader({ photos, setPhotos }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random().toString(),
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            url: event.target.result
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleRemovePhoto = (id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mr-2 text-sm border border-emerald-500/30">
              3
            </span>
            上傳待清運傢俱照片（數張）
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            已上傳 <strong className="text-emerald-400 text-sm ml-1">{photos.length}</strong> 張照片
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1 ml-10">
          請上傳能清晰辨識待清運傢俱外觀、體積大小的照片，以便清潔隊核對排車。
        </p>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 shadow-md transition-all hover:border-emerald-500/50"
              >
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(photo.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 text-slate-300 hover:text-rose-400 hover:bg-rose-500/20 transition-all border border-slate-700"
                  title="刪除這張照片"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="p-2 bg-slate-900/90 border-t border-slate-800">
                  <p className="text-xs font-medium text-slate-200 truncate">{photo.name}</p>
                  <p className="text-[10px] text-slate-400">{photo.size || '以縮圖預覽'}</p>
                </div>
              </div>
            ))}
        <button type="button" onClick={() => fileInputRef.current?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all ${isDragging ? 'border-emerald-400 bg-emerald-500/15' : 'border-emerald-500/50 bg-slate-800/40 hover:bg-emerald-500/10'}`}>
          <UploadCloud className="w-6 h-6 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200">上傳照片</span>
          <span className="text-[10px] text-slate-400">可選多張</span>
        </button>
      </div>
    </div>
  );
}
