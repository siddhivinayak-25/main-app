import { request } from './client';
import { tests, candidates } from '../data/mockData';

export const getTests = () => request(() => tests);

export const getTestById = (id) =>
  request(() => tests.find((t) => t.id === Number(id)));

export const getCandidatesByTestId = (id) =>
  request(() => candidates.filter((c) => c.testId === Number(id)));

export const createTest = (formData) =>
  request(() => {
    const now = new Date();
    const createdOn = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const newTest = {
      id: tests.length ? Math.max(...tests.map((t) => t.id)) + 1 : 1,
      name: formData.testTitle || 'Untitled Test',
      role: formData.role || '',
      candidates: 0,
      progress: 0,
      status: 'Live',
      createdOn,
    };

    tests.unshift(newTest);
    return newTest;
  });