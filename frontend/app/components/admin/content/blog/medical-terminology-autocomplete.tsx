'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('MedicalTerminologyAutocomplete');

interface MedicalTerm {
  term: string;
  definition: string;
  category: string;
  synonyms: string[];
}

interface MedicalTerminologyAutocompleteProps {
  onTermSelect: (term: MedicalTerm) => void;
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
}

const medicalTermsDatabase: MedicalTerm[] = [
  {
    term: 'Hypertension',
    definition: 'High blood pressure, typically defined as systolic pressure ≥140 mmHg or diastolic pressure ≥90 mmHg',
    category: 'Cardiovascular',
    synonyms: ['High Blood Pressure', 'HTN', 'Elevated BP']
  },
  {
    term: 'Diabetes Mellitus',
    definition: 'A group of metabolic disorders characterized by high blood sugar levels over a prolonged period',
    category: 'Endocrine',
    synonyms: ['DM', 'Diabetes', 'High Blood Sugar']
  },
  {
    term: 'Myocardial Infarction',
    definition: 'Heart attack; death of heart muscle due to lack of blood supply',
    category: 'Cardiovascular',
    synonyms: ['Heart Attack', 'MI', 'Acute MI', 'STEMI', 'NSTEMI']
  },
  {
    term: 'Cerebrovascular Accident',
    definition: 'Stroke; sudden loss of brain function due to disruption of blood supply to the brain',
    category: 'Neurological',
    synonyms: ['Stroke', 'CVA', 'Brain Attack', 'Cerebral Infarction']
  },
  {
    term: 'Pneumonia',
    definition: 'Inflammation of the lungs caused by infection, typically bacterial or viral',
    category: 'Respiratory',
    synonyms: ['Lung Infection', 'Pulmonary Infection', 'Lower Respiratory Tract Infection']
  },
  {
    term: 'Sepsis',
    definition: 'Life-threatening organ dysfunction caused by a dysregulated host response to infection',
    category: 'Infectious Disease',
    synonyms: ['Septicemia', 'Blood Poisoning', 'Systemic Inflammatory Response Syndrome']
  },
  {
    term: 'Hypotension',
    definition: 'Low blood pressure, typically defined as systolic pressure <90 mmHg',
    category: 'Cardiovascular',
    synonyms: ['Low Blood Pressure', 'Low BP', 'Orthostatic Hypotension']
  },
  {
    term: 'Tachycardia',
    definition: 'Rapid heart rate, typically >100 beats per minute in adults',
    category: 'Cardiovascular',
    synonyms: ['Rapid Heart Rate', 'Fast Heart Rate', 'SVT', 'Atrial Tachycardia']
  },
  {
    term: 'Bradycardia',
    definition: 'Slow heart rate, typically <60 beats per minute in adults',
    category: 'Cardiovascular',
    synonyms: ['Slow Heart Rate', 'Sinus Bradycardia', 'Heart Block']
  },
  {
    term: 'Arrhythmia',
    definition: 'Abnormal heart rhythm, including irregular, too fast, or too slow heartbeats',
    category: 'Cardiovascular',
    synonyms: ['Irregular Heartbeat', 'Dysrhythmia', 'Atrial Fibrillation', 'Ventricular Tachycardia']
  },
  {
    term: 'Anemia',
    definition: 'Condition in which the body lacks enough healthy red blood cells to carry adequate oxygen',
    category: 'Hematology',
    synonyms: ['Low Red Blood Cells', 'Iron Deficiency', 'Hemoglobin Deficiency']
  },
  {
    term: 'Osteoporosis',
    definition: 'Bone disease that occurs when the body loses too much bone or makes too little bone',
    category: 'Musculoskeletal',
    synonyms: ['Bone Loss', 'Brittle Bones', 'Low Bone Density']
  },
  {
    term: 'Hyperlipidemia',
    definition: 'Elevated levels of lipids (fats) in the blood, including cholesterol and triglycerides',
    category: 'Metabolic',
    synonyms: ['High Cholesterol', 'Dyslipidemia', 'Elevated Lipids']
  },
  {
    term: 'Hypothyroidism',
    definition: 'Underactive thyroid gland that does not produce enough thyroid hormone',
    category: 'Endocrine',
    synonyms: ['Underactive Thyroid', 'Low Thyroid', 'Thyroid Deficiency']
  },
  {
    term: 'Hyperthyroidism',
    definition: 'Overactive thyroid gland that produces too much thyroid hormone',
    category: 'Endocrine',
    synonyms: ['Overactive Thyroid', 'High Thyroid', 'Thyrotoxicosis']
  }
];

export function MedicalTerminologyAutocomplete({
  onTermSelect,
  isOpen,
  onClose,
  searchQuery
}: MedicalTerminologyAutocompleteProps) {
  const [filteredTerms, setFilteredTerms] = useState<MedicalTerm[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = medicalTermsDatabase.filter(term =>
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.synonyms.some(synonym => 
          synonym.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        term.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTerms(filtered);
      setSelectedIndex(0);
    } else {
      setFilteredTerms(medicalTermsDatabase.slice(0, 10));
      setSelectedIndex(0);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredTerms.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredTerms.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredTerms[selectedIndex]) {
          handleTermSelect(filteredTerms[selectedIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  const handleTermSelect = (term: MedicalTerm) => {
    onTermSelect(term);
    logger.info('Medical term selected', { term: term.term, category: term.category });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div ref={listRef} className="p-2">
        {filteredTerms.length > 0 ? (
          filteredTerms.map((term, index) => (
            <motion.div
              key={term.term}
              whileHover={{ backgroundColor: '#f3f4f6' }}
              className={`p-3 rounded cursor-pointer transition-colors ${
                index === selectedIndex ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleTermSelect(term)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{term.term}</h4>
                  <p className="text-sm text-gray-600 mt-1">{term.definition}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {term.category}
                    </span>
                    {term.synonyms.length > 0 && (
                      <span className="text-xs text-gray-500">
                        Also known as: {term.synonyms.slice(0, 2).join(', ')}
                        {term.synonyms.length > 2 && ` +${term.synonyms.length - 2} more`}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTermSelect(term);
                  }}
                  className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Insert
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            <p>No medical terms found for "{searchQuery}"</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
