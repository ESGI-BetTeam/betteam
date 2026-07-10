import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: parseInt(process.env.SMTP_PORT || '465', 10) === 465, // true for 465, false for other ports
  ignoreTLS: process.env.SMTP_IGNORE_TLS === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendVerificationEmail = async (to: string, token: string) => {
  const apiUrl = process.env.API_URL || 'http://localhost:3000';
  const verificationUrl = `${apiUrl}/api/auth/verify-redirect?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'BetTeam <noreply@localhost>',
    to,
    subject: 'Vérifiez votre adresse email - BetTeam',
    html: `
      <h1>Bienvenue sur BetTeam !</h1>
      <p>Merci de vous être inscrit. Pour valider votre compte, veuillez cliquer sur le lien ci-dessous :</p>
      <a href="${verificationUrl}">Vérifier mon compte</a>
      <p>Ou copiez/collez ce lien dans votre navigateur : ${verificationUrl}</p>
      <p>Ce lien est valide pendant 24 heures.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const apiUrl = process.env.API_URL || 'http://localhost:3000';
  const resetUrl = `${apiUrl}/api/auth/reset-redirect?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'BetTeam <noreply@localhost>',
    to,
    subject: 'Réinitialisation de mot de passe - BetTeam',
    html: `
      <h1>Réinitialisation de votre mot de passe</h1>
      <p>Vous avez demandé à réinitialiser votre mot de passe. Veuillez cliquer sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
      <a href="${resetUrl}">Réinitialiser mon mot de passe</a>
      <p>Ou copiez/collez ce lien dans votre navigateur : ${resetUrl}</p>
      <p>Ce lien est valide pendant 1 heure.</p>
      <p>Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
