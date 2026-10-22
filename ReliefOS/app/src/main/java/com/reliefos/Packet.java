package com.reliefos;

import org.json.JSONObject;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

public class Packet {
    public static final double NO_LOC = 999;

    public String id;
    public String type;      // SOS, STATUS, PRIVATE (admin-only, encrypted), PRESENCE
    public String originId;
    public String name;      // sender ka naam
    public String text;      // PRIVATE mein ye ciphertext hota hai
    public int ttl;
    public int hops;
    public double lat = NO_LOC;
    public double lng = NO_LOC;
    public long ts;

    public static Packet create(String type, String originId, String name, String text, double lat, double lng) {
        Packet p = new Packet();
        p.id = UUID.randomUUID().toString();
        p.type = type;
        p.originId = originId;
        p.name = name;
        p.text = text;
        p.ttl = 6;
        p.hops = 0;
        p.lat = lat;
        p.lng = lng;
        p.ts = System.currentTimeMillis();
        return p;
    }

    public Packet copy() {
        Packet c = new Packet();
        c.id = id; c.type = type; c.originId = originId; c.name = name; c.text = text;
        c.ttl = ttl; c.hops = hops; c.lat = lat; c.lng = lng; c.ts = ts;
        return c;
    }

    public byte[] toBytes() throws Exception {
        JSONObject o = new JSONObject();
        o.put("id", id);
        o.put("type", type);
        o.put("originId", originId);
        o.put("name", name);
        o.put("text", text);
        o.put("ttl", ttl);
        o.put("hops", hops);
        o.put("lat", lat);
        o.put("lng", lng);
        o.put("ts", ts);
        return o.toString().getBytes(StandardCharsets.UTF_8);
    }

    public static Packet fromBytes(byte[] b) throws Exception {
        JSONObject o = new JSONObject(new String(b, StandardCharsets.UTF_8));
        Packet p = new Packet();
        p.id = o.getString("id");
        p.type = o.getString("type");
        p.originId = o.getString("originId");
        p.name = o.optString("name", "Unknown");
        p.text = o.optString("text", "");
        p.ttl = o.getInt("ttl");
        p.hops = o.getInt("hops");
        p.lat = o.optDouble("lat", NO_LOC);
        p.lng = o.optDouble("lng", NO_LOC);
        p.ts = o.optLong("ts", System.currentTimeMillis());
        return p;
    }
}