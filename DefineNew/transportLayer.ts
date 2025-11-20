import { EncryptGuidTitleModel } from "../../../Models/Chargoon.Didgah.Bureau.Contracts.UI5.Models._General.EncryptGuidTitleModel";
import { GetGenerateDynamicViewModel } from "../../../Models/Chargoon.Didgah.Bureau.Contracts.UI5.Models.OverridesStructure.GetGenerateDynamicViewModel";
import { VoucherGetViewModel } from "../../../Models/Chargoon.Didgah.Bureau.Contracts.UI5.Models.Voucher.VoucherGetViewModel";
import { getApiUrl } from "../../../Utility/helper";

export function transportLayer(ajax: __Didgah_Ajax.AjaxContext) {
    return {
        getInitial: (guid) => ajax.post(getApiUrl('VoucherTemplate', 'VoucherTemplateGetInit', 'Configuration'), guid),
        getRootId: () => ajax.post(getApiUrl('VoucherTemplate', 'VoucherTemplateGetRootID', 'Configuration'), null),
        getDynamicColumn: (operationId: GetGenerateDynamicViewModel) => ajax.post(getApiUrl('VoucherTemplate', 'OverridesStructureGenerateDynamicFields', 'Configuration'), operationId),
        submitApi: (model) => ajax.post(getApiUrl('VoucherTemplate', 'SaveVoucherTemplate', 'Configuration'), model),
        loadApi: (guid) => ajax.post(getApiUrl('VoucherTemplate', 'GetByVoucherTemplateGuid', 'Configuration'), guid),
        getVoucherTemplateArticlesApi: (model:VoucherGetViewModel) => ajax.post(getApiUrl('VoucherTemplate', 'GetVoucherTemplateNode', 'Configuration'), model),
        getVoucherTemplateNodeExeption: (guid) => ajax.post(getApiUrl('VoucherTemplate', 'GetVoucherTemplateNodeExeption', 'Configuration'), guid),
        getVoucherTemplateNodeExeptionOnCopied: (guids:EncryptGuidTitleModel[]) => ajax.post(getApiUrl('VoucherTemplate', 'GetVoucherTemplateNodeExeptionOnCopied', 'Configuration'), guids),


    }
}