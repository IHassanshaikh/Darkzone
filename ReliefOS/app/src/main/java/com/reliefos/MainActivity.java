package com.reliefos;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.drawable.BitmapDrawable;
import android.location.Location;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.InputFilter;
import android.text.InputType;
import android.view.View;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import org.osmdroid.config.Configuration;
import org.osmdroid.tileprovider.tilesource.TileSourceFactory;
import org.osmdroid.util.GeoPoint;
import org.osmdroid.views.MapView;
import org.osmdroid.views.overlay.Marker;
import org.osmdroid.views.overlay.mylocation.GpsMyLocationProvider;
import org.osmdroid.views.overlay.mylocation.MyLocationNewOverlay;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class MainActivity extends AppCompatActivity implements MeshManager.Listener {

    private static final int REQ_PERMS = 100;
    private static final String ADMIN_PIN = "1234";   // demo only
    private static final String[] DIRS = {"N", "NE", "E", "SE", "S", "SW", "W", "NW"};

    private static class Person {
        String name;
        double lat = Packet.NO_LOC, lng = Packet.NO_LOC;
        long lastSeen;
        Marker marker;
        String iconName;
    }

    private MapView map;
    private MyLocationNewOverlay me;
    private MeshManager mesh;
    private TextView tvMesh, tvPeers, tvNet, tvZoneName, tvZoneDist, tvZoneSub, tvLog, tvLogToggle, tvTitle, tvLogo;
    private View logScroll;
    private String myId, myName;
    private boolean meshStarted = false;
    private boolean isAdmin = false;
    private SafeZone nearest;

    private final Map<String, Person> nearby = new HashMap<>();      // endpointId -> Person
    private final List<Packet> privateBox = new ArrayList<>();       // aaye hue PRIVATE (encrypted) packets
    private final List<SafeZone> zones = SafeZone.demo();
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable ticker = new Runnable() {
        @Override
        public void run() {
            updateNearest();
            updateNet();
            sendPresence();
            pruneNearby();
            handler.postDelayed(this, 3000);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
        super.onCreate(savedInstanceState);

        Context ctx = getApplicationContext();
        Configuration.getInstance().load(ctx, ctx.getSharedPreferences("osmdroid", MODE_PRIVATE));
        Configuration.getInstance().setUserAgentValue(getPackageName());

        setContentView(R.layout.activity_main);

        tvMesh = findViewById(R.id.tvMesh);
        tvPeers = findViewById(R.id.tvPeers);
        tvNet = findViewById(R.id.tvNet);
        tvZoneName = findViewById(R.id.tvZoneName);
        tvZoneDist = findViewById(R.id.tvZoneDist);
        tvZoneSub = findViewById(R.id.tvZoneSub);
        tvLog = findViewById(R.id.tvLog);
        tvLogToggle = findViewById(R.id.tvLogToggle);
        tvTitle = findViewById(R.id.tvTitle);
        tvLogo = findViewById(R.id.tvLogo);
        logScroll = findViewById(R.id.logScroll);

        SharedPreferences prefs = getSharedPreferences("relief", MODE_PRIVATE);
        myId = prefs.getString("myId", null);
        if (myId == null) {
            myId = "anon-" + (1000 + (int) (Math.random() * 9000));
            prefs.edit().putString("myId", myId).apply();
        }
        myName = prefs.getString("myName", null);

        setupMap();

        findViewById(R.id.btnSos).setOnClickListener(v ->
                new AlertDialog.Builder(this)
                        .setTitle("Send SOS?")
                        .setMessage("Your SOS will be passed on through nearby phones until it reaches help.")
                        .setPositiveButton("Send SOS", (d, w) -> sendMsg("SOS", "Help needed"))
                        .setNegativeButton("Cancel", null)
                        .show());
        findViewById(R.id.btnSafe).setOnClickListener(v -> sendMsg("STATUS", "I am safe"));
        findViewById(R.id.btnQuestion).setOnClickListener(v -> askCustomMessage());

        tvLogToggle.setOnClickListener(v -> {
            boolean open = logScroll.getVisibility() == View.VISIBLE;
            logScroll.setVisibility(open ? View.GONE : View.VISIBLE);
            tvLogToggle.setText(open ? "Mesh activity ▾" : "Mesh activity ▴");
        });

        tvZoneName.setOnClickListener(v -> {
            if (nearest != null) {
                if (me != null) me.disableFollowLocation();
                map.getController().setZoom(16.0);
                map.getController().animateTo(new GeoPoint(nearest.lat, nearest.lng));
            }
        });

        tvPeers.setOnClickListener(v -> showNearbyDialog());
        tvNet.setOnClickListener(v -> showServerConfigDialog());
        tvLogo.setOnLongClickListener(v -> { toggleAdmin(); return true; });
        tvTitle.setOnClickListener(v -> { if (isAdmin) showInbox(); });

        if (myName == null) askName();
        else startApp();
    }

    private void startApp() {
        mesh = new MeshManager(this, myId, myName, this);
        requestPerms();
    }

    // ---------- dialogs ----------

    private EditText newInput(String hint, int maxLen, boolean single) {
        EditText et = new EditText(this);
        et.setHint(hint);
        et.setFilters(new InputFilter[]{new InputFilter.LengthFilter(maxLen)});
        if (single) {
            et.setSingleLine(true);
        } else {
            et.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE
                    | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
            et.setMinLines(2);
        }
        return et;
    }

    private View pad(View v) {
        int p = Math.round(20 * getResources().getDisplayMetrics().density);
        FrameLayout f = new FrameLayout(this);
        f.setPadding(p, p / 2, p, 0);
        f.addView(v);
        return f;
    }

    private void askName() {
        EditText et = newInput("Your name", 14, true);
        AlertDialog d = new AlertDialog.Builder(this)
                .setTitle("Welcome to ReliefOS")
                .setMessage("Enter your name. People near you will see it on their map.")
                .setView(pad(et))
                .setCancelable(false)
                .setPositiveButton("Continue", null)
                .create();
        d.show();
        d.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String n = et.getText().toString().trim();
            if (n.isEmpty()) {
                et.setError("Name required");
                return;
            }
            myName = n;
            getSharedPreferences("relief", MODE_PRIVATE).edit().putString("myName", n).apply();
            d.dismiss();
            startApp();
        });
    }

    private void askCustomMessage() {
        if (mesh == null) return;
        EditText et = newInput("Type your message for the admin", 200, false);
        new AlertDialog.Builder(this)
                .setTitle("Message to admin")
                .setMessage("Only the admin can read this. Phones that pass it on see only scrambled text.")
                .setView(pad(et))
                .setPositiveButton("Send", (d, w) -> {
                    String t = et.getText().toString().trim();
                    if (t.isEmpty()) return;
                    try {
                        String enc = CryptoBox.encryptForAdmin(t);
                        mesh.send("PRIVATE", enc, myLat(), myLng());
                        int n = mesh.peerCount();
                        Toast.makeText(this, n > 0
                                ? "Encrypted and sent. Only the admin can read it."
                                : "Saved. Will be passed on when a phone comes nearby.", Toast.LENGTH_LONG).show();
                        onLog("Sent PRIVATE (encrypted), peers: " + n);
                    } catch (Exception e) {
                        Toast.makeText(this, "Encryption failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    }
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void toggleAdmin() {
        if (isAdmin) {
            isAdmin = false;
            updateTitle();
            Toast.makeText(this, "Admin mode off", Toast.LENGTH_SHORT).show();
            return;
        }
        EditText et = newInput("Admin PIN", 8, true);
        et.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_VARIATION_PASSWORD);
        new AlertDialog.Builder(this)
                .setTitle("Admin mode")
                .setView(pad(et))
                .setPositiveButton("Unlock", (d, w) -> {
                    if (ADMIN_PIN.equals(et.getText().toString().trim())) {
                        isAdmin = true;
                        updateTitle();
                        Toast.makeText(this, "Admin mode on. Tap the title to open inbox.", Toast.LENGTH_LONG).show();
                    } else {
                        Toast.makeText(this, "Wrong PIN", Toast.LENGTH_SHORT).show();
                    }
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void updateTitle() {
        tvTitle.setText(isAdmin ? "ReliefOS · ADMIN (" + privateBox.size() + ")" : "ReliefOS");
    }

    private void showInbox() {
        StringBuilder sb = new StringBuilder();
        if (privateBox.isEmpty()) sb.append("No private messages yet.");
        for (int i = privateBox.size() - 1; i >= 0; i--) {
            Packet p = privateBox.get(i);
            String t;
            try {
                t = CryptoBox.decryptAsAdmin(p.text);
            } catch (Exception e) {
                t = "(could not decrypt)";
            }
            sb.append("• ").append(p.name).append("  (").append(p.hops).append(" hops)\n")
                    .append("  ").append(t).append("\n\n");
        }
        new AlertDialog.Builder(this)
                .setTitle("Admin inbox")
                .setMessage(sb.toString())
                .setPositiveButton("Close", null)
                .show();
    }

    private void showNearbyDialog() {
        StringBuilder sb = new StringBuilder();
        if (nearby.isEmpty()) sb.append("No one nearby yet. Make sure the other phone has the app open.");
        for (Person p : nearby.values()) {
            sb.append("• ").append(p.name);
            String d = distanceTo(p);
            if (d != null) sb.append("   ~").append(d);
            sb.append("\n");
        }
        new AlertDialog.Builder(this)
                .setTitle("People nearby")
                .setMessage(sb.toString())
                .setPositiveButton("Close", null)
                .show();
    }

    // ---------- map ----------

    private void setupMap() {
        map = findViewById(R.id.map);
        map.setTileSource(TileSourceFactory.MAPNIK);
        map.setMultiTouchControls(true);
        map.getController().setZoom(13.0);
        map.getController().setCenter(new GeoPoint(zones.get(0).lat, zones.get(0).lng));

        for (SafeZone z : zones) {
            Marker m = new Marker(map);
            m.setPosition(new GeoPoint(z.lat, z.lng));
            m.setTitle(z.name + " (capacity " + z.capacity + ")");
            m.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM);
            map.getOverlays().add(m);
        }
    }

    private void enableLocation() {
        if (me != null) return;
        me = new MyLocationNewOverlay(new GpsMyLocationProvider(this), map);
        me.enableMyLocation();
        me.enableFollowLocation();
        map.getOverlays().add(me);
    }

    private double myLat() {
        GeoPoint g = (me != null) ? me.getMyLocation() : null;
        return g != null ? g.getLatitude() : Packet.NO_LOC;
    }

    private double myLng() {
        GeoPoint g = (me != null) ? me.getMyLocation() : null;
        return g != null ? g.getLongitude() : Packet.NO_LOC;
    }

    private BitmapDrawable personIcon(String name) {
        float d = getResources().getDisplayMetrics().density;
        int w = Math.round(130 * d), h = Math.round(56 * d);
        Bitmap bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bmp);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setColor(Color.WHITE);
        c.drawCircle(w / 2f, 14 * d, 12 * d, p);
        p.setColor(Color.parseColor("#3B82F6"));
        c.drawCircle(w / 2f, 14 * d, 9 * d, p);

        Paint t = new Paint(Paint.ANTI_ALIAS_FLAG);
        t.setTextSize(12 * d);
        t.setTextAlign(Paint.Align.CENTER);
        t.setFakeBoldText(true);
        t.setColor(Color.parseColor("#0F172A"));
        float tw = Math.min(t.measureText(name), w - 16 * d);
        p.setColor(Color.WHITE);
        c.drawRoundRect(new RectF(w / 2f - tw / 2f - 6 * d, 30 * d, w / 2f + tw / 2f + 6 * d, 50 * d), 10 * d, 10 * d, p);
        c.drawText(name, w / 2f, 45 * d, t);
        return new BitmapDrawable(getResources(), bmp);
    }

    private void updatePersonMarker(Person p) {
        if (p.lat == Packet.NO_LOC) {
            removeMarker(p);
            return;
        }
        if (p.marker == null) {
            p.marker = new Marker(map);
            p.marker.setAnchor(Marker.ANCHOR_CENTER, 14f / 56f);
            map.getOverlays().add(p.marker);
        }
        if (!p.name.equals(p.iconName)) {
            p.marker.setIcon(personIcon(p.name));
            p.marker.setTitle(p.name);
            p.iconName = p.name;
        }
        p.marker.setPosition(new GeoPoint(p.lat, p.lng));
        map.invalidate();
    }

    private void removeMarker(Person p) {
        if (p.marker != null) {
            map.getOverlays().remove(p.marker);
            p.marker = null;
            p.iconName = null;
            map.invalidate();
        }
    }

    private void pruneNearby() {
        long now = System.currentTimeMillis();
        Iterator<Map.Entry<String, Person>> it = nearby.entrySet().iterator();
        while (it.hasNext()) {
            Person p = it.next().getValue();
            if (now - p.lastSeen > 15000) {
                removeMarker(p);
                it.remove();
            }
        }
    }

    private void sendPresence() {
        if (mesh != null && meshStarted) mesh.broadcastPresence(myLat(), myLng());
    }

    private String fmtDist(float m) {
        return m < 1000 ? String.format(Locale.US, "%d m", Math.round(m))
                : String.format(Locale.US, "%.1f km", m / 1000f);
    }

    private String distanceTo(Person p) {
        double lat = myLat(), lng = myLng();
        if (lat == Packet.NO_LOC || p.lat == Packet.NO_LOC) return null;
        float[] r = new float[1];
        Location.distanceBetween(lat, lng, p.lat, p.lng, r);
        return fmtDist(r[0]);
    }

    // ---------- nearest safe zone card ----------

    private void updateNearest() {
        GeoPoint loc = (me != null) ? me.getMyLocation() : null;
        if (loc == null) {
            tvZoneName.setText("Locating you…");
            tvZoneDist.setText("Waiting for GPS");
            tvZoneSub.setText("GPS works without internet. Step outside for a faster fix.");
            return;
        }
        float best = Float.MAX_VALUE;
        float bestBearing = 0;
        SafeZone bz = null;
        float[] r = new float[2];
        for (SafeZone z : zones) {
            Location.distanceBetween(loc.getLatitude(), loc.getLongitude(), z.lat, z.lng, r);
            if (r[0] < best) {
                best = r[0];
                bestBearing = r[1];
                bz = z;
            }
        }
        nearest = bz;
        if (bz == null) return;

        float b = (bestBearing + 360f) % 360f;
        String dir = DIRS[Math.round(b / 45f) % 8];
        tvZoneName.setText(bz.name);
        tvZoneDist.setText(fmtDist(best) + " · " + dir);
        tvZoneSub.setText("Capacity " + bz.capacity + " · tap name to see on map");
    }

    private void updateNet() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        boolean online = false;
        if (cm != null && cm.getActiveNetwork() != null) {
            NetworkCapabilities caps = cm.getNetworkCapabilities(cm.getActiveNetwork());
            online = caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
        }
        tvNet.setText(online ? "● Online" : "● Offline");
        tvNet.setTextColor(Color.parseColor(online ? "#10B981" : "#F59E0B"));
    }

    // ---------- sending ----------

    private void sendMsg(String type, String text) {
        if (mesh == null) return;
        mesh.send(type, text, myLat(), myLng());
        int n = mesh.peerCount();
        Toast.makeText(this, n > 0
                ? "Sent to " + n + " nearby phone" + (n > 1 ? "s" : "")
                : "No phones nearby yet. Saved, will pass on when someone connects.", Toast.LENGTH_LONG).show();
        onLog("Sent " + type + " (peers: " + n + ")");
        relayToReliefOSServer(type, myName, text, 0);
    }

    private void showServerConfigDialog() {
        SharedPreferences prefs = getSharedPreferences("relief", MODE_PRIVATE);
        String current = prefs.getString("serverUrl", "http://192.168.1.14:3000");
        EditText et = newInput("http://<laptop-ip>:3000", 60, true);
        et.setText(current);
        new AlertDialog.Builder(this)
                .setTitle("ReliefOS HQ Gateway")
                .setMessage("Enter the laptop's Wi-Fi IP address running ReliefOS. Mesh packets will automatically relay to the Volunteer Dashboard when Wi-Fi is active.")
                .setView(pad(et))
                .setPositiveButton("Save", (d, w) -> {
                    String val = et.getText().toString().trim();
                    if (!val.isEmpty()) {
                        if (!val.startsWith("http")) val = "http://" + val;
                        prefs.edit().putString("serverUrl", val).apply();
                        Toast.makeText(this, "HQ Server set to: " + val, Toast.LENGTH_SHORT).show();
                        onLog("HQ Server URL: " + val);
                    }
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void relayToReliefOSServer(String type, String senderName, String text, int hops) {
        new Thread(() -> {
            try {
                SharedPreferences prefs = getSharedPreferences("relief", MODE_PRIVATE);
                String serverUrl = prefs.getString("serverUrl", "http://192.168.1.14:3000");
                java.net.URL url = new java.net.URL(serverUrl + "/api/v1/messages");
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; utf-8");
                conn.setRequestProperty("Accept", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(4000);
                conn.setReadTimeout(4000);

                org.json.JSONObject json = new org.json.JSONObject();
                json.put("text", "[" + type + "] " + text);
                json.put("category", "SOS".equals(type) ? "Rescue Needed" : "Mesh Field Report");
                json.put("sender", "citizen");
                json.put("senderName", (senderName != null ? senderName : "Citizen") + " (Android APK)");
                json.put("recipientId", "vol-1");
                json.put("recipientName", "Sara Khan");
                json.put("hopRoute", "Android APK Mesh (" + hops + " hops) -> Volunteer Station -> HQ");
                json.put("urgency", "SOS".equals(type) ? "critical" : "normal");

                try (java.io.OutputStream os = conn.getOutputStream()) {
                    byte[] input = json.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }

                int code = conn.getResponseCode();
                if (code >= 200 && code < 300) {
                    runOnUiThread(() -> onLog("✓ Relayed to HQ Server: " + type));
                }
                conn.disconnect();
            } catch (Exception ignored) {
                // Device might be completely offline in disaster area
            }
        }).start();
    }

    // ---------- permissions ----------

    private String[] neededPerms() {
        List<String> l = new ArrayList<>();
        l.add(Manifest.permission.ACCESS_FINE_LOCATION);
        l.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        if (Build.VERSION.SDK_INT >= 31) {
            l.add(Manifest.permission.BLUETOOTH_SCAN);
            l.add(Manifest.permission.BLUETOOTH_ADVERTISE);
            l.add(Manifest.permission.BLUETOOTH_CONNECT);
        }
        if (Build.VERSION.SDK_INT >= 33) {
            l.add(Manifest.permission.NEARBY_WIFI_DEVICES);
        }
        return l.toArray(new String[0]);
    }

    private boolean hasAllPerms() {
        for (String p : neededPerms()) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }

    private void requestPerms() {
        if (hasAllPerms()) startEverything();
        else ActivityCompat.requestPermissions(this, neededPerms(), REQ_PERMS);
    }

    @Override
    public void onRequestPermissionsResult(int code, @NonNull String[] perms, @NonNull int[] results) {
        super.onRequestPermissionsResult(code, perms, results);
        if (code == REQ_PERMS && hasAllPerms()) startEverything();
        else onLog("Permissions missing, mesh will not start");
    }

    private void startEverything() {
        enableLocation();
        if (!meshStarted && mesh != null) {
            mesh.start();
            meshStarted = true;
            tvMesh.setText("● Mesh ON");
            tvMesh.setTextColor(Color.parseColor("#10B981"));
        }
    }

    // ---------- MeshManager.Listener ----------

    @Override
    public void onPeersChanged(int count) {
        runOnUiThread(() -> {
            tvPeers.setText("● " + count + " nearby");
            sendPresence();   // naye bande ko turant apna naam/location do
        });
    }

    @Override
    public void onPeerJoined(String name) {
        runOnUiThread(() -> Toast.makeText(this, "👤 " + name + " is nearby", Toast.LENGTH_LONG).show());
    }

    @Override
    public void onPeerLeft(String endpointId) {
        runOnUiThread(() -> {
            Person p = nearby.remove(endpointId);
            if (p != null) removeMarker(p);
        });
    }

    @Override
    public void onPresence(String endpointId, Packet p) {
        final String name = p.name;
        final double lat = p.lat, lng = p.lng;
        runOnUiThread(() -> {
            Person person = nearby.get(endpointId);
            if (person == null) {
                person = new Person();
                nearby.put(endpointId, person);
            }
            person.name = name;
            person.lat = lat;
            person.lng = lng;
            person.lastSeen = System.currentTimeMillis();
            updatePersonMarker(person);
        });
    }

    @Override
    public void onPacket(Packet p) {
        final String type = p.type, name = p.name, origin = p.originId, text = p.text;
        final int hops = p.hops;
        final double lat = p.lat, lng = p.lng;
        runOnUiThread(() -> {
            if ("PRIVATE".equals(type)) {
                // Admin nahi to sirf ciphertext dikhta hai, padh nahi sakta
                privateBox.add(p);
                if (isAdmin) {
                    updateTitle();
                    Toast.makeText(this, "🔒 New private message from " + name, Toast.LENGTH_LONG).show();
                    onLog("PRIVATE from " + name + " (" + hops + " hops). Tap title to read.");
                } else {
                    String c = text.length() > 24 ? text.substring(0, 24) + "…" : text;
                    onLog("RELAY 🔒 " + name + " (" + hops + " hops): " + c);
                }
                return;
            }
            onLog("RX " + type + " from " + name + " hops=" + hops + " : " + text);
            Toast.makeText(this, type + " from " + name + " (" + hops + " hops)", Toast.LENGTH_LONG).show();
            if (lat != Packet.NO_LOC) {
                Marker m = new Marker(map);
                m.setPosition(new GeoPoint(lat, lng));
                m.setTitle(type + " · " + name);
                map.getOverlays().add(m);
                map.invalidate();
            }
        });
        relayToReliefOSServer(type, name, text, hops);
    }

    @Override
    public void onLog(String msg) {
        runOnUiThread(() -> tvLog.append(msg + "\n"));
    }

    // ---------- lifecycle ----------

    @Override
    protected void onResume() {
        super.onResume();
        map.onResume();
        handler.post(ticker);
    }

    @Override
    protected void onPause() {
        super.onPause();
        map.onPause();
        handler.removeCallbacks(ticker);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (meshStarted && mesh != null) mesh.stop();
    }
}