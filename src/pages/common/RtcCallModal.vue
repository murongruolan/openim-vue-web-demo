<template>
  <a-modal
    :open="open"
    :footer="null"
    :closable="false"
    :keyboard="false"
    :mask="false"
    centered
    destroy-on-close
    width="auto"
    class="no-padding-modal rtc-single-modal"
    wrap-class-name="pointer-events-none"
    @cancel="closeOverlay"
  >
    <div class="pointer-events-auto">
      <a-spin :spinning="connecting">
        <div class="relative h-[340px] w-[480px]">
          <div
            :class="[
              'flex h-full flex-col items-center justify-between bg-[#262729]',
              isWaiting ? '!bg-[#F2F8FF]' : '',
            ]"
          >
            <div v-if="isWaiting || !isVideoCall" class="absolute top-[10%] flex flex-col items-center">
              <OIMAvatar :size="48" :src="inviteData?.participant?.userInfo?.faceURL" :text="inviteData?.participant?.userInfo?.nickname" />
              <div
                :class="[
                  'mt-3 max-w-[120px] truncate text-white',
                  isWaiting ? '!text-[var(--base-black)]' : '',
                ]"
              >
                {{ inviteData?.participant?.userInfo?.nickname }}
              </div>
            </div>
            <div ref="remoteMediaRef" class="absolute inset-0 z-0 flex items-center justify-center overflow-hidden" />
            <div ref="localMediaRef" class="absolute right-3 top-3 z-10 h-[150px] w-[100px] overflow-hidden rounded-md" />
            <div class="absolute bottom-[6%] z-10 flex justify-center">
              <div v-if="!isWaiting" class="absolute -top-8 text-xs text-white">{{ callDuration }}</div>
              <div
                v-if="!isWaiting"
                class="flex cursor-pointer flex-col items-center !justify-start !gap-0 !p-0"
                @click="toggleMic"
              >
                <img width="48" :src="micEnabled ? rtcMic : rtcMicOff" alt="" />
                <span class="mt-2 text-xs text-white">{{ t("placeholder.microphone") }}</span>
              </div>
              <div
                :class="[
                  'ml-12 flex cursor-pointer flex-col items-center',
                  isVideoCall ? 'mr-12' : '',
                  !isRecv && isWaiting ? '!mx-0' : '',
                ]"
                @click="hungup"
              >
                <img width="48" :src="rtcHungup" alt="" />
                <span :class="['mt-2 text-xs text-white', isWaiting ? '!text-[var(--sub-text)]' : '']">
                  {{ isWaiting ? t("cancel") : t("hangUp") }}
                </span>
              </div>
              <div
                v-if="isRecv && isWaiting"
                class="mx-12 flex cursor-pointer flex-col items-center"
                @click="acceptInvitation"
              >
                <img width="48" :src="rtcAccept" alt="" />
                <span class="mt-2 text-xs !text-[var(--sub-text)]">{{ t("answer") }}</span>
              </div>
              <div
                v-if="!isWaiting && isVideoCall"
                class="flex cursor-pointer flex-col items-center justify-start !gap-0 !p-0"
                @click="toggleCamera"
              >
                <img width="48" :src="cameraEnabled ? rtcCamera : rtcCameraOff" alt="" />
                <span class="mt-2 text-xs text-white">{{ t("placeholder.camera") }}</span>
              </div>
            </div>
          </div>
        </div>
      </a-spin>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { CbEvents, MessageType, type MessageItem, type RtcInvite, type WSEvent } from "@openim/wasm-client-sdk";
import { message } from "ant-design-vue";
import { computed, nextTick, onUnmounted, ref, watch } from "vue";

