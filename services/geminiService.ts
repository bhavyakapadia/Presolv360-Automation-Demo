
import { GoogleGenAI } from "@google/genai";
import { FormData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSmartSummary = async (formData: FormData): Promise<string> => {
  try {
    const prompt = `
      As a legal analyst for Presolve360, provide a professional, one-paragraph executive summary of the following dispute for a case management sheet.
      
      Details:
      - Petitioner: ${formData.petitionerName}
      - Respondent: ${formData.respondentName}
      - Service Track: ${formData.serviceTrack}
      - Stakeholder Class: ${formData.stakeholderType}
      - Claim Value: INR ${formData.claimAmount}
      - Urgency: ${formData.urgency}
      - Deadlines: ${formData.deadlineDetails || "None specified"}
      - Raw Description: ${formData.description}

      The summary should be objective, formal, and focus on the core legal/commercial conflict. 
      Avoid bullet points. Max 100 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    return response.text || "Summary generation failed.";
  } catch (error) {
    console.error("AI Summary Error:", error);
    return `Case between ${formData.petitionerName} and ${formData.respondentName} regarding a claim of INR ${formData.claimAmount}. Description: ${formData.description.substring(0, 100)}...`;
  }
};
