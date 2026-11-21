import { Button } from "./components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
};

export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
}: PaginationProps) {
  if (totalCount === 0) return null;

  const firstResult = (currentPage - 1) * pageSize + 1;
  const lastResult = Math.min(currentPage * pageSize, totalCount);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);
  const goToPage = (page: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(page));
    window.location.href = url.toString();
  };

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-gray-600">
        Showing {firstResult} to {lastResult} of {totalCount} results
      </p>
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label="Previous page"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {pageNumbers.map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
              onClick={() => goToPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            aria-label="Next page"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </nav>
  );
}
