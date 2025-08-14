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

export class VinLookupClient {
  private baseUrl: string;

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl;
  }

  async lookupVin(vin: string): Promise<VinLookupResult> {
    if (!this.isValidVin(vin)) {
      return {
        success: false,
        error: "Invalid VIN format. VIN must be 17 characters.",
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/vin/${vin.toUpperCase()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "VIN lookup failed",
      };
    }
  }

  private isValidVin(vin: string): boolean {
    if (vin.length !== 17) return false;
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin.toUpperCase())) return false;
    return true;
  }

  validateVin(vin: string): { valid: boolean; error?: string } {
    if (vin.length !== 17) {
      return { valid: false, error: "VIN must be exactly 17 characters" };
    }
    
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
      return { valid: false, error: "VIN contains invalid characters" };
    }

    return { valid: true };
  }

  formatVin(vin: string): string {
    return vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
  }
}

export const vinLookupClient = new VinLookupClient();
