import { usePortfolioStore } from '../stores/portfolioStore';

export const useErrorHandler = () => {
  const setError = usePortfolioStore((state) => state.setError);
  const clearError = usePortfolioStore((state) => state.clearError);

  const handleError = (error: unknown) => {
    if (error instanceof Error) {
      setError(error.message);
    } else if (typeof error === 'string') {
      setError(error);
    } else {
      setError('发生未知错误');
    }
  };

  return { handleError, clearError };
};
