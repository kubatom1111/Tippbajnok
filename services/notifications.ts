// Browser Notification API wrapper

export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
    if (Notification.permission !== 'granted') {
        return;
    }

    new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
    });
};

// Check for upcoming matches and schedule reminder
export const scheduleMatchReminder = (matchTime: Date, matchName: string) => {
    const now = new Date();
    const timeDiff = matchTime.getTime() - now.getTime();

    // Remind 30 minutes before
    const reminderTime = timeDiff - (30 * 60 * 1000);

    if (reminderTime > 0) {
        setTimeout(() => {
            sendNotification('⚽ Meccs hamarosan!', {
                body: `${matchName} 30 perc múlva kezdődik. Ne felejtsd el leadni a tipped!`,
                tag: `match-${matchName}`,
            });
        }, reminderTime);

        console.log(`Reminder scheduled for ${matchName} in ${Math.round(reminderTime / 60000)} minutes`);
    }
};

// Schedule reminders for all upcoming matches
export const scheduleAllMatchReminders = async (matches: any[]) => {
    const now = new Date();

    matches.forEach(match => {
        const matchTime = new Date(match.startTime);
        if (matchTime > now && match.status !== 'FINISHED') {
            scheduleMatchReminder(matchTime, `${match.player1} vs ${match.player2}`);
        }
    });
};
