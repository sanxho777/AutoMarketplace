import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wand2, Save, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { vehicleFormSchema, type VehicleFormData, type Vehicle } from "@shared/schema";

const VEHICLE_FEATURES = [
  "Air Conditioning",
  "Backup Camera", 
  "Bluetooth",
  "Cruise Control",
  "GPS Navigation",
  "Heated Seats",
  "Leather Seats",
  "Sunroof",
  "Apple CarPlay",
  "Android Auto",
  "Keyless Entry",
  "Power Windows",
  "Power Steering",
  "ABS Brakes",
  "Airbags",
  "Traction Control"
];

interface VehicleFormProps {
  onVehicleUpdate: (vehicle: Vehicle) => void;
  uploadedImages: string[];
  aiExtractions: any[];
}

export default function VehicleForm({ onVehicleUpdate, uploadedImages, aiExtractions }: VehicleFormProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      make: "",
      model: "",
      trim: "",
      mileage: 0,
      transmission: "automatic",
      fuelType: "gasoline",
      condition: "good",
      price: 0,
      location: "",
      description: "",
      features: [],
      images: [],
    },
  });

  // VIN lookup mutation
  const vinLookupMutation = useMutation({
    mutationFn: async (vin: string) => {
      const response = await apiRequest("GET", `/api/vin/${vin}`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        // Auto-fill form with VIN data
        if (data.year) form.setValue("year", data.year);
        if (data.make) form.setValue("make", data.make);
        if (data.model) form.setValue("model", data.model);
        if (data.trim) form.setValue("trim", data.trim);
        if (data.transmission) form.setValue("transmission", data.transmission.toLowerCase());
        if (data.fuelType) form.setValue("fuelType", data.fuelType);
        
        toast({
          title: "VIN lookup successful",
          description: `Found ${data.year} ${data.make} ${data.model}`,
        });
      } else {
        toast({
          title: "VIN lookup failed",
          description: data.error || "Could not find vehicle information",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "VIN lookup error",
        description: "Failed to lookup VIN. Please enter information manually.",
        variant: "destructive",
      });
    },
  });

  // Create vehicle mutation
  const createVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      const vehicleData = {
        ...data,
        features: selectedFeatures,
        images: uploadedImages,
      };
      const response = await apiRequest("POST", "/api/vehicles", vehicleData);
      return response.json();
    },
    onSuccess: (vehicle: Vehicle) => {
      onVehicleUpdate(vehicle);
      toast({
        title: "Vehicle saved",
        description: "Vehicle information has been saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save vehicle",
        variant: "destructive",
      });
    },
  });

  // Handle VIN lookup
  const handleVinLookup = () => {
    const vin = form.watch("vin");
    if (vin && vin.length === 17) {
      vinLookupMutation.mutate(vin);
    } else {
      toast({
        title: "Invalid VIN",
        description: "VIN must be exactly 17 characters",
        variant: "destructive",
      });
    }
  };

  // Handle feature toggle
  const handleFeatureToggle = (feature: string, checked: boolean) => {
    setSelectedFeatures(prev => 
      checked 
        ? [...prev, feature]
        : prev.filter(f => f !== feature)
    );
  };

  // Handle form submission
  const onSubmit = (data: VehicleFormData) => {
    createVehicleMutation.mutate(data);
  };

  // Listen for AI data application
  useEffect(() => {
    const handleApplyAiData = (event: CustomEvent) => {
      const aiData = event.detail;
      
      if (aiData.make) form.setValue("make", aiData.make);
      if (aiData.model) form.setValue("model", aiData.model);
      if (aiData.year) form.setValue("year", parseInt(aiData.year));
      if (aiData.color) {
        // Append color to description if not already present
        const currentDesc = form.getValues("description");
        if (!currentDesc.toLowerCase().includes(aiData.color.toLowerCase())) {
          form.setValue("description", 
            currentDesc ? `${currentDesc}\n\nColor: ${aiData.color}` : `Color: ${aiData.color}`
          );
        }
      }
      
      toast({
        title: "AI data applied",
        description: "Vehicle information has been updated with AI extracted data",
      });
    };

    window.addEventListener('applyAiData', handleApplyAiData as EventListener);
    return () => window.removeEventListener('applyAiData', handleApplyAiData as EventListener);
  }, [form, toast]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900" data-testid="text-form-title">
            Vehicle Information
          </h2>
          <Button 
            variant="outline"
            size="sm"
            className="text-primary hover:text-primary/90"
            data-testid="button-auto-fill"
          >
            <Wand2 className="mr-1 h-4 w-4" />
            Auto-fill from web
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* VIN Lookup Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <FormField
                control={form.control}
                name="vin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VIN Number</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input 
                          placeholder="1HGBH41JXMN109186"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-vin"
                        />
                      </FormControl>
                      <Button 
                        type="button"
                        onClick={handleVinLookup}
                        disabled={vinLookupMutation.isPending}
                        className="bg-accent text-white hover:bg-accent/90"
                        data-testid="button-vin-lookup"
                      >
                        {vinLookupMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="mr-2 h-4 w-4" />
                        )}
                        Lookup
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-populate vehicle specs from VIN database
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-year"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mileage</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="45,000"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-mileage"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Honda"
                        {...field}
                        data-testid="input-make"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Civic"
                        {...field}
                        data-testid="input-model"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="trim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trim</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="LX, EX, Sport..."
                        {...field}
                        data-testid="input-trim"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="transmission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transmission</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-transmission">
                          <SelectValue placeholder="Select transmission" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="automatic">Automatic</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="cvt">CVT</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fuelType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-fuel-type">
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="gasoline">Gasoline</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-condition">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Price and Location */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asking Price</FormLabel>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <FormControl>
                        <Input 
                          type="number"
                          className="pl-8"
                          placeholder="18,500"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-price"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="City, State"
                        {...field}
                        data-testid="input-location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={4}
                      placeholder="Describe the vehicle's features, maintenance history, etc."
                      {...field}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Features Checklist */}
            <div>
              <FormLabel className="text-sm font-medium text-gray-700 mb-3 block">
                Features
              </FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {VEHICLE_FEATURES.map((feature) => (
                  <label key={feature} className="flex items-center">
                    <Checkbox 
                      checked={selectedFeatures.includes(feature)}
                      onCheckedChange={(checked) => handleFeatureToggle(feature, checked as boolean)}
                      data-testid={`checkbox-feature-${feature.toLowerCase().replace(/\s+/g, '-')}`}
                    />
                    <span className="ml-2 text-sm text-gray-700">{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button 
                type="button"
                variant="outline"
                className="flex-1"
                data-testid="button-save-draft"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button 
                type="submit"
                disabled={createVehicleMutation.isPending}
                className="flex-1 bg-primary text-white hover:bg-primary/90"
                data-testid="button-generate-listing"
              >
                {createVehicleMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate Listing
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
