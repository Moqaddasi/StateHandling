import React, { useState, useRef, useEffect } from 'react';
import { OverrideTypeViewComponent } from './overrideTypeViewComponent';
import { FieldViewerType } from '@models/didgah-components/lib/Chargoon.Didgah.Core5.Components.Models.Field.FieldViewerType';
import { FieldEditorType } from '@models/didgah-components/lib/Chargoon.Didgah.Core5.Components.Models.Field.FieldEditorType';
import { DynamicFieldViewModel } from '../../../../Models/Chargoon.Didgah.Bureau.Contracts.UI5.Models.Voucher.DynamicFieldViewModel';
import { buildEnumDataSource, handleErrors, Language, SoftwareGuid } from '../../../../Utility/helper';
import { ContractsArticleNature } from '../../../../Models/Chargoon.Didgah.Bureau.Deals.Contracts.Domain.Enumeration.ContractsArticleNature';
import CustomParameterGuide from '../customParameterGuide';
import { KeyValueIntModel } from '../../../../Models/Chargoon.Didgah.Bureau.Contracts.UI5.Models._General.KeyValueIntModel';
import { OverrideTypeEditComponent } from './overrideTypeEditComponent';
import { transportLayer } from '../transportLayer';
import { GetGenerateDynamicViewModel } from '../../../../Models/Chargoon.Didgah.Bureau.Contracts.UI5.Models.OverridesStructure.GetGenerateDynamicViewModel';
import { BooleanViewerField, Button, CheckboxEditorField, Fieldset, FormLayout, Modal, SelectEditorField, SelectViewerField, Spin, TableEx, TableExColumnProps, TextViewerComponentField, TextViewerField, useAjax, useCommandHandler } from 'didgah/ant-core-component';
import { TableExEditStore } from 'didgah/ant-core-component/providers';
import { AccountCodePatternToken } from '@didgah/bureau-financialAccounting-shared';
import { ArticleExceptionsViewModel } from '../../../../Models/Chargoon.Didgah.Bureau.Contracts.UI5.Models.Voucher.ArticleExceptionsViewModel';

export interface FinancialVoucherTemplateExeptionPropsModel {
  mainInfoForm,
  actionGuid,
  exceptionStructure,
  record,
  dispatch,
  state
}

