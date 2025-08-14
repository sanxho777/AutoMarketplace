import { z } from "zod";

interface OllamaResponse {
  response: string;
  done: boolean;
  context?: number[];
}

interface VisionAnalysisResult {
  licensePlate?: string;
  damage?: string;
  interior?: string;
  exterior?: string;
  confidence: number;
  extractedText: string;
  rawResponse: string;
}

export class OllamaService {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    this.model = process.env.OLLAMA_MODEL || "llava";
  }

  async analyzeVehicleImage(imageBase64: string): Promise<VisionAnalysisResult> {
    const prompt = `Analyze this vehicle image and extract the following information in JSON format:
    {
      "licensePlate": "visible license plate number or null",
      "damage": "description of any visible damage or 'none'",
      "interior": "condition of interior if visible (excellent/good/fair/poor) or null",
      "exterior": "condition of exterior (excellent/good/fair/poor)",
      "make": "vehicle make if identifiable",
      "model": "vehicle model if identifiable", 
      "year": "estimated year or null",
      "color": "primary vehicle color",
      "features": ["list", "of", "visible", "features"]
    }
    
    Be accurate and only include information you can clearly see. Use null for unclear items.`;

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          images: [imageBase64],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      
      // Try to extract JSON from the response
      let extractedData = {};
      let confidence = 50; // Default confidence
      
      try {
        // Look for JSON in the response
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
          confidence = 85; // Higher confidence if we got structured data
        }
      } catch (parseError) {
        console.warn("Could not parse JSON from Ollama response, using text analysis");
        // Fallback to text analysis
        extractedData = this.parseTextResponse(data.response);
        confidence = 60;
      }

      return {
        ...extractedData,
        confidence,
        extractedText: data.response,
        rawResponse: data.response,
      } as VisionAnalysisResult;

    } catch (error) {
      console.error("Ollama analysis error:", error);
      throw new Error(`Failed to analyze image with Ollama: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private parseTextResponse(text: string): Partial<VisionAnalysisResult> {
    const result: Partial<VisionAnalysisResult> = {};
    
    // Simple text parsing for common patterns
    const licensePlateMatch = text.match(/license plate[:\s]+([A-Z0-9\-\s]+)/i);
    if (licensePlateMatch) {
      result.licensePlate = licensePlateMatch[1].trim();
    }

    const damageMatch = text.match(/damage[:\s]+([^.\n]+)/i);
    if (damageMatch) {
      result.damage = damageMatch[1].trim();
    }

    const interiorMatch = text.match(/interior[:\s]+(excellent|good|fair|poor)/i);
    if (interiorMatch) {
      result.interior = interiorMatch[1].toLowerCase();
    }

    const exteriorMatch = text.match(/exterior[:\s]+(excellent|good|fair|poor)/i);
    if (exteriorMatch) {
      result.exterior = exteriorMatch[1].toLowerCase();
    }

    return result;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch {
      return [];
    }
  }
}

export const ollamaService = new OllamaService();
