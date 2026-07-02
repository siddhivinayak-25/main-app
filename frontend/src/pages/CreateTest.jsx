import { useState } from 'react';
import WizardLayout from '../components/wizard/WizardLayout';
import BasicInfoStep from '../components/wizard/steps/BasicInfoStep';
import TestConfigurationStep from '../components/wizard/steps/TestConfigurationStep';
import EvaluationCriteriaStep from '../components/wizard/steps/EvaluationCriteriaStep';
import ReviewPublishStep from '../components/wizard/steps/ReviewPublishStep';
import TestPublishedSuccess from '../components/wizard/TestPublishedSuccess';
import { useCreateTest } from '../hooks/useCreateTest';

const INITIAL_FORM_DATA = {
  testTitle: '',
  role: '',
  description: '',
  duration: '',
  durationUnit: 'minutes',
  skills: [],
  difficulty: '',
};

export default function CreateTest() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [published, setPublished] = useState(false);
  const { createTest, loading: publishing, error: publishError } = useCreateTest();

  function updateFormData(fields) {
    setFormData((prev) => ({ ...prev, ...fields }));
  }

  function handleNext() {
    setCurrentStep((s) => Math.min(s + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleEditStep(step) {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handlePublish() {
    try {
      await createTest(formData);
      setPublished(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // error is surfaced via publishError state
    }
  }

  /* ── Published success state ──────────────────────── */
  if (published) {
    return <TestPublishedSuccess formData={formData} />;
  }

  /* ── Wizard steps ─────────────────────────────────── */
  const stepComponents = {
    1: <BasicInfoStep formData={formData} updateFormData={updateFormData} onNext={handleNext} />,
    2: <TestConfigurationStep formData={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />,
    3: <EvaluationCriteriaStep formData={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />,
    4: (
      <ReviewPublishStep
        formData={formData}
        updateFormData={updateFormData}
        onBack={handleBack}
        onPublish={handlePublish}
        onEditStep={handleEditStep}
        publishing={publishing}
        publishError={publishError}
      />
    ),
  };

  return (
    <WizardLayout
      title="Create New Test"
      subtitle="Build a new agentic evaluation test"
      currentStep={currentStep}
    >
      {stepComponents[currentStep]}
    </WizardLayout>
  );
}
