import React from 'react';
import { ActionModel, Mode, StateModel } from './Reducer/reducer';
import { getApiUrl, handleErrors, Language, NewGuid } from '../../../Utility/helper';
import { transportLayer } from './transportLayer';
import { VoucherTreeMetadataViewModel } from '../../../Models/Chargoon.Didgah.Bureau.Contracts.UI5.Models.FinancialAccounting.Voucher.VoucherTreeMetadataViewModel';
import { VoucherGetViewModel } from '../../../Models/Chargoon.Didgah.Bureau.Contracts.UI5.Models.Voucher.VoucherGetViewModel';
import { Modal, useAjax } from 'didgah/ant-core-component';
import TreeEx from '@didgah-components/ant-tree-ex';
import { DidgahTreeNode, DidgahTreeNodeEvent, TreeStoreConfiguration, TreeExContextMenuItem, TreeStore } from '@didgah-components/ant-tree-ex/utils';
import { setChangedItemsKeys, setCopiedItem, setCopiedItemsKeys, setExceptionStructure, setItem, setSelectedItem, setSpin, setState } from './Reducer/actionMethod';

interface Props {
    guid: string;
    state: StateModel;
    dispatch: React.Dispatch<ActionModel>;
}

export default function TreeManager({ guid, state, dispatch }: Props) {
    const server = React.useRef(transportLayer(useAjax())).current;
    const [showTree, setShowTree] = React.useState<boolean>(false);
    const treeStore = React.useRef<TreeStore>(null);

    React.useEffect(() => {
        server.getRootId()
            .then(setupTree)
            .fail(handleErrors);
    }, []);

    function setupTree(rootNodeId: Guid) {
        if (rootNodeId) {

            const treeConfiguration: TreeStoreConfiguration = {
                url: getApiUrl('VoucherTemplate', 'VoucherTemplateGetChild', 'Configuration'),
                treeMetadata: {
                } as VoucherTreeMetadataViewModel,
                nodes: [
                    {
                        Text: Language('Items'),
                        ParentId: null,
                        Id: rootNodeId,
                        Metadata: { RecordGuid: guid },
                        Hierarchy: [rootNodeId],
                        Children: [],
                        DisableSelect: true,
                        DisableCheckbox: false,
                        Disabled: false,
                        IsLeaf: false,
                    },
                ],
            };
            treeStore.current = new TreeStore(treeConfiguration);
            setShowTree(true);


        }
    }


    function handleSelect(selectedKey: string, e: DidgahTreeNodeEvent, node) {
        if (node.Id === state.selectedItem?.Id) return;

        state.validateTable()
            .then((res: boolean) => {
                if (res) {
                    const oldItem = state.selectedItem;
                    const oldItemArticles = state.handleGetArticles()?.map(article => ({
                        ...article,
                        IsCopy: article.IsCopy || false,
                    }));
                    const oldItemExceptionStructure = state.exceptionStructure;

                    if (oldItem && (state.changedItemsKeys?.includes(oldItem?.Id) ||
                        state.copiedItemsKeys?.includes(oldItem?.Id))) {

                        const articlesToSave = oldItemArticles.filter(article => {
                            // But exclude articles that were copied from other nodes
                            return !article.IsCopy || state.copiedItemsKeys?.includes(oldItem?.Id);
                        }).map(article => ({
                            ...article,
                            VoucherArticleTemplateGuid: article.VoucherArticleTemplateGuid || article.Guid,
                            ArticleExceptionsList: article.ArticleExceptionsList ?? [],
                            IsCopy: article.IsCopy || false
                        }));

                        dispatch(
                            setItem({
                                ActionGuid: oldItem?.Id,
                                VoucherTemplateArticles: articlesToSave,
                                VoucherTempleteOverrideStructures: oldItemExceptionStructure,
                            }),
                        );
                    }
                    if (node.IsLeaf) {
                        dispatch(setSelectedItem(node));

                        const savedItem = getSelectedItemFromSavedItems(node);

                        if (savedItem) {
                            state.handleSetArticles(savedItem?.VoucherTemplateArticles);
                            dispatch(setExceptionStructure(savedItem?.VoucherTempleteOverrideStructures));
                        } else if (state.mode === Mode.Edit) {
                            fetchVoucherTemplateArticles(node.Id);
                        } else {
                            state.handleSetArticles([]);
                            dispatch(setExceptionStructure([]));
                        }
                    } else {
                        state.handleSetArticles([]);
                        dispatch(setState({
                            selectedItem: null,
                            exceptionStructure: [],
                        }));
                    }
                } else {
                    treeStore.current.setSelectedKey(state.selectedItem?.Id);
                }
            });
    }


    function getSelectedItemFromSavedItems(node) {
        return state.items?.find(item => item.ActionGuid === node?.Id);
    }

    function fetchVoucherTemplateArticles(actionGuid: string) {
        const model: VoucherGetViewModel = {
            ReferenceGuid: actionGuid,
            VoucherTemplateGuid: guid,
        };

        dispatch(setSpin(true));
        server.getVoucherTemplateArticlesApi(model)
            .then((res) => {
                const mappedArticles = res?.VoucherTemplateArticles?.map(article => ({
                    ...article,
                    VoucherArticleTemplateGuid: article.VoucherArticleTemplateGuid || article.Guid,
                    AccountCodePattern: article.AccountCodePattern
                        ? [{
                            id: article.AccountCodePattern.id,
                            title: article.AccountCodePattern.title,
                            metadata: { Title: article.AccountCodePattern.Title }
                        }]
                        : [],
                })) ?? [];

                state.handleSetArticles(mappedArticles);
                dispatch(setExceptionStructure(res?.VoucherTempleteOverrideStructures ?? []));
            })
            .fail(handleErrors)
            .finally(() => dispatch(setSpin(false)));
    }


    function handleDoubleClick(selectedKey: string, e: DidgahTreeNodeEvent, node) {
        if (!node.IsLeaf) {
            treeStore.current.expand(selectedKey);
        }
    }



    function getContextMenuItems(options: DidgahTreeNode) {
        // Check if the node is a leaf using available properties
        const isLeaf = options.props?.isLeaf || options.props?.node?.IsLeaf || false;

        return [
            isLeaf && (
                <TreeExContextMenuItem
                    onClick={() => handleCopy(options.id)}
                    key='copy'
                    itemKey='copy'
                    text={Language('Copy')}
                    iconType='copy' />
            ),
            isLeaf && state.copiedItem && state.copiedItem?.ActionGuid !== options.id && (
                <TreeExContextMenuItem
                    onClick={() => validateTableBeforePaste(options.id)}
                    key='paste'
                    itemKey='paste'
                    text={Language('Paste')}
                    iconType='paste' />
            ),
        ].filter(Boolean);
    }



    function handleCopy(actionGuid: string) {
        state.validateTable()
            .then((res: boolean) => {
                if (res) {
                    const model: VoucherGetViewModel = {
                        ReferenceGuid: actionGuid,
                        VoucherTemplateGuid: guid,
                    };

                    dispatch(setSpin(true));

                    server.getVoucherTemplateArticlesApi(model)
                        .then(async (response) => {
                            // Only get articles from API - these are the original articles
                            let finalArticles = [];

                            if (response?.VoucherTemplateArticles?.length > 0) {
                                const apiArticles = response.VoucherTemplateArticles.map(article => ({
                                    ...article,
                                    VoucherArticleTemplateGuid: article.VoucherArticleTemplateGuid || article.Guid,
                                    AccountCodePattern: article.AccountCodePattern
                                        ? [{
                                            id: article.AccountCodePattern.id,
                                            title: article.AccountCodePattern.title,
                                            metadata: { Title: article.AccountCodePattern.Title }
                                        }]
                                        : [],
                                    ArticleExceptionsList: []
                                }));

                                const articleGuids = apiArticles.map(article => ({
                                    Guid: article.Guid,
                                    Title: article.Title || ''
                                }));

                                try {
                                    const allExceptions = await server.getVoucherTemplateNodeExeptionOnCopied(articleGuids);

                                    apiArticles.forEach((article) => {
                                        const articleExceptions = allExceptions?.filter(
                                            exception => exception.ParentGuid === article.Guid
                                        ) ?? [];

                                        const mappedExceptions = articleExceptions.map(exception => ({
                                            ...exception,
                                            AccountCodePattern: exception.AccountCodePattern
                                                ? [{
                                                    id: exception.AccountCodePattern.id,
                                                    title: exception.AccountCodePattern.title,
                                                    metadata: { Title: exception.AccountCodePattern.Title }
                                                }]
                                                : [],
                                        }));

                                        article.ArticleExceptionsList = mappedExceptions;
                                    });

                                } catch (error) {
                                    apiArticles.forEach(article => {
                                        article.ArticleExceptionsList = [];
                                    });
                                }

                                finalArticles = [...apiArticles];
                            }

                            const copiedItem = {
                                IsCopy: true,
                                ActionGuid: actionGuid,
                                VoucherArticleTemplates: finalArticles,
                                VoucherTempleteOverrideStructures: response?.VoucherTempleteOverrideStructures ?? [],
                            };

                            dispatch(setCopiedItem(copiedItem));
                        })
                        .catch((error) => {
                            handleCopyFromState(actionGuid);
                        })
                        .finally(() => {
                            dispatch(setSpin(false));
                        });
                } else {
                    dispatch(setCopiedItem(null));
                    Modal.error({
                        title: Language("Error"),
                        content: Language('NecessaryItemsForArticlesAreRequired')
                    });
                }
            });
    }


    function handleCopyFromState(actionGuid: string) {
        const savedItem = state.items?.find(item => item.ActionGuid === actionGuid);

        if (savedItem) {
            // Get original articles only (exclude copied ones)
            const originalArticles = savedItem.VoucherTemplateArticles
                ?.filter(article => !article.IsCopy)
                ?.map(article => ({
                    ...article,
                    VoucherArticleTemplateGuid: article.VoucherArticleTemplateGuid || article.Guid,
                    ArticleExceptionsList: article.ArticleExceptionsList ?? []
                })) ?? [];

            const copiedItem = {
                IsCopy: true,
                ActionGuid: actionGuid,
                VoucherArticleTemplates: originalArticles,
                VoucherTempleteOverrideStructures: savedItem.VoucherTempleteOverrideStructures ?? [],
            };

            dispatch(setCopiedItem(copiedItem));
        } else {
            // Only use handleGetArticles if the node being copied is the currently selected node
            // AND it's not in the copiedItemsKeys (meaning it hasn't received pasted articles)
            if (state.selectedItem?.Id === actionGuid && !state.copiedItemsKeys?.includes(actionGuid)) {
                const currentArticles = state.handleGetArticles();
                const originalArticles = currentArticles
                    .filter(article => !article.IsCopy)
                    .map(article => ({
                        ...article,
                        VoucherArticleTemplateGuid: article.VoucherArticleTemplateGuid || article.Guid,
                        ArticleExceptionsList: article.ArticleExceptionsList ?? []
                    }));

                const copiedItem = {
                    IsCopy: true,
                    ActionGuid: actionGuid,
                    VoucherArticleTemplates: originalArticles,
                    VoucherTempleteOverrideStructures: state.exceptionStructure ?? [],
                };

                dispatch(setCopiedItem(copiedItem));
            } else {
                Modal.warning({
                    title: Language("Warning"),
                    content: Language('NoDataAvailableToCopy')
                });
            }
        }
    }

    function handleRightClick(options: DidgahTreeNode) {
        // Select the node being right-clicked to ensure proper context
        // The context menu generation now uses options.props directly, so it will show immediately
        handleSelect(null, null, options.props?.['node']);
    }

    function validateTableBeforePaste(actionGuid: string) {
        if (actionGuid === state.copiedItem?.ActionGuid) {
            return;
        } else if (actionGuid === state.selectedItem?.Id) {
            validateExceptionStructureBeforePaste(actionGuid);
            return;
        }

        state.validateTable()
            .then((isValid: boolean) => {
                if (isValid) {
                    validateExceptionStructureBeforePaste(actionGuid);
                } else {
                    Modal.error({
                        title: Language("Error"),
                        content: Language('NecessaryItemsForArticlesAreRequired')
                    })
                }
            });
    }

    function validateExceptionStructureBeforePaste(destinationNodeId: string) {

        const sourceHasExceptions = state?.copiedItem?.VoucherTempleteOverrideStructures?.length > 0;
        const destinationHasExceptions = state.exceptionStructure?.length > 0;



        if (!sourceHasExceptions && !destinationHasExceptions) {
            handlePaste(false, destinationNodeId);
            return;
        }

        if (sourceHasExceptions && !destinationHasExceptions) {
            handlePaste(false, destinationNodeId);
            return;
        }

        if (!sourceHasExceptions && destinationHasExceptions) {
            handlePaste(false, destinationNodeId);
            return;
        }

        if (sourceHasExceptions && destinationHasExceptions) {
            const areExceptionStructuresEqual = handleAreExceptionStructuresEqual(
                state.exceptionStructure,
                state.copiedItem?.VoucherTempleteOverrideStructures
            );

            if (areExceptionStructuresEqual) {
                handlePaste(false, destinationNodeId);
            } else {
                Modal.confirm({
                    title: Language('Confirm'),
                    content: Language('ExceptionStructuresAreNotEqual'),
                    onOk() {
                        handlePaste(true, destinationNodeId);
                    }
                });
            }
        }
    }

    function handleAreExceptionStructuresEqual(
        currentExceptionStructure,
        copiedExceptionStructure,
    ) {

        if (!currentExceptionStructure || !copiedExceptionStructure) {
            return false;
        }


        if (currentExceptionStructure.length !== copiedExceptionStructure.length) {
            return false;
        }

        const set1 = new Set(currentExceptionStructure.map(item => `${item.OperationID || item.OperationId}-${item.level || item.Index}`));
        const set2 = new Set(copiedExceptionStructure.map(item => `${item.OperationID || item.OperationId}-${item.level || item.Index}`));


        const result = set1.size === set2.size && Array.from(set1).every(key => set2.has(key));
        return result;
    }

    function generateNewRecords(records, removeExceptions: boolean) {
        return records?.map(record => {
            const newArticleGuid = NewGuid();
            const newVoucherArticleTemplateGuid = NewGuid();

            // Copy and update article exceptions with new GUIDs and parent references
            const newArticleExceptionsList = removeExceptions
                ? []
                : (record.ArticleExceptionsList ?? []).map(exception => ({
                    ...exception,
                    Guid: NewGuid(),  // Generate new GUID for the exception
                    ParentGuid: newArticleGuid,  // Update parent to point to new article
                    VoucherArticleTemplateGuid: newVoucherArticleTemplateGuid
                }));

            const newRecord = {
                ...record,
                VoucherArticleTemplateGuid: newVoucherArticleTemplateGuid,
                Guid: newArticleGuid,
                IsCopy: true,
                ArticleExceptionsList: newArticleExceptionsList
            };

            if (removeExceptions) {
                delete newRecord.ArticleExceptionsList;
                delete newRecord.ExceptionStructure;
            }

            return newRecord;
        });
    }

    function handlePaste(removeExceptions: boolean, destinationNodeId: string) {

        const newArticles = generateNewRecords(state.copiedItem?.VoucherArticleTemplates, removeExceptions);

        state.handleAddArticles(newArticles ?? []);
        const currentNodeArticles = state.handleGetArticles() || [];

        const articlesWithCopyFlag = currentNodeArticles.map(article => {
            const isPastedArticle = newArticles?.some(newArt => newArt.Guid === article.Guid);

            const updatedArticle = {
                ...article,
                IsCopy: isPastedArticle ? true : (article.IsCopy || false),
                VoucherArticleTemplateGuid: article.VoucherArticleTemplateGuid || article.Guid,
                ArticleExceptionsList: article.ArticleExceptionsList ?? []
            };

            return updatedArticle;
        });

        const updatedItem = {
            ActionGuid: destinationNodeId || state.selectedItem?.Id,
            VoucherTemplateArticles: articlesWithCopyFlag,
            VoucherTempleteOverrideStructures: removeExceptions
                ? state.exceptionStructure
                : (state.copiedItem?.VoucherTempleteOverrideStructures ?? state.exceptionStructure)
        };

        dispatch(setItem(updatedItem));

        dispatch(setChangedItemsKeys());
        dispatch(setCopiedItemsKeys());

        if (!removeExceptions) {
            if (!state.exceptionStructure?.length && state.copiedItem?.VoucherTempleteOverrideStructures?.length) {
                dispatch(setExceptionStructure(state.copiedItem?.VoucherTempleteOverrideStructures));
            }
        }

    }


    return (
        showTree && (
            <TreeEx
                store={treeStore.current}
                preloadLevel={1}
                autoExpandParent
                checkStrictly
                showLines
                onSelect={handleSelect}
                onDoubleClick={handleDoubleClick}
                dynamicContextMenuItem={getContextMenuItems}
                onRightClick={handleRightClick} />)
    );

}