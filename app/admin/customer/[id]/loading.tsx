export default function CustomerLoading() {
  return (
    <div style={{ padding: '28px 32px', fontFamily: "'Noto Sans JP',sans-serif" }}>
      <div style={{ height: '14px', width: '280px', background: '#e8f0ea', borderRadius: '4px', marginBottom: '20px' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: '52px', height: '52px', background: '#e8f5ee', borderRadius: '14px' }} />
        <div>
          <div style={{ height: '22px', width: '200px', background: '#e8f0ea', borderRadius: '6px', marginBottom: '8px' }} />
          <div style={{ height: '13px', width: '150px', background: '#f0f7f1', borderRadius: '4px' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '16px' }}>
        {[1,2,3].map(i => <div key={i} style={{ height: '80px', background: '#fff', borderRadius: '10px', border: '1px solid #e2ece5' }} />)}
      </div>
      <div style={{ height: '48px', background: '#fff', borderRadius: '10px', border: '1px solid #e2ece5', marginBottom: '16px' }} />
      <div style={{ height: '300px', background: '#fff', borderRadius: '10px', border: '1px solid #e2ece5' }} />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}div{animation:pulse 1.5s infinite}`}</style>
    </div>
  )
}
