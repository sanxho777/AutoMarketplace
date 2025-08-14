import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vehicleFormSchema, type VehicleFormData } from "@shared/schema";

interface UseVehicleFormOptions {
  onSubmit?: (data: VehicleFormData) => void;
  defaultValues?: Partial<VehicleFormData>;
}

export function useVehicleForm({ onSubmit, defaultValues }: UseVehicleFormOptions = {}) {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    defaultValues?.features || []
  );

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
      ...defaultValues,
    },
  });

  const handleFeatureToggle = (feature: string, checked: boolean) => {
    setSelectedFeatures(prev => {
      const updated = checked 
        ? [...prev, feature]
        : prev.filter(f => f !== feature);
      
      form.setValue("features", updated);
      return updated;
    });
  };

  const handleSubmit = (data: VehicleFormData) => {
    const formData = {
      ...data,
      features: selectedFeatures,
    };
    
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  const applyAiData = (aiData: any) => {
    if (aiData.make) form.setValue("make", aiData.make);
    if (aiData.model) form.setValue("model", aiData.model);
    if (aiData.year) form.setValue("year", parseInt(aiData.year));
    if (aiData.color) {
      const currentDesc = form.getValues("description");
      if (!currentDesc.toLowerCase().includes(aiData.color.toLowerCase())) {
        form.setValue("description", 
          currentDesc ? `${currentDesc}\n\nColor: ${aiData.color}` : `Color: ${aiData.color}`
        );
      }
    }
  };

  const applyVinData = (vinData: any) => {
    if (vinData.success) {
      if (vinData.year) form.setValue("year", vinData.year);
      if (vinData.make) form.setValue("make", vinData.make);
      if (vinData.model) form.setValue("model", vinData.model);
      if (vinData.trim) form.setValue("trim", vinData.trim);
      if (vinData.transmission) {
        form.setValue("transmission", vinData.transmission.toLowerCase());
      }
      if (vinData.fuelType) form.setValue("fuelType", vinData.fuelType);
    }
  };

  const resetForm = () => {
    form.reset();
    setSelectedFeatures([]);
  };

  return {
    form,
    selectedFeatures,
    handleFeatureToggle,
    handleSubmit,
    applyAiData,
    applyVinData,
    resetForm,
  };
}
