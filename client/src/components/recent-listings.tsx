import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { Vehicle } from "@shared/schema";

export default function RecentListings() {
  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const recentVehicles = vehicles.slice(0, 3);

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4" data-testid="text-recent-title">
          Recent Listings
        </h3>
        
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border border-gray-100 rounded-md">
                <div className="w-12 h-12 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            ))}
          </div>
        ) : recentVehicles.length > 0 ? (
          <div className="space-y-3">
            {recentVehicles.map((vehicle, index) => (
              <div 
                key={vehicle.id} 
                className="flex items-center space-x-3 p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                data-testid={`card-recent-vehicle-${index}`}
              >
                {vehicle.images && vehicle.images.length > 0 ? (
                  <img 
                    src={vehicle.images[0]} 
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="w-12 h-12 object-cover rounded-md"
                    data-testid={`img-vehicle-thumbnail-${index}`}
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No Image</span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate" data-testid={`text-vehicle-title-${index}`}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                  <p className="text-xs text-gray-500" data-testid={`text-vehicle-date-${index}`}>
                    Saved {new Date(vehicle.createdAt!).toLocaleDateString()}
                  </p>
                </div>
                
                <span className="text-sm font-medium text-primary" data-testid={`text-vehicle-price-${index}`}>
                  ${vehicle.price.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No recent listings</p>
            <p className="text-xs mt-1">Create your first vehicle listing to get started</p>
          </div>
        )}
        
        {recentVehicles.length > 0 && (
          <Button 
            variant="ghost"
            className="w-full mt-4 text-sm text-primary hover:text-primary/90 font-medium"
            data-testid="button-view-all-listings"
          >
            View All Listings <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
