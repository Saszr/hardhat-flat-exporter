import { task, extendConfig, subtask, types } from "hardhat/config";
import { getAllFilesMatchingSync } from "hardhat/internal/util/fs-utils";
import { DependencyGraph } from "hardhat/internal/solidity/dependencyGraph";
import { HardhatError } from "hardhat/internal/core/errors";
import {
  ResolvedFile,
  ResolvedFilesMap,
} from "hardhat/internal/solidity/resolver";
import { getPackageJson } from "hardhat/internal/util/packageInfo";
import { ERRORS } from "hardhat/internal/core/errors-list";
import { TASK_FLATTEN_GET_DEPENDENCY_GRAPH } from "hardhat/builtin-tasks/task-names";
import fs from "fs";
import path from "path";
import tsort from "tsort";
import { rimraf } from "rimraf";

function getSortedFiles(dependenciesGraph: DependencyGraph) {
  const graph = tsort();

  // sort the graph entries to make the results deterministic
  const dependencies = dependenciesGraph
    .entries()
    .sort(([a], [b]) => a.sourceName.localeCompare(b.sourceName));

  const filesMap: ResolvedFilesMap = {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resolvedFiles = dependencies.map(([file, _deps]) => file);

  resolvedFiles.forEach((f) => (filesMap[f.sourceName] = f));

  for (const [from, deps] of dependencies) {
    // sort the dependencies to make the results deterministic
    const sortedDeps = [...deps].sort((a, b) =>
      a.sourceName.localeCompare(b.sourceName)
    );

    for (const to of sortedDeps) {
      graph.add(to.sourceName, from.sourceName);
    }
  }

  try {
    const topologicalSortedNames: string[] = graph.sort();

    // If an entry has no dependency it won't be included in the graph, so we
    // add them and then dedup the array
    const withEntries = topologicalSortedNames.concat(
      resolvedFiles.map((f) => f.sourceName)
    );

    const sortedNames = [...new Set(withEntries)];
    return sortedNames.map((n) => filesMap[n]);
  } catch (error) {
    if (error instanceof Error) {
      if (error.toString().includes("Error: There is a cycle in the graph.")) {
        throw new HardhatError(ERRORS.BUILTIN_TASKS.FLATTEN_CYCLE, {}, error);
      }
    }

    throw error;
  }
}

function getFileWithoutImports(resolvedFile: ResolvedFile) {
  const IMPORT_SOLIDITY_REGEX = /^\s*import(\s+)[\s\S]*?;\s*$/gm;

  return resolvedFile.content.rawContent
    .replace(IMPORT_SOLIDITY_REGEX, "")
    .trim();
}

subtask("flatten-single-file")
  .addOptionalParam("files", undefined, undefined, types.any)
  .setAction(async ({ files }: { files: string[] }, { run }) => {
    const dependencyGraph: DependencyGraph = await run(
      TASK_FLATTEN_GET_DEPENDENCY_GRAPH,
      { files: files }
    );

    const sortedFiles = getSortedFiles(dependencyGraph);

    let flattened = "";

    if (dependencyGraph.getResolvedFiles().length === 0) {
      return flattened;
    }

    const packageJson = await getPackageJson();
    flattened += `// Sources flattened with hardhat v${packageJson.version} https://hardhat.org`;

    for (const file of sortedFiles) {
      flattened += `\n\n// File ${file.getVersionedName()}\n`;
      flattened += `\n${getFileWithoutImports(file)}\n`;
    }
    return flattened.trim();
  });

subtask("export-flat-group")
  .addParam(
    "flatGroupConfig",
    "a single flat-exporter config object",
    undefined,
    types.any
  )
  .setAction(async function (args, hre) {
    const { flatGroupConfig: config } = args;

    const inputDirectory = path.resolve(hre.config.paths.root, config.src);
    const outputDirectory = path.resolve(hre.config.paths.root, config.path);

    if (
      outputDirectory === hre.config.paths.root ||
      inputDirectory === hre.config.paths.root
    ) {
      throw new Error("resolved path must not be root directory");
    }

    const inputFilePaths = getAllFilesMatchingSync(inputDirectory);
    const outputFilePaths = inputFilePaths.map((path) =>
      path.replace(inputDirectory, outputDirectory)
    );

    if (config.clear) {
      await rimraf(outputDirectory);
    }

    for (const [i, file] of inputFilePaths.entries()) {
      const flattenFile = await hre.run("flatten-single-file", {
        files: [file],
      });
      const filePath = `${outputFilePaths[i]}`;
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, `${flattenFile}`, { flag: "w" });
    }
  });

task("export-flat", "Export flat sol").setAction(async (_args, hre) => {
  const configs = hre.config.flattenExporter;

  await Promise.all(
    configs.map((flatGroupConfig) => {
      return hre.run("export-flat-group", { flatGroupConfig });
    })
  );
});

const DEFAULT_CONFIG = {
  src: "./contracts",
  path: "./flat",
  clear: true,
};

extendConfig(function (config, userConfig) {
  config.flattenExporter = [userConfig.flattenExporter]
    .flat()
    .map(function (el) {
      const conf = Object.assign({}, DEFAULT_CONFIG, el);

      return conf;
    });
});
