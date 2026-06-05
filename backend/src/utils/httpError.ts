export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, HttpError.prototype);
  }

  static badRequest(message = 'Solicitud inválida', details?: unknown) {
    return new HttpError(400, message, details);
  }

  static unauthorized(message = 'No autenticado') {
    return new HttpError(401, message);
  }

  static forbidden(message = 'No autorizado') {
    return new HttpError(403, message);
  }

  static notFound(message = 'Recurso no encontrado') {
    return new HttpError(404, message);
  }

  static conflict(message = 'Conflicto con el estado actual') {
    return new HttpError(409, message);
  }

  static unprocessable(message = 'Entidad no procesable', details?: unknown) {
    return new HttpError(422, message, details);
  }

  static tooManyRequests(message = 'Demasiadas solicitudes') {
    return new HttpError(429, message);
  }
}
