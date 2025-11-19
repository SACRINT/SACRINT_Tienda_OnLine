"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CSVColumn {
  key: string;
  label: string;
  required?: boolean;
}

interface ImportResult {
  success: number;
  errors: { row: number; message: string }[];
  warnings: { row: number; message: string }[];
}

interface CSVOperationsProps {
  entityType: "products" | "orders" | "customers";
  onImport?: (data: any[]) => Promise<ImportResult>;
  onExport?: () => Promise<any[]>;
  columns: CSVColumn[];
}

export function CSVOperations({
  entityType,
  onImport,
  onExport,
  columns,
}: CSVOperationsProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const entityLabels = {
    products: "Productos",
    orders: "Órdenes",
    customers: "Clientes",
  };

  // Parse CSV string to array of objects
  const parseCSV = (csvString: string): any[] => {
    const lines = csvString.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      data.push(row);
    }

    return data;
  };

  // Convert array of objects to CSV string
  const toCSV = (data: any[]): string => {
    if (data.length === 0) return "";

    const headers = columns.map((col) => col.label);
    const keys = columns.map((col) => col.key);

    const rows = data.map((item) =>
      keys
        .map((key) => {
          const value = item[key];
          // Escape commas and quotes
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? "";
        })
        .join(","),
    );

    return [headers.join(","), ...rows].join("\n");
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      alert("Por favor selecciona un archivo CSV");
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvString = event.target?.result as string;
      const data = parseCSV(csvString);
      setPreviewData(data.slice(0, 5)); // Show first 5 rows
    };
    reader.readAsText(file);
  };

  // Handle import
  const handleImport = async () => {
    if (!selectedFile || !onImport) return;

    setImporting(true);
    setProgress(0);
    setImportResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const csvString = event.target?.result as string;
        const data = parseCSV(csvString);

        // Simulate progress
        const interval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const result = await onImport(data);

        clearInterval(interval);
        setProgress(100);
        setImportResult(result);
        setImporting(false);
      };
      reader.readAsText(selectedFile);
    } catch (error) {
      setImporting(false);
      setImportResult({
        success: 0,
        errors: [{ row: 0, message: "Error al procesar el archivo" }],
        warnings: [],
      });
    }
  };

  // Handle export
  const handleExport = async () => {
    if (!onExport) return;

    setExporting(true);
    setProgress(0);

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 20, 80));
      }, 100);

      const data = await onExport();
      const csvString = toCSV(data);

      clearInterval(interval);
      setProgress(100);

      // Download file
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${entityType}_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setExporting(false);
        setExportDialogOpen(false);
        setProgress(0);
      }, 500);
    } catch (error) {
      setExporting(false);
      alert("Error al exportar los datos");
    }
  };

  // Download template
  const downloadTemplate = () => {
    const headers = columns.map((col) => col.label).join(",");
    const exampleRow = columns
      .map((col) => (col.required ? `Ejemplo_${col.key}` : ""))
      .join(",");
    const csvString = `${headers}\n${exampleRow}`;

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `plantilla_${entityType}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset import state
  const resetImport = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setImportResult(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onOpenChange={(open) => {
          setImportDialogOpen(open);
          if (!open) resetImport();
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar {entityLabels[entityType]}</DialogTitle>
            <DialogDescription>
              Sube un archivo CSV para importar{" "}
              {entityLabels[entityType].toLowerCase()} masivamente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedFile && !importResult && (
              <>
                {/* File Upload Area */}
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium mb-1">
                    Arrastra tu archivo CSV o haz clic para seleccionar
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Máximo 1000 registros por archivo
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Template Download */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">¿Necesitas una plantilla?</p>
                    <p className="text-sm text-muted-foreground">
                      Descarga la plantilla con las columnas requeridas
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Plantilla
                  </Button>
                </div>

                {/* Required Columns */}
                <div>
                  <p className="text-sm font-medium mb-2">
                    Columnas requeridas:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {columns
                      .filter((col) => col.required)
                      .map((col) => (
                        <Badge key={col.key} variant="secondary">
                          {col.label}
                        </Badge>
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* Preview */}
            {selectedFile && !importing && !importResult && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{selectedFile.name}</span>
                    <Badge variant="secondary">
                      {previewData.length}+ registros
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetImport}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {previewData.length > 0 && (
                  <ScrollArea className="h-48 rounded-md border">
                    <div className="p-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {Object.keys(previewData[0]).map((key) => (
                              <th
                                key={key}
                                className="text-left p-2 font-medium"
                              >
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, i) => (
                            <tr key={i} className="border-b">
                              {Object.values(row).map((value, j) => (
                                <td
                                  key={j}
                                  className="p-2 truncate max-w-[150px]"
                                >
                                  {value as string}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                )}
              </>
            )}

            {/* Progress */}
            {importing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Importando...</span>
                  <span className="text-sm text-muted-foreground">
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {/* Results */}
            {importResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {importResult.errors.length === 0 ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-warning" />
                  )}
                  <span className="font-medium">
                    {importResult.success} registros importados exitosamente
                  </span>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="p-4 bg-error/10 rounded-lg">
                    <p className="font-medium text-error mb-2">
                      {importResult.errors.length} errores encontrados:
                    </p>
                    <ScrollArea className="h-32">
                      <ul className="text-sm space-y-1">
                        {importResult.errors.map((error, i) => (
                          <li key={i}>
                            Fila {error.row}: {error.message}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                )}

                {importResult.warnings.length > 0 && (
                  <div className="p-4 bg-warning/10 rounded-lg">
                    <p className="font-medium text-warning mb-2">
                      {importResult.warnings.length} advertencias:
                    </p>
                    <ScrollArea className="h-32">
                      <ul className="text-sm space-y-1">
                        {importResult.warnings.map((warning, i) => (
                          <li key={i}>
                            Fila {warning.row}: {warning.message}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {!importResult ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setImportDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!selectedFile || importing}
                >
                  {importing ? "Importando..." : "Importar"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setImportDialogOpen(false)}>Cerrar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar {entityLabels[entityType]}</DialogTitle>
            <DialogDescription>
              Descarga todos los {entityLabels[entityType].toLowerCase()} en
              formato CSV
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!exporting ? (
              <>
                <p className="text-sm text-muted-foreground">
                  El archivo incluirá las siguientes columnas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {columns.map((col) => (
                    <Badge key={col.key} variant="outline">
                      {col.label}
                    </Badge>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Exportando...</span>
                  <span className="text-sm text-muted-foreground">
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExportDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? "Exportando..." : "Exportar CSV"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Product columns for CSV
export const PRODUCT_CSV_COLUMNS: CSVColumn[] = [
  { key: "name", label: "Nombre", required: true },
  { key: "sku", label: "SKU", required: true },
  { key: "description", label: "Descripción" },
  { key: "category", label: "Categoría" },
  { key: "basePrice", label: "Precio Base", required: true },
  { key: "salePrice", label: "Precio Oferta" },
  { key: "stock", label: "Stock", required: true },
  { key: "published", label: "Publicado" },
  { key: "featured", label: "Destacado" },
  { key: "weight", label: "Peso (kg)" },
  { key: "tags", label: "Etiquetas" },
];

// Order columns for CSV
export const ORDER_CSV_COLUMNS: CSVColumn[] = [
  { key: "orderNumber", label: "Número", required: true },
  { key: "customerName", label: "Cliente", required: true },
  { key: "customerEmail", label: "Email", required: true },
  { key: "status", label: "Estado", required: true },
  { key: "total", label: "Total", required: true },
  { key: "items", label: "Productos" },
  { key: "shippingAddress", label: "Dirección" },
  { key: "createdAt", label: "Fecha" },
];

// Customer columns for CSV
export const CUSTOMER_CSV_COLUMNS: CSVColumn[] = [
  { key: "name", label: "Nombre", required: true },
  { key: "email", label: "Email", required: true },
  { key: "phone", label: "Teléfono" },
  { key: "address", label: "Dirección" },
  { key: "totalOrders", label: "Total Órdenes" },
  { key: "totalSpent", label: "Total Gastado" },
  { key: "createdAt", label: "Fecha Registro" },
];
