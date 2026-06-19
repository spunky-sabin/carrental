'use client';

import Link from "next/link";
import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

const screenStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#ffffff",
  color: "#1a1a1a",
  display: "flex",
  flexDirection: "column",
};

const pageWidthStyle: CSSProperties = {
  width: "100%",
  maxWidth: 430,
  marginInline: "auto",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
};

const topSectionStyle: CSSProperties = {
  padding: "22px 22px 0",
};

const keyButtonStyle: CSSProperties = {
  height: "clamp(56px, 14vw, 62px)",
  borderRadius: 12,
  border: "1px solid #dddddd",
  background: "#ffffff",
  color: "#101010",
  fontSize: 18,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
};

const keypadGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
};

function BrandLockup() {
  return (
    <Link
      href="/"
      aria-label="Qent home"
      style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "#060606",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5.25 12.25h13.5v3.25a1.5 1.5 0 0 1-1.5 1.5h-.75v1.25a.75.75 0 0 1-1.5 0V17h-6v1.25a.75.75 0 0 1-1.5 0V17h-.75a1.5 1.5 0 0 1-1.5-1.5v-3.25Z"
            fill="#ffffff"
          />
          <path
            d="m7 8.25 1.1-2.1A1.75 1.75 0 0 1 9.65 5h4.7a1.75 1.75 0 0 1 1.55 1.15L17 8.25"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8.25" cy="13.25" r="1" fill="#060606" />
          <circle cx="15.75" cy="13.25" r="1" fill="#060606" />
        </svg>
      </span>
      <span style={{ fontSize: 18, fontWeight: 700, color: "#111111", lineHeight: 1 }}>Qent</span>
    </Link>
  );
}

