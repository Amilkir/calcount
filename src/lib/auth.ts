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
  const resend = new Resend(env.RESEND_API_KEY);
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
  if (error) console.error("Resend:", error);
}

function createAuth(env: CloudflareEnv) {
  return betterAuth({
    database: prismaAdapter(getPrisma(), { provider: "sqlite" }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
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
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
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
