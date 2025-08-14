import { useState } from "react";
import { Clipboard, ExternalLink, Edit, Check, FileText, FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Vehicle } from "@shared/schema";

interface ListingPreviewProps {
  vehicle: Vehicle | null;
}

export default function ListingPreview({ vehicle }: ListingPreviewProps) {
  const [listingData, setListingData] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const { toast } = useToast();

  // Generate listing mutation
  const generateListingMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      const response = await apiRequest("POST", "/api/listings/generate", {
        vehicleId,
        platform: "facebook"
      });
      return response.json();
    },
    onSuccess: (listing) => {
      setListingData(listing.listingData);
    },
  });

  // Generate listing when vehicle updates
  if (vehicle && !listingData) {
    generateListingMutation.mutate(vehicle.id);
  }

  const handleCopyToClipboard = async () => {
    if (!listingData) return;

    const listingText = `${listingData.title}\n\n${listingData.description}`;
    
    try {
      await navigator.clipboard.writeText(listingText);
      setCopySuccess(true);
      toast({
        title: "Copied to clipboard",
        description: "Listing text is ready to paste into Facebook Marketplace",
      });
      
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleOpenFacebook = () => {
    window.open("https://www.facebook.com/marketplace/create/vehicle", "_blank");
  };

  const handleExportJSON = () => {
    if (!vehicle || !listingData) return;
    
    const dataStr = JSON.stringify({ vehicle, listing: listingData }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vehicle-listing-${vehicle.year}-${vehicle.make}-${vehicle.model}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!vehicle) return;
    
    const csvData = [
      ['Field', 'Value'],
      ['Year', vehicle.year],
      ['Make', vehicle.make],
      ['Model', vehicle.model],
      ['Trim', vehicle.trim || ''],
      ['Mileage', vehicle.mileage],
      ['Price', vehicle.price],
      ['Location', vehicle.location],
      ['Condition', vehicle.condition],
      ['Transmission', vehicle.transmission],
      ['Fuel Type', vehicle.fuelType],
      ['Description', vehicle.description],
      ['Features', (vehicle.features || []).join('; ')],
    ];
    
    const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vehicle-listing-${vehicle.year}-${vehicle.make}-${vehicle.model}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintListing = () => {
    if (!listingData) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Vehicle Listing - ${listingData.title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #1976D2; }
              .details { margin: 20px 0; }
              .features { margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1>${listingData.title}</h1>
            <div class="details">
              <p><strong>Location:</strong> ${listingData.location}</p>
              <p><strong>Mileage:</strong> ${listingData.vehicleDetails.mileage.toLocaleString()} miles</p>
              <p><strong>Price:</strong> $${listingData.price.toLocaleString()}</p>
            </div>
            <div class="features">
              <h3>Description:</h3>
              <p>${listingData.description.replace(/\n/g, '<br>')}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!vehicle) {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4" data-testid="text-preview-title">
            Facebook Marketplace Preview
          </h2>
          <div className="text-center py-8 text-gray-500">
            <p>Fill out vehicle information to see preview</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4" data-testid="text-preview-title">
          Facebook Marketplace Preview
        </h2>
        
        {listingData ? (
          <>
            {/* Marketplace Listing Preview */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              {vehicle.images && vehicle.images.length > 0 && (
                <img 
                  src={vehicle.images[0]} 
                  alt="Main listing image"
                  className="w-full h-48 object-cover rounded-md mb-4"
                  data-testid="img-main-listing"
                />
              )}
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900" data-testid="text-listing-title">
                  {listingData.title}
                </h3>
                
                <div className="flex items-center text-sm text-gray-600">
                  <span data-testid="text-listing-location">{listingData.location}</span>
                  <span className="mx-2">•</span>
                  <span data-testid="text-listing-mileage">
                    {listingData.vehicleDetails.mileage.toLocaleString()} miles
                  </span>
                </div>
                
                <div className="text-sm text-gray-700" data-testid="text-listing-description">
                  {listingData.description.split('\n').slice(0, 3).join(' ')}...
                </div>
                
                {listingData.features && listingData.features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {listingData.features.slice(0, 3).map((feature: string, index: number) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        data-testid={`tag-feature-${index}`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-lg font-bold text-primary" data-testid="text-listing-price">
                    ${listingData.price.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500">Ready to post</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <Button 
                onClick={handleCopyToClipboard}
                className="w-full bg-accent text-white hover:bg-accent/90 font-medium"
                data-testid="button-copy-clipboard"
              >
                <Clipboard className="mr-2 h-4 w-4" />
                Copy Listing to Clipboard
              </Button>
              
              <Button 
                onClick={handleOpenFacebook}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 font-medium"
                data-testid="button-open-facebook"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Facebook Marketplace
              </Button>
              
              <Button 
                variant="outline"
                className="w-full"
                data-testid="button-edit-listing"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Listing
              </Button>
            </div>

            {/* Copy Success Message */}
            {copySuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-success mr-2" />
                  <span className="text-sm font-medium text-green-800">
                    Listing copied to clipboard!
                  </span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Ready to paste into Facebook Marketplace
                </p>
              </div>
            )}

            {/* Export Options */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Export Options</h4>
              <div className="space-y-2">
                <button 
                  onClick={handleExportJSON}
                  className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                  data-testid="button-export-json"
                >
                  <FileText className="inline mr-2 h-4 w-4" />
                  Export as JSON
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                  data-testid="button-export-csv"
                >
                  <FileSpreadsheet className="inline mr-2 h-4 w-4" />
                  Export as CSV
                </button>
                <button 
                  onClick={handlePrintListing}
                  className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                  data-testid="button-print-listing"
                >
                  <Printer className="inline mr-2 h-4 w-4" />
                  Print Listing
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Generating listing preview...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
