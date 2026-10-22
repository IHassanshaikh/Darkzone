package com.reliefos;

import java.util.Arrays;
import java.util.List;

public class SafeZone {
    public final String id, name;
    public final double lat, lng;
    public final int capacity;

    public SafeZone(String id, String name, double lat, double lng, int capacity) {
        this.id = id;
        this.name = name;
        this.lat = lat;
        this.lng = lng;
        this.capacity = capacity;
    }

    public static List<SafeZone> demo() {
        return Arrays.asList(
                new SafeZone("camp-a", "Camp A", 24.9215, 67.0920, 250),
                new SafeZone("camp-b", "Camp B", 24.9056, 67.0822, 200),
                new SafeZone("camp-c", "Camp C", 24.8800, 67.0600, 150),
                new SafeZone("camp-d", "Camp D", 24.9400, 67.1100, 300)
        );
    }
}