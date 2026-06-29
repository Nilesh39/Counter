import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications should behave when app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldVibrate: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissionsAsync(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

export async function scheduleDailyReminderAsync(hour: number, minute: number, streakDays: number) {
  if (Platform.OS === 'web') return;

  // Cancel any existing reminders to prevent double scheduling
  await cancelAllRemindersAsync();

  const title = "🌸 Spiritual Naam Jap Reminder";
  const body = streakDays > 0 
    ? `It's time for your daily chanting! Keep your streak of ${streakDays} days alive. ✨`
    : "It's time for your daily chanting! Take a few minutes to connect with the divine. ✨";

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
  } catch (err) {
    console.warn('Failed to schedule notification', err);
  }
}

export async function cancelAllRemindersAsync() {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    console.warn('Failed to cancel notifications', err);
  }
}