function ExeptionManager({ mainInfoForm, actionGuid, exceptionStructure, record, dispatch, state }: FinancialVoucherTemplateExeptionPropsModel) {
  const [dynamicColumn, setDynamicColumn] = useState<DynamicFieldViewModel[]>([]);
  const [showTable, setShowTable] = useState<boolean>(false);
  const commandHandler = useCommandHandler();
  const server = useRef(transportLayer(useAjax())).current;

  const tableStore = useRef<TableExEditStore<ArticleExceptionsViewModel, string>>(new TableExEditStore<ArticleExceptionsViewModel, string>({
    keyField: 'Guid',
    data: []
  })).current;

  const tableColumns = useRef<TableExColumnProps<ArticleExceptionsViewModel>[]>([]);
  const fixeColumn = useRef<TableExColumnProps<ArticleExceptionsViewModel>[]>([
    {
      title: Language('ArticleNature'),
      dataIndex: 'ArticleNature',
      width: 200,
      align: 'right',
      viewType: new SelectViewerField(buildEnumDataSource(ContractsArticleNature, SoftwareGuid, 0, false)),
      editType: new SelectEditorField(buildEnumDataSource(ContractsArticleNature, SoftwareGuid, 0, false), false),
      required: true
    },
    {
      title: Language('AccountCodePattern'),
      dataIndex: 'AccountCodePattern',
      align: 'left',
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
      viewComponent: ({ value }) => <TextViewerComponentField value={value?.[0]?.title} />,
      required: true,
      width: 200,
    },
    {
      title: Language('AccountCodePatternTitle'),
      dataIndex: 'AccountCodePatternTitle',
      align: 'right',
      viewType: new TextViewerField(),
      editDisabled: true,
      width: 200,
    },
    {
      title: Language('Description'),
      dataIndex: 'Description',
      width: 270,
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
      width: 200,
      align: 'center',
      viewType: new BooleanViewerField(),
      editType: new CheckboxEditorField(),
    },
  ]);

  useEffect(() => {
    if (!exceptionStructure?.length) return;
    const model: GetGenerateDynamicViewModel = { Override: exceptionStructure };
    server.getDynamicColumn(model)
      .then(res => setDynamicColumn(res))
      .fail(handleErrors);
  }, [exceptionStructure]);

  useEffect(() => {
    if (record?.ArticleExceptionsList?.length) {
      const exceptions = record.ArticleExceptionsList?.map(item => ({
        ...item,
        AccountCodePattern: item.AccountCodePattern
          ? [{
            id: item.AccountCodePattern.id,
            title: item.AccountCodePattern.title,
            metadata: { title: item.AccountCodePattern.title }
          }]
          : [],
      })) ?? [];

      tableStore.reset(exceptions);
    }
    else if (record.IsCopy) {
      tableStore.reset([]);
    }
    else {
      server.getVoucherTemplateNodeExeption(record.Guid).then((res) => {
        const mappedArticles = res?.map(record => ({
          ...record,
          AccountCodePattern: record.AccountCodePattern
            ? [{
              id: record.AccountCodePattern.id,
              title: record.AccountCodePattern.title,
              metadata: { Title: record.AccountCodePattern.Title }
            }]
            : [],
        })) ?? [];
        tableStore.reset(mappedArticles);
      });
    }
  }, []);

  useEffect(() => {
    if (!dynamicColumn?.length) return;
    createColumn();
  }, [dynamicColumn]);

  function convertDataSourceList(list: KeyValueIntModel[]) {
    return list?.map(item => ({ key: item.value, value: item.key }));
  }

  function createColumn() {
    setShowTable(false);
    const columnList = [];
    if (dynamicColumn && dynamicColumn.length) {
      for (let item of dynamicColumn) {
        if (item.Title !== "MissingContract" && item.Title !== "SuretyBondSubject" && item.Title !== "SuretyBondType") {
          columnList.push({
            title: Language(`${item.Title}`),
            dataIndex: `${item.Title}`,
            width: 200,
            align: 'right',
            viewType: new SelectViewerField(convertDataSourceList(item.DataSource)),
            editType: new SelectEditorField(convertDataSourceList(item.DataSource)),
          });
        }
        else if (item.Title == "MissingContract") {
          columnList.push({
            title: Language(`${item.Title}`),
            dataIndex: `MissingContract`,
            align: 'center',
            width: 200,
            viewType: new BooleanViewerField(),
            editType: new CheckboxEditorField(),
          })
        }
        else if (item.Title == "SuretyBondSubject" || item.Title == "SuretyBondType") {
          columnList.push({
            title: Language(`${item.Title}`),
            dataIndex: `${item.Title}`,
            width: 200,
            align: 'right',
            viewComponent: OverrideTypeViewComponent,
            viewType: {
              type: FieldViewerType.Custom,
              dataSource: convertDataSourceList(item.DataSource),
              includeDisable: convertDataSourceList(item.DataSourceWithDisable),
            },
            editComponent: OverrideTypeEditComponent,
            editType: {
              type: FieldEditorType.Custom,
              dataSource: convertDataSourceList(item.DataSource),
              includeDisable: convertDataSourceList(item.DataSourceWithDisable),
            },
          })
        }
      }
    }
    tableColumns.current = [...columnList, ...fixeColumn.current];
    setShowTable(true);
  }

  function handleSave(): void {
    tableStore.validateRecords(result => {
      if (result.success) {
        const tableData: ArticleExceptionsViewModel[] = tableStore.getAllDataExceptDeletedOne();

        if (hasAllNullRows(tableData)) {
          showErrorModal("InsertingLeastOneExceptionInEachRowIsMandatory");
          return;
        }

        if (hasDuplicateRows(tableData)) {
          showErrorModal("ExeptionIsnotDuplicate");
          return;
        }

        const allData: ArticleExceptionsViewModel[] = tableData.map(item => ({
          ...item,
          AccountCodePattern: Array.isArray(item.AccountCodePattern) && item.AccountCodePattern.length > 0
            ? item.AccountCodePattern[0]
            : item.AccountCodePattern
        }));

        commandHandler.closeWindow(allData);
      }
    });
  }

  function hasAllNullRows(tableData: ArticleExceptionsViewModel[]): boolean {
    return tableData.some(record =>
      record.SuretyBondType == null &&
      record.SuretyBondSubject == null &&
      record.FundingResource == null &&
      record.ContractorType == null &&
      record.MissingContract == null &&
      record.MissingContract !== true
    );
  }

  function hasDuplicateRows(tableData: ArticleExceptionsViewModel[]): boolean {
    return tableData.some((item, index) => {
      const allData: ArticleExceptionsViewModel[] = [...tableData];
      allData.splice(index, 1);

      return allData.some(record =>
        record.SuretyBondType === item.SuretyBondType &&
        record.SuretyBondSubject === item.SuretyBondSubject &&
        record.ContractorType === item.ContractorType &&
        record.FundingResource === item.FundingResource &&
        Boolean(item.MissingContract) === Boolean(record.MissingContract)
      );
    });
  }

  function showErrorModal(messageKey: string): void {
    Modal.error({
      title: Language("Error"),
      content: Language(messageKey),
    });
  }

  function handleTableChange(record: ArticleExceptionsViewModel, oldValue: any, newValue: any, dataIndex: string): void {
    if (dataIndex === 'AccountCodePattern') {
      tableStore.update({
        ...record,
        AccountCodePatternTitle: newValue[0]?.metadata?.Title,
      });
    }
  }


  return (
    <Spin spinning={false} stretch={true}>
      <FormLayout>
        <FormLayout.LayoutContent>
          <Fieldset legend={Language('DataEntry')} collapsible={false} heightRatio={1} flex={true}>
            {showTable && <TableEx
              columns={tableColumns.current}
              store={tableStore}
              onChange={handleTableChange}
              disablePagination={true}
              fixedWidth={true}
              searchable
            />}
          </Fieldset>
        </FormLayout.LayoutContent>
        <FormLayout.ActionBar>
          <Button type="primary" onClick={handleSave}>{Language('Insert')}</Button>
        </FormLayout.ActionBar>
      </FormLayout>
    </Spin>
  )
}

export default ExeptionManager
