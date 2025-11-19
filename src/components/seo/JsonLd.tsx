// JSON-LD Structured Data Component

interface JsonLdProps {
  data: object | object[];
}

export function JsonLd({ data }: JsonLdProps) {
  const jsonLd = Array.isArray(data) ? data : [data];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item),
          }}
        />
      ))}
    </>
  );
}

// Convenience component for multiple schemas
export function MultipleJsonLd({ schemas }: { schemas: object[] }) {
  return <JsonLd data={schemas} />;
}
