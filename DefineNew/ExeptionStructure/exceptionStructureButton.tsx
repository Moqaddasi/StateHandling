import * as React from 'react';
import TooltipButton from '../../../../Common/TooltipButton/tooltipButton';
import { Language, SoftwareGuid } from '../../../../Utility/helper';
import { ActionModel, StateModel } from '../Reducer/reducer';
import { Controls } from '../../../../Models/Chargoon.Didgah.Bureau.Deals.Contracts.Domain.Enumeration.Controls';
import { useCommandHandler } from 'didgah/ant-core-component';

interface Props {
  state: StateModel;
  dispatch: React.Dispatch<ActionModel>;
}

export default function ExceptionStructureButton({ state, dispatch }: Props) {
  const commandHandler = useCommandHandler();

  function handleOpenExceptionStructure() {
    commandHandler.openControlFormByCode({
      controlCode: Controls.FinancialVoucherExeptionStructure,
      softwareGuid: SoftwareGuid,
      dtoObject: {
        dispatch,
        data: state?.exceptionStructure,
        actionGuid: state?.selectedItem?.Id,
      },
      options: { alwaysOnTop: true },
    });
  }

  return (
    <div style={{display:"flex",justifyContent:'end'}}>
      <TooltipButton 
        title={'OverrideStructure'} 
        isRecordSelected={state.selectedItem} 
        handleFunc={handleOpenExceptionStructure}/>
    </div>
  );
}
