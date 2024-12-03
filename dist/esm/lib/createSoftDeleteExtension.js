import { Prisma } from "@prisma/client";
import { withNestedOperations, } from "prisma-extension-nested-operations";
import { createAggregateParams, createCountParams, createDeleteManyParams, createDeleteParams, createFindFirstParams, createFindFirstOrThrowParams, createFindManyParams, createFindUniqueParams, createFindUniqueOrThrowParams, createIncludeParams, createSelectParams, createUpdateManyParams, createUpdateParams, createUpsertParams, createWhereParams, createGroupByParams, bootstrapModels, } from "./helpers/createParams";
import { modifyReadResult } from "./helpers/modifyResult";
import { getDmmf, setDmmf } from "./utils/dmmf";
const rootOperations = [
    "delete",
    "deleteMany",
    "update",
    "updateMany",
    "upsert",
    "findFirst",
    "findFirstOrThrow",
    "findUnique",
    "findUniqueOrThrow",
    "findMany",
    "count",
    "aggregate",
    "groupBy",
];
export function createSoftDeleteExtension({ models, defaultConfig = {
    field: "deleted",
    createValue: Boolean,
    allowToOneUpdates: false,
    allowCompoundUniqueIndexWhere: false,
}, dmmf, }) {
    if (!!dmmf) {
        setDmmf(dmmf);
    }
    if (!defaultConfig.field) {
        throw new Error("prisma-extension-soft-delete: defaultConfig.field is required");
    }
    if (!defaultConfig.createValue) {
        throw new Error("prisma-extension-soft-delete: defaultConfig.createValue is required");
    }
    bootstrapModels();
    const modelNames = Object.keys(models);
    const modelConfig = {};
    modelNames.forEach((modelName) => {
        const config = models[modelName];
        if (config) {
            modelConfig[modelName] =
                typeof config === "boolean" && config ? defaultConfig : config;
        }
    });
    const createParamsByModel = Object.keys(modelConfig).reduce((acc, model) => {
        const config = modelConfig[model];
        return {
            ...acc,
            [model]: {
                delete: createDeleteParams.bind(null, config),
                deleteMany: createDeleteManyParams.bind(null, config),
                update: createUpdateParams.bind(null, config),
                updateMany: createUpdateManyParams.bind(null, config),
                upsert: createUpsertParams.bind(null, config),
                findFirst: createFindFirstParams.bind(null, config),
                findFirstOrThrow: createFindFirstOrThrowParams.bind(null, config),
                findUnique: createFindUniqueParams.bind(null, config),
                findUniqueOrThrow: createFindUniqueOrThrowParams.bind(null, config),
                findMany: createFindManyParams.bind(null, config),
                count: createCountParams.bind(null, config),
                aggregate: createAggregateParams.bind(null, config),
                where: createWhereParams.bind(null, config),
                include: createIncludeParams.bind(null, config),
                select: createSelectParams.bind(null, config),
                groupBy: createGroupByParams.bind(null, config),
            },
        };
    }, {});
    const modifyResultByModel = Object.keys(modelConfig).reduce((acc, model) => {
        const config = modelConfig[model];
        return {
            ...acc,
            [model]: {
                include: modifyReadResult.bind(null, config),
                select: modifyReadResult.bind(null, config),
            },
        };
    }, {});
    return Prisma.defineExtension((client) => client.$extends({
        name: "prisma-extension-soft-delete",
        model: getDmmf()
            .datamodel.models.map((modelDef) => modelDef.name)
            .reduce(function (modelsAcc, configModelName) {
            const modelName = configModelName[0].toLowerCase() + configModelName.slice(1);
            return {
                ...modelsAcc,
                [modelName]: rootOperations.reduce(function (opsAcc, rootOperation) {
                    return {
                        ...opsAcc,
                        [rootOperation]: function (args) {
                            const $allOperations = withNestedOperations({
                                async $rootOperation(initialParams) {
                                    var _a, _b;
                                    const createParams = (_a = createParamsByModel[initialParams.model]) === null || _a === void 0 ? void 0 : _a[initialParams.operation];
                                    if (!createParams)
                                        return initialParams.query(initialParams.args);
                                    const { params, ctx } = createParams(initialParams);
                                    // @ts-expect-error - we don't know what the client is
                                    const result = await client[modelName][params.operation](params.args);
                                    const modifyResult = (_b = modifyResultByModel[params.model]) === null || _b === void 0 ? void 0 : _b[params.operation];
                                    if (!modifyResult)
                                        return result;
                                    return modifyResult(result, params, ctx);
                                },
                                async $allNestedOperations(initialParams) {
                                    var _a, _b;
                                    const createParams = (_a = createParamsByModel[initialParams.model]) === null || _a === void 0 ? void 0 : _a[initialParams.operation];
                                    if (!createParams)
                                        return initialParams.query(initialParams.args);
                                    const { params, ctx } = createParams(initialParams);
                                    const result = await params.query(params.args, params.operation);
                                    const modifyResult = (_b = modifyResultByModel[params.model]) === null || _b === void 0 ? void 0 : _b[params.operation];
                                    if (!modifyResult)
                                        return result;
                                    return modifyResult(result, params, ctx);
                                },
                            });
                            return $allOperations({
                                model: configModelName,
                                operation: rootOperation,
                                // @ts-expect-error - we don't know what the client is
                                query: client[modelName][rootOperation],
                                args,
                            });
                        },
                    };
                }, {}),
            };
        }, {}),
    }));
}
