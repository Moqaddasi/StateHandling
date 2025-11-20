import React from 'react';
import { transportLayer } from '../transportLayer';

import { OverridesStructureViewModel } from '../../../../Models/Chargoon.Didgah.Bureau.Contracts.UI5.Models.OverridesStructure.OverridesStructureViewModel';
import { buildEnumDataSource, Language, SoftwareGuid } from '../../../../Utility/helper';
import { OverrideStructureOperation } from '../../../../Models/Chargoon.Didgah.Bureau.Deals.Contracts.Domain.Enumeration.OverrideStructureOperation';
import { setChangedItemsKeys, setExceptionStructure } from '../Reducer/actionMethod';
import { Button, Fieldset, FormLayout, RigidNumberEditorField, SelectEditorField, SelectViewerField, Spin, TableEx, TextViewerField, useAjax, useCommandHandler } from 'didgah/ant-core-component';
import { TableExEditStore, TableExValidationResult } from 'didgah/ant-core-component/providers';
import { TableExColumnProps } from '@didgah-components/ant-selectindividual';

export interface ExeptionStructurepropsModel {
  actionGuid: Guid;
  data;
  state
  dispatch
}

function Manager({ actionGuid, data, state, dispatch }: ExeptionStructurepropsModel) {
  const [submitButtonLoading, setSubmitButtonLoading] = React.useState<boolean>(false);
  const server = React.useRef(transportLayer(useAjax())).current;
  const commandHandler = useCommandHandler();

  const tableStore = React.useRef<TableExEditStore<OverridesStructureViewModel, string>>(new TableExEditStore<OverridesStructureViewModel, string>({
    keyField: 'Guid',
    data: []
  })).current;

  const tableColumns = React.useRef<TableExColumnProps<OverridesStructureViewModel>[]>([
    {
      title: Language('OverrideType'),
      dataIndex: 'OperationId',
      width: 150,
      viewType: new SelectViewerField(buildEnumDataSource(OverrideStructureOperation, SoftwareGuid, 0, false)),
      editType: new SelectEditorField(buildEnumDataSource(OverrideStructureOperation, SoftwareGuid, 0, false), false),
      uniquenessGroup: "OperationId",
      rules: [{ validator: operationIdValidator }],
      required: true
    },
    {
      title: Language('Row'),
      dataIndex: 'Index',
      width: 80,
      viewType: new TextViewerField(),
      editType: new RigidNumberEditorField({ allowFloatNumbers: false, allowNegativeNumbers: false, doNotConvertValueToNumber: false }),
      uniquenessGroup: "Index",
      rules: [{ validator: validateIndex }],
      required: true
    },
  ]);

  React.useEffect(() => {
    tableStore.reset(data ?? [])
  }, [])

  function validateIndex(rule, value: number, callback) {
    const records = tableStore.getAllDataExceptDeletedOne() || [];
    if (records.length) {
      const arrayIndex = records.map(item => item.Index);
      const isDuplicate = arrayIndex.some((item, index) => arrayIndex.indexOf(item) !== index);

      if (isDuplicate) {
        return callback({ message: Language("IndexisNotDuplicate"), field: rule.field });
      }
      if (value?.toString()?.length > 4) {
        return callback({ message: Language("InsertingMoreThanFourDigitsIsNotAllowed"), field: rule.field });
      }
    }
    callback();
  }


  function operationIdValidator(rule, value, callback) {
    const records: OverridesStructureViewModel[] = tableStore.getAllDataExceptDeletedOne();
    if (records?.length) {
      const arrayIndex: number[] = records.map(item => +item.OperationId);

      const isDuplicate: boolean = arrayIndex.some(function (item, index) { return arrayIndex.indexOf(item) != index });

      if (isDuplicate) {
        callback({
          message: Language("OverrideTypeisNotDuplicate"),
          field: rule.field
        });
      }
      else {
        callback();
      }
    }
  }

  function validateBeforeSubmit() {
    if (tableStore.getEditingRow()) {
      tableStore.validateRow(tableStore.getEditingRow())
        .then((result: boolean) => {
          if (result) {
            tableStore.toggleView(tableStore.getEditingRow());
            validateTable();
          }
        });
    } else {
      validateTable();
    }
  }

  function validateTable() {
    tableStore.validateRecords((result: TableExValidationResult<OverridesStructureViewModel>) => {
      if (!!result.success) {
        handleSubmit();
      }
    });
  }


  function handleSubmit() {
    const allData = tableStore.getAllDataExceptDeletedOne();
    dispatch(setChangedItemsKeys());
    dispatch(setExceptionStructure(allData));
    commandHandler.closeWindow();
  }


  return (
    <FormLayout>
      <FormLayout.LayoutContent>
        <Spin spinning={submitButtonLoading} stretch={true}>
          <Fieldset legend={Language('DataEntry')} collapsible={false} heightRatio={1} flex={true}>
            <TableEx
              columns={tableColumns.current}
              store={tableStore}
              disablePagination={true}
            />
          </Fieldset>
        </Spin>
      </FormLayout.LayoutContent>
      <FormLayout.ActionBar>
        <Button type="primary"
          onClick={validateBeforeSubmit}
          loading={submitButtonLoading}>
          {Language('Insert')}
        </Button>
      </FormLayout.ActionBar>
    </FormLayout>
  )
}
export default Manager
