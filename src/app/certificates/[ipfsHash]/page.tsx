import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

const IPFS_GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://ipfs.io/ipfs/",
];

const toGatewayUrl = (value?: string, gateway = IPFS_GATEWAYS[0]): string => {
  if (!value) return "";
  if (value.startsWith("ipfs://")) return `${gateway}${value.replace("ipfs://", "")}`;
  if (value.startsWith("http")) return value;
  return `${gateway}${value}`;
};

const fetchMetadata = async (ipfsHash: string) => {
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(toGatewayUrl(ipfsHash, gateway), {
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) continue;
      return await response.json();
    } catch {
      continue;
    }
  }
  return null;
};

const extractImageValue = (metadata: any): string => {
  if (!metadata) return "";
  const imageCandidates = [
    metadata.image,
    metadata.image_url,
    metadata.imageUrl,
    metadata.image_data,
    metadata.animation_url,
  ];

  for (const value of imageCandidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value && typeof value.url === "string" && value.url.trim()) return value.url.trim();
  }

  return "";
};

const resolveImage = (imageValue?: string) => {
  if (!imageValue) {
    return { displayUrl: "", downloadUrl: "", rawUrl: "", isSvg: false };
  }

  if (imageValue.startsWith("data:")) {
    return { displayUrl: imageValue, downloadUrl: "", rawUrl: "", isSvg: true };
  }

  const rawUrl = toGatewayUrl(imageValue);
  const proxyUrl = `/api/ipfs/image?image=${encodeURIComponent(imageValue)}`;

  return { displayUrl: proxyUrl, downloadUrl: proxyUrl, rawUrl, isSvg: false };
};

export default async function CertificatePage({
  params,
}: {
  params: { ipfsHash: string };
}) {
  const t = await getTranslations("certificate");
  const ipfsHash = decodeURIComponent(params.ipfsHash || "");
  const metadata = await fetchMetadata(ipfsHash);

  if (!metadata) {
    return (
      <div className="min-h-screen w-full bg-neutralbg flex items-center justify-center px-6">
        <div className="bg-cgray border-2 border-gray rounded-2xl p-8 text-center max-w-md w-full flex flex-col gap-4">
          <h1 className="text-xl font-semibold text-neutral">{t("notFound")}</h1>
          <p className="text-xs text-dgray break-all">IPFS: {ipfsHash}</p>
          <a
            href={`https://gateway.pinata.cloud/ipfs/${ipfsHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline border-dblue text-dblue w-full"
          >
            Abrir diretamente no Pinata ↗
          </a>
        </div>
      </div>
    );
  }

  const imageValue = extractImageValue(metadata);
  const { displayUrl, downloadUrl, rawUrl, isSvg } = resolveImage(imageValue);
  const title = typeof metadata.name === "string" ? metadata.name : t("title");
  const description = typeof metadata.description === "string" ? metadata.description : "";
  const recipient = typeof metadata.recipient === "string" ? metadata.recipient : null;
  const downloadName = "certificado.pdf";
  const downloadParam = imageValue ? encodeURIComponent(imageValue) : encodeURIComponent(ipfsHash);
  const canDownload = !!downloadUrl || !!rawUrl;
  const openImageUrl = displayUrl || rawUrl;

  return (
    <div className="min-h-screen w-full bg-neutralbg flex items-center justify-center px-6 py-10">
      <div className="bg-cgray border-2 border-gray rounded-2xl p-6 md:p-8 max-w-3xl w-full">
        <h1 className="text-center text-xl md:text-2xl font-semibold text-neutral">
          {title}
        </h1>
        {recipient && (
          <p className="text-center text-sm text-dgray mt-1">
            {recipient}
          </p>
        )}
        <div className="mt-5 flex justify-center">
          <div className="w-full max-w-2xl aspect-video overflow-hidden rounded-xl border border-gray/40 bg-base-200">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-dgray text-sm">
                {t("notFound")}
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 text-center text-sm text-dgray">
          {t("subtitle")}
        </div>
        {description && (
          <div className="mt-2 text-center text-sm text-neutral/80 leading-relaxed">
            {description}
          </div>
        )}
        <div className="mt-2 text-center text-xs text-dgray">IPFS: {ipfsHash}</div>
        <div className="mt-6 flex flex-col items-center gap-2">
          {canDownload && (
            <a
              className="btn bg-dblue text-white border-0 w-full max-w-xs"
              href={`/api/ipfs/pdf?image=${downloadParam}`}
              download={downloadName}
            >
              {t("downloadImage")}
            </a>
          )}
          <a
            className="btn btn-outline border-dblue text-dblue w-full max-w-xs"
            href={toGatewayUrl(ipfsHash)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("openMetadata")}
          </a>
          {openImageUrl && (
            <a
              className="btn btn-outline border-neutral/30 text-neutral/70 w-full max-w-xs"
              href={openImageUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("openImage")}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
