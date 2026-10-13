const ALLOWED_PHONE_CHARACTERS = /^\+?[\d\s()-]+$/;

export function normalizePhoneNumber(value: string): string {
    const trimmed = value.trim();
    if (!ALLOWED_PHONE_CHARACTERS.test(trimmed)) {
        return "";
    }
    return trimmed.replace(/\D/g, "");
}

export function isValidMaxPhoneNumber(value: string): boolean {
    const digits = normalizePhoneNumber(value);
    return /^(?:7\d{10}|375\d{9})$/.test(digits);
}

export function phoneNumberError(value: string): string {
    if (!value.trim()) {
        return "Введите номер телефона.";
    }
    return "Укажите номер РФ или Беларуси в международном формате.";
}