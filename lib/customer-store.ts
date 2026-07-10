import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { env } from "@/lib/env";

type LocalCustomerRecord = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

export type LocalCustomer = Omit<LocalCustomerRecord, "passwordHash">;

type CustomersSnapshot = {
  customers: LocalCustomerRecord[];
};

const customersFilePath = path.join(process.cwd(), "data", "customers.json");

function ensureCustomersDirectory() {
  mkdirSync(path.dirname(customersFilePath), { recursive: true });
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashPassword(password: string) {
  return createHash("sha256").update(`${env.customerSessionSecret}::${password}`).digest("base64url");
}

function createSeedCustomer(): LocalCustomerRecord {
  return {
    id: "customer-demo",
    email: normalizeEmail(env.customerLoginEmail),
    fullName: env.customerDisplayName,
    phone: env.customerPhone,
    passwordHash: hashPassword(env.customerLoginPassword),
    createdAt: "2026-07-09T00:00:00.000Z",
    updatedAt: "2026-07-09T00:00:00.000Z",
  };
}

function isCustomerRecord(value: unknown): value is LocalCustomerRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<LocalCustomerRecord>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.fullName === "string" &&
    typeof candidate.phone === "string" &&
    typeof candidate.passwordHash === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string"
  );
}

export function readCustomersSnapshot(): CustomersSnapshot {
  if (!existsSync(customersFilePath)) {
    return { customers: [] };
  }

  try {
    const raw = readFileSync(customersFilePath, "utf8");
    const snapshot = JSON.parse(raw) as Partial<CustomersSnapshot>;
    const customers = Array.isArray(snapshot.customers) ? snapshot.customers.filter(isCustomerRecord) : [];
    return { customers };
  } catch {
    return { customers: [] };
  }
}

function writeCustomersSnapshot(snapshot: CustomersSnapshot) {
  ensureCustomersDirectory();
  writeFileSync(customersFilePath, JSON.stringify(snapshot, null, 2));
}

function sanitizeCustomer(customer: LocalCustomerRecord): LocalCustomer {
  return {
    id: customer.id,
    email: customer.email,
    fullName: customer.fullName,
    phone: customer.phone,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

export function getCustomerLoginPreview() {
  return {
    email: env.customerLoginEmail,
    password: env.customerLoginPassword,
  };
}

export function findLocalCustomerByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const snapshot = readCustomersSnapshot();
  const fileCustomer = snapshot.customers.find((customer) => normalizeEmail(customer.email) === normalizedEmail);

  if (fileCustomer) {
    return sanitizeCustomer(fileCustomer);
  }

  const seedCustomer = createSeedCustomer();
  if (normalizeEmail(seedCustomer.email) === normalizedEmail) {
    return sanitizeCustomer(seedCustomer);
  }

  return null;
}

function getCustomerRecordByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const snapshot = readCustomersSnapshot();
  const fileCustomer = snapshot.customers.find((customer) => normalizeEmail(customer.email) === normalizedEmail);

  if (fileCustomer) {
    return fileCustomer;
  }

  const seedCustomer = createSeedCustomer();
  if (normalizeEmail(seedCustomer.email) === normalizedEmail) {
    return seedCustomer;
  }

  return null;
}

export function validateLocalCustomerCredentials(email: string, password: string) {
  const customer = getCustomerRecordByEmail(email);

  if (!customer || customer.passwordHash !== hashPassword(password)) {
    return null;
  }

  return sanitizeCustomer(customer);
}

export function createLocalCustomer({
  fullName,
  email,
  password,
  phone,
}: {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = phone.trim();

  if (findLocalCustomerByEmail(normalizedEmail)) {
    throw new Error("An account with this email already exists.");
  }

  if (normalizedPhone.length < 7) {
    throw new Error("Please enter a valid phone number.");
  }

  const timestamp = new Date().toISOString();
  const snapshot = readCustomersSnapshot();
  const customer: LocalCustomerRecord = {
    id: randomUUID(),
    email: normalizedEmail,
    fullName: fullName.trim(),
    phone: normalizedPhone,
    passwordHash: hashPassword(password),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  snapshot.customers = [customer, ...snapshot.customers];
  writeCustomersSnapshot(snapshot);

  return sanitizeCustomer(customer);
}
