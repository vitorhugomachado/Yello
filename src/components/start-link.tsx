"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { linkProblem, linkPrefix, slugify } from "@/lib/link";
export function StartLink() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const slug = slugify(value);
  const address = linkPrefix();
  return (
    <form
      className="start-link"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const problem = linkProblem(slug);
        setError(problem);
        if (!problem) router.push(`/cadastro?link=${slug}`);
      }}
    >
      <label className="start-field">
        <span className="sr-only">Endereço da sua página na Yello</span>
        <span className="start-prefix" aria-hidden="true">
          {address}
        </span>
        <input
          name="link"
          value={value}
          maxLength={80}
          autoComplete="off"
          spellCheck={false}
          placeholder="seunome"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "start-link-error" : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
          }}
        />
      </label>
      <button className="start-cta" type="submit">
        Experimente grátis <ArrowUpRight />
      </button>
      {error ? (
        <span className="start-error" id="start-link-error" role="alert">
          {error}
        </span>
      ) : (
        slug.length > 2 && (
          <span className="start-hint">
            Seu link será /{slug}. Dá para ajustar depois.
          </span>
        )
      )}
    </form>
  );
}