import { getRtcConnectData } from "@/api/imApi";
import rtcAccept from "@/assets/images/rtc/rtc_accept.png";
import rtcCamera from "@/assets/images/rtc/rtc_camera.png";
import rtcCameraOff from "@/assets/images/rtc/rtc_camera_off.png";
import rtcHungup from "@/assets/images/rtc/rtc_hungup.png";
import rtcMic from "@/assets/images/rtc/rtc_mic.png";
import rtcMicOff from "@/assets/images/rtc/rtc_mic_off.png";
import OIMAvatar from "@/components/OIMAvatar.vue";
import { CustomType } from "@/constants/im";
import { IMSDK } from "@/im/sdk";
import { ts as t } from "@/i18n";
import { useUserStore } from "@/stores/user";

import type { InviteData } from "./types";

const props = defineProps<{
  open: boolean;
  inviteData?: InviteData;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
}>();

const userStore = useUserStore();
const remoteMediaRef = ref<HTMLDivElement>();
const localMediaRef = ref<HTMLDivElement>();
const room = ref<any>();
const connecting = ref(false);
const connected = ref(false);
const micEnabled = ref(true);
const cameraEnabled = ref(true);
const callDuration = ref("00:00");
let waitTimer: number | undefined;
let counterTimer: number | undefined;
let counterStart = 0;

const invitation = computed(() => props.inviteData?.invitation);
const isRecv = computed(() => userStore.selfInfo.userID !== invitation.value?.inviterUserID);
const isWaiting = computed(() => !connected.value);
const isVideoCall = computed(() => invitation.value?.mediaType === "video");
const recvID = computed(() =>
  isRecv.value ? invitation.value?.inviterUserID : invitation.value?.inviteeUserIDList?.[0],
);

const closeOverlay = () => {
  emit("update:open", false);
};

const clearTimers = () => {
  if (waitTimer) window.clearTimeout(waitTimer);
  if (counterTimer) window.clearInterval(counterTimer);
  waitTimer = undefined;
  counterTimer = undefined;
};

const sendCustomSignal = async (targetID: string, customType: CustomType) => {
  if (!invitation.value) return;
  const { data: customMessage } = await IMSDK.createCustomMessage({
    data: JSON.stringify({
      customType,
      data: {
        ...invitation.value,
      },
    }),
    extension: "",
    description: "",
  });
  await IMSDK.sendMessage({
    recvID: targetID,
    message: customMessage,
    groupID: "",
    isOnlineOnly: true,
  });
};

const cleanupRoom = async () => {
  try {
    await room.value?.disconnect?.();
  } catch (error) {
    console.error("rtc disconnect", error);
  }
  room.value = undefined;
  connected.value = false;
  remoteMediaRef.value?.replaceChildren();
  localMediaRef.value?.replaceChildren();
  clearTimers();
};

const startCounter = () => {
  counterStart = Date.now();
  counterTimer = window.setInterval(() => {
    const total = Math.floor((Date.now() - counterStart) / 1000);
    const minutes = String(Math.floor(total / 60)).padStart(2, "0");
    const seconds = String(total % 60).padStart(2, "0");
    callDuration.value = `${minutes}:${seconds}`;
  }, 1000);
};

