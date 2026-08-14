import React, { useRef, useState } from 'react';
import { UploadCloud, X, Image as ImageIcon, CheckCircle, Info, Sparkles, Trash2 } from 'lucide-react';

// Sample demo images for user testing convenience
const DEMO_IMAGES = [
  { name: '待清運雙人床墊實體照片.jpg', url: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=500&auto=format&fit=crop&q=60' },
  { name: '舊木質沙發現場圖.jpg', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=60' },
  { name: '舊型電視與電視櫃.jpg', url: 'https://images.unsplash.com/photo-1593078165899-7f467690a168?w=500&auto=format&fit=crop&q=60' }
];

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

  const handleAddDemoPhoto = (demo) => {
    setPhotos((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random().toString(),
        name: demo.name,
        size: '1.4 MB',
        url: demo.url
      }
    ]);
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

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
            : 'border-slate-700/80 hover:border-emerald-500/50 bg-slate-800/30 hover:bg-slate-800/60'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8 stroke-[1.8]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              點擊此處上傳照片 或 將照片檔案拖曳至此
            </p>
            <p className="text-xs text-slate-400 mt-1">
              支援 JPG, PNG, WEBP 格式（建議上傳 1 ~ 5 張照片）
            </p>
          </div>
        </div>
      </div>

      {/* Demo Photos Quick Add (For Quick Testing) */}
      <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            快速測試體驗：點擊直接載入預設範例照片
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DEMO_IMAGES.map((demo, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddDemoPhoto(demo)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 border border-slate-600/60 transition-all flex items-center space-x-1.5"
            >
              <ImageIcon className="w-3 h-3 text-emerald-400" />
              <span>+ {demo.name.split('.')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            已新增的照片清單 ({photos.length})
          </h4>
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
          </div>
        </div>
      )}
    </div>
  );
}
