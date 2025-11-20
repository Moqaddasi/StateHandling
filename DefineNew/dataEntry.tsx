import * as React from 'react';
import { Language, generateBootstrapAspectRatio } from '../../../Utility/helper';
import { StateModel } from './Reducer/reducer';
import { Checkbox, Col, Fieldset, Form, FormComponentProps, Input, Row } from 'didgah/ant-core-component';
import { VoucherTemplateSaveModel } from '../../../Models/Chargoon.Didgah.Bureau.Contracts.UI5.Models.FinancialAccounting.Voucher.VoucherTemplateSaveModel';

interface props extends FormComponentProps<VoucherTemplateSaveModel> {
    state: StateModel
    dispatch
    getDefinForm
}

function DataEntry({ form, state, getDefinForm }: props) {
    const { getFieldDecorator } = form;

    React.useEffect(() => {
        getDefinForm(form);
    }, [])

    return (
        <Fieldset legend={Language('DataEntry')}>
            <Form>
                <Form.HiddenField>{getFieldDecorator('VoucherTemplateGuid')}</Form.HiddenField>
                <Form.Row>
                    <Form.Item label={Language('Title')} >
                        {getFieldDecorator('Title', { rules: [{ required: true }] })
                            (<Input />)}
                    </Form.Item>
                    <Form.Item label={Language('Department_Keyword')} >
                        {getFieldDecorator('DepartmentID', { initialValue: state.initialData?.Department?.value })
                            (<Input
                                disabled
                                style={{ color: "black" }} />)}
                    </Form.Item>
                    <Form.Item label={Language('FinancialActivityType_Keyword')} >
                        {getFieldDecorator('FinancialActivityGuid', { initialValue: state.initialData?.FinancialActivityType?.Title })
                            (<Input
                                disabled
                                style={{ color: "black" }} />)}
                    </Form.Item>
                </Form.Row>
                <Form.Row>
                    <Form.Item label={Language('FiscalYear')} >
                        {getFieldDecorator('FiscalYearGuid', { initialValue: state.initialData?.FiscalYears?.Title })
                            (<Input
                                disabled
                                style={{ color: "black" }} />)}
                    </Form.Item>
                    <Form.Item label={Language('Description')}>
                        {getFieldDecorator('Description')
                            (<Input />)}
                    </Form.Item>
                    <Row>
                        <Col span={13}>
                            <Form.Item label={Language('Active')} {...generateBootstrapAspectRatio(13, 11)}>
                                {getFieldDecorator('Active', { valuePropName: 'checked', })
                                    (<Checkbox />)}
                            </Form.Item>
                        </Col>
                        <Col span={11}>
                            <Form.Item label={Language('CombininSameArticles')} {...generateBootstrapAspectRatio(6, 18)}>
                                {getFieldDecorator('GroupingIdenticalArticle', { valuePropName: 'checked', initialValue: true })
                                    (<Checkbox />)}
                            </Form.Item>
                        </Col>
                    </Row>
                </Form.Row>
            </Form >
        </Fieldset>
    )
}

export default Form.create({})(DataEntry);