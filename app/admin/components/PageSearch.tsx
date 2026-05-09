"use client";

type PageSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder: string;
  ariaLabel: string;
  resultCount?: number;
  resultLabel?: string;
  marginBottom?: number;
  maxWidth?: number | string;
};

export default function PageSearch({
  value,
  onChange,
  onClear,
  placeholder,
  ariaLabel,
  resultCount,
  resultLabel = "result",
  marginBottom = 20,
  maxWidth = 760,
}: PageSearchProps) {
  const hasValue = value.trim().length > 0;

  return (
    <div style={{ width: "100%", marginBottom }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth,
        }}
      >
        <svg
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9ca3af",
            pointerEvents: "none",
          }}
          width="18"
          height="18"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
        </svg>
        <input
          aria-label={ariaLabel}
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            minHeight: 44,
            padding: hasValue ? "11px 44px 11px 42px" : "11px 14px 11px 42px",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            fontSize: 14,
            color: "#111827",
            background: "#ffffff",
            outline: "none",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#3b82f6";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.boxShadow = "0 1px 2px rgba(15, 23, 42, 0.04)";
          }}
        />
        {hasValue && (
          <button
            type="button"
            aria-label="Clear search"
            title="Clear search"
            onClick={onClear}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              width: 30,
              height: 30,
              border: "1px solid transparent",
              borderRadius: 999,
              background: "#f3f4f6",
              color: "#6b7280",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e5e7eb";
              e.currentTarget.style.color = "#374151";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.style.color = "#6b7280";
            }}
          >
            x
          </button>
        )}
      </div>
      {hasValue && typeof resultCount === "number" && (
        <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
          Found <strong>{resultCount}</strong> {resultCount === 1 ? resultLabel : `${resultLabel}s`}
        </div>
      )}
    </div>
  );
}
