import { NextRequest, NextResponse } from "next/server";

/**
 * Прокси-роут для PDF-отчёта. Зачем нужен:
 *  - прямой fetch браузером на /api/documents/:id/report.pdf при отсутствии
 *    доступа возвращает голый JSON {error: Forbidden}, что выглядит как баг.
 *  - этот роут на сервере дёргает API с cookie текущего пользователя и:
 *      → 200 + application/pdf → отдаём как есть
 *      → 403/404 → редиректим на страницу документа (она покажет
 *        нормальную ошибку через ReportPage)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:3001";
  const cookie = req.headers.get("cookie") ?? "";

  const res = await fetch(
    `${apiOrigin}/api/documents/${params.id}/report.pdf`,
    { headers: { cookie }, cache: "no-store" },
  );

  if (!res.ok) {
    // Редиректим на страницу документа: там пользователю покажется
    // понятная ошибка (Forbidden / Not Found) вместо JSON.
    const origin = req.nextUrl.origin;
    return NextResponse.redirect(
      `${origin}/documents/${params.id}?pdf_error=${res.status}`,
      302,
    );
  }

  const buf = await res.arrayBuffer();
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        res.headers.get("content-disposition") ??
        `attachment; filename="contractlens-${params.id.slice(0, 8)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
