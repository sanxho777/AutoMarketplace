import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, insertListingSchema, vehicleFormSchema } from "@shared/schema";
import { ollamaService } from "./services/ollama";
import { imageProcessor } from "./services/image-processor";
import { vinLookupService } from "./services/vin-lookup";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WEBP images are allowed."));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded images
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Vehicle routes
  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getAllVehicles();
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vehicle" });
    }
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const validatedData = vehicleFormSchema.parse(req.body);
      const vehicle = await storage.createVehicle(validatedData);
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create vehicle" });
      }
    }
  });

  app.put("/api/vehicles/:id", async (req, res) => {
    try {
      const validatedData = vehicleFormSchema.partial().parse(req.body);
      const vehicle = await storage.updateVehicle(req.params.id, validatedData);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update vehicle" });
      }
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      const success = await storage.deleteVehicle(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  // Image upload and analysis
  app.post("/api/images/upload", upload.array("images", 10), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: "No images uploaded" });
      }

      const processedImages = [];
      const aiExtractions = [];

      for (const file of req.files) {
        // Validate and process image
        imageProcessor.validateImageFile(file.mimetype, file.size);
        const processedImage = await imageProcessor.processUploadedImage(
          file.buffer,
          file.originalname,
          file.mimetype
        );

        processedImages.push(processedImage);

        // Analyze with AI if Ollama is available
        try {
          const aiResult = await ollamaService.analyzeVehicleImage(processedImage.base64);
          aiExtractions.push({
            imageUrl: processedImage.url,
            extractedText: aiResult.extractedText,
            confidence: aiResult.confidence,
            extractedData: aiResult,
          });
        } catch (aiError) {
          console.warn("AI analysis failed for image:", processedImage.filename, aiError);
          // Continue without AI analysis
        }
      }

      res.json({
        images: processedImages,
        aiExtractions,
        message: `Successfully uploaded ${processedImages.length} images`,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to upload images" });
      }
    }
  });

  // AI analysis for existing images
  app.post("/api/images/analyze", async (req, res) => {
    try {
      const { imageBase64, vehicleId } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ message: "Image data is required" });
      }

      const aiResult = await ollamaService.analyzeVehicleImage(imageBase64);
      
      // Store the extraction if vehicleId is provided
      if (vehicleId) {
        await storage.createAiExtraction({
          vehicleId,
          imageUrl: "base64_image",
          extractedText: aiResult.extractedText,
          confidence: aiResult.confidence,
          extractedData: aiResult as any,
        });
      }

      res.json(aiResult);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to analyze image" });
      }
    }
  });

  // VIN lookup
  app.get("/api/vin/:vin", async (req, res) => {
    try {
      const { vin } = req.params;
      const result = await vinLookupService.lookupVin(vin);
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "VIN lookup service error" 
      });
    }
  });

  // Listing routes
  app.get("/api/listings", async (req, res) => {
    try {
      const listings = await storage.getAllListings();
      res.json(listings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  app.post("/api/listings", async (req, res) => {
    try {
      const validatedData = insertListingSchema.parse(req.body);
      const listing = await storage.createListing(validatedData);
      res.status(201).json(listing);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create listing" });
      }
    }
  });

  app.post("/api/listings/generate", async (req, res) => {
    try {
      const { vehicleId, platform = "facebook" } = req.body;
      
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      // Generate listing content based on platform
      const listingData = generateListingContent(vehicle, platform);
      
      const listing = await storage.createListing({
        vehicleId,
        title: listingData.title,
        platform,
        status: "draft",
        listingData,
      });

      res.json(listing);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate listing" });
    }
  });

  // Ollama health check
  app.get("/api/ollama/health", async (req, res) => {
    try {
      const isHealthy = await ollamaService.checkHealth();
      const models = await ollamaService.listModels();
      
      res.json({
        healthy: isHealthy,
        models,
        status: isHealthy ? "Local AI Ready" : "Ollama not available",
      });
    } catch (error) {
      res.json({
        healthy: false,
        models: [],
        status: "Ollama connection failed",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateListingContent(vehicle: any, platform: string) {
  const features = vehicle.features || [];
  const featuresText = features.length > 0 ? `\n\nFeatures:\n• ${features.join('\n• ')}` : '';
  
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''} - $${vehicle.price.toLocaleString()}`;
  
  const description = `${vehicle.description}${featuresText}

📍 Location: ${vehicle.location}
🚗 Mileage: ${vehicle.mileage.toLocaleString()} miles
⚙️ Transmission: ${vehicle.transmission}
⛽ Fuel Type: ${vehicle.fuelType}
✨ Condition: ${vehicle.condition}

Serious inquiries only. Cash, financing, or trade considered.`;

  return {
    title,
    description,
    price: vehicle.price,
    location: vehicle.location,
    images: vehicle.images || [],
    features: vehicle.features || [],
    vehicleDetails: {
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      mileage: vehicle.mileage,
      transmission: vehicle.transmission,
      fuelType: vehicle.fuelType,
      condition: vehicle.condition,
    },
  };
}
