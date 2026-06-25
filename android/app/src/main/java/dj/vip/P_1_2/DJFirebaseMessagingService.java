package dj.vip.P_1_2;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Map;

// Import explícito de R generado por el namespace del build.gradle
import dj.vip.P_1_2.R;


/**
 * DJFirebaseMessagingService
 * ──────────────────────────
 * Servicio de Firebase Cloud Messaging para DJ Panel Pro.
 * Recibe y muestra notificaciones push aunque la app esté cerrada.
 *
 * Tipos de notificación soportados (campo "notification_type" en data payload):
 *   • song_request           → DJ: nueva petición de canción
 *   • plan_expiry            → DJ: tiempo restante del plan activo
 *   • subscription_pending   → Admin: suscripción pendiente de validación
 *   • support_message        → Admin: mensaje nuevo en Soporte PRO
 *   • new_user_registered    → Admin: nuevo usuario registrado
 */
public class DJFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "DJFirebaseMsgService";

    // ─── IDs de canales de notificación ───────────────────────────────────────
    public static final String CHANNEL_DJ_SONGS     = "djvip_song_requests";
    public static final String CHANNEL_DJ_PLAN      = "djvip_plan_status";
    public static final String CHANNEL_ADMIN_SUBS   = "djvip_admin_subscriptions";
    public static final String CHANNEL_ADMIN_SUPPORT = "djvip_admin_support";
    public static final String CHANNEL_ADMIN_USERS  = "djvip_admin_users";
    public static final String CHANNEL_DEFAULT      = "djvip_default";

    // ─── IDs de notificación (para reemplazar o acumular) ─────────────────────
    private static final int NOTIF_SONG_REQUEST     = 1001;
    private static final int NOTIF_PLAN_EXPIRY      = 1002;
    private static final int NOTIF_SUB_PENDING      = 2001;
    private static final int NOTIF_SUPPORT_MSG      = 2002;
    private static final int NOTIF_NEW_USER         = 2003;

    // ─── URL del backend para registrar el token ───────────────────────────────
    // Ajusta a tu URL de producción (Vercel / servidor propio)
    private static final String BACKEND_REGISTER_TOKEN_URL =
            "https://dj-vip.vercel.app/api/register-fcm-token";

    // ─────────────────────────────────────────────────────────────────────────
    // onNewToken: se llama cuando FCM genera o rota el token del dispositivo
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "FCM token nuevo/rotado: " + token.substring(0, 12) + "...");

        // Guardar en SharedPreferences para que MainActivity lo exponga al JS
        SharedPreferences prefs = getSharedPreferences("DJ_App_Prefs", Context.MODE_PRIVATE);
        prefs.edit().putString("fcm_token", token).apply();

        // Enviar el token al backend en segundo plano
        new Thread(() -> registerTokenWithBackend(token)).start();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // onMessageReceived: se llama cuando llega un mensaje con la app en
    //                    segundo plano O cuando el payload es solo "data"
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.d(TAG, "Mensaje FCM recibido desde: " + remoteMessage.getFrom());

        Map<String, String> data = remoteMessage.getData();

        if (!data.isEmpty()) {
            // Payload tipo DATA (preferido — funciona con app cerrada)
            String notifType = data.getOrDefault("notification_type", "");
            String title = data.getOrDefault("title", "DJ Panel Pro");
            String body = data.getOrDefault("body", "");

            Log.d(TAG, "tipo=" + notifType + " | título=" + title);
            dispatchNotification(notifType, title, body, data);

        } else if (remoteMessage.getNotification() != null) {
            // Payload tipo NOTIFICATION (fallback)
            RemoteMessage.Notification n = remoteMessage.getNotification();
            String title = n.getTitle() != null ? n.getTitle() : "DJ Panel Pro";
            String body  = n.getBody()  != null ? n.getBody()  : "";
            showNotification(CHANNEL_DEFAULT, NOTIF_SONG_REQUEST, title, body, "🎵");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // dispatchNotification: enruta al canal correcto según el tipo
    // ─────────────────────────────────────────────────────────────────────────
    private void dispatchNotification(String type, String title, String body,
                                      Map<String, String> data) {
        SharedPreferences prefs = getSharedPreferences("DJ_App_Prefs", Context.MODE_PRIVATE);
        String userRole = prefs.getString("user_role", "");

        Log.d(TAG, "dispatchNotification: type=" + type + ", userRole=" + userRole);

        switch (type) {

            // ─── NOTIFICACIONES PARA DJ/USUARIO ───────────────────────────
            case "song_request": {
                String song       = data.getOrDefault("song_title", "una canción");
                String requester  = data.getOrDefault("requested_by", "alguien");
                String richBody   = "🎵 " + requester + " pide: \"" + song + "\"";
                showNotification(CHANNEL_DJ_SONGS, NOTIF_SONG_REQUEST,
                        title.isEmpty() ? "🎶 Nueva Petición" : title,
                        body.isEmpty() ? richBody : body, "🎵");
                break;
            }

            case "plan_expiry": {
                String hours    = data.getOrDefault("hours_remaining", "?");
                String richBody = "⏳ Tu plan vence en " + hours + " horas. ¡Renuévalo ahora!";
                showNotification(CHANNEL_DJ_PLAN, NOTIF_PLAN_EXPIRY,
                        title.isEmpty() ? "⏳ Plan por Vencer" : title,
                        body.isEmpty() ? richBody : body, "⏳");
                break;
            }

            // ─── NOTIFICACIONES PARA ADMIN MASTER ─────────────────────────
            case "subscription_pending": {
                if (!"admin_master".equals(userRole)) {
                    Log.d(TAG, "Notificación 'subscription_pending' omitida: el rol actual no es admin_master (es: " + userRole + ")");
                    break;
                }
                String user     = data.getOrDefault("username", "Usuario");
                String plan     = data.getOrDefault("plan_name", "Plan");
                String richBody = "✅ " + user + " solicitó activar el " + plan
                                + ". Requiere validación.";
                showNotification(CHANNEL_ADMIN_SUBS, NOTIF_SUB_PENDING,
                        title.isEmpty() ? "✅ Suscripción Pendiente" : title,
                        body.isEmpty() ? richBody : body, "✅");
                break;
            }

            case "support_message": {
                if (!"admin_master".equals(userRole)) {
                    Log.d(TAG, "Notificación 'support_message' omitida: el rol actual no es admin_master (es: " + userRole + ")");
                    break;
                }
                String from     = data.getOrDefault("from_user", "Un DJ");
                String preview  = data.getOrDefault("message_preview", "Nuevo mensaje");
                String richBody = "💬 " + from + ": \"" + preview + "\"";
                showNotification(CHANNEL_ADMIN_SUPPORT, NOTIF_SUPPORT_MSG,
                        title.isEmpty() ? "💬 Soporte PRO" : title,
                        body.isEmpty() ? richBody : body, "💬");
                break;
            }

            case "new_user_registered": {
                if (!"admin_master".equals(userRole)) {
                    Log.d(TAG, "Notificación 'new_user_registered' omitida: el rol actual no es admin_master (es: " + userRole + ")");
                    break;
                }
                String user     = data.getOrDefault("username", "Nuevo usuario");
                String email    = data.getOrDefault("email", "");
                String richBody = "👤 " + user + " (" + email + ") se registró en la plataforma.";
                showNotification(CHANNEL_ADMIN_USERS, NOTIF_NEW_USER,
                        title.isEmpty() ? "👤 Nuevo Usuario" : title,
                        body.isEmpty() ? richBody : body, "👤");
                break;
            }

            default:
                // Tipo desconocido — mostrar notificación genérica
                showNotification(CHANNEL_DEFAULT, NOTIF_SONG_REQUEST,
                        title.isEmpty() ? "DJ Panel Pro" : title, body, "🎧");
                break;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // showNotification: construye y muestra la notificación nativa Android
    // ─────────────────────────────────────────────────────────────────────────
    private void showNotification(String channelId, int notifId,
                                  String title, String body, String emoji) {
        NotificationManager manager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        // Crear canal si no existe (Android 8+)
        ensureChannelExists(manager, channelId);

        // Intent que abre MainActivity al tocar la notificación
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("notification_type", channelId);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, notifId, intent,
                PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE);

        // Sonido de notificación del sistema
        Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        // Construir notificación
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setAutoCancel(true)
                .setSound(soundUri)
                .setVibrate(new long[]{0, 400, 200, 400})
                .setLights(Color.argb(255, 124, 58, 237), 500, 500) // Violeta DJVIP
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setContentIntent(pendingIntent)
                .setColor(Color.argb(255, 124, 58, 237));

        manager.notify(notifId, builder.build());
        Log.d(TAG, "Notificación mostrada: [" + channelId + "] " + title);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ensureChannelExists: crea el canal de notificación si no existe (API 26+)
    // ─────────────────────────────────────────────────────────────────────────
    private void ensureChannelExists(NotificationManager manager, String channelId) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        if (manager.getNotificationChannel(channelId) != null) return;

        String name;
        String description;
        int importance;

        switch (channelId) {
            case CHANNEL_DJ_SONGS:
                name = "🎵 Peticiones de Canciones";
                description = "Notificaciones de nuevas peticiones de canciones del público";
                importance = NotificationManager.IMPORTANCE_HIGH;
                break;
            case CHANNEL_DJ_PLAN:
                name = "⏳ Estado del Plan";
                description = "Alertas sobre el tiempo restante del plan activo";
                importance = NotificationManager.IMPORTANCE_DEFAULT;
                break;
            case CHANNEL_ADMIN_SUBS:
                name = "✅ Suscripciones (Admin)";
                description = "Suscripciones pendientes de validación por el administrador";
                importance = NotificationManager.IMPORTANCE_HIGH;
                break;
            case CHANNEL_ADMIN_SUPPORT:
                name = "💬 Soporte PRO (Admin)";
                description = "Mensajes nuevos en el chat de Soporte PRO";
                importance = NotificationManager.IMPORTANCE_HIGH;
                break;
            case CHANNEL_ADMIN_USERS:
                name = "👤 Nuevos Usuarios (Admin)";
                description = "Notificaciones de nuevos registros en la plataforma";
                importance = NotificationManager.IMPORTANCE_DEFAULT;
                break;
            default:
                name = "DJ Panel Pro";
                description = "Notificaciones generales de la plataforma DJVIP";
                importance = NotificationManager.IMPORTANCE_DEFAULT;
                break;
        }

        NotificationChannel channel = new NotificationChannel(channelId, name, importance);
        channel.setDescription(description);
        channel.enableLights(true);
        channel.setLightColor(Color.argb(255, 124, 58, 237));
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[]{0, 400, 200, 400});
        manager.createNotificationChannel(channel);
        Log.d(TAG, "Canal creado: " + channelId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // registerTokenWithBackend: envía el token FCM al backend via HTTP
    // ─────────────────────────────────────────────────────────────────────────
    private void registerTokenWithBackend(String token) {
        try {
            SharedPreferences prefs = getSharedPreferences("DJ_App_Prefs", Context.MODE_PRIVATE);
            String userId = prefs.getString("user_uid", "");

            if (userId.isEmpty()) {
                Log.w(TAG, "UID de usuario no disponible aún, token guardado localmente.");
                return;
            }

            String json = String.format(
                    "{\"uid\":\"%s\",\"fcmToken\":\"%s\",\"platform\":\"android\"}",
                    userId, token);

            URL url = new URL(BACKEND_REGISTER_TOKEN_URL);
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
            Log.d(TAG, "Token registrado en backend. HTTP " + responseCode);
            conn.disconnect();

        } catch (Exception e) {
            Log.e(TAG, "Error registrando token en backend: " + e.getMessage());
        }
    }
}
