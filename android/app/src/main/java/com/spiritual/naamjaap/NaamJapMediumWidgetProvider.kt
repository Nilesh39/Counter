package com.spiritual.naamjaap

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class NaamJapMediumWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val prefs = context.getSharedPreferences("NaamJapWidgetPrefs", Context.MODE_PRIVATE)
        val chantsToday = prefs.getInt("chants_today", 0)
        val dailyGoal = prefs.getInt("daily_goal", 1080)
        val streakDays = prefs.getInt("streak_days", 0)

        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_medium_layout)
            views.setTextViewText(R.id.widget_medium_chants_text, "Chants: $chantsToday / $dailyGoal")
            views.setTextViewText(R.id.widget_medium_streak_text, "Streak: $streakDays Days 🔥")
            
            // Set up click intent for the circular JAP button
            val intent = Intent(context, NaamJapMediumWidgetProvider::class.java).apply {
                action = "com.spiritual.naamjaap.ACTION_WIDGET_CHANT"
            }
            // FLAG_IMMUTABLE is required for Android 12+ compatibility
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                1,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_medium_chant_button, pendingIntent)
            
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == "com.spiritual.naamjaap.ACTION_WIDGET_CHANT") {
            val prefs = context.getSharedPreferences("NaamJapWidgetPrefs", Context.MODE_PRIVATE)
            val chantsToday = prefs.getInt("chants_today", 0)
            val unsynced = prefs.getInt("unsynced_chants", 0)
            
            // Increment local widget preferences instantly
            prefs.edit().apply {
                putInt("chants_today", chantsToday + 1)
                putInt("unsynced_chants", unsynced + 1)
                apply()
            }
            
            // Trigger instant updates on both widgets so they show matching numbers in real time
            val appWidgetManager = AppWidgetManager.getInstance(context)
            
            // Update small widget
            val smallIds = appWidgetManager.getAppWidgetIds(ComponentName(context, NaamJapWidgetProvider::class.java))
            val smallProvider = NaamJapWidgetProvider()
            smallProvider.onUpdate(context, appWidgetManager, smallIds)

            // Update medium widget
            val mediumIds = appWidgetManager.getAppWidgetIds(ComponentName(context, NaamJapMediumWidgetProvider::class.java))
            onUpdate(context, appWidgetManager, mediumIds)
        }
    }
}
