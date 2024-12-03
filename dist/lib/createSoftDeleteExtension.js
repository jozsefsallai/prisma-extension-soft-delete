"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSoftDeleteExtension = void 0;
const client_1 = require("@prisma/client");
const prisma_extension_nested_operations_1 = require("prisma-extension-nested-operations");
const createParams_1 = require("./helpers/createParams");
const modifyResult_1 = require("./helpers/modifyResult");
const dmmf_1 = require("./utils/dmmf");
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
function createSoftDeleteExtension({ models, defaultConfig = {
    field: "deleted",
    createValue: Boolean,
    allowToOneUpdates: false,
    allowCompoundUniqueIndexWhere: false,
}, dmmf, }) {
    if (!!dmmf) {
        (0, dmmf_1.setDmmf)(dmmf);
    }
    if (!defaultConfig.field) {
        throw new Error("prisma-extension-soft-delete: defaultConfig.field is required");
    }
    if (!defaultConfig.createValue) {
        throw new Error("prisma-extension-soft-delete: defaultConfig.createValue is required");
    }
    (0, createParams_1.bootstrapModels)();
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
                delete: createParams_1.createDeleteParams.bind(null, config),
                deleteMany: createParams_1.createDeleteManyParams.bind(null, config),
                update: createParams_1.createUpdateParams.bind(null, config),
                updateMany: createParams_1.createUpdateManyParams.bind(null, config),
                upsert: createParams_1.createUpsertParams.bind(null, config),
                findFirst: createParams_1.createFindFirstParams.bind(null, config),
                findFirstOrThrow: createParams_1.createFindFirstOrThrowParams.bind(null, config),
                findUnique: createParams_1.createFindUniqueParams.bind(null, config),
                findUniqueOrThrow: createParams_1.createFindUniqueOrThrowParams.bind(null, config),
                findMany: createParams_1.createFindManyParams.bind(null, config),
                count: createParams_1.createCountParams.bind(null, config),
                aggregate: createParams_1.createAggregateParams.bind(null, config),
                where: createParams_1.createWhereParams.bind(null, config),
                include: createParams_1.createIncludeParams.bind(null, config),
                select: createParams_1.createSelectParams.bind(null, config),
                groupBy: createParams_1.createGroupByParams.bind(null, config),
            },
        };
    }, {});
    const modifyResultByModel = Object.keys(modelConfig).reduce((acc, model) => {
        const config = modelConfig[model];
        return {
            ...acc,
            [model]: {
                include: modifyResult_1.modifyReadResult.bind(null, config),
                select: modifyResult_1.modifyReadResult.bind(null, config),
            },
        };
    }, {});
    return client_1.Prisma.defineExtension((client) => client.$extends({
        name: "prisma-extension-soft-delete",
        model: (0, dmmf_1.getDmmf)()
            .datamodel.models.map((modelDef) => modelDef.name)
            .reduce(function (modelsAcc, configModelName) {
            const modelName = configModelName[0].toLowerCase() + configModelName.slice(1);
            return {
                ...modelsAcc,
                [modelName]: rootOperations.reduce(function (opsAcc, rootOperation) {
                    return {
                        ...opsAcc,
                        [rootOperation]: function (args) {
                            const $allOperations = (0, prisma_extension_nested_operations_1.withNestedOperations)({
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
exports.createSoftDeleteExtension = createSoftDeleteExtension;
