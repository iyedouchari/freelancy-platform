import nodemailer from "nodemailer";
import AppError from "./AppError.js";
import { env } from "../config/env.js";

let transporter;

const extractEmailAddress = (value) => {
  const normalized = String(value || "").trim();
  const match = normalized.match(/<([^>]+)>/);
  return (match ? match[1] : normalized).trim().toLowerCase();
};

const buildEffectiveFrom = () => {
  const configuredFrom = String(env.SMTP_FROM || "").trim();
  const smtpUser = String(env.SMTP_USER || "").trim();
  const configuredFromEmail = extractEmailAddress(configuredFrom);
  const smtpUserEmail = extractEmailAddress(smtpUser);
  const isGmailHost = String(env.SMTP_HOST || "").toLowerCase().includes("gmail");

  if (!configuredFrom) {
    return smtpUser;
  }

  if (!isGmailHost || !smtpUserEmail || configuredFromEmail === smtpUserEmail) {
    return configuredFrom;
  }

  const displayName = configuredFrom.includes("<")
    ? configuredFrom.split("<")[0].trim().replace(/^"|"$/g, "")
    : "";

  return displayName ? `${displayName} <${smtpUserEmail}>` : smtpUserEmail;
};

const ensureMailerConfig = () => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new AppError(
      "SMTP is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM to .env (or server/.env).",
      500,
      "SMTP_NOT_CONFIGURED",
    );
  }
};

const getTransporter = () => {
  if (!transporter) {
    ensureMailerConfig();
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
    });
  }

  return transporter;
};

export const mailer = {
  async sendMail({ to, subject, text, html }) {
    if (!to) {
      throw new AppError("Email destination missing.", 400, "EMAIL_MISSING");
    }

    const activeTransporter = getTransporter();
    const effectiveFrom = buildEffectiveFrom();
    return activeTransporter.sendMail({
      from: effectiveFrom,
      replyTo: env.SMTP_FROM || effectiveFrom,
      to,
      subject,
      text,
      html,
    });
  },
};
