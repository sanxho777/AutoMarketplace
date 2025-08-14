interface VinLookupResult {
  make?: string;
  model?: string;
  year?: number;
  trim?: string;
  engine?: string;
  transmission?: string;
  fuelType?: string;
  bodyStyle?: string;
  drivetrain?: string;
  success: boolean;
  source?: string;
  error?: string;
}

export class VinLookupService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // Support multiple VIN lookup services
    this.apiKey = process.env.VIN_API_KEY || process.env.NHTSA_API_KEY || "";
    this.baseUrl = process.env.VIN_API_URL || "https://vpic.nhtsa.dot.gov/api";
  }

  async lookupVin(vin: string): Promise<VinLookupResult> {
    if (!this.isValidVin(vin)) {
      return {
        success: false,
        error: "Invalid VIN format. VIN must be 17 characters.",
      };
    }

    try {
      // Try NHTSA API first (free)
      const nhtsaResult = await this.lookupWithNHTSA(vin);
      if (nhtsaResult.success) {
        return nhtsaResult;
      }

      // Fallback to other services if API key is provided
      if (this.apiKey) {
        return await this.lookupWithCommercialAPI(vin);
      }

      return {
        success: false,
        error: "VIN lookup service unavailable. Please enter vehicle information manually.",
      };

    } catch (error) {
      console.error("VIN lookup error:", error);
      return {
        success: false,
        error: "VIN lookup failed. Please try again or enter information manually.",
      };
    }
  }

  private async lookupWithNHTSA(vin: string): Promise<VinLookupResult> {
    const url = `${this.baseUrl}/vehicles/DecodeVinValues/${vin}?format=json`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.Results?.[0];

    if (!result || result.ErrorCode !== "0") {
      return {
        success: false,
        error: result?.ErrorText || "VIN not found in NHTSA database",
      };
    }

    return {
      make: result.Make || undefined,
      model: result.Model || undefined,
      year: parseInt(result.ModelYear) || undefined,
      trim: result.Trim || undefined,
      engine: result.EngineHP ? `${result.EngineHP} HP` : undefined,
      transmission: result.TransmissionStyle || undefined,
      fuelType: this.mapFuelType(result.FuelTypePrimary),
      bodyStyle: result.BodyClass || undefined,
      drivetrain: result.DriveType || undefined,
      success: true,
      source: "NHTSA",
    };
  }

  private async lookupWithCommercialAPI(vin: string): Promise<VinLookupResult> {
    // Placeholder for commercial VIN API integration
    // Could integrate with services like:
    // - VINquery API
    // - CarQuery API  
    // - AutoCheck API
    
    return {
      success: false,
      error: "Commercial VIN API not configured",
    };
  }

  private isValidVin(vin: string): boolean {
    // Basic VIN validation
    if (vin.length !== 17) return false;
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return false;
    
    // Additional VIN checksum validation could be added here
    return true;
  }

  private mapFuelType(fuelType: string): string | undefined {
    if (!fuelType) return undefined;
    
    const mappings: Record<string, string> = {
      "gasoline": "gasoline",
      "gas": "gasoline",
      "electric": "electric",
      "hybrid": "hybrid",
      "diesel": "diesel",
      "flex fuel": "gasoline",
      "e85": "gasoline",
    };

    const normalized = fuelType.toLowerCase();
    return mappings[normalized] || "gasoline";
  }
}

export const vinLookupService = new VinLookupService();
