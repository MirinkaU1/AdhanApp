declare module "lucide-react-native" {
  import { ComponentType } from "react";

  export type LucideProps = {
    color?: string;
    size?: number;
    strokeWidth?: number;
  };

  export const Check: ComponentType<LucideProps>;
}
