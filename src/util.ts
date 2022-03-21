export function convertLockState(jemaState: boolean): string {
  return jemaState ? 'LOCK' : 'UNLOCK';
}

export function convertJemaState(lockState: any): boolean {
  if (lockState === 'LOCK') {
    return true;
  } else if (lockState === 'UNLOCK') {
    return false;
  }
  throw new Error(`lockState: ${lockState}`);
}
