import { Lock } from "lucide-react";

interface LockedSectionProps {
  title: string;
  previewItems?: string[];
  children?: React.ReactNode;
  isEN?: boolean;
}

const LockedSection = ({ title, previewItems, children, isEN = false }: LockedSectionProps) => {
  return (
    <div className="relative rounded-lg border border-border bg-card p-6 overflow-hidden">
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-background/30 z-10 flex flex-col items-center justify-center">
        <Lock className="w-8 h-8 text-[#C9A961] mb-3" />
        <p className="text-sm font-semibold text-card-foreground mb-2">{isEN ? 'Unlock to see:' : 'Desbloqueia para ver:'}</p>
        {previewItems && (
          <ul className="text-sm text-muted-foreground space-y-1">
            {previewItems.map((item, i) => (
              <li key={i}>→ {item}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Content (blurred in background) */}
      <div className="opacity-40">
        <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-[#C9A961]" />
          {title}
        </h3>
        {children || (
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LockedSection;
