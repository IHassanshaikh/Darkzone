package com.reliefos;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Admin-only messages: AES-GCM se message encrypt, AES key RSA se admin ke public key par lock.
 * Relay phones sirf ciphertext dekhte hain. DEMO KEYS: production mein private key sirf admin device/server par rehti hai.
 */
public class CryptoBox {

    public static final String ADMIN_PUBLIC_B64 =
            "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4B/kfZENOWVpSbfbFfne+bcjfIzvE1nbBcvT7KcchTsu3KvlwWuy0bA2p4Me+bAGegjKTjIdYHrwRdaTigVzktLHRwC2nxUAxj7mRaDpPuPCIq7m5+cPpeIsjJC5JtfmIzLEwlW2ZyTP7DVNSzCimEFs+1VvAm9PsXdKRbM1yXAoqcrP7tKRA4xOvgbsmtqK8Bq4LGGbXRQmf++1yCfZ+7QKmeCQRmhUul94qVCq1Sxc+2Ani6bmvatC8I8gysHojXAE/uZRKyYdQFsQUDR+uSftoqD50wqp5luEOQ7f4ZSQUn0OAaVL8/moibajfCeEv3UnrnfuHDx+UqadG6HNZQIDAQAB";

    private static final String ADMIN_PRIVATE_B64 =
            "MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDgH+R9kQ05ZWlJt9sV+d75tyN8jO8TWdsFy9PspxyFOy7cq+XBa7LRsDangx75sAZ6CMpOMh1gevBF1pOKBXOS0sdHALafFQDGPuZFoOk+48Iirubn5w+l4iyMkLkm1+YjMsTCVbZnJM/sNU1LMKKYQWz7VW8Cb0+xd0pFszXJcCipys/u0pEDjE6+Buya2orwGrgsYZtdFCZ/77XIJ9n7tAqZ4JBGaFS6X3ipUKrVLFz7YCeLpua9q0LwjyDKweiNcAT+5lErJh1AWxBQNH65J+2ioPnTCqnmW4Q5Dt/hlJBSfQ4BpUvz+aiJtqN8J4S/dSeud+4cPH5Spp0boc1lAgMBAAECggEAFP/X/E3lc83FLjOMUwRM+I/Iwug/lEwUgfgFnMRRn0gazXFLvzI0mIIOtOZLtjBggvmk3uvCJeKO9bQzsbhuCkE2i7gM5F3m6yxEjhyUDiDv9Sj3GJ5lMHE/JFKBDpsnBIBCwESgqQxhcOvTmKpvaZ2jtO7dzlgYmvOm4V33ua5cH4cRykJvlcdXsqAjljDChptcqhwIMV5aUQULGJ1AtCHtZGYQN7am3rKbadX1E/LqwGKsk3o6sBbZlUZKiSQEsnNxnOXG6OIOCoIfAydX84xC5WNOnYHWeLfYt5znwO8C0t/3gFL9ArbPASAOxV9XSp/6m6ms2E/zzz3tlzKH4QKBgQD++79YcQ7QiZ16zweOQQsbdsdolJ13QIg4vsJcpC7oH8HhWn5sLo/JEjl49zGNYYAvffhAmt60zo7CnfnHNcA9z8QAwCc58e7RHGLUqPLhRnC/L8YHIce5PMMb0ZIBewecl3ZnDOnCe08hMLgwcbaRsFFyd6kegUO1eDWsQdEmMQKBgQDhBKYKpQxnZVHtTbRBIgjwODBXmTztKu2KA/3rp6htZISuWfvT7ok/M+/2oWi5G19a0MowWd7uJymbD9JJ02+HKM94vBfg5Oth4SIW3vXxSsRrpNq9S3SYIWvSl2fiGM7Klj4wYFYBwrdBii+gpyvx6gC9oTCjH0joklPju+WpdQKBgDT2u+c2DLq6axCwYkRlNFZvFLqfbBnyOJl43kx5+hhTSGVz86CrB0jf1TpQNmXEo+i5hNB+mtX5teOtBs4fVyA/wNnbEArUOyQKfmjn8xNiG1dLKBohJShP+8MSg/50vL8FIx4Cq6evD1+4i/ncFO0sL67UNjfU5+iQ4K04OqZxAoGAGuJJTEBH6RqL3URJYvbEBp9P90dRpixY0QKFFeCkGN3HlGUf10RKlYiJBPhn4KXKkLkdTwWNwvpe2C3dvABM9OMFVrFyUOZI0Rrqzby5uahrK0k48SDQv1RO44w/Vx4LptyodXMtE2zGJEh0REd00qRYjk9x1itotJC3ASBz4fkCgYABaZdMNClL1uFTPgRY+UIzdeyLzmDtdYSEL8qYmQNmARSEirpdLW7j9Nv+XdwggDgRPja2tfwsvPdCKZwpvb/diJDnQNQ8yOgvKhH3EL8QCSdrrSYNKQs1wZN9oH9m7ZkrYKZOnRz3WzrH1gj0wXZl5fj0pldFuqKgv2D1uv6aGw==";

    private static final Base64.Encoder ENC = Base64.getEncoder();
    private static final Base64.Decoder DEC = Base64.getDecoder();

    /** Return format: encryptedKey.iv.ciphertext (teeno base64) */
    public static String encryptForAdmin(String plain) throws Exception {
        KeyGenerator kg = KeyGenerator.getInstance("AES");
        kg.init(128);
        SecretKey aes = kg.generateKey();

        byte[] iv = new byte[12];
        new SecureRandom().nextBytes(iv);
        Cipher gcm = Cipher.getInstance("AES/GCM/NoPadding");
        gcm.init(Cipher.ENCRYPT_MODE, aes, new GCMParameterSpec(128, iv));
        byte[] ct = gcm.doFinal(plain.getBytes(StandardCharsets.UTF_8));

        PublicKey pub = KeyFactory.getInstance("RSA")
                .generatePublic(new X509EncodedKeySpec(DEC.decode(ADMIN_PUBLIC_B64)));
        Cipher rsa = Cipher.getInstance("RSA/ECB/PKCS1Padding");
        rsa.init(Cipher.ENCRYPT_MODE, pub);
        byte[] ek = rsa.doFinal(aes.getEncoded());

        return ENC.encodeToString(ek) + "." + ENC.encodeToString(iv) + "." + ENC.encodeToString(ct);
    }

    /** Sirf admin mode mein use hota hai. */
    public static String decryptAsAdmin(String bundle) throws Exception {
        String[] parts = bundle.split("\\.");
        if (parts.length != 3) throw new IllegalArgumentException("bad bundle");

        PrivateKey priv = KeyFactory.getInstance("RSA")
                .generatePrivate(new PKCS8EncodedKeySpec(DEC.decode(ADMIN_PRIVATE_B64)));
        Cipher rsa = Cipher.getInstance("RSA/ECB/PKCS1Padding");
        rsa.init(Cipher.DECRYPT_MODE, priv);
        byte[] aesKey = rsa.doFinal(DEC.decode(parts[0]));

        Cipher gcm = Cipher.getInstance("AES/GCM/NoPadding");
        gcm.init(Cipher.DECRYPT_MODE, new SecretKeySpec(aesKey, "AES"),
                new GCMParameterSpec(128, DEC.decode(parts[1])));
        return new String(gcm.doFinal(DEC.decode(parts[2])), StandardCharsets.UTF_8);
    }
}