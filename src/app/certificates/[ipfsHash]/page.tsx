import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

const pinataGateway = "https://ipfs.io/ipfs/";

const toGatewayUrl = (value?: string): string => {
  if (!value) return "";
  if (value.startsWith("ipfs://")) {
    return `${pinataGateway}${value.replace("ipfs://", "")}`;
  }
  if (value.startsWith("http")) return value;
  return `${pinataGateway}${value}`;
};

const fetchMetadata = async (ipfsHash: string) => {
  try {
    const response = await fetch(toGatewayUrl(ipfsHash), { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

const resolveImage = async (imageValue?: string) => {
  const rawUrl = toGatewayUrl(imageValue);
  if (!rawUrl) {
    return { displayUrl: "", downloadUrl: "", rawUrl: "", isSvg: false };
  }

  try {
    const response = await fetch(rawUrl, { cache: "no-store" });
    if (!response.ok) {
      return { displayUrl: "/assets/icons/nft-placeholder.svg", downloadUrl: rawUrl, rawUrl, isSvg: false };
    }
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("image/svg+xml")) {
      const svgText = await response.text();
      const encoded = Buffer.from(svgText).toString("base64");
      const dataUrl = `data:image/svg+xml;base64,${encoded}`;
      return { displayUrl: dataUrl, downloadUrl: dataUrl, rawUrl, isSvg: true };
    }
    return { displayUrl: rawUrl, downloadUrl: rawUrl, rawUrl, isSvg: false };
  } catch {
    return { displayUrl: "/assets/icons/nft-placeholder.svg", downloadUrl: rawUrl, rawUrl, isSvg: false };
  }
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
        <div className="bg-cgray border-2 border-gray rounded-2xl p-8 text-center max-w-md w-full">
          <h1 className="text-xl font-semibold text-neutral">{t("notFound")}</h1>
          <p className="text-sm text-dgray mt-2">IPFS: {ipfsHash}</p>
        </div>
      </div>
    );
  }

  const { displayUrl, downloadUrl, rawUrl, isSvg } = await resolveImage(metadata.image);
  const title = typeof metadata.name === "string" ? metadata.name : t("title");
  const description = typeof metadata.description === "string" ? metadata.description : "";
  const downloadName = "certificado.pdf";
  const downloadParam = metadata.image ? encodeURIComponent(metadata.image) : encodeURIComponent(ipfsHash);

  return (
    <div className="min-h-screen w-full bg-neutralbg flex items-center justify-center px-6 py-10">
      <div className="bg-cgray border-2 border-gray rounded-2xl p-6 md:p-8 max-w-3xl w-full">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray/40 bg-base-200">
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
          <div className="flex-1 flex flex-col gap-3">
            <h1 className="text-2xl font-semibold text-neutral">{title}</h1>
            <p className="text-sm text-dgray">{t("subtitle")}</p>
            {description && (
              <p className="text-sm text-neutral/80 leading-relaxed">{description}</p>
            )}
            <div className="text-xs text-dgray mt-2">IPFS: {ipfsHash}</div>
            <div className="flex flex-col gap-2 mt-4">
              {downloadUrl && (
                <a
                  className="btn bg-dblue text-white border-0"
                  href={`/api/ipfs/pdf?image=${downloadParam}`}
                  download={downloadName}
                >
                  {t("downloadImage")}
                </a>
              )}
              <a
                className="btn btn-outline border-dblue text-dblue"
                href={toGatewayUrl(ipfsHash)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("openMetadata")}
              </a>
              {rawUrl && (
                <a
                  className="btn btn-outline border-neutral/30 text-neutral/70"
                  href={rawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("openImage")}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
