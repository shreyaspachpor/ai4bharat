import Vapi from "@vapi-ai/web";

const vapiPublicKey =
  process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ||
  process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;

if (!vapiPublicKey) {
  console.error(
    "Vapi public key missing. Set NEXT_PUBLIC_VAPI_PUBLIC_KEY (or NEXT_PUBLIC_VAPI_WEB_TOKEN) in .env.local."
  );
}

export const vapi = new Vapi(vapiPublicKey ?? "");
