import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateResponses } from '../../store/features/questionnaireSlice';

const Step1Personal = () => {
  const dispatch = useDispatch();
  const { responses } = useSelector((state) => state.questionnaire);
  const personal = responses.personal || {};

  const handleChange = (field, value) => {
    dispatch(updateResponses({
      section: 'personal',
      data: { [field]: value }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Age */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What is your age?
        </label>
        <input
          type="number"
          min="18"
          max="100"
          value={personal.age || ''}
          onChange={(e) => handleChange('age', parseInt(e.target.value) || '')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your age"
        />
      </div>

      {/* Employment Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What is your employment status?
        </label>
        <select
          value={personal.employmentStatus || ''}
          onChange={(e) => handleChange('employmentStatus', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select...</option>
          <option value="full_time">Full-time employed</option>
          <option value="part_time">Part-time employed</option>
          <option value="self_employed">Self-employed</option>
          <option value="retired">Retired</option>
          <option value="student">Student</option>
          <option value="unemployed">Unemployed</option>
        </select>
      </div>

      {/* Marital Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What is your marital status?
        </label>
        <select
          value={personal.maritalStatus || ''}
          onChange={(e) => handleChange('maritalStatus', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select...</option>
          <option value="single">Single</option>
          <option value="married">Married</option>
          <option value="divorced">Divorced</option>
          <option value="widowed">Widowed</option>
          <option value="partnered">Domestic Partnership</option>
        </select>
      </div>

      {/* Dependents */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How many dependents do you have? (children, elderly parents, etc.)
        </label>
        <input
          type="number"
          min="0"
          max="20"
          value={personal.dependents ?? ''}
          onChange={(e) => handleChange('dependents', parseInt(e.target.value) || 0)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="0"
        />
      </div>

      {/* Housing */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What is your housing situation?
        </label>
        <select
          value={personal.housingSituation || ''}
          onChange={(e) => handleChange('housingSituation', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select...</option>
          <option value="own_mortgage">Own (with mortgage)</option>
          <option value="own_outright">Own (no mortgage)</option>
          <option value="rent">Rent</option>
          <option value="live_with_family">Live with family</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>
  );
};

export default Step1Personal;