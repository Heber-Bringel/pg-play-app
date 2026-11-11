export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class DataSourceError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'DataSourceError';
  }
}
