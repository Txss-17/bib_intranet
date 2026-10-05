import { SignJWT, importPKCS8 } from "npm:jose@5.10.0";

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.modify";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users";

type GmailConfig = {
  serviceAccountEmail: string;
  privateKey: string;
  impersonatedUser: string;
};

type GmailHeader = {
  name: string;
  value: string;
};

export type GmailMessagePart = {
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: {
    attachmentId?: string;
    size?: number;
    data?: string;
  };
  parts?: GmailMessagePart[];
};

export type GmailMessage = {
  id: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  historyId?: string;
  internalDate?: string;
  payload?: GmailMessagePart;
  sizeEstimate?: number;
  raw?: string;
};

export type GmailMessageListResponse = {
  messages?: Array<{
    id: string;
    threadId?: string;
  }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
};

export type GmailProfile = {
  emailAddress: string;
  messagesTotal?: number;
  threadsTotal?: number;
  historyId?: string;
};

function getConfig(): GmailConfig {
  const serviceAccountEmail = Deno.env.get(
    "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  );

  const privateKey = Deno.env.get(
    "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
  );

  const impersonatedUser = Deno.env.get(
    "GOOGLE_WORKSPACE_IMPERSONATED_USER",
  );

  if (!serviceAccountEmail) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL Supabase secret.",
    );
  }

  if (!privateKey) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY Supabase secret.",
    );
  }

  if (!impersonatedUser) {
    throw new Error(
      "Missing GOOGLE_WORKSPACE_IMPERSONATED_USER Supabase secret.",
    );
  }

  return {
    serviceAccountEmail,
    privateKey: normalizePrivateKey(privateKey),
    impersonatedUser,
  };
}

function normalizePrivateKey(privateKey: string): string {
  return privateKey
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();
}

async function createAccessToken(): Promise<string> {
  const config = getConfig();

  const now = Math.floor(Date.now() / 1000);

  const privateKey = await importPKCS8(
    config.privateKey,
    "RS256",
  );

  const assertion = await new SignJWT({
    scope: GMAIL_SCOPE,
  })
    .setProtectedHeader({
      alg: "RS256",
      typ: "JWT",
    })
    .setIssuer(config.serviceAccountEmail)
    .setSubject(config.impersonatedUser)
    .setAudience(GOOGLE_TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type:
        "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Google OAuth token request failed (${response.status}): ${errorText}`,
    );
  }

  const tokenData = await response.json();

  if (!tokenData.access_token) {
    throw new Error(
      "Google OAuth response did not contain an access_token.",
    );
  }

  return tokenData.access_token;
}

