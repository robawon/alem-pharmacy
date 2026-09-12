"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Tag } from "lucide-react";
import { DrugCategory } from "@/lib/types";

export const CATEGORIES: { value: DrugCategory; label: string }[] = [
  { value: "anti_diabetics",    label: "Anti Diabetics" },
  { value: "anti_biotic",       label: "Anti Biotic" },
  { value: "anti_pain",         label: "Anti Pain" },
  { value: "anti_protozal",     label: "Anti Protozoal" },
  { value: "cns_drugs",         label: "CNS Drugs" },
  { value: "cv",                label: "CV" },
  { value: "dermatology",       label: "Dermatology" },
  { value: "eye_ear_nasal",     label: "Eye-Ear and Nasal Preparation Drugs" },
  { value: "gi",                label: "GI" },
  { value: "hormonal_drug",     label: "Hormonal Drug" },
  { value: "medical_equipment", label: "Medical Equipment" },
  { value: "respiratory_drug",  label: "Respiratory Drug" },
  { value: "vitamins_minerals", label: "Vitamin and Minerals" },
  { value: "cosmetics",         label: "Cosmetics" },
];

interface CategorySelectProps {
  value?: DrugCategory | string;
  onChange: (val: DrugCategory) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CategorySelect({
  value,
  onChange,
  placeholder = "Select Category...",
  className = "",
  disabled = false,
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCategory = CATEGORIES.find((c) => c.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (catValue: DrugCategory) => {
    onChange(catValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border bg-slate-900/90 px-3.5 py-2.5 text-sm transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${
          isOpen
            ? "border-teal-500 ring-2 ring-teal-500/30 bg-slate-800/90"
            : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/60"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          <Tag className="h-4 w-4 text-teal-400 shrink-0" />
          <span className={`truncate text-sm ${selectedCategory ? "text-slate-100 font-medium" : "text-slate-400"}`}>
            {selectedCategory ? selectedCategory.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-teal-400" : ""
          }`}
        />
      </button>

      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 rounded-xl border border-slate-700 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-md shadow-slate-950/80 animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="max-h-64 overflow-y-auto overscroll-contain space-y-0.5 pr-1 custom-scrollbar">
            {CATEGORIES.map((cat) => {
              const isSelected = cat.value === value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleSelect(cat.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all duration-150 text-left ${
                    isSelected
                      ? "bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="truncate">{cat.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-teal-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
