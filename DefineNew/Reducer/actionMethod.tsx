import { SelectItem } from 'didgah/ant-core-component';
import { SET_ACCOUNT_CODE_PATTERN_COUNT, SET_CHANGED_ITEMS_KEYS, SET_COPIED_ITEM, SET_COPIED_ITEMS_KEYS, SET_EXCEPTION_STRUCTURE, SET_FINANCIAL_ACTIVITY_TYPES, SET_FISCAL_YEAR, SET_INACTIVE_DEPARTMENT, SET_INITIAL_DATA, SET_ITEM, SET_SELECTED_ITEM, SET_SPIN, SET_STATE } from './actionTypes';
import { ActionModel, StateModel } from './reducer';

export const setState: (data: Partial<StateModel>) => ActionModel = data => ({ type: SET_STATE, payLoad: data });
export const setSpin: (data: boolean) => ActionModel = data => ({ type: SET_SPIN, payLoad: data });
export const setInitialData: (data) => ActionModel = data => ({ type: SET_INITIAL_DATA, payLoad: data });
export const setInactiveDepartment: (data) => ActionModel = data => ({ type: SET_INACTIVE_DEPARTMENT, payLoad: data });
export const setFinancialActivityType: (data: SelectItem[]) => ActionModel = data => ({ type: SET_FINANCIAL_ACTIVITY_TYPES, payLoad: data });
export const setFiscalYears: (data: SelectItem[]) => ActionModel = data => ({ type: SET_FISCAL_YEAR, payLoad: data });
export const setSelectedItem: (data) => ActionModel = data => ({ type: SET_SELECTED_ITEM, payLoad: data });
export const setCopiedItem: (data) => ActionModel = data => ({ type: SET_COPIED_ITEM, payLoad: data });
export const setExceptionStructure: (data) => ActionModel = data => ({ type: SET_EXCEPTION_STRUCTURE, payLoad: data });
export const setAccountCodePatternCount: (data: number) => ActionModel = data => ({ type: SET_ACCOUNT_CODE_PATTERN_COUNT, payLoad: data });
export const setChangedItemsKeys: () => ActionModel = () => ({ type: SET_CHANGED_ITEMS_KEYS, payLoad: null });
export const setCopiedItemsKeys: () => ActionModel = () => ({ type: SET_COPIED_ITEMS_KEYS, payLoad: null });
export const setItem: (data) => ActionModel = data => ({ type: SET_ITEM, payLoad: data });