function DeleteKey({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Delete digit"
      style={{
        ...keyButtonStyle,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path
          d="M12.3 6.5h9.35c2 0 3.17 0 4.09.42.81.37 1.5 1 1.94 1.78.5.87.58 2.04.74 4.03l.02.2c.07.88.1 1.32.1 1.77v.6c0 .44-.03.89-.1 1.77l-.02.2c-.16 1.99-.24 3.16-.74 4.03-.44.78-1.13 1.41-1.94 1.78-.92.42-2.09.42-4.09.42H12.3c-.63 0-.95 0-1.24-.08a2.68 2.68 0 0 1-.95-.49c-.23-.19-.45-.41-.89-.86l-3.2-3.2c-.55-.55-.83-.82-.94-1.15a2.1 2.1 0 0 1 0-1.32c.11-.33.39-.6.94-1.15l3.2-3.2c.44-.45.66-.67.89-.86.29-.23.61-.4.95-.49.29-.08.61-.08 1.24-.08Z"
          stroke="#20253a"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
        <path
          d="m14.4 12.4 6.9 6.9m0-6.9-6.9 6.9"
          stroke="#20253a"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

export default function EnterVerification({ standalone = true }: { standalone?: boolean }) {
  const [digits, setDigits] = useState(["6", "9", "0", ""]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const code = useMemo(() => digits.join(""), [digits]);
  const activeIndex = useMemo(() => digits.findIndex((digit) => digit === ""), [digits]);
  const highlightedIndex = focusedIndex ?? (activeIndex === -1 ? digits.length - 1 : activeIndex);

  const focusInput = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, digits.length - 1));
    setFocusedIndex(nextIndex);
    inputRefs.current[nextIndex]?.focus();
    inputRefs.current[nextIndex]?.select();
  };

  const updateDigit = (index: number, value: string) => {
    const nextDigit = value.replace(/\D/g, "").slice(-1);

    setDigits((current) => {
      const next = [...current];
      next[index] = nextDigit;
      return next;
    });

    if (nextDigit && index < digits.length - 1) {
      focusInput(index + 1);
    }
  };

  const pushDigit = (digit: string) => {
    const firstEmptyIndex = digits.findIndex((value) => value === "");
    const targetIndex = focusedIndex ?? (firstEmptyIndex === -1 ? digits.length - 1 : firstEmptyIndex);

    setDigits((current) => {
      const next = [...current];
      next[targetIndex] = digit;
      return next;
    });

    focusInput(Math.min(targetIndex + 1, digits.length - 1));
  };

  const deleteDigit = () => {
    let nextFocusIndex = 0;

    setDigits((current) => {
      const next = [...current];
      if (focusedIndex !== null) {
        if (next[focusedIndex]) {
          next[focusedIndex] = "";
          nextFocusIndex = focusedIndex;
          return next;
        }

        if (focusedIndex > 0) {
          next[focusedIndex - 1] = "";
          nextFocusIndex = focusedIndex - 1;
          return next;
        }
      }

      const lastFilledIndex = [...current].reverse().findIndex((value) => value !== "");
      const index = lastFilledIndex === -1 ? 0 : current.length - 1 - lastFilledIndex;
      next[index] = "";
      nextFocusIndex = index;
      return next;
    });

    focusInput(nextFocusIndex);
  };

  const handleInputChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, "");

    if (!value) {
      updateDigit(index, "");
      return;
    }

    if (value.length === 1) {
      updateDigit(index, value);
      return;
    }

    const pastedDigits = value.slice(0, digits.length - index).split("");
    setDigits((current) => {
      const next = [...current];

      pastedDigits.forEach((digit, offset) => {
        next[index + offset] = digit;
      });

      return next;
    });

    focusInput(Math.min(index + pastedDigits.length, digits.length - 1));
  };

  const handleInputKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();

      if (digits[index]) {
        updateDigit(index, "");
        return;
      }

      if (index > 0) {
        updateDigit(index - 1, "");
        focusInput(index - 1);
      }
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
    }

    if (event.key === "ArrowRight" && index < digits.length - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedDigits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, digits.length - index).split("");

    if (!pastedDigits.length) {
      return;
    }

    setDigits((current) => {
      const next = [...current];

      pastedDigits.forEach((digit, offset) => {
        next[index + offset] = digit;
      });

      return next;
    });

    focusInput(Math.min(index + pastedDigits.length, digits.length - 1));
  };

  const content = (
    <div style={standalone ? pageWidthStyle : { width: "100%" }}>
      <section style={{ ...topSectionStyle, paddingInline: standalone ? "clamp(18px, 5vw, 22px)" : 0 }}>
        {standalone && <BrandLockup />}

        <div style={{ paddingTop: standalone ? "clamp(56px, 20vw, 104px)" : 0, textAlign: "center" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(30px, 8vw, 34px)",
              lineHeight: 1.15,
              fontWeight: 700,
              color: "#202020",
            }}
          >
            Enter verification code
          </h1>

          <p
            style={{
              margin: "18px 0 0",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#878787",
            }}
          >
            We have send a Code to : +100******00
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "clamp(10px, 3vw, 20px)",
              marginTop: "clamp(28px, 8vw, 42px)",
              paddingInline: standalone ? "clamp(0px, 6vw, 28px)" : 0,
            }}
          >
            {digits.map((digit, index) => {
              const isActive = index === highlightedIndex;

              return (
                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  enterKeyHint="done"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => handleInputChange(index, event)}
                  onKeyDown={(event) => handleInputKeyDown(index, event)}
                  onFocus={(event) => {
                    setFocusedIndex(index);
                    event.currentTarget.select();
                  }}
                  onPaste={(event) => handlePaste(index, event)}
                  aria-label={`Verification digit ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "clamp(56px, 14vw, 62px)",
                    borderRadius: 12,
                    border: `1px solid ${isActive ? "#d6d6d6" : "#d9d9d9"}`,
                    background: "#ffffff",
                    boxShadow: isActive ? "inset 0 0 0 1px #efefef" : "0 2px 6px rgba(15, 23, 42, 0.03)",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#111111",
                    textAlign: "center",
                    outline: "none",
                    caretColor: "#111111",
                  }}
                />
              );
            })}
          </div>

          <button
            type="button"
            style={{
              marginTop: 24,
              width: "100%",
              height: "clamp(58px, 15vw, 62px)",
              borderRadius: 999,
              border: "none",
              background: "#232b2d",
              color: "#ffffff",
              fontSize: 18,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 18px 28px rgba(35, 43, 45, 0.12)",
            }}
          >
            Continue
          </button>

          <p
            style={{
              margin: "24px 0 0",
              fontSize: 14,
              lineHeight: 1.5,
              color: "#909090",
            }}
          >
            Didn&apos;t receive the OTP? Resend.
          </p>
        </div>
      </section>

      <section
        style={{
          marginTop: standalone ? "auto" : 40,
          background: "#f1f1f1",
          borderRadius: 28,
          padding: "18px clamp(16px, 4vw, 20px) 16px",
          border: "1px solid #ebebeb",
        }}
      >
        <div style={{ textAlign: "center", color: "#8c8c8c" }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45 }}>Form Message</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: 1.45 }}>{code || "----"}</p>
        </div>

        <div style={{ ...keypadGridStyle, marginTop: 22 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => pushDigit(String(digit))}
              style={keyButtonStyle}
            >
              {digit}
            </button>
          ))}

          <div />

          <button type="button" onClick={() => pushDigit("0")} style={keyButtonStyle}>
            0
          </button>

          <DeleteKey onClick={deleteDigit} />
        </div>
      </section>
    </div>
  );

  if (!standalone) {
    return content;
  }

  return (
    <div style={screenStyle}>
      {content}
    </div>
  );
}
