/**
 * IPFS upload helper.
 *
 * Talks to a Kubo (go-ipfs) node via its HTTP RPC API.
 * Configure via env vars:
 *   IPFS_API_URL     — e.g. http://localhost:5001  (the Kubo RPC, NOT the gateway)
 *   IPFS_GATEWAY_URL — e.g. https://ipfs.tu-dominio.com  (the public HTTP gateway)
 *
 * When IPFS_API_URL is not set the function throws a clear error so callers
 * can return 503 instead of crashing.
 */

export type IpfsUploadResult = {
  cid: string;
  url: string;
  nombre: string;
  tipo: string;
  size: number;
};

export class IpfsNotConfiguredError extends Error {
  constructor() {
    super(
      "El nodo IPFS no está configurado. Definí IPFS_API_URL en las variables de entorno del servidor.",
    );
  }
}

export class IpfsUploadError extends Error {
  constructor(message: string) {
    super(`Error al subir a IPFS: ${message}`);
  }
}

/**
 * Upload a buffer to IPFS via the Kubo HTTP API.
 *
 * @param buffer   Raw file bytes
 * @param filename Original file name (stored in the adjunto record)
 * @param mimeType MIME type (e.g. "image/jpeg")
 */
export async function uploadToIpfs(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<IpfsUploadResult> {
  const apiUrl = process.env.IPFS_API_URL?.replace(/\/$/, "");
  const gatewayUrl = (process.env.IPFS_GATEWAY_URL ?? "https://ipfs.io").replace(/\/$/, "");

  if (!apiUrl) {
    throw new IpfsNotConfiguredError();
  }

  // Build a multipart/form-data body manually (no extra deps)
  const boundary = `----TrazaIpfsBoundary${Date.now()}`;
  const CRLF = "\r\n";

  const header = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${filename}"`,
    `Content-Type: ${mimeType}`,
    "",
    "",
  ].join(CRLF);

  const footer = `${CRLF}--${boundary}--${CRLF}`;

  const headerBuf = Buffer.from(header, "utf8");
  const footerBuf = Buffer.from(footer, "utf8");
  const body = Buffer.concat([headerBuf, buffer, footerBuf]);

  const response = await fetch(`${apiUrl}/api/v0/add?pin=true&quieter=true`, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new IpfsUploadError(text);
  }

  // Kubo returns newline-delimited JSON; with quieter=true it's a single line
  const text = await response.text();
  const lastLine = text.trim().split("\n").pop() ?? "";

  type KuboResponse = { Hash: string };
  const json = JSON.parse(lastLine) as KuboResponse;
  const cid = json.Hash;

  if (!cid) {
    throw new IpfsUploadError("El nodo no retornó un CID válido.");
  }

  return {
    cid,
    url: `${gatewayUrl}/ipfs/${cid}`,
    nombre: filename,
    tipo: mimeType,
    size: buffer.length,
  };
}
