export function notFound(req, res) {
  res.status(404).json({ message: "API route not found." });
}

export function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV === "production") {
    console.error("Request failed", {
      name: err?.name || "Error",
      code: err?.code || "",
      category:
        err?.code === 11000
          ? "duplicate-record"
          : err?.name === "ValidationError"
            ? "validation"
            : err?.name === "CastError"
              ? "invalid-id"
              : Number(err?.status || 500) >= 500
                ? "server-error"
                : "client-error",
      method: req.method,
      path: req.path
    });
  } else {
    console.error(err);
  }

  if (err?.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Dish image must be 6 MB or smaller."
        : "The image upload could not be processed.";
    return res.status(400).json({ message });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      message: "A record with the same unique value already exists."
    });
  }

  if (err?.name === "ValidationError") {
    const firstMessage = Object.values(err.errors || {})[0]?.message;
    return res.status(400).json({
      message: firstMessage || "The submitted data is invalid."
    });
  }

  if (err?.name === "CastError") {
    return res.status(400).json({ message: "Invalid record id." });
  }

  const status = err.status || 500;

  res.status(status).json({
    message:
      status === 500
        ? "The server could not complete the request."
        : err.message
  });
}
