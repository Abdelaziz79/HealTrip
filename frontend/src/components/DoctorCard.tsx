'use client';

import React from 'react';
import { Star, Building, Stethoscope } from 'lucide-react';
import { Doctor } from '@/types';
import { Language, translations } from '@/lib/translations';

interface DoctorCardProps {
  doctor: Doctor;
  language: Language;
}

export function DoctorCard({ doctor, language }: DoctorCardProps) {
  const t = translations[language];

  // Helper for languages list
  const langList: string[] = Array.isArray(doctor.languages)
    ? doctor.languages
    : typeof doctor.languages === 'string'
    ? (() => {
        try {
          return JSON.parse(doctor.languages);
        } catch {
          return [doctor.languages];
        }
      })()
    : [];

  const displayName = language === 'ar' && doctor.name_ar ? doctor.name_ar : doctor.name;
  const secondaryName = language === 'ar' ? doctor.name : doctor.name_ar;
  const displaySpecialty = language === 'ar' && doctor.specialty_name_ar ? doctor.specialty_name_ar : doctor.specialty_name || 'Specialist';
  const displayHospital = language === 'ar' && doctor.hospital_name_ar ? doctor.hospital_name_ar : doctor.hospital_name || '';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-xs hover:border-teal-400 hover:shadow-sm transition-all text-xs flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
          <div className="flex items-start gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 font-bold">
              <Stethoscope className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-slate-900 text-xs sm:text-sm leading-tight truncate">
                {displayName}
              </h4>
              {secondaryName && secondaryName !== displayName && (
                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">{secondaryName}</p>
              )}
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-1">
                <span className="font-medium text-teal-700 bg-teal-50 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px]">
                  {displaySpecialty}
                </span>
                <span className="text-slate-400 text-[10px] sm:text-[11px]">
                  • {doctor.experience_years} {t.doctor.experience}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex-shrink-0">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{doctor.rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="mt-2.5 sm:mt-3 space-y-1.5 text-slate-600 border-t border-slate-100 pt-2 sm:pt-2.5 text-[11px] sm:text-xs">
          {displayHospital && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Building className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{displayHospital} ({doctor.hospital_city})</span>
            </div>
          )}

          {langList.length > 0 && (
            <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
              <span className="font-medium text-slate-700">{language === 'ar' ? 'اللغات: ' : 'Languages: '}</span>
              {langList.join(', ')}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[9px] sm:text-[10px] text-slate-400 block">{t.doctor.fee}</span>
          <span className="font-bold text-slate-900 text-xs sm:text-sm">
            ${doctor.consultation_fee}
          </span>
        </div>

        <button
          type="button"
          className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-900 text-white rounded-lg text-[11px] sm:text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {t.doctor.book}
        </button>
      </div>
    </div>
  );
}
