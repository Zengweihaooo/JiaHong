import { appView } from "../shared/core.js";
import {
  renderConsultConfirmDialogs,
  renderQuickReplyDialogView,
  renderRiskWarningDialogView
} from "./components/dialogs.js?v=20260527-41";
import { renderData } from "../application/viewModels/renderViewModel.js?v=20260528-06";
import {
  renderAnnouncementDialog,
  renderAnnouncementListDialog,
  renderMain,
  renderQuickEntryDialog,
  renderScheduleDialog
} from "./views/homeView.js?v=20260603-03";
import {
  renderTextPage,
  renderVideoPage
} from "./views/consultRoomView.js?v=20260603-01";
import { renderHistoryPage } from "./views/historyView.js?v=20260528-06";
import { getActiveConsultationRecord } from "./views/renderRecordSelectors.js?v=20260528-06";
import {
  renderChatMessageMenu,
  renderConsultAttachmentDialog,
  renderFollowUpVoiceDialog
} from "./views/chatView.js?v=20260603-01";
import {
  renderRoomMain,
  renderRoomTopbar,
  renderSidebar,
  renderTopbar
} from "./views/roomShellView.js?v=20260528-06";
import { renderRoomSidebar } from "./views/roomMessageListView.js?v=20260603-01";

export function renderQuickReplyDialog() {
  return renderQuickReplyDialogView({
    categories: renderData.quickReplyCategories,
    messages: renderData.quickReplyMessages
  });
}

export function renderRiskWarningDialog() {
  const record = getActiveConsultationRecord();
  const medicines = record?.prescriptionMedicines?.length ? record.prescriptionMedicines : [];
  return renderRiskWarningDialogView({ medicines });
}

function renderConsultOverlays() {
  return `
      ${renderQuickReplyDialog()}
      ${renderRiskWarningDialog()}
      ${renderConsultConfirmDialogs()}
      ${renderChatMessageMenu()}
      ${renderConsultAttachmentDialog()}
      ${renderFollowUpVoiceDialog()}`;
}

export function renderRoom() {
  return `
    <div class="app-shell room-shell app-shell--responsive">
      ${renderRoomTopbar()}
      ${renderRoomSidebar()}
      ${renderRoomMain()}
      ${renderConsultOverlays()}
      <div class="toast" role="status" aria-live="polite"></div>
    </div>`;
}

export function renderAppMarkup() {
  return appView === "room"
    ? renderRoom()
    : appView === "text"
      ? renderTextPage({ overlays: renderConsultOverlays() })
      : appView === "video"
        ? renderVideoPage({ overlays: renderConsultOverlays() })
        : appView === "history"
          ? renderHistoryPage({
              quickReplyDialog: renderQuickReplyDialog(),
              riskWarningDialog: renderRiskWarningDialog()
            })
    : `
    <div class="app-shell app-shell--responsive">
      ${renderTopbar()}
      ${renderSidebar()}
      ${renderMain()}
      ${renderAnnouncementDialog()}
      ${renderAnnouncementListDialog()}
      ${renderQuickEntryDialog()}
      ${renderScheduleDialog()}
      <div class="toast" role="status" aria-live="polite"></div>
    </div>`;
}
