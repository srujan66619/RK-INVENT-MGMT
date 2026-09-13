import { useState, useRef } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { Button } from "./button";
import { toast } from "sonner";

interface FileUploadProps {
  onUploadSuccess: (url: string) => void;
  folder?: string;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
}

export function FileUpload({
  onUploadSuccess,
  accept = "image/*",
  maxSizeMB = 5,
  label = "Upload File",
}: FileUploadProps) {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setIsUploading(true);
    setProgress(0);

    // MOCK UPLOAD: Simulates file upload progress then returns a local blob URL
    // Replace this logic with your real cloud storage upload (AWS S3, Cloudinary, etc)
    const totalTime = 1500;
    const intervalTime = 50;
    const steps = totalTime / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress((currentStep / steps) * 100);

      if (currentStep >= steps) {
        clearInterval(timer);

        // Use a local blob URL for the mock
        const blobUrl = URL.createObjectURL(file);
        onUploadSuccess(blobUrl);
        setIsUploading(false);
        toast.success("File uploaded successfully (Mock)");
      }
    }, intervalTime);
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center gap-4">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full flex gap-2 items-center justify-center py-6 border-dashed border-white/20 bg-muted hover:bg-secondary text-muted-foreground"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[var(--neon)]" />
          ) : (
            <UploadCloud className="h-5 w-5 text-[var(--neon)]" />
          )}
          {isUploading ? `Uploading... ${Math.round(progress)}%` : label}
        </Button>
      </div>

      {isUploading && (
        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-[var(--neon)] h-1.5 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
