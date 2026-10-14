import { describe, expect, it } from "vitest";
import { isValidMaxPhoneNumber, normalizePhoneNumber } from "@/shared/lib/phone";

describe("phone number validation", () => {
    it("normalizes punctuation before sending the number to GREEN-API", () => {
        expect(normalizePhoneNumber("+7 (999) 123-45-67")).toBe("79991234567");
        expect(normalizePhoneNumber("+375 29 123-45-67")).toBe("375291234567");
    });

    it.each(["79991234567", "+7 (999) 123-45-67", "375291234567", "+375 29 123-45-67"])(
        "accepts a supported number: %s",
        (phone) => {
            expect(isValidMaxPhoneNumber(phone)).toBe(true);
        },
    );

    it.each(["", "12345", "7999123456", "37529123456", "7999123456abc"])(
        "rejects an invalid number: %s",
        (phone) => {
            expect(isValidMaxPhoneNumber(phone)).toBe(false);
        },
    );
});