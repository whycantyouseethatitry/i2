import { atom } from 'recoil';

export const topicState = atom({ key: 'topicState', default: '' });
export const questionsState = atom({ key: 'questionsState', default: [] });
export const answersState = atom({ key: 'answersState', default: {} });
export const uiState = atom({ key: 'uiState', default: { step: 1, loading: false, error: null, currentIndex: 0 } });
export const feedbackState = atom({ key: 'feedbackState', default: null });
