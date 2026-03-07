export default function UsersLoading() {
  return (
    <div style={{ padding: '40px 32px', fontFamily: "'Noto Sans JP',sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ height: '28px', width: '150px', background: '#e8f0ea', borderRadius: '6px' }} />
        <div style={{ height: '36px', width: '120px', background: '#d5e8db', borderRadius: '8px' }} />
      </div>
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2ece5' }}>
        <div style={{ height: '52px', background: '#f6fbf7', borderBottom: '1px solid #eef3ef' }} />
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ height: '62px', borderBottom: '1px solid #f2f7f3', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#e8f5ee' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: '13px', background: '#f0f7f1', borderRadius: '4px', width: '180px', marginBottom: '6px' }} />
              <div style={{ height: '11px', background: '#f4f9f5', borderRadius: '4px', width: '120px' }} />
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} } div{animation:pulse 1.5s infinite}`}</style>
    </div>
  )
}
