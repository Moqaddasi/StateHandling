import {
  SET_ACCOUNT_CODE_PATTERN_COUNT,
  SET_CHANGED_ITEMS_KEYS,
  SET_COPIED_ITEM,
  SET_COPIED_ITEMS_KEYS,
  SET_EXCEPTION_STRUCTURE,
  SET_FINANCIAL_ACTIVITY_TYPES,
  SET_FISCAL_YEAR,
  SET_INACTIVE_DEPARTMENT,
  SET_INITIAL_DATA,
  SET_ITEM,
  SET_SELECTED_ITEM,
  SET_SPIN,
  SET_STATE
} from './actionTypes';

export enum Mode {
  Add = 1,
  Edit = 2,
}

export interface InitialDefineModel  {
  FinancialActivityType?;
  FiscalYears?;
  Department?;
}

export type StateModel = {
  selectedItem;
  initialData: InitialDefineModel;
  items;
  spin: boolean;
  mode: Mode;
  changedItemsKeys: string[];
  accountCodePatternCount: number;
  exceptionStructure;
  copiedItem;
  copiedItemsKeys: string[];
  handleGetArticles();
  handleSetArticles(data): void;
  handleAddArticles(data): void;
  validateTable(): Promise<unknown>;
};

export type ActionModel = {
  type: string;
  payLoad: any;
};

export function reducer(state: StateModel, action: ActionModel): StateModel {
  const { payLoad, type } = action;

  const stateProvider = {
    [SET_STATE]: () => ({ ...state, ...payLoad }),
    [SET_SPIN]: () => ({ ...state, spin: payLoad }),
    [SET_INITIAL_DATA]: () => ({ ...state, initialData: payLoad }),
    [SET_INACTIVE_DEPARTMENT]: () => ({ ...state, initialData: { ...state?.initialData, Departments: [...state?.initialData?.Department, payLoad] } }),
    [SET_FINANCIAL_ACTIVITY_TYPES]: () => ({ ...state, initialData: { ...state?.initialData, financialActivityTypes: payLoad } }),
    [SET_FISCAL_YEAR]: () => ({ ...state, initialData: { ...state?.initialData, fiscalYears: payLoad } }),
    [SET_SELECTED_ITEM]: () => ({ ...state, selectedItem: payLoad }),
    [SET_COPIED_ITEM]: () => ({ ...state, copiedItem: payLoad }),
    [SET_EXCEPTION_STRUCTURE]: () => ({ ...state, exceptionStructure: payLoad }),
    [SET_ACCOUNT_CODE_PATTERN_COUNT]: () => ({ ...state, accountCodePatternCount: state.accountCodePatternCount + payLoad }),
    [SET_CHANGED_ITEMS_KEYS]: () => ({ ...state, changedItemsKeys: Array.from(new Set([...state.changedItemsKeys, state.selectedItem?.Id])) }),
    [SET_COPIED_ITEMS_KEYS]: () => ({ ...state, copiedItemsKeys: Array.from(new Set([...state.copiedItemsKeys, state.selectedItem?.Id])) }),
    [SET_ITEM]: () => {
      const items= state.items.map(item => (item.ActionGuid === payLoad.ActionGuid ? payLoad : item));
      return { ...state, items: items.some(item => item.ActionGuid === payLoad.ActionGuid) ? items : [...items, payLoad] };
    },
  };

  return stateProvider[type]();
}
