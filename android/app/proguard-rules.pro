# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# === Capacitor / 本应用关键类保留 ===
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.plugin.** { *; }
-keep class com.zaa.cryptpwa.** { *; }
-keep public class * extends com.getcapacitor.Plugin { *; }

# === WebView JS 桥接（evaluateJavascript / addJavascriptInterface）===
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepclassmembers class * {
    @android.annotation.JavascriptInterface <methods>;
}

# === 反射 / Parcelable / Activity ===
-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver

# === AndroidX core（默认会保留，显式声明避免被裁剪）===
-keep class androidx.core.app.** { *; }
-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement
