export default function DashboardLoading() {
  return (
    <div style={{ padding:'28px 32px', fontFamily:"'Noto Sans JP',sans-serif", display:'flex', flexDirection:'column', gap:'16px' }}>
      <div style={{ height:'22px', width:'240px', background:'#e8f0ea', borderRadius:'6px' }}/>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
        <div style={{ height:'80px', background:'#f0f7f1', borderRadius:'10px', border:'1px solid #e2ece5' }}/>
        <div style={{ height:'80px', background:'#f0f7f1', borderRadius:'10px', border:'1px solid #e2ece5' }}/>
      </div>
      <div style={{ height:'120px', background:'#f0f7f1', borderRadius:'10px', border:'1px solid #e2ece5' }}/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
        {[1,2,3,4,5,6].map(i=>(
          <div key={i} style={{ height:'90px', background:'#f0f7f1', borderRadius:'10px', border:'1px solid #e2ece5' }}/>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}div{animation:pulse 1.5s ease-in-out infinite}`}</style>
    </div>
  )
}
