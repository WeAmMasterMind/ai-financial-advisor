import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, Save } from 'lucide-react';
import { fetchStatus, saveProgress, setStep, completeQuestionnaire } from '../../store/features/questionnaireSlice';
import toast from 'react-hot-toast';

import Step1Personal from './Step1Personal';
import Step2Income from './Step2Income';
import Step3Expenses from './Step3Expenses';
import Step4Debt from './Step4Debt';
import Step5Goals from './Step5Goals';
import QuestionnaireComplete from './QuestionnaireComplete';

const steps = [
  { id: 1, name: 'Personal', component: Step1Personal },
  { id: 2, name: 'Income', component: Step2Income },
  { id: 3, name: 'Expenses', component: Step3Expenses },
  { id: 4, name: 'Debt', component: Step4Debt },
  { id: 5, name: 'Goals', component: Step5Goals },
];

const QuestionnaireWizard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentStep, totalSteps, responses, isLoading, isSaving, isCompleted, results } = useSelector(
    (state) => state.questionnaire
  );

  useEffect(() => {
    dispatch(fetchStatus());
  }, [dispatch]);

  const handleNext = async () => {
    // Save progress
    await dispatch(saveProgress({
      step: currentStep + 1,
      data: responses[Object.keys(responses)[currentStep - 1]],
      allResponses: responses
    }));

    if (currentStep < totalSteps) {
      dispatch(setStep(currentStep + 1));
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      dispatch(setStep(currentStep - 1));
    }
  };

  const handleComplete = async () => {
    try {
      await dispatch(completeQuestionnaire(responses)).unwrap();
      toast.success('Questionnaire completed!');
    } catch (error) {
      toast.error('Failed to complete questionnaire');
    }
  };

  const handleSaveAndExit = async () => {
    await dispatch(saveProgress({
      step: currentStep,
      data: responses[Object.keys(responses)[currentStep - 1]],
      allResponses: responses
    }));
    toast.success('Progress saved');
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isCompleted && results) {
    return <QuestionnaireComplete results={results} />;
  }

  const CurrentStepComponent = steps[currentStep - 1]?.component;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center ${
                step.id <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.id < currentStep
                    ? 'bg-blue-600 text-white'
                    : step.id === currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.id}
              </div>
              <span className="ml-2 hidden sm:inline text-sm">{step.name}</span>
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Step {currentStep}: {steps[currentStep - 1]?.name}
        </h2>
        {CurrentStepComponent && <CurrentStepComponent />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className={`flex items-center px-4 py-2 rounded-lg ${
            currentStep === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </button>

        <button
          onClick={handleSaveAndExit}
          disabled={isSaving}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <Save className="w-5 h-5 mr-1" />
          {isSaving ? 'Saving...' : 'Save & Exit'}
        </button>

        {currentStep < totalSteps ? (
          <button
            onClick={handleNext}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Next
            <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            disabled={isLoading}
            className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Complete'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuestionnaireWizard;