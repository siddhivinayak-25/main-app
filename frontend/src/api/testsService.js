import { get, post, patch } from './client.js';

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

export async function createTest(formData) {
  const data = await post('/tests', formData);
  return data.test;
}

export async function updateTest(id, updates) {
  const data = await patch(`/tests/${id}`, updates);
  return data.test;
}
