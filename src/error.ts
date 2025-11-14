let error = false;

export function hadError(): boolean {
  return error;
}

export function clearError() {
  error = false;
}

export function logError(
  line: number,
  message: string,
  where: string = ''
): void {
  console.log(`[line ${line}] Error ${where}: ${message}`);
  error = true;
}
