'use strict';

const CREATE_ENDPOINT = 'https://app.reduct.cn/Web/V1/Paperskill/create_version';
const DELETE_ENDPOINT = 'https://app.reduct.cn/Web/V1/Paperskill/delete_version';

// Provisional contract pending a successful backend integration test.
const DEFAULT_CONTRACT = Object.freeze({ authentication: 'create-headers', successCode: 200 });

function createDeleteVersion({ enabled = false, contract = DEFAULT_CONTRACT, createHeaders, deleteHeaders, fetchImpl = fetch }) {
  if (enabled !== true) throw new Error('PaperSkill 版本删除未启用');
  if (!contract || !['none', 'create-headers', 'delete-headers'].includes(contract.authentication) ||
      !Number.isSafeInteger(contract.successCode)) {
    throw new Error('删除契约须指定有效的鉴权方式和整数业务成功码');
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
      (contract.authentication === 'delete-headers' && !Object.keys(values).length) ||
      Object.values(values).some(value => typeof value !== 'string')) {
    throw new Error('删除鉴权请求头必须由选定的密钥显式配置');
  }
  const headers = new Headers(values);
  if (headers.has('content-type')) throw new Error('multipart Content-Type 及其 boundary 由 fetch 生成');
  headers.set('Accept', 'application/json');
  const { successCode } = contract;

  return async function deleteVersion(id) {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('数据库版本 ID 无效');
    const body = new FormData();
    body.set('id', String(id));
    let confirmed = false;
    try {
      const response = await fetchImpl(DELETE_ENDPOINT, {
        method: 'POST', headers, body, signal: AbortSignal.timeout(30000), redirect: 'error',
      });
      if (response.status === 200) {
        const payload = await response.json();
        confirmed = payload?.code === successCode && typeof payload.msg === 'string' &&
          payload.data?.id === id;
      }
    } catch {
      throw new Error('删除请求结果不确定，账本保持原状态，需人工核对');
    }
    if (!confirmed) throw new Error('删除响应未匹配已确认的成功规则，需人工核对');
  };
}

module.exports = { CREATE_ENDPOINT, DELETE_ENDPOINT, createDeleteVersion };
