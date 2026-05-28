import { LayoutLoading } from "@/shared/layouts/layout-loading.jsx";

export function PageShell({
  actions,
  children,
  description,
  eyebrow,
  isLoading = false,
  title
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-sm font-medium text-primary">{eyebrow}</p>
          ) : null}
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>

      {isLoading ? <LayoutLoading /> : children}
    </section>
  );
}
