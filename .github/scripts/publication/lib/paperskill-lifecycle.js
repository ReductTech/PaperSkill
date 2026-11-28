'use strict';

const { SHA, validKey } = require('./deployment-snapshot');

function ownershipMatches(record, identity) {
  return record && record.id === identity.id && record.page_path === identity.page_path &&
    record.repository === identity.repository && record.endpoint === identity.endpoint &&
    record.version_key === identity.version_key;
}

// Integration boundary for the future backend contract. The dry-run CLI does
// not construct a transport or call this adapter.
function createLifecycleClient(transport, { enabled = false } = {}) {
  async function change(action, identity, context) {
    if (!enabled || !transport) throw new Error('数据库网页撤回与恢复写入已禁用');
    if (typeof identity.version_key !== 'string' || !validKey(identity.version_key) ||
        !/^[\w.-]+\/[\w.-]+$/.test(identity.repository || '') ||
        typeof identity.endpoint !== 'string' || !identity.endpoint.startsWith('https://') ||
        !Number.isSafeInteger(identity.id) || identity.id <= 0 ||
        identity.page_path !== 'papers/' + identity.version_key + '/' ||
        !SHA.test(context.source_sha || '') || !Number.isSafeInteger(context.deployment_id) ||
        context.deployment_id <= 0 || !/^[0-9a-f]{64}$/.test(context.operation_key || '')) {
      throw new Error('数据库版本身份或部署上下文无效');
    }
    const record = await transport.lookup(identity);
    if (!ownershipMatches(record, identity) || !['active', 'withdrawn'].includes(record.publication_status)) {
      throw new Error('数据库记录归属或当前状态无法确认');
    }
    const desired = action === 'withdraw' ? 'withdrawn' : 'active';
    if (record.publication_status === desired) return { id: record.id, publication_status: desired, changed: false };
    const result = await transport[action](identity, { ...context, expected_status: record.publication_status });
    if (!ownershipMatches(result, identity) || result.publication_status !== desired) {
      throw new Error('数据库端未确认目标状态，需重新查询');
    }
    return result;
  }
  return {
    withdraw: (identity, context) => change('withdraw', identity, context),
    restore: (identity, context) => change('restore', identity, context),
  };
}

module.exports = { ownershipMatches, createLifecycleClient };