const connectRtc = async () => {
  if (!invitation.value) return;
  connecting.value = true;
  try {
    const { Room, RoomEvent, Track } = await import("livekit-client");
    const {
      data: { serverUrl, token },
    } = await getRtcConnectData(invitation.value.roomID, userStore.selfInfo.userID!);
    const nextRoom = new Room({
      publishDefaults: {
        videoCodec: "vp9",
        backupCodec: { codec: "vp8" },
      },
    });
    room.value = nextRoom;

    nextRoom.on(RoomEvent.TrackSubscribed, (track: any) => {
      const element = track.attach();
      element.className = "h-full w-full object-contain";
      remoteMediaRef.value?.appendChild(element);
    });
    nextRoom.on(RoomEvent.TrackUnsubscribed, (track: any) => {
      track.detach().forEach((element: HTMLElement) => element.remove());
    });
    nextRoom.on(RoomEvent.Disconnected, () => {
      cleanupRoom();
      closeOverlay();
    });
    nextRoom.on(RoomEvent.ParticipantDisconnected, () => {
      cleanupRoom();
    });

    await nextRoom.connect(serverUrl, token);
    await nextRoom.localParticipant.setMicrophoneEnabled(true);
    if (isVideoCall.value) {
      const publication = await nextRoom.localParticipant.setCameraEnabled(true);
      const localTrack = publication?.track;
      if (localTrack) {
        const localElement = localTrack.attach();
        localElement.className = "h-full w-full object-cover";
        localElement.muted = true;
      (localElement as HTMLMediaElement).muted = true;
      localMediaRef.value?.appendChild(localElement);
      }
    }
    micEnabled.value = true;
    cameraEnabled.value = Boolean(isVideoCall.value);
    connected.value = true;
    clearTimers();
    startCounter();
    // Keep imports live for bundlers that tree-shake enum access aggressively.
    void Track;
  } catch (error) {
    message.error((error as WSEvent).errMsg ?? String(error));
    closeOverlay();
  } finally {
    connecting.value = false;
  }
};

const tryInvite = async () => {
  if (isRecv.value || !invitation.value || !recvID.value) return;
  try {
    await sendCustomSignal(recvID.value, CustomType.CallingInvite);
    waitTimer = window.setTimeout(() => {
      if (!recvID.value) return;
      sendCustomSignal(recvID.value, CustomType.CallingCancel);
      closeOverlay();
    }, (invitation.value.timeout ?? 30) * 1000);
  } catch (error) {
    message.error((error as WSEvent).errMsg ?? t("toast.inviteUserFailed"));
    closeOverlay();
  }
};

const acceptInvitation = async () => {
  if (!recvID.value) return;
  try {
    await sendCustomSignal(recvID.value, CustomType.CallingAccept);
    await connectRtc();
  } catch (error) {
    message.error((error as WSEvent).errMsg ?? t("toast.byInviteUserFailed"));
    closeOverlay();
  }
};

const hungup = async () => {
  if (!recvID.value) return;
  if (isWaiting.value) {
    await sendCustomSignal(
      recvID.value,
      isRecv.value ? CustomType.CallingReject : CustomType.CallingCancel,
    );
    closeOverlay();
    return;
  }
  await sendCustomSignal(recvID.value, CustomType.CallingHungup);
  cleanupRoom();
  closeOverlay();
};

const toggleMic = async () => {
  micEnabled.value = !micEnabled.value;
  await room.value?.localParticipant?.setMicrophoneEnabled?.(micEnabled.value);
};

const toggleCamera = async () => {
  cameraEnabled.value = !cameraEnabled.value;
  await room.value?.localParticipant?.setCameraEnabled?.(cameraEnabled.value);
};

const newMessageHandler = ({ data }: WSEvent<MessageItem[]>) => {
  data.forEach((item) => {
    if (item.contentType !== MessageType.CustomMessage || !item.customElem?.data) return;
    const customData = JSON.parse(item.customElem.data) as {
      customType: CustomType;
      data: RtcInvite;
    };
    if (customData.data.roomID !== invitation.value?.roomID) return;
    if (customData.customType === CustomType.CallingAccept) {
      connectRtc();
    }
    if (
      customData.customType === CustomType.CallingReject ||
      customData.customType === CustomType.CallingCancel ||
      customData.customType === CustomType.CallingHungup
    ) {
      cleanupRoom();
      closeOverlay();
    }
  });
};

watch(
  () => props.open,
  async (open) => {
    if (open) {
      await nextTick();
      IMSDK.on(CbEvents.OnRecvNewMessages, newMessageHandler);
      tryInvite();
    } else {
      IMSDK.off(CbEvents.OnRecvNewMessages, newMessageHandler);
      cleanupRoom();
    }
  },
);

onUnmounted(() => {
  IMSDK.off(CbEvents.OnRecvNewMessages, newMessageHandler);
  cleanupRoom();
});
</script>
