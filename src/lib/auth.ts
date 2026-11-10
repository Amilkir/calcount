import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Resend } from "resend";
import { getPrisma } from "@/lib/db";

const DEFAULT_FROM = "Calcount <onboarding@resend.dev>";

async function sendEmail(
  env: CloudflareEnv,
  to: string,
  subject: string,
  heading: string,
  intro: string,
  action: string,
  url: string
) {
  const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      `⚠️ [Resend]: Falta configurar RESEND_API_KEY en .dev.vars o .env.local. El correo no fue enviado a ${to}.`
    );
    return;
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM ?? DEFAULT_FROM,
    to,
    subject,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2>${heading}</h2>
      <p>${intro}</p>
      <p><a href="${url}" style="display:inline-block;background:#059669;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${action}</a></p>
      <p style="color:#737373;font-size:12px">Si no fuiste tú, puedes ignorar este correo.</p>
    </div>`,
  });
  // No se relanza: un fallo de envío no debe revelar si el correo existe.
  // Se registran los campos por separado: el objeto de error se serializa como "{}".
  if (error) {
    console.error(
      `Resend: no se pudo enviar "${subject}" (${error.name}): ${error.message}`
    );
  }
}

function createAuth(env: CloudflareEnv) {
  const isDev = process.env.NODE_ENV !== "production";
  const baseURL = isDev ? "http://localhost:3000" : env.BETTER_AUTH_URL;
  const trustedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    env.BETTER_AUTH_URL,
  ].filter(Boolean) as string[];

  return betterAuth({
    database: prismaAdapter(getPrisma(), { provider: "sqlite" }),
    secret: env.BETTER_AUTH_SECRET ?? (isDev ? "dev-secret-calcount-key-32-chars-minimum" : undefined),
    baseURL,
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        if (isDev) {
          console.log(`\n🔑 [DEV AUTH] Reset password link for ${user.email}:\n${url}\n`);
        }
        await sendEmail(
          env,
          user.email,
          "Restablece tu contraseña de Calcount",
          "Restablecer contraseña",
          "Recibimos una solicitud para cambiar tu contraseña. El enlace vence en 1 hora.",
          "Cambiar contraseña",
          url
        );
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        if (isDev) {
          console.log(`\n✉️ [DEV AUTH] Verification link for ${user.email}:\n${url}\n`);
        }
        await sendEmail(
          env,
          user.email,
          "Confirma tu correo en Calcount",
          "Confirma tu correo",
          "Gracias por registrarte. Confirma tu correo para activar tu cuenta.",
          "Confirmar correo",
          url
        );
      },
    },
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          socialProviders: {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
          },
        }
      : {}),
  });
}

type Auth = ReturnType<typeof createAuth>;

// Los secretos y el binding D1 solo existen dentro de una petición, así que la
// instancia se crea de forma perezosa y se reutiliza mientras el entorno sea el mismo.
const instances = new WeakMap<object, Auth>();

export function getAuth(): Auth {
  const { env } = getCloudflareContext();
  let auth = instances.get(env);
  if (!auth) {
    auth = createAuth(env);
    instances.set(env, auth);
  }
  return auth;
}