async function gmailRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const accessToken = await createAccessToken();

  const headers = new Headers(options.headers);

  headers.set(
    "Authorization",
    `Bearer ${accessToken}`,
  );

  if (
    options.body &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  const response = await fetch(
    `${GMAIL_API_BASE}/me${path}`,
    {
      ...options,
      headers,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Gmail API request failed (${response.status}): ${errorText}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return await response.json();
}

function assertSafeHeaderValue(
  value: string,
  fieldName: string,
): void {
  if (/[\r\n]/.test(value)) {
    throw new Error(
      `Invalid ${fieldName}: header injection characters are not allowed.`,
    );
  }
}

function encodeBase64Url(
  value: Uint8Array,
): string {
  let binary = "";

  const chunkSize = 0x8000;

  for (
    let index = 0;
    index < value.length;
    index += chunkSize
  ) {
    binary += String.fromCharCode(
      ...value.subarray(
        index,
        Math.min(index + chunkSize, value.length),
      ),
    );
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function textToBase64Url(
  value: string,
): string {
  return encodeBase64Url(
    new TextEncoder().encode(value),
  );
}

function decodeBase64Url(
  value: string,
): string {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded =
    normalized +
    "=".repeat(
      (4 - (normalized.length % 4)) % 4,
    );

  const binary = atob(padded);

  const bytes = new Uint8Array(
    binary.length,
  );

  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new TextDecoder().decode(bytes);
}

function encodeMimeHeader(
  value: string,
): string {
  if (/^[\x20-\x7E]*$/.test(value)) {
    return value;
  }

  const encoded = textToBase64Url(value)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  return `=?UTF-8?B?${encoded}=`;
}

function normalizeEmailAddress(
  value: string,
  fieldName: string,
): string {
  const normalized = value.trim();

  assertSafeHeaderValue(
    normalized,
    fieldName,
  );

  if (!normalized) {
    throw new Error(
      `${fieldName} cannot be empty.`,
    );
  }

  return normalized;
}

function buildMimeMessage(options: {
  to: string;
  subject: string;
  text: string;
  from?: string;
  replyTo?: string;
  inReplyTo?: string;
  references?: string;
}): string {
  const config = getConfig();

  const to = normalizeEmailAddress(
    options.to,
    "recipient",
  );

  const from = normalizeEmailAddress(
    options.from ?? config.impersonatedUser,
    "sender",
  );

  const replyTo = options.replyTo
    ? normalizeEmailAddress(
        options.replyTo,
        "replyTo",
      )
    : undefined;

  const subject = options.subject.trim();

  assertSafeHeaderValue(
    subject,
    "subject",
  );

  const boundary =
    `=_BIB_GMAIL_${crypto.randomUUID().replace(/-/g, "")}`;

  const lines: string[] = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeMimeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];

  if (replyTo) {
    lines.push(`Reply-To: ${replyTo}`);
  }

  if (options.inReplyTo) {
    assertSafeHeaderValue(
      options.inReplyTo,
      "In-Reply-To",
    );

    lines.push(
      `In-Reply-To: ${options.inReplyTo}`,
    );
  }

  if (options.references) {
    assertSafeHeaderValue(
      options.references,
      "References",
    );

    lines.push(
      `References: ${options.references}`,
    );
  }

  lines.push(
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    options.text,
    "",
    `--${boundary}--`,
  );

  return lines.join("\r\n");
}

export async function sendGmailMessage(options: {
  to: string;
  subject: string;
  text: string;
  from?: string;
  replyTo?: string;
  inReplyTo?: string;
  references?: string;
  threadId?: string;
}): Promise<GmailMessage> {
  const rawMime = buildMimeMessage(options);

  const body: {
    raw: string;
    threadId?: string;
  } = {
    raw: textToBase64Url(rawMime),
  };

  if (options.threadId) {
    body.threadId = options.threadId;
  }

  return await gmailRequest<GmailMessage>(
    "/messages/send",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function listGmailMessages(options?: {
  query?: string;
  maxResults?: number;
  pageToken?: string;
}): Promise<GmailMessageListResponse> {
  const params = new URLSearchParams();

  if (options?.query) {
    params.set("q", options.query);
  }

  if (options?.maxResults) {
    params.set(
      "maxResults",
      String(
        Math.min(
          Math.max(options.maxResults, 1),
          500,
        ),
      ),
    );
  }

  if (options?.pageToken) {
    params.set(
      "pageToken",
      options.pageToken,
    );
  }

  const queryString = params.toString();

  return await gmailRequest<GmailMessageListResponse>(
    `/messages${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
    },
  );
}

export async function getGmailMessage(
  messageId: string,
): Promise<GmailMessage> {
  assertSafeHeaderValue(
    messageId,
    "messageId",
  );

  return await gmailRequest<GmailMessage>(
    `/messages/${encodeURIComponent(messageId)}?format=full`,
    {
      method: "GET",
    },
  );
}

export async function getGmailProfile(): Promise<GmailProfile> {
  return await gmailRequest<GmailProfile>(
    "/profile",
    {
      method: "GET",
    },
  );
}

export function getGmailHeader(
  message: GmailMessage,
  name: string,
): string | null {
  const headers =
    message.payload?.headers ?? [];

  const header = headers.find(
    (item) =>
      item.name.toLowerCase() ===
      name.toLowerCase(),
  );

  return header?.value ?? null;
}

export function getGmailMessageText(
  message: GmailMessage,
): string {
  const payload = message.payload;

  if (!payload) {
    return "";
  }

  const plainTextParts: string[] = [];
  const htmlParts: string[] = [];

  function visit(
    part: GmailMessagePart,
  ): void {
    const mimeType =
      part.mimeType?.toLowerCase() ?? "";

    if (
      part.body?.data &&
      mimeType === "text/plain"
    ) {
      plainTextParts.push(
        decodeBase64Url(part.body.data),
      );
    }

    if (
      part.body?.data &&
      mimeType === "text/html"
    ) {
      htmlParts.push(
        decodeBase64Url(part.body.data),
      );
    }

    for (const child of part.parts ?? []) {
      visit(child);
    }
  }

  visit(payload);

  if (plainTextParts.length > 0) {
    return plainTextParts.join("\n\n").trim();
  }

  if (htmlParts.length > 0) {
    return htmlParts
      .join("\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .trim();
  }

  if (payload.body?.data) {
    return decodeBase64Url(
      payload.body.data,
    ).trim();
  }

  return "";
}

export function getGmailMessageDate(
  message: GmailMessage,
): string {
  if (message.internalDate) {
    const timestamp = Number(
      message.internalDate,
    );

    if (
      Number.isFinite(timestamp) &&
      timestamp > 0
    ) {
      return new Date(timestamp).toISOString();
    }
  }

  return new Date().toISOString();
}

export function getImpersonatedGmailUser(): string {
  return getConfig().impersonatedUser;
}
