import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

const ERRORS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Correo o contraseña incorrectos.",
  INVALID_PASSWORD: "Contraseña incorrecta.",
  USER_ALREADY_EXISTS: "Ya existe una cuenta con ese correo.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Ya existe una cuenta con ese correo.",
  EMAIL_NOT_VERIFIED: "Confirma tu correo para iniciar sesión. Te enviamos un nuevo enlace.",
  INVALID_EMAIL: "Correo inválido.",
  PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 8 caracteres.",
  PASSWORD_TOO_LONG: "La contraseña es demasiado larga.",
  INVALID_TOKEN: "El enlace no es válido o ya venció. Solicita uno nuevo.",
};

export function authErrorMessage(error: { code?: string; message?: string } | null) {
  if (error?.code && ERRORS[error.code]) return ERRORS[error.code];
  return "No se pudo completar la operación. Inténtalo de nuevo.";
}
