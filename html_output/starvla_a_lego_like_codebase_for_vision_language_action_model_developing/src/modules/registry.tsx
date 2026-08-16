/* 交互组件注册表：tutorial.ts 中的 componentId 在这里映射到真实组件。
   页面渲染由 src/App.tsx 直接引用组件；本注册表是同一批组件的统一索引，
   供结构校验与后续按 id 动态渲染使用。 */

import type { ComponentType } from "react";
import BabelLab from "../widgets/BabelLab";
import ContractFlow from "../widgets/ContractFlow";
import LegoBuilder from "../widgets/LegoBuilder";
import MatrixTable from "../widgets/MatrixTable";
import FormulaSwitch from "../widgets/FormulaSwitch";
import HeadTheater from "../widgets/HeadTheater";
import ServerClient from "../widgets/ServerClient";
import YamlMixer from "../widgets/YamlMixer";
import ForgettingLab from "../widgets/ForgettingLab";
import ResultsLab from "../widgets/ResultsLab";

export const widgetRegistry: Record<string, ComponentType> = {};

widgetRegistry["babel-lab"] = BabelLab;
widgetRegistry["contract-flow"] = ContractFlow;
widgetRegistry["lego-builder"] = LegoBuilder;
widgetRegistry["matrix-table"] = MatrixTable;
widgetRegistry["formula-switch"] = FormulaSwitch;
widgetRegistry["head-theater"] = HeadTheater;
widgetRegistry["server-client"] = ServerClient;
widgetRegistry["yaml-mixer"] = YamlMixer;
widgetRegistry["forgetting-lab"] = ForgettingLab;
widgetRegistry["results-lab"] = ResultsLab;

export default widgetRegistry;
