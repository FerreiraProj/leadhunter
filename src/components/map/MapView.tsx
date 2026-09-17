import React, { useEffect, useRef, useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { Lead, LeadStatus, LEAD_STATUS_CONFIG } from "../../types";
import { StatusBadge, ScoreBadge, WebsiteBadge } from "../common/Badge";
import {
  MapPin,
  SlidersHorizontal,
  Star,
  Sparkles,
} from "lucide-react";

declare global {
  interface Window {
    L: any;
  }
}

export const MapView: React.FC = () => {
  const { leads, openLeadDetail } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  // Filters
  const [websiteFilter, setWebsiteFilter] = useState<"ALL" | "NO_WEBSITE" | "HAS_WEBSITE">("ALL");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedLeadForSidePanel, setSelectedLeadForSidePanel] = useState<Lead | null>(null);

  // Leads with coordinates
  const leadsWithCoords = useMemo(() => {
    return leads.filter((l) => {
      const hasCoords = typeof l.latitude === "number" && typeof l.longitude === "number";
      if (!hasCoords) return false;

      if (websiteFilter === "NO_WEBSITE" && l.hasWebsite) return false;
      if (websiteFilter === "HAS_WEBSITE" && !l.hasWebsite) return false;

      if (selectedCity && l.city?.toLowerCase() !== selectedCity.toLowerCase()) return false;
      if (selectedStatus && l.status !== selectedStatus) return false;

      return true;
    });
  }, [leads, websiteFilter, selectedCity, selectedStatus]);

  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.city && l.city.trim()) set.add(l.city.trim());
    });
    return Array.from(set).sort();
  }, [leads]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;

    if (!mapInstanceRef.current) {
      const map = window.L.map(mapContainerRef.current).setView([39.5, -8.0], 7);

      window.L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = window.L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      // Keep map instance alive across rerenders
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !window.L) return;

    markersLayerRef.current.clearLayers();

    if (leadsWithCoords.length === 0) return;

    const bounds = window.L.latLngBounds([]);

    leadsWithCoords.forEach((lead) => {
      const lat = lead.latitude!;
      const lng = lead.longitude!;
      bounds.extend([lat, lng]);

      const isNoSite = !lead.hasWebsite;
      const markerColor = isNoSite ? "#f43f5e" : "#10b981"; // neon rose vs emerald

      const customIcon = window.L.divIcon({
        className: "custom-map-pin",
        html: `
          <div style="
            background-color: ${markerColor};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 2px solid #020408;
            box-shadow: 0 0 12px ${isNoSite ? "rgba(244,63,94,0.7)" : "rgba(16,185,129,0.7)"};
            display: flex;
            align-items: center;
            justify-content: center;
            color: #020408;
            font-weight: 900;
            font-size: 11px;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            ${isNoSite ? "!" : "✓"}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });

      const marker = window.L.marker([lat, lng], { icon: customIcon });

      const popupContent = document.createElement("div");
      popupContent.className = "p-1 text-slate-200 font-mono";
      popupContent.style.minWidth = "220px";
      popupContent.innerHTML = `
        <div class="font-bold text-xs text-white mb-1 leading-tight">${lead.name}</div>
        <div class="text-[11px] text-slate-400 mb-2">${lead.city || ""} • ${lead.type || ""}</div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 6px; background: ${
            lead.hasWebsite ? "rgba(16,185,129,0.2); color: #34d399;" : "rgba(244,63,94,0.2); color: #fb7185;"
          }">${lead.hasWebsite ? "Com Site" : "Sem Site"}</span>
          <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px; background: rgba(6,182,212,0.2); color: #22d3ee;">Score: ${lead.priorityScore}</span>
        </div>
        ${
          lead.phone
            ? `<div class="text-[11px] text-slate-300 mb-2 font-mono">📞 ${lead.phone}</div>`
            : ""
        }
        <button id="btn-popup-${lead.id}" style="
          width: 100%;
          padding: 7px;
          background: linear-gradient(135deg, #06b6d4, #4f46e5);
          color: white;
          border-radius: 8px;
          font-weight: bold;
          font-size: 11px;
          border: none;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(6,182,212,0.3);
        ">Ver Ficha do Lead →</button>
      `;

      marker.bindPopup(popupContent);

      marker.on("popupopen", () => {
        const btn = document.getElementById(`btn-popup-${lead.id}`);
        if (btn) {
          btn.onclick = () => openLeadDetail(lead.id);
        }
        setSelectedLeadForSidePanel(lead);
      });

      marker.on("click", () => {
        setSelectedLeadForSidePanel(lead);
      });

      markersLayerRef.current.addLayer(marker);
    });

    if (leadsWithCoords.length > 0 && bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [leadsWithCoords, openLeadDetail]);

  const handleCenterOnLead = (lead: Lead) => {
    if (!mapInstanceRef.current || !lead.latitude || !lead.longitude) return;
    mapInstanceRef.current.setView([lead.latitude, lead.longitude], 15, { animate: true });
    setSelectedLeadForSidePanel(lead);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-cyan-400" />
            <span>Mapa Geográfico de Leads</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Visualiza a densidade geográfica e planeia rotas de visitas presenciais em Portugal
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono font-semibold bg-white/[0.03] p-2.5 rounded-xl border border-white/10 backdrop-blur-md self-start sm:self-auto">
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="w-3 h-3 rounded-full bg-rose-500 border border-black shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            <span>Sem Website ({leads.filter((l) => !l.hasWebsite && l.latitude).length})</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-black shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span>Com Website ({leads.filter((l) => l.hasWebsite && l.latitude).length})</span>
          </div>
        </div>
      </div>

      {/* Quick Map Filters */}
      <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/10 backdrop-blur-md flex flex-wrap items-center gap-3 font-mono">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mr-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
          <span>Filtros do Mapa:</span>
        </div>

        {/* Website toggle */}
        <div className="flex items-center bg-white/[0.04] p-1 rounded-xl text-xs border border-white/10">
          <button
            onClick={() => setWebsiteFilter("ALL")}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              websiteFilter === "ALL"
                ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setWebsiteFilter("NO_WEBSITE")}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              websiteFilter === "NO_WEBSITE"
                ? "bg-rose-600 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]"
                : "text-slate-400 hover:text-rose-400"
            }`}
          >
            Sem Website
          </button>
          <button
            onClick={() => setWebsiteFilter("HAS_WEBSITE")}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              websiteFilter === "HAS_WEBSITE"
                ? "bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                : "text-slate-400 hover:text-emerald-400"
            }`}
          >
            Com Website
          </button>
        </div>

        {/* City */}
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="px-3 py-1.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:border-cyan-400"
        >
          <option value="" className="bg-[#0a101d] text-slate-200">Todas as Cidades</option>
          {uniqueCities.map((c) => (
            <option key={c} value={c} className="bg-[#0a101d] text-slate-200">
              {c}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:border-cyan-400"
        >
          <option value="" className="bg-[#0a101d] text-slate-200">Todos os Estados</option>
          {(Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[]).map((st) => (
            <option key={st} value={st} className="bg-[#0a101d] text-slate-200">
              {LEAD_STATUS_CONFIG[st].label}
            </option>
          ))}
        </select>

        <div className="ml-auto text-xs font-bold text-cyan-400">
          {leadsWithCoords.length} localizações mapeadas
        </div>
      </div>

      {/* Map + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[620px]">
        {/* Map Container */}
        <div className="lg:col-span-3 bg-white/[0.02] rounded-2xl border border-white/10 shadow-[0_0_25px_rgba(0,0,0,0.5)] overflow-hidden h-full relative">
          <div ref={mapContainerRef} className="w-full h-full z-10" />
        </div>

        {/* Map Leads Side List */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 backdrop-blur-md p-4 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Leads no Mapa ({leadsWithCoords.length})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono">
            {leadsWithCoords.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                Nenhum lead com coordenadas para estes filtros
              </p>
            ) : (
              leadsWithCoords.map((lead) => {
                const isSelected = selectedLeadForSidePanel?.id === lead.id;
                return (
                  <div
                    key={lead.id}
                    onClick={() => handleCenterOnLead(lead)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? "bg-cyan-950/40 border-cyan-500/50 ring-1 ring-cyan-400/30"
                        : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="font-bold text-white line-clamp-1">{lead.name}</span>
                      <ScoreBadge score={lead.priorityScore} />
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2">
                      <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
                      <span className="truncate">{lead.city || "Portugal"}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <WebsiteBadge hasWebsite={lead.hasWebsite} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openLeadDetail(lead.id);
                        }}
                        className="text-[11px] font-bold text-cyan-400 hover:underline"
                      >
                        Ver Detalhes →
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
