import { type Vehicle, type InsertVehicle, type Listing, type InsertListing, type AiExtraction, type InsertAiExtraction } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Vehicle methods
  getVehicle(id: string): Promise<Vehicle | undefined>;
  getAllVehicles(): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: string): Promise<boolean>;

  // Listing methods
  getListing(id: string): Promise<Listing | undefined>;
  getListingsByVehicle(vehicleId: string): Promise<Listing[]>;
  getAllListings(): Promise<Listing[]>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: string, listing: Partial<InsertListing>): Promise<Listing | undefined>;
  deleteListing(id: string): Promise<boolean>;

  // AI Extraction methods
  getAiExtraction(id: string): Promise<AiExtraction | undefined>;
  getAiExtractionsByVehicle(vehicleId: string): Promise<AiExtraction[]>;
  createAiExtraction(extraction: InsertAiExtraction): Promise<AiExtraction>;
}

export class MemStorage implements IStorage {
  private vehicles: Map<string, Vehicle>;
  private listings: Map<string, Listing>;
  private aiExtractions: Map<string, AiExtraction>;

  constructor() {
    this.vehicles = new Map();
    this.listings = new Map();
    this.aiExtractions = new Map();
  }

  // Vehicle methods
  async getVehicle(id: string): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = randomUUID();
    const now = new Date();
    const vehicle: Vehicle = { 
      ...insertVehicle, 
      id, 
      createdAt: now,
      updatedAt: now,
      trim: insertVehicle.trim || null,
      features: insertVehicle.features || [],
      images: insertVehicle.images || [],
    };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehicle(id: string, updateData: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const existing = this.vehicles.get(id);
    if (!existing) return undefined;
    
    const updated: Vehicle = { 
      ...existing, 
      ...updateData, 
      updatedAt: new Date(),
      features: updateData.features ? [...updateData.features] : existing.features,
      images: updateData.images ? [...updateData.images] : existing.images,
    };
    this.vehicles.set(id, updated);
    return updated;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    return this.vehicles.delete(id);
  }

  // Listing methods
  async getListing(id: string): Promise<Listing | undefined> {
    return this.listings.get(id);
  }

  async getListingsByVehicle(vehicleId: string): Promise<Listing[]> {
    return Array.from(this.listings.values())
      .filter(listing => listing.vehicleId === vehicleId);
  }

  async getAllListings(): Promise<Listing[]> {
    return Array.from(this.listings.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createListing(insertListing: InsertListing): Promise<Listing> {
    const id = randomUUID();
    const now = new Date();
    const listing: Listing = { 
      ...insertListing, 
      id, 
      createdAt: now,
      updatedAt: now,
      status: insertListing.status || "draft",
    };
    this.listings.set(id, listing);
    return listing;
  }

  async updateListing(id: string, updateData: Partial<InsertListing>): Promise<Listing | undefined> {
    const existing = this.listings.get(id);
    if (!existing) return undefined;
    
    const updated: Listing = { 
      ...existing, 
      ...updateData, 
      updatedAt: new Date() 
    };
    this.listings.set(id, updated);
    return updated;
  }

  async deleteListing(id: string): Promise<boolean> {
    return this.listings.delete(id);
  }

  // AI Extraction methods
  async getAiExtraction(id: string): Promise<AiExtraction | undefined> {
    return this.aiExtractions.get(id);
  }

  async getAiExtractionsByVehicle(vehicleId: string): Promise<AiExtraction[]> {
    return Array.from(this.aiExtractions.values())
      .filter(extraction => extraction.vehicleId === vehicleId);
  }

  async createAiExtraction(insertExtraction: InsertAiExtraction): Promise<AiExtraction> {
    const id = randomUUID();
    const extraction: AiExtraction = { 
      ...insertExtraction, 
      id, 
      createdAt: new Date(),
      vehicleId: insertExtraction.vehicleId || null,
    };
    this.aiExtractions.set(id, extraction);
    return extraction;
  }
}

export const storage = new MemStorage();
