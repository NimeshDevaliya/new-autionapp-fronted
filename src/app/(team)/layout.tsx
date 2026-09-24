/** Team-owner app: phone-first, one column, no admin chrome. */
export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4 sm:px-6">{children}</main>
    </div>
  );
}
