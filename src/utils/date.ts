/**
 * Date formatting helpers in PT-PT (Europe/Lisbon)
 * Standard Format: DD/MM/YYYY HH:mm or DD/MM/YYYY
 */

export function formatDatePT(dateStrOrObj: string | Date | number | null | undefined, includeTime = true): string {
  if (!dateStrOrObj) return "—";
  try {
    const d = typeof dateStrOrObj === "string" || typeof dateStrOrObj === "number" 
      ? new Date(dateStrOrObj) 
      : dateStrOrObj;

    if (isNaN(d.getTime())) return "—";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    if (!includeTime) {
      return `${day}/${month}/${year}`;
    }

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return "—";
  }
}

export function formatRelativeOrFullPT(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Agora mesmo";
  if (diffMinutes < 60) return `Há ${diffMinutes}m`;
  if (diffHours < 24) return `Há ${diffHours}h`;
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `Há ${diffDays} dias`;

  return formatDatePT(d);
}

export function isDateOverdue(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

export function toInputDateTimeValue(dateStr?: string): string {
  if (!dateStr) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
