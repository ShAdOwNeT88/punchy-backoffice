/** A failure the mock backend answers with, in the `ApiError` shape. */
export class MockError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export const notFound = () => new MockError(404, 'not_found');
export const validation = (message: string) => new MockError(400, 'validation_error', message);
export const conflict = (code: string) => new MockError(409, code);
