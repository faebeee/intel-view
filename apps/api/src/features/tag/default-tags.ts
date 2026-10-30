/**
 * The default set of global tags representing the standard stages of a
 * penetration test engagement. Created automatically on application
 * startup (see `TagModule.onModuleInit` / `TagService.ensureDefaultTagsExist`)
 * so every environment has a sensible baseline set of tags without manual
 * setup, and reused by the offline demo-data seed script
 * (`apps/api/src/features/database/seed.ts`) so both stay in sync.
 */
export const DEFAULT_TAGS: ReadonlyArray<{ name: string; color: string }> = [
  { name: 'Reconnaissance', color: '#3b82f6' },
  { name: 'Scanning & Enumeration', color: '#06b6d4' },
  { name: 'Vulnerability Analysis', color: '#eab308' },
  { name: 'Exploitation', color: '#ef4444' },
  { name: 'Privilege Escalation', color: '#f97316' },
  { name: 'Post-Exploitation', color: '#8b5cf6' },
  { name: 'Lateral Movement', color: '#ec4899' },
  { name: 'Persistence', color: '#10b981' },
  { name: 'Exfiltration', color: '#f43f5e' },
  { name: 'Reporting / Cleanup', color: '#64748b' },
];
