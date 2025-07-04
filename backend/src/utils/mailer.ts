import nodemailer from 'nodemailer';

// Create a transporter using the fake SMTP server (MailHog)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost', // Using localhost since we're running outside Docker
  port: Number(process.env.SMTP_PORT) || 1025,
  secure: false,
  ignoreTLS: true,
});

interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using the configured transporter
 */
export async function sendMail({ to, subject, text, html }: SendMailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"Balance Ton Compte" <noreply@balancetoncompte.fr>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Generate a password reset email with JWT token
 */
export function generatePasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  const html = `
    <h1>Réinitialisation de votre mot de passe</h1>
    <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
    <p><a href="${resetUrl}">Réinitialiser mon mot de passe</a></p>
    <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
    <p>Le lien expirera dans 1 heure.</p>
  `;
  
  const text = `
    Réinitialisation de votre mot de passe
    
    Vous avez demandé à réinitialiser votre mot de passe. Copiez et collez le lien ci-dessous dans votre navigateur pour définir un nouveau mot de passe :
    
    ${resetUrl}
    
    Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
    
    Le lien expirera dans 1 heure.
  `;
  
  return {
    subject: 'Réinitialisation de votre mot de passe',
    html,
    text,
  };
}
