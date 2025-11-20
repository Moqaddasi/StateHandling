import React, { useState } from 'react';
import { ArticleExceptionModel } from '../../../../Models/Chargoon.Didgah.Bureau.Contracts.UI5.Models.FinancialAccounting.Voucher.ArticleExceptionModel';
import { SelectItem, Tooltip } from 'didgah/ant-core-component';

interface props {
  value: Guid;
  record: ArticleExceptionModel;
  dataSource: SelectItem[];
  includeDisable: SelectItem[];
  onChange: (value: Guid) => void;
}

export function OverrideTypeViewComponent({ dataSource, value, includeDisable }: props) {
  const [listData, setlistData] = useState<SelectItem[]>(dataSource);
  const [eventValue, setEventValue] = useState<SelectItem>(null);

  React.useEffect(() => {
    if (value) {
      const disableItem: SelectItem = createDisableList().find(item => item.value == value);
      if (disableItem) {
        setlistData((previous) => [disableItem, ...previous])
      };
    }
  }, [value])

  React.useEffect(() => {
    if (value && listData?.length) {
      const item: SelectItem = listData?.find(item => item.value == value);
      setEventValue(item);
    }
  }, [listData])

  function createDisableList() {
    const disableItems: SelectItem[] = [];
    includeDisable?.map(item => {
      const isEnable = dataSource?.find(element => item.value == element.value);
      if (!isEnable) {
        disableItems.push(item);
      }
    })
    return disableItems
  }

  return (
        <>
          {eventValue?.key && eventValue?.key?.length > 13 ?
            <Tooltip title={eventValue?.key}>
              <div style={{ overflow: "hidden" }} >
                {eventValue?.key?.substring(0, 43) + "..."}
              </div>
            </Tooltip>
            : eventValue?.key && eventValue?.key.length <= 13 ? <div style={{ overflow: "hidden" }}>{eventValue?.key}</div> :
              ""}
        </>
    
  )
}



