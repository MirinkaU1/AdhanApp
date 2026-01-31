declare module "lucide-react-native" {
  import { ComponentType } from "react";

  export type LucideProps = {
    color?: string;
    size?: number;
    strokeWidth?: number;
  };

  export const Check: ComponentType<LucideProps>;
  export const BookOpen: ComponentType<LucideProps>;
  export const Share2: ComponentType<LucideProps>;
  export const RefreshCw: ComponentType<LucideProps>;
  export const X: ComponentType<LucideProps>;
  export const ChevronLeft: ComponentType<LucideProps>;
}
