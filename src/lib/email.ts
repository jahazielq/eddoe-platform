/**
 * Envío de correo. Fase 1: si no hay SMTP configurado, registra el mensaje
 * en consola en vez de fallar — así el flujo de registro/aprobación es
 * probable de correr localmente sin credenciales reales. Sustituir por un
 * proveedor real (SMTP, SES, Resend, etc.) sin tocar quienes lo llaman.
 */
interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const hasSmtp = Boolean(process.env.SMTP_HOST);

  if (!hasSmtp) {
    console.log("[email:simulado]", {
      to: input.to,
      subject: input.subject,
      preview: input.html.slice(0, 200),
    });
    return;
  }

  // TODO(fase 2): integrar un cliente SMTP/API real (p.ej. nodemailer o Resend)
  // usando SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD / SMTP_FROM.
  throw new Error("Proveedor de correo real no configurado todavía.");
}

export function verificationEmailHtml(verifyUrl: string): string {
  return `
    <p>Gracias por iniciar tu registro a la EDDOE.</p>
    <p>Confirma tu correo dando clic en el siguiente enlace:</p>
    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
  `;
}

export function accessGrantedEmailHtml(loginUrl: string, temporaryNote: string): string {
  return `
    <p>Tu solicitud a la EDDOE fue aprobada.</p>
    <p>${temporaryNote}</p>
    <p>Inicia sesión y establece tu contraseña aquí: <a href="${loginUrl}">${loginUrl}</a></p>
  `;
}
