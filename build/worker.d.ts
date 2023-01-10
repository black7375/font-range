export interface SubsetI {
    options: string[];
    log?: string;
}
export default function subset({ options, log }: SubsetI): import("@esm2cjs/execa").ExecaSyncReturnValue<string>;
