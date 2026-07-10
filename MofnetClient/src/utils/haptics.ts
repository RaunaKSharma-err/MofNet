import * as Haptics from "expo-haptics";
import { useSettingsStore } from "@/src/store/settingsStore";

export const triggerHaptic = async (
  type:
    | "light"
    | "medium"
    | "heavy"
    | "success"
    | "warning"
    | "error"
    | "selection" = "light",
) => {
  const { hapticsEnabled } = useSettingsStore.getState();
  if (!hapticsEnabled) return;

  try {
    switch (type) {
      case "light":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "success":
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        break;
      case "warning":
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
        break;
      case "error":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case "selection":
        await Haptics.selectionAsync();
        break;
    }
  } catch (e) {
    // haptics not available
  }
};
