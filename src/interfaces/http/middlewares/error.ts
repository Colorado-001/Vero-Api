import httpStatus from "http-status";
import { ErrorRequestHandler } from "express";
import { AppError } from "../../../utils/errors/app-error";

export const errorConverter: ErrorRequestHandler = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode
      ? httpStatus.BAD_REQUEST
      : httpStatus.INTERNAL_SERVER_ERROR;

    const message = error.message || httpStatus[statusCode];

    error = new AppError(
      "UNKNOWN_ERROR",
      httpStatus.INTERNAL_SERVER_ERROR,
      message,
      false
    );
  }
  next(error);
};

export const errorHandler: ErrorRequestHandler = (
  err: AppError,
  req,
  res,
  next
) => {
  let { httpCode, message, name } = err;

  res.locals.errorMessage = err.message;

  const response = {
    code: httpCode,
    error: name,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  if (process.env.NODE_ENV === "development") {
    console.error(`Return Error To Caller ${JSON.stringify(response)}`);
  }

  res.status(httpCode).send(response);
};
