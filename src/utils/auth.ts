const configuredEmail = import.meta.env.VITE_LOGIN_EMAIL?.trim();
const configuredPassword = import.meta.env.VITE_LOGIN_PASSWORD;

export const LOGIN_EMAIL = configuredEmail || "goncalo.fcmacedo@gmail.com";
export const LOGIN_PASSWORD = configuredPassword || "leadhunter";