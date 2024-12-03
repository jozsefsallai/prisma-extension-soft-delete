import { Config } from "./types";
export declare function createSoftDeleteExtension({ models, defaultConfig, dmmf, }: Config): (client: any) => {
    $extends: {
        extArgs: {
            result: {};
            model: {};
            query: {};
            client: {};
        };
    };
};
