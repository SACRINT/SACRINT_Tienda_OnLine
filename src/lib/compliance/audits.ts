/** Week 27: Audit Logs */
export function logAction(action: string, userId: string) {
  console.log(`AUDIT: ${action} by ${userId}`);
}
