import { useState } from "react";
import { Car, Settings, Circle } from "lucide-react";
import ImageUpload from "@/components/image-upload";
import VehicleForm from "@/components/vehicle-form";
import ListingPreview from "@/components/listing-preview";
import RecentListings from "@/components/recent-listings";
import { useQuery } from "@tanstack/react-query";
import type { Vehicle } from "@shared/schema";

export default function Home() {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [aiExtractions, setAiExtractions] = useState<any[]>([]);

  // Check Ollama health
  const { data: ollamaHealth } = useQuery<{healthy: boolean; status: string}>({
    queryKey: ["/api/ollama/health"],
    refetchInterval: 30000, // Check every 30 seconds
  });

  const handleVehicleUpdate = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleImagesUploaded = (images: string[], extractions: any[]) => {
    setUploadedImages(images);
    setAiExtractions(extractions);
  };

  return (
    <div className="font-inter bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Car className="text-primary text-2xl mr-3" data-testid="logo-icon" />
              <h1 className="text-xl font-semibold text-gray-900" data-testid="app-title">
                AutoLister Pro
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600" data-testid="ai-status">
                <Circle 
                  className={`w-2 h-2 mr-2 ${
                    ollamaHealth?.healthy ? 'text-success fill-current' : 'text-gray-400 fill-current'
                  }`} 
                />
                <span>{ollamaHealth?.status || "Checking AI status..."}</span>
              </div>
              <button 
                className="text-gray-500 hover:text-gray-700 transition-colors"
                data-testid="button-settings"
              >
                <Settings className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Image Upload - Left Column */}
          <div className="lg:col-span-4">
            <ImageUpload 
              onImagesUploaded={handleImagesUploaded}
              aiExtractions={aiExtractions}
              selectedVehicle={selectedVehicle}
            />
          </div>

          {/* Vehicle Form - Center Column */}
          <div className="lg:col-span-5">
            <VehicleForm 
              onVehicleUpdate={handleVehicleUpdate}
              uploadedImages={uploadedImages}
              aiExtractions={aiExtractions}
            />
          </div>

          {/* Listing Preview - Right Column */}
          <div className="lg:col-span-3">
            <ListingPreview vehicle={selectedVehicle} />
            <RecentListings />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {ollamaHealth && !ollamaHealth.healthy && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
          <div className="flex items-center">
            <div className="animate-pulse w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">AI Processing Status</p>
              <p className="text-xs text-gray-600">Ollama offline - manual entry only</p>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <span>Install Ollama for AI features</span>
          </div>
        </div>
      )}
    </div>
  );
}
