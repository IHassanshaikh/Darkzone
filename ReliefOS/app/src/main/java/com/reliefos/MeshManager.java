package com.reliefos;

import android.content.Context;

import androidx.annotation.NonNull;

import com.google.android.gms.nearby.Nearby;
import com.google.android.gms.nearby.connection.AdvertisingOptions;
import com.google.android.gms.nearby.connection.ConnectionInfo;
import com.google.android.gms.nearby.connection.ConnectionLifecycleCallback;
import com.google.android.gms.nearby.connection.ConnectionResolution;
import com.google.android.gms.nearby.connection.ConnectionsClient;
import com.google.android.gms.nearby.connection.DiscoveredEndpointInfo;
import com.google.android.gms.nearby.connection.DiscoveryOptions;
import com.google.android.gms.nearby.connection.EndpointDiscoveryCallback;
import com.google.android.gms.nearby.connection.Payload;
import com.google.android.gms.nearby.connection.PayloadCallback;
import com.google.android.gms.nearby.connection.PayloadTransferUpdate;
import com.google.android.gms.nearby.connection.Strategy;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class MeshManager {

    public interface Listener {
        void onPeersChanged(int count);
        void onPeerJoined(String name);
        void onPeerLeft(String endpointId);
        void onPresence(String endpointId, Packet p);   // nearby banda active hai (naam + location)
        void onPacket(Packet p);                        // naya message (pehli baar dekha)
        void onLog(String msg);
    }

    private static final String SERVICE_ID = "com.reliefos.mesh.v2";
    private static final Strategy STRATEGY = Strategy.P2P_CLUSTER;

    private final ConnectionsClient client;
    private final String myId, myName, endpointName;
    private final Listener listener;

    private final Set<String> seen = Collections.synchronizedSet(new HashSet<>());
    private final Map<String, String> peers = new ConcurrentHashMap<>();        // endpointId -> name
    private final Map<String, String> pendingNames = new ConcurrentHashMap<>();
    private final List<Packet> store = Collections.synchronizedList(new ArrayList<>());

    public MeshManager(Context ctx, String myId, String myName, Listener listener) {
        this.client = Nearby.getConnectionsClient(ctx);
        this.myId = myId;
        this.myName = myName;
        this.endpointName = myId + "|" + myName;
        this.listener = listener;
    }

    public void start() {
        AdvertisingOptions advOptions = new AdvertisingOptions.Builder()
                .setStrategy(STRATEGY)
                .setDisruptiveUpgrade(false)
                .build();

        DiscoveryOptions discOptions = new DiscoveryOptions.Builder()
                .setStrategy(STRATEGY)
                .build();

        client.startAdvertising(endpointName, SERVICE_ID, lifecycle, advOptions)
                .addOnFailureListener(e -> listener.onLog("Advertise fail: " + e.getMessage()));

        client.startDiscovery(SERVICE_ID, discovery, discOptions)
                .addOnFailureListener(e -> listener.onLog("Discover fail: " + e.getMessage()));

        listener.onLog("Mesh started as " + myName + " (" + myId + ")");
    }

    public void stop() {
        client.stopAdvertising();
        client.stopDiscovery();
        client.stopAllEndpoints();
        peers.clear();
    }

    /** Naya message mesh mein chhodo. */
    public Packet send(String type, String text, double lat, double lng) {
        Packet p = Packet.create(type, myId, myName, text, lat, lng);
        seen.add(p.id);
        store.add(p);
        forward(p, null);
        return p;
    }

    /** "Main yahan hu" signal. Sirf seedhe connected phones ko jata hai, aage relay nahi hota. */
    public void broadcastPresence(double lat, double lng) {
        if (peers.isEmpty()) return;
        Packet p = Packet.create("PRESENCE", myId, myName, "", lat, lng);
        p.ttl = 1;
        forward(p, null);
    }

    public List<Packet> getStore() { return new ArrayList<>(store); }

    public int peerCount() { return peers.size(); }

    // ---------- internals ----------

    /** Aage bhejne wala copy: dusre ka packet ho to ttl-1 aur hops+1. */
    private Packet outbound(Packet p) {
        Packet f = p.copy();
        if (!p.originId.equals(myId)) {
            f.ttl -= 1;
            f.hops += 1;
        }
        return f;
    }

    private void forward(Packet p, String exceptEndpoint) {
        try {
            byte[] bytes = p.toBytes();
            for (String endpointId : peers.keySet()) {
                if (endpointId.equals(exceptEndpoint)) continue;
                client.sendPayload(endpointId, Payload.fromBytes(bytes));
            }
        } catch (Exception e) {
            listener.onLog("Forward error: " + e.getMessage());
        }
    }

    private void handleIncoming(String fromEndpoint, Packet p) {
        if ("PRESENCE".equals(p.type)) {
            listener.onPresence(fromEndpoint, p);
            return;
        }
        if (!seen.add(p.id)) return;       // pehle dekha hua, ignore
        store.add(p);
        listener.onPacket(p);
        Packet f = outbound(p);
        if (f.ttl >= 1) forward(f, fromEndpoint);   // aage relay
    }

    private final ConnectionLifecycleCallback lifecycle = new ConnectionLifecycleCallback() {
        @Override
        public void onConnectionInitiated(@NonNull String endpointId, @NonNull ConnectionInfo info) {
            String[] parts = info.getEndpointName().split("\\|", 2);
            pendingNames.put(endpointId, parts.length > 1 ? parts[1] : parts[0]);
            client.acceptConnection(endpointId, payloadCallback);
        }

        @Override
        public void onConnectionResult(@NonNull String endpointId, @NonNull ConnectionResolution r) {
            String name = pendingNames.remove(endpointId);
            if (name == null) name = "Someone";
            if (r.getStatus().isSuccess()) {
                peers.put(endpointId, name);
                listener.onLog("Connected: " + name);
                listener.onPeerJoined(name);
                listener.onPeersChanged(peers.size());
                // naye peer ko purane messages de do (store-and-forward)
                for (Packet p : getStore()) {
                    Packet f = outbound(p);
                    if (f.ttl >= 1) {
                        try {
                            client.sendPayload(endpointId, Payload.fromBytes(f.toBytes()));
                        } catch (Exception ignored) { }
                    }
                }
            }
        }

        @Override
        public void onDisconnected(@NonNull String endpointId) {
            String name = peers.remove(endpointId);
            listener.onLog("Disconnected: " + (name != null ? name : endpointId));
            listener.onPeerLeft(endpointId);
            listener.onPeersChanged(peers.size());
        }
    };

    private final EndpointDiscoveryCallback discovery = new EndpointDiscoveryCallback() {
        @Override
        public void onEndpointFound(@NonNull String endpointId, @NonNull DiscoveredEndpointInfo info) {
            String otherId = info.getEndpointName().split("\\|", 2)[0];
            // Dono taraf se ek saath request na jaye, isliye sirf bada id request karega
            if (myId.compareTo(otherId) > 0 && !peers.containsKey(endpointId)) {
                client.requestConnection(endpointName, endpointId, lifecycle)
                        .addOnFailureListener(e -> { });
            }
        }

        @Override
        public void onEndpointLost(@NonNull String endpointId) { }
    };

    private final PayloadCallback payloadCallback = new PayloadCallback() {
        @Override
        public void onPayloadReceived(@NonNull String endpointId, @NonNull Payload payload) {
            if (payload.getType() != Payload.Type.BYTES) return;
            try {
                handleIncoming(endpointId, Packet.fromBytes(payload.asBytes()));
            } catch (Exception e) {
                listener.onLog("Bad packet: " + e.getMessage());
            }
        }

        @Override
        public void onPayloadTransferUpdate(@NonNull String endpointId, @NonNull PayloadTransferUpdate u) { }
    };
}