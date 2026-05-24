const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

function buildLegalTermPrompt(term: string, contextSentence: string) {
  return `Ești un asistent juridic pentru antreprenori în domeniul imobiliar din România. Utilizatorul a selectat termenul: ${term} din următoarea frază: ${contextSentence}. Explică pe scurt (2-3 propoziții scurte, doar cu definitia termenului, fara sa spui "Termenul inseamna..." sau introduceri de genul.), în limbaj simplu și non-tehnic, ce înseamnă acest termen în contextul legilor de urbanism și cadastru din România.`;
}

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

export async function explainLegalTerm(term: string, contextSentence: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY nu este configurat.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: buildLegalTermPrompt(term, contextSentence) }],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2000,
        },
      }),
    },
  );

  const data = (await response.json()) as GeminiGenerateResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Răspuns invalid de la Gemini API.");
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error("Gemini nu a returnat o definiție.");
  }

  return text;
}
