import React, { useEffect } from 'react';
import { Button, Fieldset, FormLayout, Message, useAjax, useCommandHandler, WrappedFormUtils } from 'didgah/ant-core-component';
import { ErrorType } from '../../../Models/Chargoon.Didgah.Bureau.Deals.Contracts.Domain.Enumeration.ErrorType';
import { setInitialData, setSpin } from './Reducer/actionMethod';
import { ErrorModalHandler, Language, handleErrors } from '../../../Utility/helper';
import { Mode, reducer, StateModel } from './Reducer/reducer';
import { transportLayer } from './transportLayer';
import DataEntry from './dataEntry';
import TreeManager from './tree';
import TableManager from './table';

interface Props {
    guid: string;
}

export default function DefineManager({ guid }: Props) {
    const initState: StateModel = {
        selectedItem: null,
        initialData: null,
        items: [],
        spin: true,
        mode: guid ? Mode.Edit : Mode.Add,
        changedItemsKeys: [],
        accountCodePatternCount: 0,
        exceptionStructure: [],
        copiedItem: null,
        copiedItemsKeys: [],
        handleGetArticles: () => null,
        handleSetArticles: () => null,
        handleAddArticles: () => null,
        validateTable: () => null,
    };

    const [state, dispatch] = React.useReducer(reducer, initState);
    const server = React.useRef(transportLayer(useAjax())).current;
    const commandHandler = useCommandHandler();
    const mainInfoForm = React.useRef<WrappedFormUtils>(null);
    const [loading, setLoading] = React.useState<boolean>(false);

    useEffect(() => {
        server.getInitial(guid ?? null)
            .then((res) => {
                dispatch(setInitialData(res));
                if (guid) {
                    server.loadApi(guid)
                        .then((response) => {
                            const { DepartmentID, FinancialActivityTypeGuid, FiscalYearDetailGuid, ...result } = response;
                            mainInfoForm.current?.setFieldsValue(result);

                        })
                        .fail((error: ErrorType) => {
                            dispatch(setSpin(false));
                            handleErrors(error);
                        })
                }
            })
            .fail((err: any) => handleErrors(err));
    }, []);

    function validateBeforeSubmit() {
        mainInfoForm.current?.validateFields((errors, values) => {
            if (errors) {
                return;
            }

            const tableValidation = state.validateTable?.();
            if (!tableValidation) {
                handleSubmit(values);
                return;
            }

            tableValidation
                .then((res: boolean) => {
                    if (res) {
                        handleSubmit(values);
                    }
                })
                .catch((err: any) => handleErrors(err));
        });
    }

    function handleSubmit(valuesFromForm?: any): void {
        let values = valuesFromForm ?? mainInfoForm.current?.getFieldsValue?.();
        if (!values) return;

        values = {
            ...values,
            DepartmentID: state.initialData?.Department.key,
            FinancialActivityGuid: state.initialData?.FinancialActivityType?.Guid,
            FiscalYearGuid: state.initialData?.FiscalYears?.Guid
        };

        const normalizeAccountCodePattern = (pattern: any) => {
            if (Array.isArray(pattern) && pattern.length > 0) {
                return pattern[0];
            }
            return pattern;
        };

        const normalizedItems = (state.items ?? []).map(item => ({
            ...item,
            VoucherTemplateArticles: item.VoucherTemplateArticles?.map(article => {
                const { AccountCodePattern, ArticleExceptionsList, ...rest } = article;

                const normalizedPattern = normalizeAccountCodePattern(AccountCodePattern);
                const normalizedExceptions = ArticleExceptionsList?.map(exception => {
                    const { AccountCodePattern: exceptionPattern, ...exceptionRest } = exception;
                    return {
                        ...exceptionRest,
                        AccountCodePattern: normalizeAccountCodePattern(exceptionPattern)
                    };
                }) ?? [];

                return {
                    ...rest,
                    AccountCodePattern: normalizedPattern,
                    ArticleExceptionsList: normalizedExceptions.length > 0 ? normalizedExceptions : undefined,
                    VoucherArticleTemplateGuid: article.VoucherArticleTemplateGuid || article.Guid,
                    IsCopy: article.IsCopy || false
                };
            }) ?? [],
            VoucherTempleteOverrideStructures: item.VoucherTempleteOverrideStructures ?? []
        }));

        if (state.selectedItem) {
            const isInChangedItems = state.changedItemsKeys?.includes(state.selectedItem.Id);
            const isInCopiedItems = state.copiedItemsKeys?.includes(state.selectedItem.Id);

            if (isInChangedItems || isInCopiedItems) {
                const existingIndex = normalizedItems.findIndex(
                    item => item.ActionGuid === state.selectedItem.Id
                );

                const currentArticles = state.handleGetArticles() ?? [];
                const preparedArticles = currentArticles.map(article => {
                    const { AccountCodePattern, ArticleExceptionsList, ...rest } = article;

                    const normalizedPattern = normalizeAccountCodePattern(AccountCodePattern);
                    const normalizedExceptions = ArticleExceptionsList?.map(exception => {
                        const { AccountCodePattern: exceptionPattern, ...exceptionRest } = exception;
                        return {
                            ...exceptionRest,
                            AccountCodePattern: normalizeAccountCodePattern(exceptionPattern)
                        };
                    }) ?? [];

                    return {
                        ...rest,
                        AccountCodePattern: normalizedPattern,
                        ArticleExceptionsList: normalizedExceptions.length > 0 ? normalizedExceptions : undefined,
                        VoucherArticleTemplateGuid: article.VoucherArticleTemplateGuid || article.Guid,
                        IsCopy: article.IsCopy || false
                    };
                });

                const itemToSave = {
                    ActionGuid: state.selectedItem.Id,
                    VoucherTemplateArticles: preparedArticles,
                    VoucherTempleteOverrideStructures: state.exceptionStructure ?? [],
                };

                if (existingIndex >= 0) {
                    normalizedItems[existingIndex] = itemToSave;
                } else {
                    normalizedItems.push(itemToSave);
                }
            }
        }

        const model = {
            ...values,
            VoucherTemplateNodes: normalizedItems,
        };


        const saveCall = server.submitApi(model);
        if (!saveCall) {
            setLoading(false);
            return;
        }

        saveCall
            .then((res: any) => {
                if (!res.ShowError) {
                    Message.success(Language("RegistrationWasSuccessful"));
                    commandHandler.closeWindow(true);
                } else {
                    ErrorModalHandler(res.Errors);
                }
            })
            .fail((error: any) => handleErrors(error))
            .finally(() => setLoading(false));
    }



    return (

        <FormLayout>
            <FormLayout.LayoutContent>
                <DataEntry
                    getDefinForm={(form: WrappedFormUtils) => mainInfoForm.current = form}
                    state={state}
                    dispatch={dispatch}
                />
                <FormLayout className='voucher-template-items'>
                    <FormLayout.LayoutSide size={300} open hideTitle>
                        <TreeManager
                            dispatch={dispatch}
                            guid={guid}
                            state={state}
                        />
                    </FormLayout.LayoutSide>
                    <FormLayout.LayoutContent>
                        <Fieldset heightRatio={1}>
                            {(state.initialData &&
                                <TableManager
                                    mainInfoForm={mainInfoForm.current}
                                    state={state}
                                    dispatch={dispatch}
                                />)}
                        </Fieldset>
                    </FormLayout.LayoutContent>
                </FormLayout>
            </FormLayout.LayoutContent>
            <FormLayout.ActionBar>
                <Button
                    type='primary'
                    loading={loading}
                    onClick={validateBeforeSubmit}>{Language('Save')}</Button>
            </FormLayout.ActionBar>
        </FormLayout>
    );
}


