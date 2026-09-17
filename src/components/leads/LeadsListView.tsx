import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Lead, LeadStatus, LEAD_STATUS_CONFIG } from "../../types";
import { StatusBadge, ScoreBadge, WebsiteBadge } from "../common/Badge";
import { EmptyState } from "../common/EmptyState";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  LayoutGrid,
  List,
  Phone,
  Mail,
  MapPin,
  Star,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Sparkles,
  Building,
  Instagram,
  Facebook,
  Linkedin,
  Globe,
  Share2,
  Quote,
  History,
} from "lucide-react";

type SortField = "name" | "city" | "rating" | "reviews" | "priorityScore" | "status";
type SortDirection = "asc" | "desc";

export const LeadsListView: React.FC = () => {
  const {
    leads,
    batches,
    filters,
    setFilters,
    resetFilters,
    viewMode,
    setViewMode,
    openLeadDetail,
    openAIPitchModal,
    setActiveView,
  } = useApp();

  const [sortField, setSortField] = useState<SortField>("priorityScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 25;

  // Extract unique cities from all leads
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.city && l.city.trim()) set.add(l.city.trim());
    });
    return Array.from(set).sort();
  }, [leads]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("v", "leads");
    if (filters.search) params.set("q", filters.search);
    else params.delete("q");

    if (filters.websiteFilter !== "ALL") params.set("site", filters.websiteFilter);
    else params.delete("site");

    if (filters.socialFilter && filters.socialFilter !== "ALL") params.set("social", filters.socialFilter);
    else params.delete("social");

    if (filters.city) params.set("city", filters.city);
    else params.delete("city");

    if (filters.status.length > 0) params.set("status", filters.status.join(","));
    else params.delete("status");

    if (filters.minScore !== "") params.set("minScore", String(filters.minScore));
    else params.delete("minScore");

    if (filters.minRating !== "") params.set("minRating", String(filters.minRating));
    else params.delete("minRating");

    if (filters.batchId) params.set("batch", filters.batchId);
    else params.delete("batch");

    if (filters.hasPhoneOnly) params.set("phone", "1");
    else params.delete("phone");

    if (filters.hasEmailOnly) params.set("email", "1");
    else params.delete("email");

    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }, [filters]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortField, sortDirection]);

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Text search
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const matchName = lead.name?.toLowerCase().includes(q);
        const matchCity = lead.city?.toLowerCase().includes(q);
        const matchPhone = lead.phone?.toLowerCase().includes(q);
        const matchEmail = lead.email?.toLowerCase().includes(q);
        const matchType = lead.type?.toLowerCase().includes(q);
        const matchNotes = lead.notes?.toLowerCase().includes(q);
        if (!matchName && !matchCity && !matchPhone && !matchEmail && !matchType && !matchNotes) {
          return false;
        }
      }

      // 2. Website filter
      if (filters.websiteFilter === "NO_WEBSITE" && lead.hasWebsite) return false;
      if (filters.websiteFilter === "HAS_WEBSITE" && !lead.hasWebsite) return false;

      // 3. Social Media filter
      if (filters.socialFilter === "HAS_SOCIAL" && !lead.hasSocialMedia) return false;
      if (filters.socialFilter === "NO_SOCIAL" && lead.hasSocialMedia) return false;
      if (filters.socialFilter === "HAS_INSTAGRAM" && !lead.instagram && !lead.companyInstagram && !lead.contactInstagram) return false;
      if (filters.socialFilter === "HAS_FACEBOOK" && !lead.facebook && !lead.companyFacebook && !lead.contactFacebook) return false;
      if (filters.socialFilter === "HAS_LINKEDIN" && !lead.linkedin && !lead.companyLinkedin && !lead.contactLinkedin) return false;
      if (filters.socialFilter === "SOCIAL_NO_WEBSITE" && (!lead.hasSocialMedia || lead.hasWebsite)) return false;

      // 4. City filter
      if (filters.city && lead.city?.toLowerCase() !== filters.city.toLowerCase()) {
        return false;
      }

      // 5. Status filter
      if (filters.status.length > 0 && !filters.status.includes(lead.status)) {
        return false;
      }

      // 6. Min score
      if (filters.minScore !== "" && lead.priorityScore < Number(filters.minScore)) {
        return false;
      }

      // 7. Min rating
      if (filters.minRating !== "") {
        const minR = Number(filters.minRating);
        if (!lead.rating || lead.rating < minR) return false;
      }

      // 8. Batch filter
      if (filters.batchId && lead.batchId !== filters.batchId) {
        return false;
      }

      // 9. Phone only
      if (filters.hasPhoneOnly && !lead.phone) {
        return false;
      }

      // 10. Email only
      if (filters.hasEmailOnly && !lead.email) {
        return false;
      }

      return true;
    });
  }, [leads, filters]);

  // Sort leads
  const sortedLeads = useMemo(() => {
    const list = [...filteredLeads];
    list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      if (typeof valA === "string") {
        const cmp = valA.localeCompare(valB, "pt", { sensitivity: "base" });
        return sortDirection === "asc" ? cmp : -cmp;
      }

      return sortDirection === "asc" ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
    });
    return list;
  }, [filteredLeads, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedLeads.length / pageSize) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLeads.slice(start, start + pageSize);
  }, [sortedLeads, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const toggleStatusFilter = (st: LeadStatus) => {
    setFilters((prev) => {
      const exists = prev.status.includes(st);
      if (exists) {
        return { ...prev, status: prev.status.filter((s) => s !== st) };
      } else {
        return { ...prev, status: [...prev.status, st] };
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Leads & Pipeline</span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
              {filteredLeads.length} de {leads.length}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Pesquisa rápida, filtros por presença de website e scores de prioridade
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div className="bg-white/[0.04] p-1 rounded-xl border border-white/10 flex items-center gap-1">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "table"
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Vista de Tabela"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "cards"
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Vista de Cartões"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/10 backdrop-blur-md shadow-[0_0_25px_rgba(6,182,212,0.06)] space-y-4">
        {/* Row 1: Search & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Pesquisar empresa, cidade..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:bg-white/[0.07] focus:outline-hidden focus:border-cyan-400 transition-all font-mono"
            />
          </div>

          {/* Website Filter */}
          <div>
            <select
              value={filters.websiteFilter}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  websiteFilter: e.target.value as "ALL" | "NO_WEBSITE" | "HAS_WEBSITE",
                }))
              }
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:bg-white/[0.07] focus:outline-hidden focus:border-cyan-400 transition-all font-mono"
            >
              <option value="ALL" className="bg-[#0a101d] text-slate-200">Website: Todos</option>
              <option value="NO_WEBSITE" className="bg-[#0a101d] text-rose-300">Sem Website (Alvo)</option>
              <option value="HAS_WEBSITE" className="bg-[#0a101d] text-emerald-300">Com Website</option>
            </select>
          </div>

          {/* Social Media Filter */}
          <div>
            <select
              value={filters.socialFilter || "ALL"}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  socialFilter: e.target.value as any,
                }))
              }
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:bg-white/[0.07] focus:outline-hidden focus:border-cyan-400 transition-all font-mono"
            >
              <option value="ALL" className="bg-[#0a101d] text-slate-200">Redes: Todas</option>
              <option value="HAS_SOCIAL" className="bg-[#0a101d] text-cyan-300">Com Redes Sociais</option>
              <option value="SOCIAL_NO_WEBSITE" className="bg-[#0a101d] text-amber-300 font-bold">🔥 Redes sem Site (+Score)</option>
              <option value="HAS_INSTAGRAM" className="bg-[#0a101d] text-pink-300">Com Instagram</option>
              <option value="HAS_FACEBOOK" className="bg-[#0a101d] text-blue-300">Com Facebook</option>
              <option value="HAS_LINKEDIN" className="bg-[#0a101d] text-cyan-300">Com LinkedIn</option>
              <option value="NO_SOCIAL" className="bg-[#0a101d] text-slate-400">Sem Redes Sociais</option>
            </select>
          </div>

          {/* City Filter */}
          <div>
            <select
              value={filters.city}
              onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:bg-white/[0.07] focus:outline-hidden focus:border-cyan-400 transition-all font-mono"
            >
              <option value="" className="bg-[#0a101d] text-slate-200">Todas as Cidades</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city} className="bg-[#0a101d] text-slate-200">
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <select
              value={filters.batchId}
              onChange={(e) => setFilters((f) => ({ ...f, batchId: e.target.value }))}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:bg-white/[0.07] focus:outline-hidden focus:border-cyan-400 transition-all truncate font-mono"
            >
              <option value="" className="bg-[#0a101d] text-slate-200">Todos os Lotes</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#0a101d] text-slate-200">
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Numeric Thresholds, Checkboxes & Clear */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            {/* Min Score */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-400">Score Min:</span>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Ex: 50"
                value={filters.minScore}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    minScore: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                className="w-16 px-2 py-1 bg-white/[0.04] border border-white/10 rounded-lg text-xs font-bold text-center text-cyan-400 focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            {/* Min Rating */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-400">Rating Min:</span>
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                placeholder="Ex: 4.0"
                value={filters.minRating}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    minRating: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                className="w-16 px-2 py-1 bg-white/[0.04] border border-white/10 rounded-lg text-xs font-bold text-center text-amber-400 focus:outline-hidden focus:border-amber-400"
              />
            </div>

            {/* Checkbox Has Phone */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium select-none">
              <input
                type="checkbox"
                checked={filters.hasPhoneOnly}
                onChange={(e) => setFilters((f) => ({ ...f, hasPhoneOnly: e.target.checked }))}
                className="rounded accent-cyan-500 w-3.5 h-3.5 bg-white/10"
              />
              <span>Tem telefone</span>
            </label>

            {/* Checkbox Has Email */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium select-none">
              <input
                type="checkbox"
                checked={filters.hasEmailOnly}
                onChange={(e) => setFilters((f) => ({ ...f, hasEmailOnly: e.target.checked }))}
                className="rounded accent-cyan-500 w-3.5 h-3.5 bg-white/10"
              />
              <span>Tem email</span>
            </label>
          </div>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar filtros</span>
          </button>
        </div>

        {/* Row 3: Status Multi-select Chips */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mr-1">
            Estados:
          </span>
          {(Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[]).map((st) => {
            const isSelected = filters.status.includes(st);
            const cfg = LEAD_STATUS_CONFIG[st];
            return (
              <button
                key={st}
                type="button"
                onClick={() => toggleStatusFilter(st)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border transition-all ${
                  isSelected
                    ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]`
                    : "bg-white/[0.02] text-slate-400 border-white/10 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: cfg.colorHex }}
                />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main List Render */}
      {leads.length === 0 ? (
        <EmptyState
          title="Ainda não tens nenhum lead importado"
          description="A base de dados foi limpa. Podes agora importar o teu ficheiro Excel (.xlsx, .xls, .csv) do Outscraper com os teus leads."
          actionText="Importar Ficheiro Excel (.xlsx)"
          onAction={() => setActiveView("import")}
        />
      ) : paginatedLeads.length === 0 ? (
        <EmptyState
          title="Nenhum lead corresponde aos filtros"
          description="Tenta ajustar a tua pesquisa ou limpar os filtros para visualizar mais empresas."
          actionText="Limpar Todos os Filtros"
          onAction={resetFilters}
        />
      ) : viewMode === "table" ? (
        /* Table View */
        <div className="bg-white/[0.02] rounded-2xl border border-white/10 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider select-none">
                  <th
                    onClick={() => handleSort("name")}
                    className="py-3.5 px-4 cursor-pointer hover:text-cyan-400 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Empresa</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("city")}
                    className="py-3.5 px-3 cursor-pointer hover:text-cyan-400 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Cidade</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 px-3">Tipo</th>
                  <th className="py-3.5 px-3">Website & Redes</th>
                  <th
                    onClick={() => handleSort("rating")}
                    className="py-3.5 px-3 cursor-pointer hover:text-cyan-400 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Rating</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("reviews")}
                    className="py-3.5 px-3 cursor-pointer hover:text-cyan-400 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Reviews</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("priorityScore")}
                    className="py-3.5 px-3 cursor-pointer hover:text-cyan-400 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Score</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="py-3.5 px-3 cursor-pointer hover:text-cyan-400 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Estado</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3.5 px-3">Telefone</th>
                  <th className="py-3.5 px-3">Email</th>
                  <th className="py-3.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedLeads.map((lead) => {
                  const instaUrl = lead.instagram || lead.companyInstagram || lead.contactInstagram;
                  const fbUrl = lead.facebook || lead.companyFacebook || lead.contactFacebook;
                  const inUrl = lead.linkedin || lead.companyLinkedin || lead.contactLinkedin;

                  const fullInsta = instaUrl ? (instaUrl.startsWith("http") ? instaUrl : `https://instagram.com/${instaUrl.replace(/^@/, "")}`) : "";
                  const fullFb = fbUrl ? (fbUrl.startsWith("http") ? fbUrl : `https://facebook.com/${fbUrl}`) : "";
                  const fullIn = inUrl ? (inUrl.startsWith("http") ? inUrl : `https://linkedin.com/company/${inUrl}`) : "";

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-cyan-950/20 transition-colors group"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => openLeadDetail(lead.id)}
                            className="font-bold text-white group-hover:text-cyan-300 group-hover:underline text-left block max-w-[200px] truncate transition-colors"
                          >
                            {lead.name}
                          </button>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {lead.featuredGoogleReview && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono"
                                title={`Review Google: "${lead.featuredGoogleReview}"`}
                              >
                                <Quote className="w-2.5 h-2.5" />
                                <span>Review</span>
                              </span>
                            )}
                            {lead.lastEmailSentAt && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30 text-[10px] font-mono"
                                title={`Email enviado a ${new Date(lead.lastEmailSentAt).toLocaleDateString("pt-PT")}`}
                              >
                                <History className="w-2.5 h-2.5" />
                                <span>Enviado</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* City */}
                      <td className="py-3.5 px-3 text-slate-400 font-mono truncate max-w-[120px]">
                        {lead.city || "—"}
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-3 text-slate-400 truncate max-w-[140px]">
                        {lead.type || lead.category || "—"}
                      </td>

                      {/* Website & Social */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1.5">
                          <WebsiteBadge hasWebsite={lead.hasWebsite} websiteUrl={lead.website} />
                          {(instaUrl || fbUrl || inUrl) && (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {fullInsta && (
                                <a
                                  href={fullInsta}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-md bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 border border-pink-500/20 transition-all"
                                  title="Instagram"
                                >
                                  <Instagram className="w-3 h-3" />
                                </a>
                              )}
                              {fullFb && (
                                <a
                                  href={fullFb}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all"
                                  title="Facebook"
                                >
                                  <Facebook className="w-3 h-3" />
                                </a>
                              )}
                              {fullIn && (
                                <a
                                  href={fullIn}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all"
                                  title="LinkedIn"
                                >
                                  <Linkedin className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-3.5 px-3">
                        {lead.rating ? (
                          <div className="flex items-center gap-1 font-semibold text-amber-400 font-mono">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span>{lead.rating}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Reviews */}
                      <td className="py-3.5 px-3 text-slate-300 font-mono">
                        {lead.reviews ? lead.reviews.toLocaleString("pt-PT") : "—"}
                      </td>

                      {/* Priority Score */}
                      <td className="py-3.5 px-3">
                        <ScoreBadge score={lead.priorityScore} />
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <StatusBadge status={lead.status} size="sm" />
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-3 font-mono">
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-slate-300 hover:text-cyan-300"
                          >
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span className="truncate max-w-[110px]">{lead.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-3 font-mono">
                        {lead.email ? (
                          <a
                            href={`mailto:${lead.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
                            title={lead.email}
                          >
                            <Mail className="w-3 h-3 text-cyan-400" />
                            <span className="truncate max-w-[120px]">{lead.email}</span>
                          </a>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openAIPitchModal(lead)}
                            className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-950/60 hover:border hover:border-cyan-500/30 transition-all"
                            title="Gerar Pitch com IA"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openLeadDetail(lead.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-white/5 hover:bg-cyan-500 hover:text-black text-slate-300 border border-white/10 transition-all"
                          >
                            Ver
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View (Grid) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedLeads.map((lead) => {
            const instaUrl = lead.instagram || lead.companyInstagram || lead.contactInstagram;
            const fbUrl = lead.facebook || lead.companyFacebook || lead.contactFacebook;
            const inUrl = lead.linkedin || lead.companyLinkedin || lead.contactLinkedin;

            const fullInsta = instaUrl ? (instaUrl.startsWith("http") ? instaUrl : `https://instagram.com/${instaUrl.replace(/^@/, "")}`) : "";
            const fullFb = fbUrl ? (fbUrl.startsWith("http") ? fbUrl : `https://facebook.com/${fbUrl}`) : "";
            const fullIn = inUrl ? (inUrl.startsWith("http") ? inUrl : `https://linkedin.com/company/${inUrl}`) : "";

            return (
            <div
              key={lead.id}
              onClick={() => openLeadDetail(lead.id)}
              className="bg-white/[0.03] rounded-2xl border border-white/10 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] transition-all cursor-pointer flex flex-col justify-between overflow-hidden group backdrop-blur-md"
            >
              {/* Card Header & Photo */}
              <div className="relative h-36 bg-slate-900 overflow-hidden">
                {lead.photo ? (
                  <img
                    src={lead.photo}
                    alt={lead.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-gradient-to-br from-slate-900 to-[#0a101d]">
                    <Building className="w-10 h-10 mb-1 opacity-40" />
                    <span className="text-[10px] font-mono text-slate-500">Sem fotografia</span>
                  </div>
                )}
                {/* Floating Score & Status */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <ScoreBadge score={lead.priorityScore} />
                </div>
                <div className="absolute top-3 right-3">
                  <StatusBadge status={lead.status} size="sm" />
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-extrabold text-sm text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {lead.name}
                    </h3>
                  </div>

                  {/* Review & Sent Badges if present */}
                  {(lead.featuredGoogleReview || lead.lastEmailSentAt) && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      {lead.featuredGoogleReview && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono"
                          title={`Review Google: "${lead.featuredGoogleReview}"`}
                        >
                          <Quote className="w-3 h-3" />
                          <span>Review Google</span>
                        </span>
                      )}
                      {lead.lastEmailSentAt && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-300 border border-amber-500/30 text-[10px] font-mono"
                          title={`Email enviado a ${new Date(lead.lastEmailSentAt).toLocaleDateString("pt-PT")}`}
                        >
                          <History className="w-3 h-3" />
                          <span>Email Enviado</span>
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 font-mono">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                    <span className="truncate">{lead.city || "Portugal"}</span>
                    {lead.type && <span>• {lead.type}</span>}
                  </div>

                  {/* Rating & Website */}
                  <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-white/10">
                    <WebsiteBadge hasWebsite={lead.hasWebsite} />
                    {lead.rating ? (
                      <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{lead.rating}</span>
                        <span className="text-slate-500 font-normal">({lead.reviews || 0})</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 font-mono">Sem avaliações</span>
                    )}
                  </div>

                  {/* Social Media Badges */}
                  {(fullInsta || fullFb || fullIn) && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-3" onClick={(e) => e.stopPropagation()}>
                      {fullInsta && (
                        <a
                          href={fullInsta}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 border border-pink-500/20 text-[10px] font-mono transition-colors"
                        >
                          <Instagram className="w-3 h-3" />
                          <span>Instagram</span>
                        </a>
                      )}
                      {fullFb && (
                        <a
                          href={fullFb}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 text-[10px] font-mono transition-colors"
                        >
                          <Facebook className="w-3 h-3" />
                          <span>Facebook</span>
                        </a>
                      )}
                      {fullIn && (
                        <a
                          href={fullIn}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 text-[10px] font-mono transition-colors"
                        >
                          <Linkedin className="w-3 h-3" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Contacts & Quick Pitch */}
                <div className="space-y-2 text-xs font-mono">
                  {lead.phone && (
                    <div className="flex items-center gap-2 text-slate-300 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{lead.phone}</span>
                    </div>
                  )}
                  {lead.email && (
                    <div className="flex items-center gap-2 text-cyan-400 truncate">
                      <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}

                  <div className="pt-3 flex items-center justify-between border-t border-white/5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAIPitchModal(lead);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Pitch IA</span>
                    </button>

                    <span className="text-xs font-bold text-slate-300 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all flex items-center gap-0.5">
                      Ver detalhes →
                    </span>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {sortedLeads.length > pageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10 font-mono">
          <div className="text-xs text-slate-400">
            A mostrar {(currentPage - 1) * pageSize + 1} a{" "}
            {Math.min(currentPage * pageSize, sortedLeads.length)} de {sortedLeads.length} leads
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-white px-3">
              Página {currentPage} de {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
