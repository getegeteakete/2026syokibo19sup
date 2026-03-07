export default function AdminLoading() {
  return (
    <div style={{ padding: '40px 32px', fontFamily: "'Noto Sans JP',sans-serif" }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header skeleton */}
        <div style={{ height: '28px', width: '200px', background: '#e8f0ea', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
        {/* Cards skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: '90px', background: '#f0f7f1', borderRadius: '10px', border: '1px solid #e2ece5' }} />
          ))}
        </div>
        {/* Table skeleton */}
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2ece5', overflow: 'hidden' }}>
          <div style={{ height: '52px', background: '#f6fbf7', borderBottom: '1px solid #eef3ef' }} />
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ height: '58px', borderBottom: '1px solid #f2f7f3', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#e8f5ee' }} />
              <div style={{ flex: 1, height: '14px', background: '#f0f7f1', borderRadius: '4px', maxWidth: '200px' }} />
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  )
}
