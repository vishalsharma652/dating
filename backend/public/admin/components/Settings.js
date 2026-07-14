const { useState, useEffect } = React;

window.Settings = function Settings({ data, onSave }) {
  return (
    <section className="panel">
      <div className="panel-body">
        <form className="form-grid" onSubmit={onSave}>
          <label className="field">
            <span>Coin deduction rate (per minute chat cost)</span>
            <input className="input" name="coin_deduction_rate" defaultValue={data.coin_deduction_rate || '10'} />
          </label>
          <label className="field">
            <span>Minimum withdrawal threshold (INR)</span>
            <input className="input" name="minimum_withdrawal" type="number" defaultValue={data.minimum_withdrawal || '500'} />
          </label>
          <label style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
            <input type="checkbox" name="require_kyc_before_chat" defaultChecked={data.require_kyc_before_chat !== 'false'} />
            <span>Require KYC approval before enabling Chat</span>
          </label>
          <button className="btn" style={{ marginTop: '16px' }}>Save Settings</button>
        </form>
      </div>
    </section>
  );
};
