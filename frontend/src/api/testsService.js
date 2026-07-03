import { get, post, patch, del } from './client.js';

export async function getTests() {
  const data = await get('/tests');
  return data.tests;
}

export async function getTestById(id) {
  const data = await get(`/tests/${id}`);
  return data.test;
}

export async function getCandidatesByTestId(id) {
  const data = await get(`/tests/${id}/candidates`);
  return data.candidates;
}

/**
 * Maps wizard formData to API shape.
 * formData keys: testTitle, role, description, duration, durationUnit,
 *                skills, difficulty, instructions, starterCode, language, testCases
 */
export async function createTest(formData) {
  // Convert duration to minutes
  let timeLimitMinutes = null;
  if (formData.duration) {
    const val = Number(formData.duration);
    timeLimitMinutes = formData.durationUnit === 'hours' ? val * 60 : val;
  }

  const payload = {
    name:         formData.testTitle,
    role:         formData.role || null,
    instructions: formData.instructions || formData.description || null,
    language:     formData.language || 'python',
    time_limit:   timeLimitMinutes,
    starter_code: formData.starterCode || null,
    testCases:    (formData.testCases || []).map((tc, i) => ({
      name:           tc.name || `Case ${i + 1}`,
      input:          tc.input || '',
      expectedOutput: tc.expectedOutput || '',
      isHidden:       tc.isHidden ?? false,
      weight:         tc.weight != null ? Number(tc.weight) : 1.0,
    })),
  };

  const data = await post('/tests', payload);
  return data.test;
}

export async function updateTest(id, updates) {
  const data = await patch(`/tests/${id}`, updates);
  return data.test;
}

export async function deleteTest(id) {
  return del(`/tests/${id}`);
}
