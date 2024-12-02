export const errorHandler = (statusCode, message, details = null) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    if (details) error.details = details;
    return error;
};
