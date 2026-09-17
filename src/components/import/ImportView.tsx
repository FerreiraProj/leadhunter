import React, { useState, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { parseExcelFile } from "../../utils/excelParser";
import { formatDatePT } from "../../utils/date";
import * as XLSX from "xlsx";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  Layers,
  ArrowRight,
  Sparkles,
  Download,
  Info,
} from "lucide-react";

export const ImportView: React.FC = () => {
  const { leads, batches, addBatchAndLeads, settings, addToast, setActiveView } = useApp();

  const [batchName, setBatchName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    newCount: number;
    updatedCount: number;
    ignoredCount: number;
    batchName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!batchName) {
        setBatchName(file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!batchName) {
        setBatchName(file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
      }
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      addToast("Por favor seleciona um ficheiro Excel (.xlsx, .xls, .csv).", "error");
      return;
    }
    if (!batchName.trim()) {
      addToast("Por favor introduz um nome para o lote de importação.", "error");
      return;
    }

    setIsProcessing(true);
    setImportSummary(null);

    try {
      const result = await parseExcelFile(
        selectedFile,
        batchName.trim(),
        leads,
        settings.scoreConfig
      );

      addBatchAndLeads(result.batch, result.createdLeads, result.updatedLeads);

      setImportSummary({
        total: result.summary.totalProcessed,
        newCount: result.summary.newCount,
        updatedCount: result.summary.updatedCount,
        ignoredCount: result.summary.ignoredCount,
        batchName: batchName.trim(),
      });

      // Reset form
      setSelectedFile(null);
      setBatchName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      console.error("Erro ao importar ficheiro:", error);
      addToast(error.message || "Erro ao processar ficheiro Excel.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to generate a demo sample Excel file with Outscraper columns
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        name: "Restaurante O Lusitano",
        category: "Restaurante",
        type: "Cozinha Tradicional Portuguesa",
        phone: "+351 214 555 111",
        email: "",
        website: "",
        address: "Rua do Comércio 55, 1100-150 Lisboa",
        city: "Lisboa",
        state: "Lisboa",
        postal_code: "1100-150",
        country: "Portugal",
        latitude: 38.7101,
        longitude: -9.1382,
        rating: 4.8,
        reviews: 420,
        company_facebook: "https://facebook.com/restauranteolusitano",
        company_instagram: "https://instagram.com/restauranteolusitano",
        business_status: "OPERATIONAL",
        about: "Pratos típicos portugueses em forno de lenha.",
      },
      {
        name: "Café & Bistrô Central",
        category: "Café",
        type: "Cafetaria e Brunch",
        phone: "+351 223 999 888",
        email: "geral@cafebistrocentral.pt",
        website: "",
        address: "Rua de Santa Catarina 120, 4000-442 Porto",
        city: "Porto",
        state: "Porto",
        postal_code: "4000-442",
        country: "Portugal",
        latitude: 41.1495,
        longitude: -8.6056,
        rating: 4.6,
        reviews: 310,
        company_instagram: "https://instagram.com/cafebistrocentral",
        business_status: "OPERATIONAL",
        about: "Cafés de especialidade e pastelaria artesanal no centro do Porto.",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, "exemplo_outscraper_leadhunter.xlsx");
    addToast("Ficheiro de exemplo Excel descarregado!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Importar Ficheiro Excel (.xlsx / .csv)
        </h1>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">
          Processa as listas geradas pelo Outscraper com deduplicação inteligente e cálculo automático de scores
        </p>
      </div>

      {/* Import Form Card */}
      <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.06)] font-mono">
        <form onSubmit={handleImportSubmit} className="space-y-6">
          {/* Batch Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Nome do Lote <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="Ex: Restaurantes Baixa do Porto - Outscraper Março"
              className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:bg-white/[0.08] focus:outline-hidden focus:border-cyan-400 transition-all placeholder-slate-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Atribui um nome para identificar a origem desta lista nos filtros e métricas.
            </p>
          </div>

          {/* Drag & Drop Zone */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Ficheiro de Dados (.xlsx, .xls, .csv) <span className="text-rose-400">*</span>
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-cyan-400 bg-cyan-950/30"
                  : selectedFile
                  ? "border-emerald-500/50 bg-emerald-950/20"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-cyan-500/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-2">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    selectedFile
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                      : "bg-cyan-950 text-cyan-400 border border-cyan-500/40"
                  }`}
                >
                  {selectedFile ? (
                    <FileSpreadsheet className="w-6 h-6" />
                  ) : (
                    <UploadCloud className="w-6 h-6" />
                  )}
                </div>

                {selectedFile ? (
                  <div>
                    <span className="text-xs font-bold text-emerald-400 block">
                      {selectedFile.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Clica para alterar ficheiro
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      Arrasta o teu ficheiro Excel para aqui ou clica para navegar
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Suporta formatos .xlsx, .xls e .csv do Outscraper
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descarregar modelo Excel (.xlsx)</span>
            </button>

            <button
              type="submit"
              disabled={isProcessing || !selectedFile || !batchName.trim()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>A processar ficheiro...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Importar e Processar Leads</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Summary Alert after import */}
      {importSummary && (
        <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-2 backdrop-blur-md font-mono">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white">Importação Concluída com Sucesso!</h3>
              <p className="text-xs text-emerald-300 mt-1">
                Lote "<strong>{importSummary.batchName}</strong>": foram processadas{" "}
                <strong>{importSummary.total} linhas</strong>. Criados{" "}
                <strong>{importSummary.newCount} novos leads</strong>, atualizados{" "}
                <strong>{importSummary.updatedCount} leads existentes (merge)</strong> e ignoradas{" "}
                <strong>{importSummary.ignoredCount} linhas inválidas</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveView("leads")}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shrink-0 self-start sm:self-auto flex items-center gap-1.5 shadow-[0_0_12px_rgba(52,211,153,0.3)]"
          >
            <span>Ver Leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Outscraper Deduplication Rules info */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs font-mono text-slate-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white block mb-0.5">
            Deduplicação & Merge Inteligente:
          </span>
          A app verifica automaticamente se já existe um lead com o mesmo <code className="text-cyan-400">place_id</code> ou
          a mesma combinação de <code className="text-cyan-400">nome + cidade</code>. Se existir, preenche apenas os campos
          que estejam em branco no registo atual e recalcula o score de prioridade.
        </div>
      </div>

      {/* Previous Import Batches Table */}
      <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6 backdrop-blur-md space-y-4 font-mono">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Histórico de Lotes Importados ({batches.length})</span>
        </h3>

        {batches.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center bg-white/[0.01] rounded-xl border border-dashed border-white/10">
            Ainda não realizaste nenhuma importação de ficheiros
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-wider bg-white/[0.02]">
                  <th className="py-2.5 px-3">Nome do Lote</th>
                  <th className="py-2.5 px-3">Ficheiro Original</th>
                  <th className="py-2.5 px-3">Data de Importação</th>
                  <th className="py-2.5 px-3 text-center">Processados</th>
                  <th className="py-2.5 px-3 text-center">Novos</th>
                  <th className="py-2.5 px-3 text-center">Atualizados</th>
                  <th className="py-2.5 px-3 text-center">Ignorados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-white/[0.04]">
                    <td className="py-3 px-3 font-bold text-white">{batch.name}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {batch.originalFileName}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{formatDatePT(batch.importedAt)}</td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-300">
                      {batch.totalProcessed}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-400">
                      +{batch.newLeadsCount}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-cyan-400">
                      {batch.updatedLeadsCount}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500">
                      {batch.ignoredCount || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
