package dj.vip.P_1_2;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.util.Log;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "DJMainActivity";
    private static final int RINGTONE_PICKER_REQUEST_CODE = 999;
    private static final int PERMISSION_REQUEST_NOTIFICATIONS = 1001;

    private SharedPreferences preferences;

    // ─────────────────────────────────────────────────────────────────────────
    // onCreate
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        preferences = getSharedPreferences("DJ_App_Prefs", Context.MODE_PRIVATE);

        getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                android.view.WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }

        enableImmersiveMode();

        // Crear todos los canales de notificación FCM al iniciar la app
        createNotificationChannels();

        // Solicitar permiso de notificaciones en Android 13+ (API 33)
        requestNotificationPermissionIfNeeded();

        // Obtener y guardar el token FCM actual
        fetchAndStoreFCMToken();

        // Aplicar orientación de pantalla inicial según el estado del usuario
        String userUid = preferences.getString("user_uid", "");
        if (!userUid.isEmpty()) {
            setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
            Log.d(TAG, "Usuario autenticado detectado al inicio. Orientación: LANDSCAPE");
        } else {
            setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
            Log.d(TAG, "Usuario no autenticado detectado al inicio. Orientación: PORTRAIT");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // onStart: registrar el JS Bridge
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public void onStart() {
        super.onStart();
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.addJavascriptInterface(new WebAppInterface(this), "AndroidApp");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // onResume
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public void onResume() {
        super.onResume();
        enableImmersiveMode();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // enableImmersiveMode: modo pantalla completa
    // ─────────────────────────────────────────────────────────────────────────
    private void enableImmersiveMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            final WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // createNotificationChannels: crea los 5 canales FCM al arranque
    // ─────────────────────────────────────────────────────────────────────────
    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        // Canal 1 — Peticiones de Canciones (DJ)
        createChannel(manager,
                DJFirebaseMessagingService.CHANNEL_DJ_SONGS,
                "🎵 Peticiones de Canciones",
                "Nuevas peticiones del público al DJ",
                NotificationManager.IMPORTANCE_HIGH);

        // Canal 2 — Estado del Plan (DJ/Usuario)
        createChannel(manager,
                DJFirebaseMessagingService.CHANNEL_DJ_PLAN,
                "⏳ Estado del Plan",
                "Alertas de vencimiento del plan activo",
                NotificationManager.IMPORTANCE_DEFAULT);

        // Canal 3 — Suscripciones (Admin)
        createChannel(manager,
                DJFirebaseMessagingService.CHANNEL_ADMIN_SUBS,
                "✅ Suscripciones Pendientes",
                "Suscripciones que requieren validación del administrador",
                NotificationManager.IMPORTANCE_HIGH);

        // Canal 4 — Soporte PRO (Admin)
        createChannel(manager,
                DJFirebaseMessagingService.CHANNEL_ADMIN_SUPPORT,
                "💬 Soporte PRO",
                "Mensajes nuevos en el chat de soporte",
                NotificationManager.IMPORTANCE_HIGH);

        // Canal 5 — Nuevos Usuarios (Admin)
        createChannel(manager,
                DJFirebaseMessagingService.CHANNEL_ADMIN_USERS,
                "👤 Nuevos Usuarios",
                "Registros nuevos en la plataforma",
                NotificationManager.IMPORTANCE_DEFAULT);

        // Canal Default
        createChannel(manager,
                DJFirebaseMessagingService.CHANNEL_DEFAULT,
                "DJ Panel Pro",
                "Notificaciones generales",
                NotificationManager.IMPORTANCE_DEFAULT);

        Log.d(TAG, "Canales de notificación FCM creados correctamente.");
    }

    private void createChannel(NotificationManager manager, String id,
                                String name, String description, int importance) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        if (manager.getNotificationChannel(id) != null) return;

        NotificationChannel channel = new NotificationChannel(id, name, importance);
        channel.setDescription(description);
        channel.enableLights(true);
        channel.setLightColor(Color.argb(255, 124, 58, 237));
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[]{0, 400, 200, 400});
        manager.createNotificationChannel(channel);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // requestNotificationPermissionIfNeeded: pide permiso en Android 13+
    // ─────────────────────────────────────────────────────────────────────────
    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                        this,
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        PERMISSION_REQUEST_NOTIFICATIONS);
                Log.d(TAG, "Solicitando permiso POST_NOTIFICATIONS...");
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_NOTIFICATIONS) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "Permiso de notificaciones concedido.");
            } else {
                Log.w(TAG, "Permiso de notificaciones DENEGADO. Las notificaciones no aparecerán.");
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // fetchAndStoreFCMToken: obtiene el token FCM y lo guarda en SharedPreferences
    // ─────────────────────────────────────────────────────────────────────────
    private void fetchAndStoreFCMToken() {
        FirebaseMessaging.getInstance().getToken()
            .addOnCompleteListener(task -> {
                if (!task.isSuccessful()) {
                    Log.w(TAG, "Error obteniendo token FCM", task.getException());
                    return;
                }
                String token = task.getResult();
                if (token != null) {
                    preferences.edit().putString("fcm_token", token).apply();
                    Log.d(TAG, "Token FCM almacenado: " + token.substring(0, 12) + "...");

                    // Si ya hay un UID guardado (sesión persistida), registrar con el backend inmediatamente
                    String userId = preferences.getString("user_uid", "");
                    if (!userId.isEmpty()) {
                        Log.d(TAG, "UID detectado al iniciar, enviando token al backend...");
                        new Thread(() -> registerTokenWithBackend(token)).start();
                    }
                }
            });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WebAppInterface — Puente JavaScript → Android
    // ─────────────────────────────────────────────────────────────────────────
    public class WebAppInterface {
        Context mContext;
        // Guard atómico: evita que múltiples taps disparen múltiples descargas
        private final java.util.concurrent.atomic.AtomicBoolean downloadInProgress =
                new java.util.concurrent.atomic.AtomicBoolean(false);

        WebAppInterface(Context c) {
            mContext = c;
        }

        /**
         * Reproducir sonido de notificación del sistema (o el personalizado)
         * Llamada desde JS: AndroidApp.playSystemNotificationSound()
         */
        @JavascriptInterface
        public void playSystemNotificationSound() {
            try {
                String uriString = preferences.getString("selected_ringtone_uri", null);
                Uri ringtoneUri;
                if (uriString != null) {
                    ringtoneUri = Uri.parse(uriString);
                } else {
                    ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                }
                Ringtone r = RingtoneManager.getRingtone(mContext, ringtoneUri);
                if (r != null) r.play();
            } catch (Exception e) {
                Log.e(TAG, "Error reproduciendo sonido: " + e.getMessage());
            }
        }

        /**
         * Abrir selector de tono de notificación
         * Llamada desde JS: AndroidApp.chooseNotificationSound()
         */
        @JavascriptInterface
        public void chooseNotificationSound() {
            try {
                String uriString = preferences.getString("selected_ringtone_uri", null);
                Uri existingUri = uriString != null ? Uri.parse(uriString) : null;

                Intent intent = new Intent(RingtoneManager.ACTION_RINGTONE_PICKER);
                intent.putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_NOTIFICATION);
                intent.putExtra(RingtoneManager.EXTRA_RINGTONE_TITLE, "Sonido de Notificación");
                intent.putExtra(RingtoneManager.EXTRA_RINGTONE_EXISTING_URI, existingUri);
                intent.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true);
                intent.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, true);
                startActivityForResult(intent, RINGTONE_PICKER_REQUEST_CODE);
            } catch (Exception e) {
                Log.e(TAG, "Error abriendo selector de tonos: " + e.getMessage());
            }
        }

        /**
         * Obtener nombre del sonido seleccionado
         * Llamada desde JS: AndroidApp.getSelectedSoundName()
         */
        @JavascriptInterface
        public String getSelectedSoundName() {
            return preferences.getString("selected_ringtone_name", "Predeterminado del sistema");
        }

        /**
         * Obtener el token FCM del dispositivo
         * Llamada desde JS: AndroidApp.getFCMToken()
         * Retorna el token string o "" si aún no está disponible
         */
        @JavascriptInterface
        public String getFCMToken() {
            return preferences.getString("fcm_token", "");
        }

        /**
         * Guardar el UID del usuario autenticado para asociarlo con el token FCM
         * Llamada desde JS: AndroidApp.setUserUID(uid)
         */
        @JavascriptInterface
        public void setUserUID(String uid) {
            if (uid != null && !uid.isEmpty()) {
                preferences.edit().putString("user_uid", uid).apply();
                Log.d(TAG, "UID de usuario guardado: " + uid.substring(0, Math.min(8, uid.length())) + "...");
                runOnUiThread(() -> {
                    setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
                    Log.d(TAG, "Cambio de orientación dinámico: LANDSCAPE (Inicio de sesión)");
                });
            } else {
                preferences.edit().remove("user_uid").apply();
                Log.d(TAG, "UID de usuario eliminado de preferences.");
                runOnUiThread(() -> {
                    setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                    Log.d(TAG, "Cambio de orientación dinámico: PORTRAIT (Cierre de sesión / Sin sesión)");
                });
            }
        }

        /**
         * Obtener el UID del usuario guardado
         * Llamada desde JS: AndroidApp.getUserUID()
         */
        @JavascriptInterface
        public String getUserUID() {
            return preferences.getString("user_uid", "");
        }

        /**
         * Guardar el rol del usuario para filtrar notificaciones nativas
         * Llamada desde JS: AndroidApp.setUserRole(role)
         */
        @JavascriptInterface
        public void setUserRole(String role) {
            if (role != null && !role.isEmpty()) {
                preferences.edit().putString("user_role", role).apply();
                Log.d(TAG, "Rol de usuario guardado: " + role);
            } else {
                preferences.edit().remove("user_role").apply();
                Log.d(TAG, "Rol de usuario eliminado de preferences.");
            }
        }

        /**
         * Obtener el rol del usuario guardado
         * Llamada desde JS: AndroidApp.getUserRole()
         */
        @JavascriptInterface
        public String getUserRole() {
            return preferences.getString("user_role", "");
        }

        /**
         * Imprimir la página web actual
         * Llamada desde JS: AndroidApp.printPage()
         */
        @JavascriptInterface
        public void printPage() {
            runOnUiThread(() -> {
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                        PrintManager printManager = (PrintManager) mContext.getSystemService(Context.PRINT_SERVICE);
                        if (printManager != null) {
                            String jobName = "DJ VIP QR Tarjetas";
                            PrintDocumentAdapter printAdapter;
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                                printAdapter = webView.createPrintDocumentAdapter(jobName);
                            } else {
                                printAdapter = webView.createPrintDocumentAdapter();
                            }
                            printManager.print(jobName, printAdapter, new PrintAttributes.Builder().build());
                        }
                    }
                }
            });
        }

        /**
         * Descargar APK usando un Intent de Android nativo.
         * Guard atómico: si ya hay una descarga en curso, ignora llamadas adicionales.
         * Llamada desde JS: AndroidApp.downloadApk(url)
         */
        @JavascriptInterface
        public void downloadApk(String url) {
            // compareAndSet: solo pasa a true si era false → atómico, sin race condition
            if (!downloadInProgress.compareAndSet(false, true)) {
                Log.w(TAG, "downloadApk: descarga ya en curso, llamada extra ignorada.");
                return;
            }
            Log.d(TAG, "downloadApk: iniciando descarga → " + url);
            runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    mContext.startActivity(intent);
                } catch (Exception e) {
                    Log.e(TAG, "downloadApk: error abriendo Intent → " + e.getMessage());
                } finally {
                    // Resetear guard después de 3 segundos para permitir reintento en error
                    new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(
                        () -> downloadInProgress.set(false), 3000
                    );
                }
            });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // onActivityResult: resultado del selector de tono
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == RINGTONE_PICKER_REQUEST_CODE && resultCode == RESULT_OK && data != null) {
            Uri uri = data.getParcelableExtra(RingtoneManager.EXTRA_RINGTONE_PICKED_URI);
            SharedPreferences.Editor editor = preferences.edit();
            if (uri != null) {
                editor.putString("selected_ringtone_uri", uri.toString());
                Ringtone ringtone = RingtoneManager.getRingtone(this, uri);
                String title = ringtone.getTitle(this);
                editor.putString("selected_ringtone_name", title);
            } else {
                editor.putString("selected_ringtone_uri", null);
                editor.putString("selected_ringtone_name", "Silencio");
            }
            editor.apply();

            runOnUiThread(() -> {
                WebView webView = getBridge().getWebView();
                if (webView != null) webView.reload();
            });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // registerTokenWithBackend: envía el token FCM al backend via HTTP
    // ─────────────────────────────────────────────────────────────────────────
    private void registerTokenWithBackend(String token) {
        try {
            String userId = preferences.getString("user_uid", "");
            if (userId.isEmpty()) {
                Log.w(TAG, "UID de usuario no disponible aún, token guardado localmente.");
                return;
            }

            String json = String.format(
                    "{\"uid\":\"%s\",\"fcmToken\":\"%s\",\"platform\":\"android\"}",
                    userId, token);

            URL url = new URL("https://dj-vip.vercel.app/api/register-fcm-token");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(json.getBytes(StandardCharsets.UTF_8));
            }

            int responseCode = conn.getResponseCode();
            Log.d(TAG, "Token registrado en backend desde MainActivity. HTTP " + responseCode);
            conn.disconnect();

        } catch (Exception e) {
            Log.e(TAG, "Error registrando token en backend desde MainActivity: " + e.getMessage());
        }
    }
}
