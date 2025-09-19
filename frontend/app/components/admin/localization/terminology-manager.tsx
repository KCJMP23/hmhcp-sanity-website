'use client';

import React, { useState, useEffect } from 'react';
import { ClinicalTerm, TerminologySearchCriteria } from '../../../types/localization/localization-types';

interface TerminologyManagerProps {
  language: string;
  onTermSelect?: (term: ClinicalTerm) => void;
  className?: string;
}

export function TerminologyManager({
  language,
  onTermSelect,
  className = ''
}: TerminologyManagerProps) {
  const [searchCriteria, setSearchCriteria] = useState<TerminologySearchCriteria>({
    query: '',
    medical_specialties: [],
    term_categories: [],
    confidence_level_min: 0.7,
    sort_by: 'term',
    sort_order: 'asc',
    limit: 50,
    offset: 0
  });
  
  const [searchResults, setSearchResults] = useState<ClinicalTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<ClinicalTerm | null>(null);

  const medicalSpecialties = [
    'cardiology', 'neurology', 'oncology', 'pediatrics', 'surgery',
    'internal_medicine', 'emergency_medicine', 'radiology', 'pathology',
    'psychiatry', 'dermatology', 'orthopedics', 'ophthalmology', 'otolaryngology'
  ];

  const termCategories = [
    'anatomy', 'symptoms', 'diagnoses', 'procedures', 'medications',
    'vital_signs', 'lab_tests', 'imaging', 'treatments', 'equipment'
  ];

  const searchTerminology = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        language,
        ...Object.fromEntries(
          Object.entries(searchCriteria).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(',') : String(value)
          ])
        )
      });

      const response = await fetch(`/api/admin/localization/terminology?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search terminology');
      }

      setSearchResults(data.terms || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTermClick = (term: ClinicalTerm) => {
    setSelectedTerm(term);
    onTermSelect?.(term);
  };

  const handleAddTerm = async () => {
    // This would open a modal or form to add a new term
    // Implementation depends on the specific UI requirements
    console.log('Add new term functionality would be implemented here');
  };

  useEffect(() => {
    if (searchCriteria.query.trim()) {
      searchTerminology();
    }
  }, [searchCriteria.query, language]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Form */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Clinical Terminology</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Query
            </label>
            <input
              type="text"
              value={searchCriteria.query}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, query: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter medical term..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical Specialties
            </label>
            <select
              multiple
              value={searchCriteria.medical_specialties}
              onChange={(e) => setSearchCriteria(prev => ({
                ...prev,
                medical_specialties: Array.from(e.target.selectedOptions, option => option.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {medicalSpecialties.map(specialty => (
                <option key={specialty} value={specialty}>
                  {specialty.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Term Categories
            </label>
            <select
              multiple
              value={searchCriteria.term_categories}
              onChange={(e) => setSearchCriteria(prev => ({
                ...prev,
                term_categories: Array.from(e.target.selectedOptions, option => option.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {termCategories.map(category => (
                <option key={category} value={category}>
                  {category.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Confidence Level
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={searchCriteria.confidence_level_min || 0.7}
              onChange={(e) => setSearchCriteria(prev => ({
                ...prev,
                confidence_level_min: parseFloat(e.target.value)
              }))}
              className="w-full"
            />
            <div className="text-sm text-gray-500 text-center">
              {(searchCriteria.confidence_level_min || 0.7).toFixed(1)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={searchCriteria.sort_by}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, sort_by: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="term">Term</option>
              <option value="confidence_level">Confidence Level</option>
              <option value="last_updated">Last Updated</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <select
              value={searchCriteria.sort_order}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, sort_order: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={searchTerminology}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>

          <button
            onClick={handleAddTerm}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Add New Term
          </button>
        </div>
      </div>

      {/* Search Results */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Search Results ({searchResults.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {searchResults.map((term) => (
              <div
                key={term.term_id}
                onClick={() => handleTermClick(term)}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  selectedTerm?.term_id === term.term_id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">{term.term}</h4>
                    <p className="text-sm text-gray-600 mt-1">{term.definition}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {term.medical_specialties.map(specialty => (
                        <span
                          key={specialty}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {specialty.replace('_', ' ').toUpperCase()}
                        </span>
                      ))}
                      {term.term_categories.map(category => (
                        <span
                          key={category}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {category.replace('_', ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {(term.confidence_level * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">Confidence</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Term Details */}
      {selectedTerm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Term Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Term</label>
              <p className="mt-1 text-sm text-gray-900">{selectedTerm.term}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Definition</label>
              <p className="mt-1 text-sm text-gray-900">{selectedTerm.definition}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Confidence Level</label>
              <p className="mt-1 text-sm text-gray-900">{(selectedTerm.confidence_level * 100).toFixed(1)}%</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Updated</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(selectedTerm.last_updated).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
