import React from 'react';
import ReactResizeDetector from 'react-resize-detector';
import { buildEnumDataSource, Language, SoftwareGuid } from '../../../Utility/helper';
import { ContractsArticleNature } from '../../../Models/Chargoon.Didgah.Bureau.Deals.Contracts.Domain.Enumeration.ContractsArticleNature';
import ExceptionStructureButton from './ExeptionStructure/exceptionStructureButton';
import { Mode, StateModel } from './Reducer/reducer';
import { Controls } from '../../../Models/Chargoon.Didgah.Bureau.Deals.Contracts.Domain.Enumeration.Controls';
import { setAccountCodePatternCount, setChangedItemsKeys, setState } from './Reducer/actionMethod';
import CustomParameterGuide from './customParameterGuide';
import CustomTextViewer from './customTextViewer';
import { VoucherTemplateArticleSaveModel } from '../../../Models/Chargoon.Didgah.Bureau.Contracts.UI5.Models.FinancialAccounting.Voucher.VoucherTemplateArticleSaveModel';
import { BooleanViewerField, Button, CheckboxEditorField, Modal, SelectEditorField, SelectViewerField, TableEx, TextViewerField, useCommandHandler } from 'didgah/ant-core-component';
import { TableExColumnProps } from '@didgah-components/ant-selectindividual';
import { AccountCodePatternToken } from '@didgah/bureau-financialAccounting-shared';
import { FieldEditorType, FieldViewerType } from '@models/didgah-components';
import { TableExValidationResult } from 'didgah/ant-core-component/providers';
import { TableExEditStore } from "didgah/ant-core-component/providers";

interface Props {
  state
  dispatch?
  mainInfoForm
}

