import {
  announcements,
  latestAnnouncement,
  markAnnouncementRead as markAnnouncementReadInStore,
  quickEntryOptions
} from "../state/dataStore.js";

export function getAnnouncementById(announcementId) {
  return announcements.find((item) => item.id === announcementId) || latestAnnouncement;
}

export function markAnnouncementRead(announcementId) {
  return markAnnouncementReadInStore(announcementId);
}

export function getQuickEntryOption(index) {
  return quickEntryOptions[Number(index)] || null;
}
