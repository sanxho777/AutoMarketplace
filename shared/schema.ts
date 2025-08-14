import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vin: text("vin"),
  year: integer("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  trim: text("trim"),
  mileage: integer("mileage").notNull(),
  transmission: text("transmission").notNull(),
  fuelType: text("fuel_type").notNull(),
  condition: text("condition").notNull(),
  price: integer("price").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  features: text("features").array().default([]),
  images: text("images").array().default([]),
  aiExtractedData: json("ai_extracted_data").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const listings = pgTable("listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").references(() => vehicles.id),
  title: text("title").notNull(),
  platform: text("platform").notNull(), // facebook, craigslist, etc
  status: text("status").notNull().default("draft"), // draft, published, sold
  listingData: json("listing_data").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiExtractions = pgTable("ai_extractions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").references(() => vehicles.id),
  imageUrl: text("image_url").notNull(),
  extractedText: text("extracted_text"),
  confidence: integer("confidence"),
  extractedData: json("extracted_data").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiExtractionSchema = createInsertSchema(aiExtractions).omit({
  id: true,
  createdAt: true,
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;
export type InsertAiExtraction = z.infer<typeof insertAiExtractionSchema>;
export type AiExtraction = typeof aiExtractions.$inferSelect;

// Form schemas for frontend validation
export const vehicleFormSchema = insertVehicleSchema.extend({
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  mileage: z.number().min(0).max(999999),
  price: z.number().min(1).max(999999),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  condition: z.enum(["excellent", "good", "fair", "poor"]),
  transmission: z.enum(["automatic", "manual", "cvt"]),
  fuelType: z.enum(["gasoline", "hybrid", "electric", "diesel"]),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

export type VehicleFormData = z.infer<typeof vehicleFormSchema>;
