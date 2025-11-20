import React, { useState } from 'react';
import { ArticleExceptionModel } from '../../../../Models/Chargoon.Didgah.Bureau.Contracts.UI5.Models.FinancialAccounting.Voucher.ArticleExceptionModel';
import { SelectEx, SelectItem, SelectValue } from 'didgah/ant-core-component';

interface props {
    value: Guid;
    record: ArticleExceptionModel;
    dataSource: SelectItem[];
    includeDisable: SelectItem[];
    onChange: (value: Guid) => void;
}

export function OverrideTypeEditComponent({ dataSource, onChange, value, includeDisable }: props) {
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

    function handleChange(event: SelectValue): void {
        if (event == undefined) {
            setlistData(dataSource);
            setEventValue(null);
        } else {
            const item: SelectItem = listData?.find(item => item.value == event);
            setEventValue(item);
        }
        onChange(event);
    }

    function handleSelect(event: string): void {
        const disableItem: SelectItem = createDisableList().find(item => item.value == eventValue?.value);
        if (disableItem && event !== eventValue?.value) {
            const index: number = listData.findIndex(item => item.value == disableItem.value);
            listData.splice(index, 1);
            setlistData(listData);
        }
    }

    return (
        <SelectEx
            dataSource={listData}
            onChange={handleChange}
            value={eventValue?.value}
            onSelect={handleSelect}
            allowClear={true} />
    )
}



