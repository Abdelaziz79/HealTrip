'use client';

import React from 'react';
import { Building2, Star, MapPin, Phone, Globe, Siren } from 'lucide-react';
import { Hospital } from '@/types';
import { Language, translations } from '@/lib/translations';

interface HospitalCardProps {
  hospital: Hospital;
  language: Language;
}

export function HospitalCard({ hospital, language }: HospitalCardProps) {
  const t = translations[language];

  const displayName = language === 'ar' && hospital.name_ar ? hospital.name_ar : hospital.name;
  const isEmergency = hospital.emergency_available === 1 || hospital.emergency_available === true;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-xs hover:border-slate-300 transition-all text-xs flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
          <div className="flex items-start gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-slate-900 text-xs sm:text-sm leading-tight truncate">
                {displayName}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                <span className="truncate">{[hospital.city, hospital.country].filter(Boolean).join(', ')}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex-shrink-0">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{hospital.rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="mt-2.5 sm:mt-3 flex flex-wrap gap-1 sm:gap-1.5">
          {isEmergency && (
            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
              <Siren className="h-3 w-3 text-rose-500" />
              {t.hospital.emergency24}
            </span>
          )}
          <span className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium bg-slate-100 text-slate-600">
            {t.hospital.accredited}
          </span>
        </div>
      </div>

      <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500">
        {hospital.phone ? (
          <a
            href={`tel:${hospital.phone}`}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 truncate"
          >
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span dir="ltr" className="truncate">{hospital.phone}</span>
          </a>
        ) : <span />}

        {hospital.website && (
          <a
            href={hospital.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-700 hover:underline font-medium inline-flex items-center gap-1 flex-shrink-0"
          >
            <Globe className="h-3 w-3" />
            {t.hospital.website}
          </a>
        )}
      </div>
    </div>
  );
}
