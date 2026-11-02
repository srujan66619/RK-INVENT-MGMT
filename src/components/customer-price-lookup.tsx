import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Package,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
  Tag,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { inr } from "@/lib/format";
import { getPublicPriceLookupFn } from "@/lib/api/inventory";

interface PublicPartItem {
  name: string;
  sku: string | null;
  category: string;
  selling_price: number;
  in_stock: boolean;
}

export function CustomerPriceLookup() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Debounce search term by 250ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["public-price-lookup", debouncedSearch, selectedCategory],
    queryFn: async () => {
      const res = await getPublicPriceLookupFn({
        data: {
          search: debouncedSearch,
          category: selectedCategory,
        },
      });
      return res as { items: PublicPartItem[]; categories: string[] };
    },
    staleTime: 30000, // 30s cache
  });

  const items = data?.items || [];
  const categories = data?.categories || [];

  return (
    <section id="part-prices" className="py-20 md:py-28 bg-gradient-to-b from-[#ffffff] via-[#f0f9ff]/50 to-[#ffffff] relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#0284c7]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0284c7]/10 text-[#0284c7] font-semibold text-xs uppercase tracking-wider mb-4 border border-[#0284c7]/20">
              <Sparkles className="h-3.5 w-3.5" />
              Transparent Pricing
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#082f49] tracking-tight mb-4">
              Check Repair Part Prices
            </h2>
            <p className="text-base md:text-lg text-[#0369a1] leading-relaxed">
              Find the parts you need and check their current prices directly from RK Repair Labs.
              Real-time pricing backed by our live workshop inventory.
            </p>
          </motion.div>
        </div>

        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[#ffffff] p-4 sm:p-6 rounded-2xl md:rounded-3xl shadow-xl shadow-[#082f49]/5 border border-[#bae6fd]/80 mb-10"
        >
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#0284c7]" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by part name (e.g. Battery, Screen, Motherboard), SKU, or category…"
              className="w-full pl-12 pr-10 h-13 sm:h-14 text-base sm:text-lg bg-[#f0f9ff]/50 border-[#bae6fd] focus:border-[#0284c7] focus:ring-4 focus:ring-[#0284c7]/10 rounded-xl text-[#082f49] placeholder:text-[#082f49]/40 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-[#e0f2fe] text-[#0369a1] transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-[#075985] uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
              <Tag className="h-3.5 w-3.5 text-[#0284c7]" />
              Filter:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-[#0284c7] text-[#ffffff] shadow-md shadow-[#0284c7]/25"
                  : "bg-[#f0f9ff] text-[#0369a1] hover:bg-[#e0f2fe] border border-[#bae6fd]/60"
              }`}
            >
              All Parts
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat.toLowerCase())}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.toLowerCase()
                    ? "bg-[#0284c7] text-[#ffffff] shadow-md shadow-[#0284c7]/25"
                    : "bg-[#f0f9ff] text-[#0369a1] hover:bg-[#e0f2fe] border border-[#bae6fd]/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results Count & Active Search Info */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-[#075985] font-medium px-2 mb-6">
          <div>
            {isLoading ? (
              <span>Checking live inventory…</span>
            ) : (
              <span>
                Showing <strong className="text-[#082f49]">{items.length}</strong> available item{items.length === 1 ? "" : "s"}
                {debouncedSearch && ` matching "${debouncedSearch}"`}
              </span>
            )}
          </div>
          {(debouncedSearch || selectedCategory !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="text-[#0284c7] hover:underline font-semibold"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Results Display */}
        {isLoading ? (
          /* Skeleton Loading Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-[#ffffff] rounded-2xl p-6 border border-[#e0f2fe] shadow-sm animate-pulse space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="h-5 w-24 bg-[#e0f2fe] rounded-full" />
                  <div className="h-5 w-16 bg-[#e0f2fe] rounded-full" />
                </div>
                <div className="h-6 w-3/4 bg-[#e0f2fe] rounded" />
                <div className="h-4 w-1/2 bg-[#e0f2fe] rounded" />
                <div className="pt-4 border-t border-[#f0f9ff] flex justify-between items-baseline">
                  <div className="h-7 w-24 bg-[#e0f2fe] rounded" />
                  <div className="h-8 w-20 bg-[#e0f2fe] rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {items.map((item, idx) => {
                const whatsappUrl = `https://wa.me/919666984949?text=${encodeURIComponent(
                  `Hi RK Repair Labs, I am inquiring about the ${item.name}${item.sku ? ` (SKU: ${item.sku})` : ""} priced at ${inr(item.selling_price)}. Is it currently available for installation/service?`
                )}`;

                return (
                  <motion.div
                    key={`${item.name}-${item.sku}-${idx}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.3) }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="bg-[#ffffff] rounded-2xl p-6 border border-[#e0f2fe] shadow-md shadow-[#082f49]/3 hover:shadow-xl hover:shadow-[#0284c7]/10 hover:border-[#7dd3fc] transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#f0f9ff] text-[#0284c7] border border-[#bae6fd]/50">
                          {item.category}
                        </span>

                        {/* Availability Badge */}
                        {item.in_stock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            In Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            On Request
                          </span>
                        )}
                      </div>

                      {/* Part Name */}
                      <h3 className="text-lg font-bold text-[#082f49] group-hover:text-[#0284c7] transition-colors line-clamp-2 mb-1.5">
                        {item.name}
                      </h3>

                      {/* SKU / Code */}
                      {item.sku ? (
                        <div className="text-xs font-mono text-[#075985]/70 mb-4">
                          SKU: <span className="text-[#082f49] font-medium">{item.sku}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-[#075985]/50 mb-4 italic">Standard Workshop Part</div>
                      )}
                    </div>

                    {/* Price & Action */}
                    <div className="pt-4 border-t border-[#f0f9ff] flex items-center justify-between gap-3 mt-2">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#075985]/70">
                          Customer Price
                        </div>
                        {item.selling_price > 0 ? (
                          <div className="text-2xl font-black text-[#0284c7] tracking-tight">
                            {inr(item.selling_price)}
                          </div>
                        ) : (
                          <div className="text-xs font-semibold text-amber-700">
                            Price unavailable — Contact us
                          </div>
                        )}
                      </div>

                      {/* WhatsApp Inquiry Button */}
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#f0f9ff] text-[#0284c7] border border-[#bae6fd] hover:bg-[#0284c7] hover:text-[#ffffff] transition-all"
                        title="Inquire about this part"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Inquire
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 px-6 bg-[#ffffff] rounded-3xl border border-[#e0f2fe] shadow-sm max-w-xl mx-auto"
          >
            <div className="h-16 w-16 mx-auto rounded-full bg-[#f0f9ff] text-[#0284c7] flex items-center justify-center mb-4">
              <Package className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-[#082f49] mb-2">No Parts Found</h3>
            <p className="text-sm text-[#0369a1] mb-6 leading-relaxed">
              {debouncedSearch
                ? `We couldn't find any inventory part matching "${debouncedSearch}". We can source parts for almost all devices on demand.`
                : "No parts currently listed in this category."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="border-[#bae6fd] text-[#0369a1] hover:bg-[#f0f9ff]"
              >
                Clear Search
              </Button>
              <a
                href="https://wa.me/919666984949?text=Hi%20RK%20Repair%20Labs,%20I%20am%20looking%20for%20a%20part%20that%20is%20not%20listed%20on%20your%20site."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-[#0284c7] text-[#ffffff] hover:bg-[#0369a1] transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                Ask Us on WhatsApp
              </a>
            </div>
          </motion.div>
        )}

        {/* Call to action footer banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-14 bg-gradient-to-r from-[#0284c7] to-[#0369a1] rounded-3xl p-8 sm:p-10 text-[#ffffff] shadow-xl shadow-[#0284c7]/20 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Need help finding a part? Contact RK Repair Labs.
            </h4>
            <p className="text-[#e0f2fe] text-sm sm:text-base max-w-xl">
              Get an instant diagnosis and exact estimate from our certified chip-level repair technicians.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <a
              href="tel:+919666984949"
              className="inline-flex items-center gap-2 bg-[#ffffff] text-[#0284c7] hover:bg-[#f0f9ff] px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all"
            >
              <Phone className="h-4 w-4" />
              Call +91 96669 84949
            </a>
            <a
              href="https://wa.me/919666984949?text=Hi%20RK%20Repair%20Labs,%20I%20would%20like%20to%20get%20a%20quote%20for%20my%20device%20repair."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-[#ffffff] px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Us
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
