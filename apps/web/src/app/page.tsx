import { UploadForm } from "@/components/UploadForm";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-neutral-900">
        Пойми любой договор за 30&nbsp;секунд
      </h1>
      <p className="mt-4 text-lg text-neutral-600">
        Загрузите PDF, DOCX или TXT — получите отчёт с рисками и объяснениями
        простым языком. Без юриста. Без юридического образования.
      </p>

      <div className="mt-10">
        <UploadForm />
      </div>

      <ul className="mt-12 grid gap-4 text-sm text-neutral-600 sm:grid-cols-3">
        <li className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="font-medium text-neutral-900">Любой формат</div>
          PDF, DOCX, TXT и сканы (до 10&nbsp;МБ).
        </li>
        <li className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="font-medium text-neutral-900">Скор риска 0–100</div>
          Видите главное за один взгляд.
        </li>
        <li className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="font-medium text-neutral-900">Объяснения простым языком</div>
          Без латыни и сносок на статьи.
        </li>
      </ul>
    </div>
  );
}
