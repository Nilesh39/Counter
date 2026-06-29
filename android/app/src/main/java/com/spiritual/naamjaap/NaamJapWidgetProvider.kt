package com.spiritual.naamjaap

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews

class NaamJapWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val prefs = context.getSharedPreferences("NaamJapWidgetPrefs", Context.MODE_PRIVATE)
        val chantsToday = prefs.getInt("chants_today", 0)
        val dailyGoal = prefs.getInt("daily_goal", 1080)
        val streakDays = prefs.getInt("streak_days", 0)

        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_layout)
            views.setTextViewText(R.id.widget_chants_text, "Chants: $chantsToday / $dailyGoal")
            views.setTextViewText(R.id.widget_streak_text, "Streak: $streakDays Days 🔥")
            views.setProgressBar(R.id.widget_progress_bar, dailyGoal, chantsToday, false)
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
