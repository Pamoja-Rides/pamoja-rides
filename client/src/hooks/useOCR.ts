/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { GoogleGenAI } from "@google/genai";

// ─── Config ───────────────────────────────────────────────────────────────────

const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });

export interface ParsedNID {
  type: "nid";
  isValid: boolean;
  isTampered: boolean;
  idNumber: string;
  names: string;
  dateOfBirth: string;
  sex: string;
  placeOfIssue: string;
  validationNote: string;
}

export interface ParsedLicense {
  type: "license";
  isValid: boolean;
  isTampered: boolean;
  licenseNumber: string;
  names: string;
  dateOfBirth: string;
  expiryDate: string;
  licenseClass: string;
  sex: string;
  placeOfIssue: string;
  validationNote: string;
}

export interface CrossCheckResult {
  samePerson: boolean;
  confidence: "high" | "medium" | "low";
  nidName: string;
  licenseName: string;
  note: string;
}

// Prompts from the "New Version" as requested
const NID_PROMPT = `You are a document verification expert for Rwanda. Analyze this image.

1. Confirm this is a Rwanda National Identity Card (Indangamuntu / National Identity Card). If not, mark invalid, but if you detect that it's a valid Driving license uploaded instead, mark it invalid but not tampered with and the validation note should be that it's the wrong document .
2. Extract all visible fields accurately.
3. Assess digital tampering: inconsistent fonts, blurred text edges, misaligned fields, color inconsistencies, AI generation artifacts.

Respond ONLY with valid JSON, no markdown:
{
  "type": "nid",
  "isValid": true or false,
  "isTampered": true or false,
  "idNumber": "ID number as printed",
  "names": "full name as printed",
  "dateOfBirth": "date of birth as printed",
  "sex": "M or F",
  "placeOfIssue": "place of issue as printed",
  "validationNote": "one sentence on validity or tampering"
}

Rules: If not a Rwanda NID, isValid=false. Unreadable fields = empty string. isTampered=true for ANY manipulation sign.`;

const LICENSE_PROMPT = `You are a document verification expert for Rwanda. Analyze this image.

1. Confirm this is a Rwanda Driving License (Uruhushya rwo Gutwara Ibinyabiziga / Driving License). If not, mark invalid, but if you detect that it's a valid National ID uploaded instead, mark it invalid but not tampered with and the validation note should be that it's the wrong document.
2. Extract all visible fields accurately.
3. Assess digital tampering: inconsistent fonts, blurred text edges, misaligned fields, color inconsistencies.
4. Check expiry — note if expired in validationNote but still set isValid=true for a real (expired) document.

Respond ONLY with valid JSON, no markdown:
{
  "type": "license",
  "isValid": true or false,
  "isTampered": true or false,
  "licenseNumber": "DL number as printed (e.g. 1 2003 8 0137535 0 39)",
  "names": "full name as printed",
  "dateOfBirth": "date of birth as printed",
  "expiryDate": "expiry date as printed",
  "licenseClass": "class letter(s) as printed",
  "sex": "M or F",
  "placeOfIssue": "place of issue as printed",
  "validationNote": "one sentence on validity, tampering, or expiry"
}

Rules: If not a Rwanda Driving License, isValid=false. Unreadable fields = empty string.`;

const CROSS_CHECK_PROMPT = `You are an identity verification expert. You are given two Rwandan documents: a National ID and a Driving License.

Your job is to determine if BOTH documents belong to the SAME physical person.

Compare:
- The face photos on both documents (if visible)
- The full names on both documents
- The date of birth on both documents
- Any other identifying details

Respond ONLY with valid JSON, no markdown:
{
  "samePerson": true or false,
  "confidence": "high", "medium", or "low",
  "nidName": "name extracted from NID",
  "licenseName": "name extracted from Driving License",
  "note": "one sentence explaining your conclusion"
}

Be strict: if names differ significantly or faces clearly differ, samePerson=false. If you cannot see faces clearly, base judgment on names and DOB.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Kept EXACTLY as the old version, but updated parts to be an array
 * to support multiple images in the cross-check call.
 */
const callGemini = async <T>(parts: any[]): Promise<T> => {
  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash-lite", // Reverted to the model version you were using
    contents: [
      {
        role: "user",
        parts: parts,
      },
    ],
  });

  const text = result.text;
  if (!text) throw new Error("Empty response from Gemini");

  // Original cleaning logic from your old version
  const cleaned = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  return JSON.parse(cleaned) as T;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useNIDOCR = () => {
  const [result, setResult] = useState<ParsedNID | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognize = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const base64 = await fileToBase64(file);
      const parsed = await callGemini<ParsedNID>([
        { text: NID_PROMPT },
        {
          inlineData: {
            mimeType: file.type || "image/jpeg",
            data: base64,
          },
        },
      ]);
      setResult(parsed);
    } catch (err) {
      console.log("data", err);
      setError("Could not read the document. Please try a clearer photo.");
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = result?.isValid === true && result?.isTampered === false;
  return { recognize, result, isLoading, isValid, error };
};

export const useLicenseOCR = () => {
  const [result, setResult] = useState<ParsedLicense | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognize = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const base64 = await fileToBase64(file);
      const parsed = await callGemini<ParsedLicense>([
        { text: LICENSE_PROMPT },
        {
          inlineData: {
            mimeType: file.type || "image/jpeg",
            data: base64,
          },
        },
      ]);
      setResult(parsed);
    } catch {
      setError("Could not read the document. Please try a clearer photo.");
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = result?.isValid === true && result?.isTampered === false;
  return { recognize, result, isLoading, isValid, error };
};

// ── Cross-check logic from New Version ───────────────────────────────────────

export const crossCheckDocuments = async (
  nidFile: File,
  licenseFile: File,
): Promise<CrossCheckResult> => {
  const [nidBase64, licBase64] = await Promise.all([
    fileToBase64(nidFile),
    fileToBase64(licenseFile),
  ]);

  return callGemini<CrossCheckResult>([
    { text: CROSS_CHECK_PROMPT },
    {
      inlineData: {
        mimeType: nidFile.type || "image/jpeg",
        data: nidBase64,
      },
    },
    {
      inlineData: {
        mimeType: licenseFile.type || "image/jpeg",
        data: licBase64,
      },
    },
  ]);
};
