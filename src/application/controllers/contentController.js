import { announcements, latestAnnouncement, quickEntryOptions } from "../state/dataStore.js";

export function getAnnouncementById(announcementId) {
  return announcements.find((item) => item.id === announcementId) || latestAnnouncement;
}

export function getQuickEntryOption(index) {
  return quickEntryOptions[Number(index)] || null;
}
