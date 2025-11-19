// Encryption Tests
import {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  hashForComparison,
  verifyHash,
  maskSensitiveData,
  generateSecureToken,
} from "@/lib/security/encryption";

describe("Encryption", () => {
  describe("encrypt/decrypt", () => {
    it("should encrypt and decrypt string", () => {
      const plaintext = "Hello, World!";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(encrypted).not.toBe(plaintext);
      expect(decrypted).toBe(plaintext);
    });

    it("should produce different ciphertext each time", () => {
      const plaintext = "Same message";
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should handle empty string", () => {
      const plaintext = "";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle special characters", () => {
      const plaintext = "Special: !@#$%^&*()_+{}|:<>?";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle unicode", () => {
      const plaintext = "Unicode: 你好世界 🌍";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should throw for invalid ciphertext", () => {
      expect(() => {
        decrypt("invalid");
      }).toThrow();
    });
  });

  describe("encryptObject/decryptObject", () => {
    it("should encrypt and decrypt objects", () => {
      const obj = { name: "Test", value: 123 };
      const encrypted = encryptObject(obj);
      const decrypted = decryptObject<typeof obj>(encrypted);

      expect(decrypted).toEqual(obj);
    });

    it("should handle nested objects", () => {
      const obj = {
        user: {
          name: "Test",
          address: {
            city: "Test City",
          },
        },
      };
      const encrypted = encryptObject(obj);
      const decrypted = decryptObject<typeof obj>(encrypted);

      expect(decrypted).toEqual(obj);
    });

    it("should handle arrays", () => {
      const obj = { items: [1, 2, 3] };
      const encrypted = encryptObject(obj);
      const decrypted = decryptObject<typeof obj>(encrypted);

      expect(decrypted).toEqual(obj);
    });
  });

  describe("hashForComparison/verifyHash", () => {
    it("should hash and verify", () => {
      const value = "password123";
      const hash = hashForComparison(value);
      const isValid = verifyHash(value, hash);

      expect(isValid).toBe(true);
    });

    it("should fail for wrong value", () => {
      const value = "password123";
      const hash = hashForComparison(value);
      const isValid = verifyHash("wrongpassword", hash);

      expect(isValid).toBe(false);
    });

    it("should produce different hashes for same value", () => {
      const value = "password123";
      const hash1 = hashForComparison(value);
      const hash2 = hashForComparison(value);

      expect(hash1).not.toBe(hash2);
      // But both should verify
      expect(verifyHash(value, hash1)).toBe(true);
      expect(verifyHash(value, hash2)).toBe(true);
    });
  });

  describe("maskSensitiveData", () => {
    it("should mask middle characters", () => {
      const data = "1234567890";
      const masked = maskSensitiveData(data);

      expect(masked).toBe("1234**7890");
    });

    it("should handle short strings", () => {
      const data = "123";
      const masked = maskSensitiveData(data);

      expect(masked).toBe("***");
    });

    it("should use custom visible chars", () => {
      const data = "1234567890";
      const masked = maskSensitiveData(data, 2);

      expect(masked).toBe("12******90");
    });

    it("should handle credit card", () => {
      const data = "4111111111111111";
      const masked = maskSensitiveData(data);

      expect(masked.startsWith("4111")).toBe(true);
      expect(masked.endsWith("1111")).toBe(true);
      expect(masked).toContain("*");
    });
  });

  describe("generateSecureToken", () => {
    it("should generate token of specified length", () => {
      const token = generateSecureToken(16);
      // Hex encoding doubles the length
      expect(token.length).toBe(32);
    });

    it("should generate unique tokens", () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();

      expect(token1).not.toBe(token2);
    });

    it("should generate hex string", () => {
      const token = generateSecureToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it("should default to 32 bytes (64 hex chars)", () => {
      const token = generateSecureToken();
      expect(token.length).toBe(64);
    });
  });
});