export default function TableManager({ state, dispatch, mainInfoForm }: Props) {
  const stateRef = React.useRef<StateModel>(state);
  const commandHandler = useCommandHandler();

  const tableStore = React.useRef<TableExEditStore<VoucherTemplateArticleSaveModel, string>>(new TableExEditStore<VoucherTemplateArticleSaveModel, string>({
    keyField: 'VoucherArticleTemplateGuid',
    data: []
  })).current;

  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const tableColumns = React.useRef<TableExColumnProps<VoucherTemplateArticleSaveModel>[]>([
    {
      title: Language('ArticleNature'),
      dataIndex: 'ArticleNature',
      width: 150,
      align: 'right',
      viewType: new SelectViewerField(buildEnumDataSource(ContractsArticleNature, SoftwareGuid, 0, false)),
      editType: new SelectEditorField(buildEnumDataSource(ContractsArticleNature, SoftwareGuid, 0, false), false),
      required: true
    },
    {
      title: Language('AccountCodePattern'),
      dataIndex: 'AccountCodePattern',
      align:'left',
      viewType: { type: FieldViewerType.Custom },
      editType: {
        type: FieldEditorType.Custom,
        softwareGuid: SoftwareGuid,
        preventSelectDiactiveRecord: true,
        filterDisable: true,
      },
      getDynamicProps: () => ({
        departmentId: state.initialData?.Department.key,
        financialActivityTypeGuid: state.initialData?.FinancialActivityType.Guid,
        fiscalYearDetailGuid: state.initialData?.FiscalYears.Guid,
      }),
      editComponent: AccountCodePatternToken,
      viewComponent: ({ value }) => <CustomTextViewer value={value?.[0]?.title} />,
      required: true,
      width: 200,
    },
        {
      title: Language('AccountCodePatternTitle'),
      dataIndex: 'AccountCodePatternTitle',
      align:'right',
      viewType: new TextViewerField(),
      editDisabled: true,
      width: 200,
    },
    {
      title: Language('Description'),
      dataIndex: 'Description',
      width: 250,
      align: 'right',
      viewType: new TextViewerField(),
      editComponent: CustomParameterGuide,
      editType: {
        type: FieldEditorType.Custom,
      },
    },
    {
      title: Language('WithoutArticle'),
      dataIndex: 'SkipArticle',
      width: 150,
      align: 'center',
      viewType: new BooleanViewerField(),
      editType: new CheckboxEditorField(),
    },
    {
      title: Language('Exception'),
      dataIndex: 'ArticleExceptionsList',
      width: 150,
      align: 'center',
      editComponent: ({ record }) => <Button onClick={() => handleOpenException(record)}>...</Button>,
      editType: { type: FieldEditorType.Custom },
      viewType: {
        type: FieldViewerType.Custom
      },
      viewComponent: () => <span>...</span>
    },
  ]);

  React.useEffect(() => {
    dispatch(
      setState({
        handleGetArticles,
        handleSetArticles,
        handleAddArticles,
        validateTable,
      }),
    );
  }, []);

  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);


  function handleOpenException(record: VoucherTemplateArticleSaveModel) {

    if (stateRef.current?.exceptionStructure?.length) {
      commandHandler.openControlFormByCode({
        controlCode: Controls.FinancialVoucherExeption,
        softwareGuid: SoftwareGuid,
        dtoObject: {
          mainInfoForm,
          actionGuid: stateRef.current?.selectedItem?.Id,
          exceptionStructure: stateRef.current?.exceptionStructure,
          record,
          dispatch,
          state
        },
        options: { alwaysOnTop: true },
      }).then((res) => {
        tableStore.update({
          ...record,
          ArticleExceptionsList: res,
        });
        dispatch(setChangedItemsKeys());

      });
    } else {
      Modal.error({
        title: Language("Error"),
        content: Language('InsertingExceptionNotPossibleLackExceptionStructure')
      })
    }
  }

  function handleGetArticles() {
    const data = tableStore.getAllDataExceptDeletedOne();
    // Deep clone to prevent shared references across nodes
    return data ? JSON.parse(JSON.stringify(data)) : [];
  }

  function handleSetArticles(data: VoucherTemplateArticleSaveModel[]) {

    tableStore.reset(data ?? []);
  }

  function handleAddArticles(data: VoucherTemplateArticleSaveModel[]) {

    const allData: VoucherTemplateArticleSaveModel[] = handleGetArticles();

    tableStore.bulkInsert(data ?? [], allData?.length);
  }

  async function validateTable() {
    if (tableStore.getEditingRow()) {
      const result: boolean = await tableStore.validateRow(tableStore.getEditingRow());
      if (result) {
        tableStore.toggleView(tableStore.getEditingRow());
        return validateTableRecords();
      }
    } else {
      return validateTableRecords();
    }

    return false;
  }

  function handleChange(record: VoucherTemplateArticleSaveModel, oldValue: any, newValue: any, dataIndex: string) {

    if (!stateRef.current?.changedItemsKeys?.some(key => key === stateRef.current?.selectedItem?.Id)) {

      dispatch(setChangedItemsKeys());
    }

    if (dataIndex === 'AccountCodePattern') {
      tableStore.update({
        ...record,
        AccountCodePatternTitle: newValue?.[0]?.metadata?.Title,
      });

      dispatch(setAccountCodePatternCount(newValue?.length ? 1 : -1));
    }
  }

  async function validateTableRecords() {
    return new Promise(resolve => {
      tableStore.validateRecords((res: TableExValidationResult<VoucherTemplateArticleSaveModel>) => {
        resolve(res.success);
      });
    });
  }

  function handleAfterDelete(deletedRecords: VoucherTemplateArticleSaveModel[]) {
    const accountCodePatternCount: number =
      (deletedRecords[0]?.ArticleExceptionsList?.length ?? 0) +
      (deletedRecords[0]?.AccountCodePattern ? 1 : 0);
                                                             
    dispatch(setChangedItemsKeys());
    dispatch(setAccountCodePatternCount(-accountCodePatternCount));
  }


  function handleResize(width?: number) {
    // setIsFixedWidth(width <= columnsWidth);
  }
  return (

    <ReactResizeDetector handleWidth handleHeight onResize={handleResize}>

      <TableEx
        columns={tableColumns.current}
        store={tableStore}
        disablePagination={true}
        onChange={handleChange}
        onAfterDelete={handleAfterDelete}
        allowAdd={!!state.selectedItem}
        emptyText={() => Language('NoItemIsSelected')}
        actionBarComponents={[<ExceptionStructureButton state={state} dispatch={dispatch} />]}
      />
    </ReactResizeDetector>
  )
}