const MEETING_CODE_PATTERN = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;

export function normalizeMeetingCode(value: string) {
  const trimmed = value.trim().toLowerCase();

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/meeting\/([^/?#]+)/i);
    return decodeURIComponent(match?.[1] || "").toLowerCase();
  } catch {
    const match = trimmed.match(/(?:^|\/meeting\/)([a-z]{3}-[a-z]{4}-[a-z]{3})(?:$|[/?#])/i);
    return (match?.[1] || trimmed).split(/[?#/]/)[0].toLowerCase();
  }
}

export function isValidMeetingCode(value: string) {
  return MEETING_CODE_PATTERN.test(normalizeMeetingCode(value));
}

export function getMeetingLink(code: string) {
  return `${window.location.origin}/meeting/${normalizeMeetingCode(code)}`;
}