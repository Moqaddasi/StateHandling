import React from 'react';
import { Language } from '../../../Utility/helper';
import { ParameterGuideItemModel } from '../parameterGuide/manager';
import { Controls } from '../../../Models/Chargoon.Didgah.Bureau.Deals.Contracts.Domain.Enumeration.Controls';
import { VoucherArticleTemplateViewModel } from '../../../Models/Chargoon.Didgah.Bureau.Contracts.UI5.Models.Voucher.VoucherArticleTemplateViewModel';
import { Button, Input, Row, useCommandHandler } from 'didgah/ant-core-component';

interface props {
  onChange: (value: string) => void;
  record: VoucherArticleTemplateViewModel;
  value: string
}

export default function CustomParameterGuide({ onChange, value }: props) {
  const commandHandler = useCommandHandler();

  function openPrameterGuide(): void {
    commandHandler.openControlFormByCode({
      controlCode: Controls.Configuration_FinancialVoucherTemplate_ParameterGuids,
      options: {
        alwaysOnTop: true
      }
    }).then((res: ParameterGuideItemModel) => {
      if (!!res) {
        onChange((value || "") + res.Parameter);
      }
    })
  }

  function handleChange(event): void {
    onChange(event.target.value);
  }

  return (
    <Row type='flex' >
      <span style={{ flex: 1 }}>
        <Input
          onChange={handleChange}
          value={value} />
      </span>
      <Button
        icon='ellipsis'
        style={{ height: 28, display: "flex" }}
        onClick={openPrameterGuide}
        title={Language("GuideOfParameters")} />
    </Row>
  )
}

