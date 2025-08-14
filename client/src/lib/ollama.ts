interface OllamaAnalysisResult {
  licensePlate?: string;
  damage?: string;
  interior?: string;
  exterior?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  features?: string[];
  confidence: number;
  extractedText: string;
  rawResponse: string;
}

export class OllamaClient {
  private baseUrl: string;

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl;
  }

  async analyzeImage(imageBase64: string, vehicleId?: string): Promise<OllamaAnalysisResult> {
    const response = await fetch(`${this.baseUrl}/images/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageBase64,
        vehicleId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async checkHealth(): Promise<{
    healthy: boolean;
    models: string[];
    status: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/ollama/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    } catch (error) {
      return {
        healthy: false,
        models: [],
        status: "Connection failed",
      };
    }
  }

  async uploadAndAnalyzeImages(files: File[]): Promise<{
    images: Array<{
      filename: string;
      url: string;
      originalName: string;
    }>;
    aiExtractions: OllamaAnalysisResult[];
  }> {
    const formData = new FormData();
    files.forEach(file => formData.append("images", file));

    const response = await fetch(`${this.baseUrl}/images/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

export const ollamaClient = new OllamaClient();
