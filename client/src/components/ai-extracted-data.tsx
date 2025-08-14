import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Vehicle } from "@shared/schema";

interface AiExtractedDataProps {
  extractions: any[];
  selectedVehicle: Vehicle | null;
}

export default function AiExtractedData({ extractions, selectedVehicle }: AiExtractedDataProps) {
  if (extractions.length === 0) return null;

  // Use the latest extraction or combine multiple extractions
  const latestExtraction = extractions[extractions.length - 1];
  const extractedData = latestExtraction.extractedData;

  const handleApplyToForm = () => {
    // Emit event to apply extracted data to form
    window.dispatchEvent(new CustomEvent('applyAiData', { 
      detail: extractedData 
    }));
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4" data-testid="text-ai-extracted-title">
          AI Extracted Information
        </h3>
        
        <div className="space-y-3">
          {extractedData.licensePlate && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">License Plate</span>
              <span className="text-sm text-gray-900" data-testid="text-license-plate">
                {extractedData.licensePlate}
              </span>
            </div>
          )}
          
          {extractedData.damage && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Visible Damage</span>
              <span 
                className={`text-sm ${
                  extractedData.damage === 'none' ? 'text-success' : 'text-red-600'
                }`}
                data-testid="text-damage"
              >
                {extractedData.damage}
              </span>
            </div>
          )}
          
          {extractedData.interior && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Interior Condition</span>
              <span 
                className={`text-sm ${
                  extractedData.interior === 'excellent' ? 'text-success' : 'text-gray-900'
                }`}
                data-testid="text-interior"
              >
                {extractedData.interior}
              </span>
            </div>
          )}
          
          {extractedData.exterior && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Exterior Condition</span>
              <span 
                className={`text-sm ${
                  extractedData.exterior === 'excellent' ? 'text-success' : 'text-gray-900'
                }`}
                data-testid="text-exterior"
              >
                {extractedData.exterior}
              </span>
            </div>
          )}
          
          {extractedData.make && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Make</span>
              <span className="text-sm text-gray-900" data-testid="text-ai-make">
                {extractedData.make}
              </span>
            </div>
          )}
          
          {extractedData.model && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Model</span>
              <span className="text-sm text-gray-900" data-testid="text-ai-model">
                {extractedData.model}
              </span>
            </div>
          )}
          
          {extractedData.color && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Color</span>
              <span className="text-sm text-gray-900" data-testid="text-ai-color">
                {extractedData.color}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-gray-600">Confidence Score</span>
            <span 
              className={`text-sm font-medium ${
                latestExtraction.confidence > 80 ? 'text-success' : 
                latestExtraction.confidence > 60 ? 'text-warning' : 'text-red-600'
              }`}
              data-testid="text-confidence"
            >
              {latestExtraction.confidence}%
            </span>
          </div>
        </div>

        <Button 
          onClick={handleApplyToForm}
          className="w-full mt-4 bg-primary text-white hover:bg-primary/90"
          data-testid="button-apply-to-form"
        >
          <Check className="mr-2 h-4 w-4" />
          Apply to Form
        </Button>
      </CardContent>
    </Card>
  );
}