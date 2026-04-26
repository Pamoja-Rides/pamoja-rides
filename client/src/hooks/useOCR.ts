import { useState } from "react";
import { createWorker } from "tesseract.js";

interface ParsedID {
  idNumber: string;
  names: string;
}

export const useOCR = () => {
  const [text, setText] = useState<ParsedID | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const parseIDData = (text: string): { idNumber: string; names: string } => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // 1. EXTRACT ID NUMBER (Broad-Spectrum Search)
    let idNumber = "Check ID quality";

    // Strategy: Find any line that has a high density of digits (at least 10)
    // This bypasses the "label" matching entirely if the label is mangled.
    const numericLine = lines.find((line) => {
      const digits = line.replace(/\D/g, "");
      return digits.length >= 10;
    });

    if (numericLine) {
      // Take the line, remove all spaces and non-digits
      const cleanDigits = numericLine.replace(/\D/g, "");
      // Ensure we only return it if it looks like a Rwandan ID (starts with 1 and is 16 digits)
      const match = cleanDigits.match(/1\d{15}/);
      idNumber = match ? match[0] : cleanDigits;
    }

    // 2. EXTRACT NAMES
    const nameLabelIndex = lines.findIndex((line) => /Names/i.test(line));
    let names = "Name not detected";

    if (nameLabelIndex !== -1 && lines[nameLabelIndex + 1]) {
      names = lines[nameLabelIndex + 1]
        .replace(/[^a-zA-Z\s]/g, "") // Remove symbols/numbers
        .split(" ") // Split into words
        .filter((word) => word.length > 1 || word === word.toUpperCase()) // Filter out lone lowercase artifacts like 'j'
        .join(" ")
        .trim();

      // Final check: If the very first letter is lowercase and followed by a space, drop it
      names = names.replace(/^[a-z]\s+/, "");
    }

    return { idNumber, names };
  };

  const recognizeText = async (imageSource: File | string) => {
    setIsLoading(true);
    try {
      const worker = await createWorker("eng");

      const {
        data: { text },
      } = await worker.recognize(imageSource);

      // Parse the messy text into clean data
      const cleanData = parseIDData(text);
      setText(cleanData);

      await worker.terminate();
    } catch (error) {
      console.error("OCR Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { recognizeText, text, isLoading };
};
