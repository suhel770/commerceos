interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContainer({
  children,
  className = "",
}: PageContainerProps) {
  return (
    <main
      className={`
        w-full
        px-6
        py-4
        xl:px-8
        ${className}
      `}
    >
      {children}
    </main>
  );
}