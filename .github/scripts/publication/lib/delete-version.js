'use strict';

const CREATE_ENDPOINT = 'https://app.reduct.cn/Web/V1/Paperskill/create_version';
const DELETE_ENDPOINT = 'https://app.reduct.cn/Web/V1/Paperskill/delete_version';

function responseContract(success) {
  return success && Number.isInteger(success.status) && success.status >= 200 && success.status < 300 &&
    (success.type === 'empty' ||
      (success.type === 'text' && typeof success.equals === 'string' && success.equals !== '') ||
      (success.type === 'json' && Array.isArray(success.path) &&
        success.path.every(key => typeof key === 'string' && key !== '') &&
        (success.equals === null || ['string', 'number', 'boolean'].includes(typeof success.equals))));
}

async function responseMatches(response, success) {
  if (response.status !== success.status) return false;
  if (success.type === 'empty') return await response.text() === '';
  if (success.type === 'text') return await response.text() === success.equals;
  let value = await response.json();
  for (const key of success.path) {
    if (value === null || typeof value !== 'object' || !Object.hasOwn(value, key)) return false;
    value = value[key];
  }
  return value === success.equals;
}

function createDeleteVersion({ enabled = false, contract, createHeaders, deleteHeaders, fetchImpl = fetch }) {
  if (enabled !== true) throw new Error('PaperSkill 版本删除未启用');
  if (!contract || !['json', 'form', 'multipart'].includes(contract.encoding) ||
      !['none', 'create-headers', 'delete-headers'].includes(contract.authentication) ||
      !responseContract(contract.success)) {
    throw new Error('须先配置经后端确认的删除请求编码、鉴权和成功响应');
  }
  const rawHeaders = contract.authentication === 'create-headers' ? createHeaders
    : contract.authentication === 'delete-headers' ? deleteHeaders : '{}';
  let values;
  try {
    values = JSON.parse(rawHeaders || '{}');
  } catch {
    throw new Error('删除鉴权请求头配置须为 JSON 对象');
  }
  if (!values || typeof values !== 'object' || Array.isArray(values) ||
      (contract.authentication !== 'none' && !Object.keys(values).length) ||
      Object.values(values).some(value => typeof value !== 'string')) {
    throw new Error('删除鉴权请求头必须由选定的密钥显式配置');
  }
  const headers = new Headers(values);
  if (headers.has('content-type')) throw new Error('删除请求 Content-Type 由已确认的编码配置决定');
  if (contract.encoding === 'json') headers.set('Content-Type', 'application/json');
  // Snapshot the confirmed contract for this run.
  const { encoding } = contract;
  const success = structuredClone(contract.success);

  return async function deleteVersion(id) {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('数据库版本 ID 无效');
    let body;
    if (encoding === 'json') body = JSON.stringify({ id });
    else if (encoding === 'form') body = new URLSearchParams({ id: String(id) });
    else {
      body = new FormData();
      body.set('id', String(id));
    }
    let confirmed = false;
    try {
      const response = await fetchImpl(DELETE_ENDPOINT, {
        method: 'POST', headers, body, signal: AbortSignal.timeout(30000), redirect: 'error',
      });
      confirmed = await responseMatches(response, success);
    } catch {
      throw new Error('删除请求结果不确定，账本保持原状态，需人工核对');
    }
    if (!confirmed) throw new Error('删除响应未匹配已确认的成功规则，需人工核对');
  };
}

module.exports = { CREATE_ENDPOINT, DELETE_ENDPOINT, createDeleteVersion };