// 画像URLを <img> で表示可能な形へ正規化する。
// 特にGoogleドライブの共有リンク(.../view や open?id=...)は
// そのままでは画像として表示できないため、thumbnailエンドポイントに変換する。
//
// 保存値は変換せず、表示時にこの関数を通す（非破壊）。

export function toDisplayableImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    // thumbnailエンドポイントは <img> 埋め込みで安定して表示できる
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
  }

  return trimmed;
}

// GoogleドライブのURLからファイルIDを抽出する。該当しなければ null。
function extractDriveFileId(url: string): string | null {
  if (!/drive\.google\.com|docs\.google\.com/.test(url)) return null;

  // https://drive.google.com/file/d/<ID>/view?...
  const byPath = url.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]{10,})/);
  if (byPath) return byPath[1];

  // https://drive.google.com/open?id=<ID> / uc?export=view&id=<ID> / thumbnail?id=<ID>
  const byQuery = url.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (byQuery) return byQuery[1];

  return null;
}
