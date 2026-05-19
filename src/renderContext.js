import {
  announcements,
  consultationRecords,
  latestAnnouncement,
  menuGroups,
  ongoingChatState,
  quickActions,
  quickEntryOptions,
  quickReplyCategories,
  quickReplyMessages,
  services
} from "./data.js";
import {
  activeVideoConsultationState,
  dismissedMessageBadges,
  doctorStatusState,
  getMessageBadgeKey,
  serviceState,
  waitingQueueState
} from "./state.js";

export const renderData = {
  get announcements() {
    return announcements;
  },
  get consultationRecords() {
    return consultationRecords;
  },
  get latestAnnouncement() {
    return latestAnnouncement;
  },
  get menuGroups() {
    return menuGroups;
  },
  get ongoingChatState() {
    return ongoingChatState;
  },
  get quickActions() {
    return quickActions;
  },
  get quickEntryOptions() {
    return quickEntryOptions;
  },
  get quickReplyCategories() {
    return quickReplyCategories;
  },
  get quickReplyMessages() {
    return quickReplyMessages;
  },
  get services() {
    return services;
  }
};

export const renderRuntime = {
  get activeVideoConsultationId() {
    return activeVideoConsultationState.recordId;
  },
  get doctorStatus() {
    return doctorStatusState.status;
  },
  get serviceState() {
    return serviceState;
  },
  get waitingQueue() {
    return waitingQueueState;
  },
  getMessageBadgeKey,
  isMessageBadgeDismissed(recordId) {
    return dismissedMessageBadges.has(getMessageBadgeKey(recordId));
  }
};
