"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ImportType = "companies" | "employees" | "merchants";

interface Props {
  companies: { id: string; displayId: string; name: string }[];
}

export default function CsvImporter({ companies }: Props) {
  const router = useRouter();
  const [type, setType] = useState<ImportType>("employees");
  const [file, setFile] = useState<File | null>(null);
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [defaultPassword, setDefaultPassword] = useState("demo1234");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    created?: number;
    failed?: number;
    errors?: string[];
    message?: string;
  } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      if (type === "employees") {
        fd.append("companyId", companyId);
      }
      fd.append("defaultPassword", defaultPassword);

      const res = await fetch("/api/superadmin/import", {
        method: "POST",
        body: fd,
      });
      const j = await res.json();
      if (!res.ok) {
        setResult({ success: false, message: j.error ?? "インポートに失敗しました" });
        return;
      }
      setResult({
        success: true,
        created: j.created,
        failed: j.failed,
        errors: j.errors,
      });
      router.refresh();
    } catch {
      setResult({ success: false, message: "通信エラー" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
          1. インポート対象を選択
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <TypeButton current={type} value="companies" onClick={() => setType("companies")}>
            企業
          </TypeButton>
          <TypeButton current={type} value="employees" onClick={() => setType("employees")}>
            従業員
          </TypeButton>
          <TypeButton current={type} value="merchants" onClick={() => setType("merchants")}>
            加盟店
          </TypeButton>
        </div>

        <CsvFormatGuide type={type} />
      </div>

      <form onSubmit={submit} style={cardStyle}>
        <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
          2. CSVファイルをアップロード
        </div>

        {type === "employees" && (
          <div style={fieldStyle}>
            <label style={labelStyle}>所属会社(必須)</label>
            <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={inputStyle} required>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayId} {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={fieldStyle}>
          <label style={labelStyle}>初期パスワード(全アカウント共通)</label>
          <input
            type="text"
            value={defaultPassword}
            onChange={(e) => setDefaultPassword(e.target.value)}
            style={inputStyle}
            placeholder="demo1234"
            minLength={8}
          />
          <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 4 }}>
            ※ ログイン後、各ユーザーに変更してもらってください。
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>CSVファイル</label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ ...inputStyle, padding: 8 }}
            required
          />
          <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 4 }}>
            UTF-8(BOM有・無いずれも可)。1行目はヘッダー。
          </div>
        </div>

        {result && (
          <div
            style={{
              padding: "12px 16px",
              fontSize: 13,
              borderRadius: 4,
              marginTop: 12,
              ...(result.success
                ? { background: "#e8f0e3", color: "#3a5024", border: "1px solid #b8ceab" }
                : { background: "#fcebeb", color: "#791f1f", border: "1px solid #f7c1c1" }),
            }}
          >
            {result.success ? (
              <>
                ✅ <strong>{result.created}件</strong> をインポートしました。
                {result.failed && result.failed > 0 && (
                  <span style={{ marginLeft: 8, color: "#8b6914" }}>
                    (失敗: {result.failed}件)
                  </span>
                )}
                {result.errors && result.errors.length > 0 && (
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ cursor: "pointer", fontSize: 12 }}>
                      エラー詳細 ({result.errors.length}件)
                    </summary>
                    <ul style={{ marginTop: 6, paddingLeft: 20, fontSize: 11 }}>
                      {result.errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </>
            ) : (
              <>❌ {result.message}</>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button type="submit" disabled={!file || busy} style={btnAccentStyle}>
            {busy ? "インポート中..." : "インポート開始"}
          </button>
        </div>
      </form>
    </div>
  );
}

function TypeButton({
  current,
  value,
  onClick,
  children,
}: {
  current: ImportType;
  value: ImportType;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? "var(--accent)" : "var(--bg-panel)",
        color: active ? "#fbfaf6" : "var(--ink)",
        border: `1px solid ${active ? "var(--accent)" : "var(--line-strong)"}`,
        padding: "12px 18px",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        borderRadius: 4,
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

function CsvFormatGuide({ type }: { type: ImportType }) {
  const guides: Record<ImportType, { headers: string[]; example: string; notes: string[] }> = {
    companies: {
      headers: ["displayId", "name", "monthlyPoints", "invoiceEmail", "adminEmail", "adminName"],
      example: `displayId,name,monthlyPoints,invoiceEmail,adminEmail,adminName
C003,株式会社サンプル,5,billing@sample.co.jp,admin@sample.co.jp,サンプル管理者
C004,テスト工業株式会社,10,billing@test.co.jp,admin@test.co.jp,テスト管理者`,
      notes: [
        "displayId は C001 形式・ユニーク",
        "monthlyPoints は 0以上の整数(月次付与pt数)",
        "adminEmail / adminName は初期管理者(必須)",
        "全加盟店との契約は自動的に作成されます",
        "全アカウントの初期パスワードは下で指定するもの",
      ],
    },
    employees: {
      headers: ["displayId", "name", "email", "department"],
      example: `displayId,name,email,department
E0001,山田 太郎,yamada@example.co.jp,営業部
E0002,佐藤 花子,sato@example.co.jp,人事部`,
      notes: [
        "displayId は E0001 形式・会社内ユニーク",
        "department は省略可",
        "全員が下で選択した会社に追加されます",
        "メールアドレスはシステム全体でユニーク",
      ],
    },
    merchants: {
      headers: ["displayId", "name", "email", "category", "address", "websiteUrl", "invoiceRegNo"],
      example: `displayId,name,email,category,address,websiteUrl,invoiceRegNo
M004,ヨガスタジオ難波,info@yoga-namba.jp,ヨガスタジオ,大阪市中央区難波1-1,https://yoga-namba.example.jp,T9876543210123
M005,リラクセーション庵,info@an-relax.jp,マッサージ,大阪市中央区本町2-2,https://an-relax.example.jp,T8765432109876`,
      notes: [
        "displayId は M001 形式・ユニーク",
        "category は文字列(自由記述)",
        "websiteUrl はhttps必須",
        "invoiceRegNo は T+13桁の数字",
        "全企業との契約が自動的に作成されます",
      ],
    },
  };

  const g = guides[type];

  return (
    <div style={{ background: "var(--bg)", border: "1px dashed var(--line-strong)", padding: 14, borderRadius: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>📋 CSVフォーマット</div>
      <div style={{ fontSize: 11, color: "var(--ink-mute)", marginBottom: 6 }}>1行目のヘッダー(必須):</div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          background: "#fff",
          padding: "8px 10px",
          border: "1px solid var(--line)",
          borderRadius: 4,
          marginBottom: 12,
          wordBreak: "break-all",
        }}
      >
        {g.headers.join(",")}
      </div>
      <div style={{ fontSize: 11, color: "var(--ink-mute)", marginBottom: 6 }}>サンプル:</div>
      <pre
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          background: "#fff",
          padding: "8px 10px",
          border: "1px solid var(--line)",
          borderRadius: 4,
          marginBottom: 12,
          overflowX: "auto",
          margin: 0,
        }}
      >
        {g.example}
      </pre>
      <ul style={{ fontSize: 11, color: "var(--ink-soft)", paddingLeft: 18, lineHeight: 1.7, margin: 0 }}>
        {g.notes.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </ul>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--bg-panel)",
  border: "1px solid var(--line)",
  padding: 24,
  marginBottom: 20,
  boxShadow: "0 1px 0 rgba(0,0,0,0.02), 0 20px 40px -20px rgba(60,40,20,0.08)",
};
const fieldStyle: React.CSSProperties = { marginBottom: 14 };
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "var(--ink-soft)",
  marginBottom: 6,
  fontWeight: 500,
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid var(--line-strong)",
  background: "#fff",
  fontFamily: "inherit",
  fontSize: 13,
  borderRadius: 4,
};
const btnAccentStyle: React.CSSProperties = {
  background: "var(--accent)",
  color: "#fbfaf6",
  border: "none",
  padding: "10px 22px",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  borderRadius: 4,
  fontFamily: "inherit",
};
