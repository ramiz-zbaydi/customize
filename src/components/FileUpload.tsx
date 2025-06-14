import React, { useCallback } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  hasDesign?: boolean;
  onClearDesign?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, hasDesign, onClearDesign }) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      onFileUpload(file);
    } else {
      alert('Veuillez sélectionner un fichier PNG ou JPEG');
    }
  }, [onFileUpload]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      onFileUpload(file);
    } else {
      alert('Veuillez sélectionner un fichier PNG ou JPEG');
    }
  }, [onFileUpload]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  if (hasDesign) {
    return (
      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Upload className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">Design uploadé</p>
            <p className="text-xs text-green-600">Votre image est prête</p>
          </div>
        </div>
        <button
          onClick={onClearDesign}
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
          title="Supprimer le design"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
    >
      <input
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-medium text-blue-600">Cliquez pour uploader</span> ou glissez-déposez
        </p>
        <p className="text-xs text-gray-500">PNG ou JPEG (max. 10MB)</p>
      </label>
    </div>
  );
};

export default FileUpload;