'use client';

import React, { useState, useEffect } from 'react';
import { Language, LanguageSettings } from '../../../types/localization/localization-types';

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  availableLanguages: Language[];
  className?: string;
}

export function LanguageSelector({
  currentLanguage,
  onLanguageChange,
  availableLanguages,
  className = ''
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage);

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageChange(languageCode);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center">
          {currentLang && (
            <>
              <span className="text-lg mr-2">{currentLang.flag}</span>
              <span>{currentLang.name}</span>
            </>
          )}
        </div>
        <svg
          className={`w-5 h-5 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="py-1">
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => handleLanguageSelect(language.code)}
                className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 ${
                  language.code === currentLanguage ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <span className="text-lg mr-3">{language.flag}</span>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{language.name}</span>
                  <span className="text-xs text-gray-500">{language.native_name}</span>
                </div>
                {language.code === currentLanguage && (
                  <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
