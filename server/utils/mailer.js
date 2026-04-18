import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const hasSmtpConfig = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  : nodemailer.createTransport({ jsonTransport: true });

export const mailer = {
  async sendMail({ to, subject, text, html }) {
    if (!to) {
      throw new Error("Recipient email is required");
    }

    return transporter.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER || "no-reply@freelancy.local",
      to,
      subject,
      text,
      html,
    });
  },
};
