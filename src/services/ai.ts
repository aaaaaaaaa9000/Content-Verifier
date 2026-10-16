export interface Source {
  title: string;
  url: string;
}

export interface VerificationResponse {
  bentoData: {
    investigationLevel: { title: string; description: string; };
    riskLevel: { badge: string; details: string; isHigh: boolean; };
    score: number;
    claims: Array<{ text: string; assessment: string; isDangerous: boolean; }>;
    misleadingPatterns: string[];
    expertise: string[];
    conclusion: { text: string; recommendation: string; };
  };
  fullReport: string;
  sources: Source[];
  searchQueries: string[];
  searchSuggestionsHtml?: string;
}

export async function verifyContent(text: string): Promise<VerificationResponse> {
  try {
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `فشل الاتصال بالخادم (${response.status})`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Fetch Error:', error);
    throw new Error(error.message || 'حدث خطأ أثناء فحص المحتوى. يرجى المحاولة مرة أخرى.');
  }
}
