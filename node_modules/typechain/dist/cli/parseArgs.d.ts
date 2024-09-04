export interface ParsedArgs {
    files: string[];
    target: string;
    outDir?: string | undefined;
    flags: {
        alwaysGenerateOverloads: boolean;
        tsNocheck: boolean;
    };
}
export declare function parseArgs(): ParsedArgs;
