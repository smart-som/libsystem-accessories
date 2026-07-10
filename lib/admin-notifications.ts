const ADMIN_NOTIFICATION_STORAGE_KEY = "libsystem-admin-read-order-notifications";
export const ADMIN_NOTIFICATIONS_CHANGED_EVENT = "libsystem-admin-notifications-changed";

function getUniqueIds(orderIds: string[]) {
  return [...new Set(orderIds.filter(Boolean))];
}

export function readAdminNotificationOrderIds() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(ADMIN_NOTIFICATION_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? getUniqueIds(parsed.filter((value): value is string => typeof value === "string")) : [];
  } catch {
    return [];
  }
}

function writeAdminNotificationOrderIds(orderIds: string[]) {
  if (typeof window === "undefined") {
    return [];
  }

  const nextIds = getUniqueIds(orderIds);
  window.localStorage.setItem(ADMIN_NOTIFICATION_STORAGE_KEY, JSON.stringify(nextIds));
  window.dispatchEvent(new CustomEvent(ADMIN_NOTIFICATIONS_CHANGED_EVENT, { detail: nextIds }));
  return nextIds;
}

export function markAdminNotificationsRead(orderIds: string[]) {
  const existingIds = readAdminNotificationOrderIds();
  return writeAdminNotificationOrderIds([...existingIds, ...orderIds]);
}
