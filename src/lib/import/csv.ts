/**
 * CSV Import Utilities
 * Parse and import CSV files
 */

import { z } from "zod";

/**
 * Parse CSV string to array of objects
 */
export function parseCSV<T>(
  csvContent: string,
  delimiter = ","
): Array<Record<string, string>> {
  const lines = csvContent.trim().split("\n");

  if (lines.length < 2) {
    throw new Error("CSV must have at least a header row and one data row");
  }

  // Parse headers
  const headers = parseCSVLine(lines[0], delimiter);

  // Parse data rows
  const data: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines

    const values = parseCSVLine(lines[i], delimiter);

    if (values.length !== headers.length) {
      console.warn(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
    }

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    data.push(row);
  }

  return data;
}

/**
 * Parse a single CSV line
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentValue += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      // End of field
      values.push(currentValue.trim());
      currentValue = "";
    } else {
      currentValue += char;
    }
  }

  // Push last value
  values.push(currentValue.trim());

  return values;
}

/**
 * Product import schema
 */
export const ProductImportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  description: z.string().default(""),
  category: z.string().optional(),
  basePrice: z.string().transform((val) => parseFloat(val)),
  salePrice: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  stock: z.string().default("0").transform((val) => parseInt(val, 10)),
  published: z.string().default("false").transform((val) => val.toLowerCase() === "true" || val === "1"),
  weight: z.string().default("0").transform((val) => parseFloat(val)),
  length: z.string().default("0").transform((val) => parseFloat(val)),
  width: z.string().default("0").transform((val) => parseFloat(val)),
  height: z.string().default("0").transform((val) => parseFloat(val)),
});

export type ProductImportData = z.infer<typeof ProductImportSchema>;

/**
 * Validate and transform product import data
 */
export function validateProductImport(
  data: Array<Record<string, string>>
): {
  valid: ProductImportData[];
  invalid: Array<{ row: number; errors: string[]; data: Record<string, string> }>;
} {
  const valid: ProductImportData[] = [];
  const invalid: Array<{ row: number; errors: string[]; data: Record<string, string> }> = [];

  data.forEach((row, index) => {
    try {
      const validated = ProductImportSchema.parse(row);
      valid.push(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        invalid.push({
          row: index + 2, // +2 because CSV is 1-indexed and has header
          errors: error.issues.map((err) => `${err.path.map(String).join(".")}: ${err.message}`),
          data: row,
        });
      }
    }
  });

  return { valid, invalid };
}

/**
 * Read CSV file from uploaded File object
 */
export async function readCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error("Failed to read file"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    reader.readAsText(file);
  });
}
