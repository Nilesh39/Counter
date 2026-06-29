package com.spiritual.naamjaap

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class NaamJapWidgetModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "NaamJapWidgetModule"
    }

    @ReactMethod
    fun updateWidgetData(chantsToday: Double, dailyGoal: Double, streakDays: Double) {
        val context = reactApplicationContext
        val prefs: SharedPreferences = context.getSharedPreferences("NaamJapWidgetPrefs", Context.MODE_PRIVATE)
        prefs.edit().apply {
            putInt("chants_today", chantsToday.toInt())
            putInt("daily_goal", dailyGoal.toInt())
            putInt("streak_days", streakDays.toInt())
            apply()
        }

        // Trigger widget update broadcast on small widget
        val smallIntent = Intent(context, NaamJapWidgetProvider::class.java).apply {
            action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        }
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val smallIds = appWidgetManager.getAppWidgetIds(ComponentName(context, NaamJapWidgetProvider::class.java))
        smallIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, smallIds)
        context.sendBroadcast(smallIntent)

        // Trigger widget update broadcast on medium widget
        val mediumIntent = Intent(context, NaamJapMediumWidgetProvider::class.java).apply {
            action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        }
        val mediumIds = appWidgetManager.getAppWidgetIds(ComponentName(context, NaamJapMediumWidgetProvider::class.java))
        mediumIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, mediumIds)
        context.sendBroadcast(mediumIntent)
    }

    @ReactMethod
    fun getUnsyncedChants(promise: Promise) {
        val context = reactApplicationContext
        val prefs = context.getSharedPreferences("NaamJapWidgetPrefs", Context.MODE_PRIVATE)
        val unsynced = prefs.getInt("unsynced_chants", 0)
        promise.resolve(unsynced)
    }

    @ReactMethod
    fun clearUnsyncedChants(promise: Promise) {
        val context = reactApplicationContext
        val prefs = context.getSharedPreferences("NaamJapWidgetPrefs", Context.MODE_PRIVATE)
        prefs.edit().putInt("unsynced_chants", 0).apply()
        promise.resolve(true)
    }
}
