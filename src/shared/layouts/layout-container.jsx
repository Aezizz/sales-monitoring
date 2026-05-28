export function LayoutContainer({ children }) {
  return (
    <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
      {children}
    </main>
  );
}
