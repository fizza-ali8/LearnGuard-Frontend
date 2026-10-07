"use client";

import { Accordion, PageHeader, SearchBox } from "@/components/ui/display";
import { HELP_CATEGORIES } from "@/lib/constants";
import { helpArticles } from "@/data/help";
import { useMemo, useState } from "react";

export function HelpView() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const articles = useMemo(() => {
    const term = query.trim().toLowerCase();
    return helpArticles.filter((article) => {
      const matchesCategory = category === "All" || article.category === category;
      const matchesTerm = !term || `${article.question} ${article.answer} ${article.category}`.toLowerCase().includes(term);
      return matchesCategory && matchesTerm;
    });
  }, [category, query]);

  return (
    <div>
      <PageHeader title="Help & Guidance" subtitle="Short answers for running a screening and reading a result." />
      <div className="mb-4 max-w-xl">
        <SearchBox value={query} onChange={setQuery} placeholder="How can we help?" />
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {["All", ...HELP_CATEGORIES].map((item) => (
          <button key={item} type="button" onClick={() => setCategory(item)} className={`h-9 rounded-full px-3 text-[13px] ${category === item ? "bg-primary-soft text-primary-dark" : "bg-surface text-body border border-line"}`}>
            {item}
          </button>
        ))}
      </div>
      {articles.length ? (
        <Accordion items={articles.map((article) => ({ id: article.id, title: article.question, content: <p>{article.answer}</p> }))} />
      ) : (
        <p className="text-sm text-muted">No guidance matches that search. Try “risk”, “consent” or “SHAP”.</p>
      )}
    </div>
  );
}
