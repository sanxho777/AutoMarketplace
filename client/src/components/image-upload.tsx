import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, FolderOpen, X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AiExtractedData from "./ai-extracted-data";
import type { Vehicle } from "@shared/schema";

interface ImageUploadProps {
  onImagesUploaded: (images: string[], extractions: any[]) => void;
  aiExtractions: any[];
  selectedVehicle: Vehicle | null;
}

export default function ImageUpload({ onImagesUploaded, aiExtractions, selectedVehicle }: ImageUploadProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append("images", file));
      
      const response = await apiRequest("POST", "/api/images/upload", formData);
      return response.json();
    },
    onSuccess: (data) => {
      const imageUrls = data.images.map((img: any) => img.url);
      setUploadedImages(prev => [...prev, ...imageUrls]);
      onImagesUploaded(imageUrls, data.aiExtractions || []);
      
      toast({
        title: "Images uploaded successfully",
        description: `${data.images.length} images processed with AI analysis`,
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload images",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Validate files
    const validFiles = acceptedFiles.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a valid image file`,
          variant: "destructive",
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length > 0) {
      uploadMutation.mutate(validFiles);
    }
  }, [uploadMutation, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: true,
    maxFiles: 10,
  });

  const removeImage = (indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4" data-testid="text-upload-title">
            Upload Vehicle Images
          </h2>
          
          {/* Drag & Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-primary'
            }`}
            data-testid="dropzone-upload"
          >
            <input {...getInputProps()} />
            <CloudUpload className="text-4xl text-gray-400 mb-4 mx-auto" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {isDragActive ? 'Drop images here' : 'Drop images here or click to browse'}
            </p>
            <p className="text-sm text-gray-500 mb-4">Supports PNG, JPG, WEBP files</p>
            <Button 
              type="button" 
              className="bg-primary text-white hover:bg-primary/90"
              data-testid="button-choose-files"
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Choose Files
            </Button>
          </div>

          {/* Upload Progress */}
          {uploadMutation.isPending && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Processing images...</span>
                <span className="text-sm text-gray-500">Analyzing with AI</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Uploaded Images Preview */}
          {uploadedImages.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3" data-testid="text-uploaded-count">
                Uploaded Images ({uploadedImages.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {uploadedImages.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={imageUrl} 
                      alt={`Uploaded vehicle image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md border border-gray-200"
                      data-testid={`img-uploaded-${index}`}
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`button-remove-image-${index}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                
                {/* Add more images button */}
                <div 
                  {...getRootProps()}
                  className="border-2 border-dashed border-gray-300 rounded-md h-24 flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                  data-testid="button-add-more-images"
                >
                  <input {...getInputProps()} />
                  <Plus className="h-6 w-6 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {/* AI Processing Status */}
          {uploadMutation.isPending && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin text-primary mr-3" />
                <span className="text-sm font-medium text-blue-900">AI analyzing images...</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Extracting vehicle information using local LLaVA model
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Extracted Data */}
      {aiExtractions.length > 0 && (
        <AiExtractedData 
          extractions={aiExtractions} 
          selectedVehicle={selectedVehicle}
        />
      )}
    </div>
  );
}
