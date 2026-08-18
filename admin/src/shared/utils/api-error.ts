export const getApiError = (error: any, defaultMessage = 'Произошла ошибка'): string => {
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error?.message) {
    return error.message;
  }
  return defaultMessage;
};
