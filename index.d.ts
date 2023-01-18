import "hardhat/types/config";

interface FlattenExporterUserConfig {
  src?: string;
  path?: string;
  clear?: boolean;
}

declare module "hardhat/types/config" {
  interface HardhatUserConfig {
    flattenExporter?: FlattenExporterUserConfig | FlattenExporterUserConfig[];
  }

  interface HardhatConfig {
    flattenExporter: {
      src: string;
      path: string;
      clear: boolean;
    }[];
  }
}
